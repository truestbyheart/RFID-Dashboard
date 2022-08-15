mod db;
mod users;
mod access_logs;

// re-export
pub use db::init_db;
pub use db::Db;
pub use users::{User, UserMac, UserPatch};
pub use access_logs::{AccessLog, AccessLogMac};

// region:    Error
#[derive(thiserror::Error, Debug)]
pub enum Error {
	#[error("Entity Not Found - {0}[{1}] ")]
	EntityNotFound(&'static str, String),

	#[error(transparent)]
	SqlxError(#[from] sqlx::Error),

	#[error(transparent)]
	IOError(#[from] std::io::Error),
}