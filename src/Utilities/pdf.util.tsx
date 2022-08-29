import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";
import { sendAppNotification } from "./notification.util";
import { createExportDir } from "./fs.util";

const generatePDF = async (filename: string, tableColumn: string[], tableRows: any[]) => {
    try {
        const doc = new jsPDF();
        console.log(tableColumn)
        autoTable(doc, {
            head: [tableColumn],
            body: [tableRows]
        })

        await createExportDir();
        await writeTextFile(filename, doc.output(), { dir: BaseDirectory.Document });
        await sendAppNotification(`File saved at ${BaseDirectory.Document}/rfis/export/${filename}`);
    } catch (error) {
        console.log(error)
        await sendAppNotification(`${String(error)}`);
    }
};

export default generatePDF;
