use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};
use std::fs;
use std::path::PathBuf;
use std::time::Duration;


const PG_HOST: &str = "localhost";
const PG_ROOT_DB: &str = "rfid";
const PG_ROOT_USER: &str = "postgres";
const PG_ROOT_PWD: &str = "postgres";

pub type Db = Pool<Postgres>;

#[tauri::command]
pub async fn init_db() -> Result<Db, sqlx::Error> { 
    new_db_pool(PG_HOST, PG_ROOT_DB, PG_ROOT_USER, PG_ROOT_PWD, 1).await
}

async fn new_db_pool(host: &str, db: &str, user: &str, pwd: &str, max_con: u32) -> Result<Db, sqlx::Error> {
	let con_string = format!("postgres://{}:{}@{}/{}", user, pwd, host, db);
	PgPoolOptions::new()
		.max_connections(max_con)
		.acquire_timeout(Duration::from_millis(500)) // Needs to find replacement
		.connect(&con_string)
		.await
}