use super::db::Db;
use crate::model;
use serde::{Deserialize, Serialize};
use sqlb::{HasFields, Raw};
use chrono::Utc;


#[derive(sqlx::FromRow, Debug, Clone, Serialize, Deserialize)]
pub struct User {
	pub id: i64,
	pub full_name: String, // creator id
	pub rf_id: String,
	// pub created_at: chrono::DateTime<Utc>,
    // pub updated_at: chrono::DateTime<Utc>
}

#[derive(sqlb::Fields, Default, Debug, Clone, Deserialize)]
pub struct UserPatch {
	pub full_name: Option<String>,
	pub rf_id: Option<String>,
    // pub created_at: Option<chrono::DateTime<Utc>>,
    // pub updated_at: Option<chrono::DateTime<Utc>>
}

pub struct UserMac;

impl UserMac {
	const TABLE: &'static str = "users";
	const COLUMNS: &'static [&'static str] = &["id", "full_name", "rf_id"];
}

impl UserMac {
    pub async fn list(db: &Db) -> Result<Vec<User>, model::Error> {
		let sb = sqlb::select().table(Self::TABLE).columns(Self::COLUMNS).order_by("!id");
		let users = sb.fetch_all(db).await?;
		Ok(users)
	}
}
