use super::db::Db;
use crate::model;
use diesel::sql_types::Date;
use serde::{Deserialize, Serialize};
use sqlb::{HasFields, Raw};
use chrono::{DateTime, TimeZone, NaiveDateTime, Utc};


#[derive(sqlx::FromRow, Debug, Clone)]
pub struct AccessLog {
	pub id: i64,
	pub rf_id: String,
    pub current_state: CurrentState,
	pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>
}

#[derive(sqlx::Type, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[sqlx(type_name = "card_state")]
pub enum CurrentState {
	IN,
	OUT,
}
sqlb::bindable!(CurrentState);

// #[derive(sqlx::Type, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
// pub struct  TimeStamptz {
// 	datetz: chrono::DateTime<chrono::Utc>
// }
// sqlb::bindable!(TimeStamptz);

// #[derive(sqlb::Fields, Default, Debug, Clone, Deserialize)]
// pub struct AccessLogPatch {
// 	pub rf_id: Option<String>,
//     pub current_state: Option<CurrentState>,
//     pub created_at: Option<TimeStamptz::datetz>,
//     pub updated_at: Option<TimeStamptz::datetz>
// }

pub struct AccessLogMac;

impl AccessLogMac {
	const TABLE: &'static str = "access_logs";
	const COLUMNS: &'static [&'static str] = &["id", "rf_id", "current_state", "created_at", "updated_at"];
}

impl AccessLogMac {
    pub async fn list(db: &Db) -> Result<Vec<AccessLog>, sqlx::Error> {
		let sb = "SELECT id, rf_id, current_state, created_at, updated_at FROM access_logs ORDER BY id ASC LIMIT 10 OFFSET 0";
		// sqlb::select().table(Self::TABLE).columns(Self::COLUMNS).order_by("!id");
		let query = sqlx::query_as::<_, AccessLog>(sb);
		let access_logs = query.fetch_all(db).await.unwrap();
		Ok(access_logs)
	}
}
