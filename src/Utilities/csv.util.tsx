import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";
import { json2csvAsync  } from "json-2-csv";
import { sendAppNotification } from "./notification.util";

export const generateCSVFile = async (filename:string, payload: any) => {
    try {
        const csv = await json2csvAsync(payload);
        await writeTextFile(filename, csv, { dir: BaseDirectory.Document }); 
        await sendAppNotification(`File saved at ${BaseDirectory.Document}/${filename}`);
    } catch (error) {
        await sendAppNotification(`${error}`);
    }
}
