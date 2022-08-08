#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri_plugin_sql::TauriSql;
use dotenv::dotenv;
use std::env;

#[tauri::command]
fn get_db_string() -> String {
   dotenv().ok();

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
  return database_url      
}

fn main() {
  tauri::Builder::default()
     .invoke_handler(tauri::generate_handler![get_db_string])
    .plugin(TauriSql::default())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
