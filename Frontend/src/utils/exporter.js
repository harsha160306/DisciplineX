import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Paragraph, Packer, TextRun, Table, TableRow, TableCell, BorderStyle } from 'docx';

/**
 * Client-side Exporter Utility for Reports
 */

// 1. Excel Export helper
export const exportToExcel = (headers, rows, fileName = 'report') => {
  try {
    // Map data to an array of objects matching headers
    const data = rows.map(row => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] !== undefined && row[idx] !== null ? String(row[idx]) : '';
      });
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    
    // Fit column widths helper
    const maxLens = headers.map(h => h.length);
    data.forEach(row => {
      headers.forEach((h, idx) => {
        const val = row[h] || '';
        maxLens[idx] = Math.max(maxLens[idx], val.length);
      });
    });
    worksheet['!cols'] = maxLens.map(len => ({ wch: len + 3 }));

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Excel Export Error:', error);
  }
};

// 2. PDF Export helper
export const exportToPDF = (title, headers, rows, fileName = 'report') => {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    // Header styling
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(61, 90, 241); // brand primary color
    doc.text('Modern Institute College', 14, 15);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(title, 14, 21);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 26);
    
    // Line separator
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 29, 196, 29);

    // AutoTable plugin call
    doc.autoTable({
      startY: 33,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: [61, 90, 241],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14 }
    });

    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('PDF Export Error:', error);
  }
};

// 3. Word Document Export helper
export const exportToWord = (title, headers, rows, fileName = 'report') => {
  try {
    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    };

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Modern Institute College",
                bold: true,
                size: 32, // 16pt
                color: "3D5AF1",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 24, // 12pt
                color: "475569",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on: ${new Date().toLocaleString('en-IN')}`,
                italics: true,
                size: 18, // 9pt
                color: "94A3B8",
              }),
            ],
          }),
          new Paragraph({ text: "" }), // spacing
          new Table({
            width: {
              size: 100,
              type: "percent"
            },
            rows: [
              // Header row
              new TableRow({
                children: headers.map(h => new TableCell({
                  shading: { fill: "3D5AF1" },
                  borders: cellBorders,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: h,
                          bold: true,
                          color: "FFFFFF",
                          size: 18,
                        }),
                      ],
                    }),
                  ],
                })),
              }),
              // Data rows
              ...rows.map(row => new TableRow({
                children: row.map(cell => new TableCell({
                  borders: cellBorders,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cell !== null && cell !== undefined ? String(cell) : '',
                          size: 16,
                        }),
                      ],
                    }),
                  ],
                })),
              })),
            ],
          }),
        ],
      }],
    });

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `${fileName}.docx`);
    });
  } catch (error) {
    console.error('Word Export Error:', error);
  }
};
