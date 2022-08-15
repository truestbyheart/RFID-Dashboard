import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

const generatePDF = (filename: string, tableColumn: string[], tableRows: any[]) => {
    const doc = new jsPDF();
    autoTable(doc, {
        head: [tableColumn], 
        body: [tableRows]
    })
    doc.save(filename);
};

export default generatePDF;
