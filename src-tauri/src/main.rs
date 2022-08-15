#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
#![allow(unused)]

use dotenv::dotenv;
use futures::Future;
use futures::TryFutureExt;
use std::env;
use tauri_plugin_sql::TauriSql;
use sqlv::Sqlv;

#[tauri::command]
fn get_db_string() -> String {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    return database_url;
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_db_string])
        .plugin(Sqlv::default())
        .plugin(TauriSql::default())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
