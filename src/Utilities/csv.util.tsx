import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";
import { json2csvAsync  } from "json-2-csv";
import { createExportDir } from "./fs.util";
import { sendAppNotification } from "./notification.util";

export const generateCSVFile = async (filename:string, payload: any) => {
    try {
        const csv = await json2csvAsync(payload);
        await createExportDir();
        await writeTextFile(`rfid/exports/${filename}`, csv, { dir: BaseDirectory.Document });
        await sendAppNotification(`File saved at ${BaseDirectory.Document}/rfid/exports/${filename}`);
    } catch (error) {
        await sendAppNotification(`${error}`);
    }
}
