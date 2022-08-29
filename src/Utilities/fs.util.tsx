import { BaseDirectory, writeTextFile, createDir, readTextFile } from "@tauri-apps/api/fs";
import { DatabaseConnection } from "../Pages/Login";

export const createConfigDir = async () => {
    await createDir('rfid/database', { dir: BaseDirectory.Document, recursive: true });
}

export const createDatabaseConfigFile = async (options: DatabaseConnection ) => {
   await writeTextFile('rfid/database/database.config.json', JSON.stringify(options), { dir: BaseDirectory.Document});
}

export const readDatabaseConfigFile = async (): Promise<string> => {
    return await readTextFile('rfid/database/database.config.json', { dir: BaseDirectory.Document });
}

export const generateDatabaseString = (connectionOptions: DatabaseConnection): string => {
    return `postgres://${connectionOptions.user}:${connectionOptions.password}@${connectionOptions.host}:${connectionOptions.port}/${connectionOptions.database}`;
}

export const createExportDir = async () => {
    await createDir('rfid/export', { dir: BaseDirectory.Document, recursive: true });
}
