#![allow(unused)]
#[warn(non_snake_case)]
use chrono::{DateTime, NaiveDateTime, TimeZone, Utc};
use futures::future::BoxFuture;
use serde::{ser::Serializer, Deserialize, Serialize};
use serde_json::json;
use serde_json::Value as JsonValue;
use sqlb::{HasFields, Raw};

use sqlx::types::Json;
use sqlx::{
    error::BoxDynError,
    migrate::{
        MigrateDatabase, Migration as SqlxMigration, MigrationSource, MigrationType, Migrator,
    },
    Column, Pool, Postgres, Row, TypeInfo,
};
use tauri::{
    command,
    plugin::{Plugin, Result as PluginResult},
    AppHandle, Invoke, Manager, Runtime, State,
};

// Database Section
use sqlx::postgres::PgPoolOptions;
use std::collections::HashMap;
use std::fmt;
use std::fs;
use std::path::PathBuf;
use std::time::Duration;
use tokio::sync::Mutex;

const PG_HOST: &str = "localhost";
const PG_ROOT_DB: &str = "rfid";
const PG_ROOT_USER: &str = "postgres";
const PG_ROOT_PWD: &str = "postgres";

type Db = sqlx::postgres::Postgres;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Sql(#[from] sqlx::Error),
    #[error("database {0} not loaded")]
    DatabaseNotLoaded(String),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

type Result<T> = std::result::Result<T, Error>;

#[derive(Default)]
struct DbInstances(Mutex<HashMap<String, Pool<Db>>>);

#[derive(Default, Deserialize)]
struct PluginConfig {
    #[serde(default)]
    preload: Vec<String>,
}

#[command]
async fn load<R: Runtime>(
    #[allow(unused_variables)] app: AppHandle<R>,
    db_instances: State<'_, DbInstances>,
    db: String,
) -> Result<String> {
    #[cfg(feature = "sqlite")]
    let fqdb = path_mapper(app_path(&app), &db);
    #[cfg(not(feature = "sqlite"))]
    let fqdb = db.clone();

    #[cfg(feature = "sqlite")]
    create_dir_all(app_path(&app)).expect("Problem creating App directory!");

    if !Db::database_exists(&fqdb).await.unwrap_or(false) {
        Db::create_database(&fqdb).await?;
    }
    let pool = Pool::connect(&fqdb).await?;

    db_instances.0.lock().await.insert(db.clone(), pool);
    Ok(db)
}

// access log section
#[derive(sqlx::FromRow, Debug, Clone)]
pub struct AccessLog {
    pub id: i64,
    pub rf_id: String,
    pub full_name: String,
    pub current_state: CurrentState,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(sqlx::Type, Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Copy)]
#[sqlx(type_name = "card_state")]
pub enum CurrentState {
    IN,
    OUT,
}
sqlb::bindable!(CurrentState);

impl fmt::Display for CurrentState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            CurrentState::IN => write!(f, "IN"),
            CurrentState::OUT => write!(f, "OUT"),
        }
    }
}

#[derive(sqlx::FromRow, Debug, Clone)]
struct Count {
    count: i64,
}

#[command]
async fn generate_pagination_obj(
    db_instances: State<'_, DbInstances>,
    db: String,
    table_name: String,
    limit: i64,
    page: i64,
) -> Result<HashMap<String, JsonValue>> {
    let count_sql = format!("SELECT COUNT(id) FROM {table_name}");

    let mut instances = db_instances.0.lock().await;
    let db = instances.get_mut(&db).ok_or(Error::DatabaseNotLoaded(db))?;

    let mut query = sqlx::query_as::<_, Count>(&count_sql);
    let count = query.fetch_one(&*db).await?;

    let total_pages = count.count / limit;
    let current_page = if page > 0 { page } else { 1 };
    let offset = (current_page - 1) * limit;

    let mut value: HashMap<String, JsonValue> = HashMap::default();
    value.insert("offset".to_string(), JsonValue::Number(offset.into()));
    value.insert(
        "totalPages".to_string(),
        JsonValue::Number(total_pages.into()),
    );
    value.insert(
        "currentPage".to_string(),
        JsonValue::Number(current_page.into()),
    );
    value.insert("page".to_string(), JsonValue::Number(page.into()));
    value.insert("count".to_string(), JsonValue::Number(count.count.into()));
    value.insert("limit".to_string(), JsonValue::Number(limit.into()));

    Ok(value)
}

#[command]
async fn get_all_access_logs(
    db_instances: State<'_, DbInstances>,
    db: String,
    limit: i32,
    offset: i32,
) -> Result<Vec<HashMap<String, JsonValue>>> {
    let sql: String = format!(
        "SELECT m.id, u.full_name, m.current_state, m.rf_id, m.created_at, m.updated_at
FROM access_logs as m
INNER JOIN users u on m.rf_id = u.rf_id
ORDER BY id ASC
LIMIT {limit} OFFSET {offset}"
    );
    let mut instances = db_instances.0.lock().await;
    let db = instances.get_mut(&db).ok_or(Error::DatabaseNotLoaded(db))?;
    let mut query = sqlx::query_as::<_, AccessLog>(&sql);

    let access_logs = query.fetch_all(&*db).await?;
    let mut values: Vec<HashMap<String, JsonValue>> = Vec::new();
    for row in access_logs {
        let mut value: HashMap<String, JsonValue> = HashMap::default();
        value.insert("id".to_string(), JsonValue::Number(row.id.into()));
        value.insert("full_name".to_string(), JsonValue::String(row.full_name));
        value.insert(
            "current_state".to_string(),
            JsonValue::String(row.current_state.to_string()),
        );
        value.insert("rf_id".to_string(), JsonValue::String(row.rf_id));
        value.insert(
            "created_at".to_string(),
            JsonValue::String(row.created_at.to_string()),
        );
        value.insert(
            "updated_at".to_string(),
            JsonValue::String(row.updated_at.to_string()),
        );
        values.push(value)
    }

    Ok(values)
}

// users section
#[derive(sqlx::FromRow, Debug, Clone)]
struct User {
	pub id: i64,
	pub full_name: String,
	pub rf_id: String,
	pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>
}

#[command]
async fn get_all_users(
    db_instances: State<'_, DbInstances>,
    db: String,
    limit: i32,
    offset: i32,
) -> Result<Vec<HashMap<String, JsonValue>>> {
    let sql = format!("SELECT * FROM users ORDER BY id ASC LIMIT {limit} OFFSET {offset}");

    let mut instances = db_instances.0.lock().await;
    let db = instances.get_mut(&db).ok_or(Error::DatabaseNotLoaded(db))?;

    let mut query = sqlx::query_as::<_, User>(&sql);
    let users = query.fetch_all(&*db).await?;
    let mut values: Vec<HashMap<String, JsonValue>> = Vec::new();
    for row in users {
        let mut value: HashMap<String, JsonValue> = HashMap::default();
        value.insert("id".to_string(), JsonValue::Number(row.id.into()));
        value.insert("full_name".to_string(), JsonValue::String(row.full_name));
        value.insert("rf_id".to_string(), JsonValue::String(row.rf_id));
        value.insert(
            "created_at".to_string(),
            JsonValue::String(row.created_at.to_string()),
        );
        value.insert(
            "updated_at".to_string(),
            JsonValue::String(row.updated_at.to_string()),
        );
        values.push(value)
    }

    Ok(values)
}

#[command]
async fn search_all_users(
    db_instances: State<'_, DbInstances>,
    db: String,
    q: String
) -> Result<Vec<HashMap<String, JsonValue>>>  {
let sql = format!("SELECT * FROM users WHERE full_name LIKE '%{q}%' OR rf_id LIKE '%{q}%' ORDER BY id ASC");

    let mut instances = db_instances.0.lock().await;
    let db = instances.get_mut(&db).ok_or(Error::DatabaseNotLoaded(db))?;

    let mut query = sqlx::query_as::<_, User>(&sql);
    let users = query.fetch_all(&*db).await?;
    let mut values: Vec<HashMap<String, JsonValue>> = Vec::new();
    for row in users {
        let mut value: HashMap<String, JsonValue> = HashMap::default();
        value.insert("id".to_string(), JsonValue::Number(row.id.into()));
        value.insert("full_name".to_string(), JsonValue::String(row.full_name));
        value.insert("rf_id".to_string(), JsonValue::String(row.rf_id));
        value.insert(
            "created_at".to_string(),
            JsonValue::String(row.created_at.to_string()),
        );
        value.insert(
            "updated_at".to_string(),
            JsonValue::String(row.updated_at.to_string()),
        );
        values.push(value)
    }
    Ok(values)
}

#[command]
async fn search_all_logs(
    db_instances: State<'_, DbInstances>,
    db: String,
    q: String
) -> Result<Vec<HashMap<String, JsonValue>>>  {
let sql = format!("
SELECT m.id, u.full_name, m.current_state, m.rf_id, m.created_at, m.updated_at
FROM access_logs AS m
INNER JOIN users u on m.rf_id = u.rf_id
WHERE m.rf_id LIKE '%{q}%' OR u.full_name LIKE '%{q}%'
ORDER BY id ASC
");

    let mut instances = db_instances.0.lock().await;
    let db = instances.get_mut(&db).ok_or(Error::DatabaseNotLoaded(db))?;

    let mut query = sqlx::query_as::<_, User>(&sql);
    let users = query.fetch_all(&*db).await?;
    let mut values: Vec<HashMap<String, JsonValue>> = Vec::new();
    for row in users {
        let mut value: HashMap<String, JsonValue> = HashMap::default();
        value.insert("id".to_string(), JsonValue::Number(row.id.into()));
        value.insert("full_name".to_string(), JsonValue::String(row.full_name));
        value.insert("rf_id".to_string(), JsonValue::String(row.rf_id));
        value.insert(
            "created_at".to_string(),
            JsonValue::String(row.created_at.to_string()),
        );
        value.insert(
            "updated_at".to_string(),
            JsonValue::String(row.updated_at.to_string()),
        );
        values.push(value)
    }
    Ok(values)
}

pub struct Sqlv<R: Runtime> {
    invoke_handler: Box<dyn Fn(Invoke<R>) + Send + Sync>,
}

impl<R: Runtime> Default for Sqlv<R> {
    fn default() -> Self {
        Self {
            invoke_handler: Box::new(tauri::generate_handler![
                load,
                get_all_access_logs,
                generate_pagination_obj,
                get_all_users,
                search_all_users,
                search_all_logs
            ]),
        }
    }
}

impl<R: Runtime> Plugin<R> for Sqlv<R> {
    fn name(&self) -> &'static str {
        "sqlv"
    }

    fn initialize(&mut self, app: &AppHandle<R>, config: serde_json::Value) -> PluginResult<()> {
        tauri::async_runtime::block_on(async move {
            let config: PluginConfig = if config.is_null() {
                Default::default()
            } else {
                serde_json::from_value(config)?
            };

            #[cfg(feature = "sqlite")]
            create_dir_all(app_path(app)).expect("problems creating App directory!");

            let instances = DbInstances::default();
            let mut lock = instances.0.lock().await;
            for db in config.preload {
                #[cfg(feature = "sqlite")]
                let fqdb = path_mapper(app_path(app), &db);
                #[cfg(not(feature = "sqlite"))]
                let fqdb = db.clone();

                if !Db::database_exists(&fqdb).await.unwrap_or(false) {
                    Db::create_database(&fqdb).await?;
                }
                let pool = Pool::connect(&fqdb).await?;

                lock.insert(db, pool);
            }
            drop(lock);
            app.manage(instances);
            Ok(())
        })
    }

    fn extend_api(&mut self, message: Invoke<R>) {
        (self.invoke_handler)(message)
    }
}
