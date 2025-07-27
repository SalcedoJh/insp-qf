import React, { useState, useRef } from 'react';
import { Download, Save, Mail, Loader2, Check, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
    Container,
    ButtonsWrapper,
    Button,
    IconWrapper,
    SuccessIndicator,
    DialogOverlay,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogForm,
    FormGroup,
    Label,
    Input,
    DialogFooter,
    ErrorAlert,
    ErrorContent
} from './Buttons.style';
import './Buttons.css';


// Función para guardar en db.json mediante API
const saveToDbJson = async (reportData) => {
    try {
        const response = await fetch('http://localhost:3000/reportes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reportData),
        });

        if (!response.ok) {
            throw new Error('Error al guardar en db.json');
        }

        return await response.json();
    } catch (error) {
        console.error('Error al guardar en db.json:', error);
        throw error;
    }
};
const saveDataLocally = (key, data) => {
    try {
        const existingData = JSON.parse(localStorage.getItem(key) || "[]");
        existingData.push({
            id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date().toISOString(),
            ...data,
        });
        localStorage.setItem(key, JSON.stringify(existingData));
        return true;
    } catch (error) {
        console.error(`Error al guardar en ${key}:`, error);
        return false;
    }
};

// Función para cargar imagen desde public
const loadImageFromPublic = (imagePath) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${imagePath}`));
        img.src = imagePath;

        // Timeout para evitar esperar indefinidamente
        setTimeout(() => reject(new Error(`Timeout al cargar imagen: ${imagePath}`)), 5000);
    });
};

const Buttons = ({ formData = {}, setFormData }) => {
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("Reporte de Inspección de Calidad");
    const [loading, setLoading] = useState({
        pdf: false,
        drive: false,
        email: false,
        save: false,
    });
    const [success, setSuccess] = useState({
        drive: false,
        email: false,
        save: false,
    });
    const [error, setError] = useState({
        drive: null,
        email: null,
        save: null,
    });
    const pdfDataRef = useRef(null);

    const generatePDF = async () => {
        try {
            console.log("Generando PDF...", formData);

            // Crear un nuevo documento PDF
            const pdf = new jsPDF("p", "mm", "a4");

            // Dimensiones de la página
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Márgenes
            const margin = 15;
            const contentWidth = pageWidth - 2 * margin;

            // Posición Y actual (para ir añadiendo contenido)
            let y = margin;


            pdf.setFontSize(16);
            pdf.setFont("helvetica", "bold");
            pdf.text("REPORTE DE INSPECCIÓN DE CALIDAD", pageWidth / 2, y, { align: "center" });
            y += 10;

            // ===== ENCABEZADO =====
            // ===== ENCABEZADO DEL DOCUMENTO =====
            // === Primera tabla con columna combinada (Pregunta / C / NC) ===
            const firstTableWidth = pageWidth - margin * 2;

            // Distribución: 25% - 50% - 25%
            const col1Width = firstTableWidth * 0.25; // Pregunta (más angosto)
            const col2Width = firstTableWidth * 0.50; // C (más ancho)
            const col3Width = firstTableWidth * 0.25; // NC

            const rowHeight = 13;
            const cellX = margin;
            let cellY = y;

            pdf.setLineWidth(0.1);
            pdf.setDrawColor(200); // gris claro

            // === Celda combinada (Pregunta - 3 filas de alto) ===
            pdf.rect(cellX, cellY, col1Width, rowHeight * 3);

            // === Dibujar celdas de columna 2 y 3 (3 filas cada una) ===
            for (let row = 0; row < 3; row++) {
                const rowY = cellY + row * rowHeight;

                // Columna 2 (C)
                pdf.rect(cellX + col1Width, rowY, col2Width, rowHeight);

                // Columna 3 (NC)
                pdf.rect(cellX + col1Width + col2Width, rowY, col3Width, rowHeight);
            }

            // === Cargar y añadir el logo ===
            try {
                // Intentar cargar el logo desde diferentes rutas posibles
                const possiblePaths = [
                    '/logo-qf.png',
                    '/logo.jpg',
                    '/logo.jpeg',
                    '/assets/logo.png',
                    '/assets/logo.jpg',
                    '/assets/logo.jpeg',
                    './logo.png',
                    './logo.jpg',
                    './logo.jpeg'
                ];

                let logoImg = null;
                for (const path of possiblePaths) {
                    try {
                        logoImg = await loadImageFromPublic(path);
                        console.log(`Logo cargado desde: ${path}`);
                        break;
                    } catch (error) {
                        console.log(`No se pudo cargar logo desde: ${path}`);
                        continue;
                    }
                }

                if (logoImg) {
                    // Calcular dimensiones del logo para que quepa en la celda
                    const logoMaxWidth = col1Width - 4; // 2mm de margen a cada lado
                    const logoMaxHeight = (rowHeight * 3) - 4; // 2mm de margen arriba y abajo

                    // Calcular proporción para mantener aspect ratio
                    const logoRatio = logoImg.width / logoImg.height;
                    let logoWidth = logoMaxWidth;
                    let logoHeight = logoWidth / logoRatio;

                    // Si la altura es mayor que el espacio disponible, ajustar por altura
                    if (logoHeight > logoMaxHeight) {
                        logoHeight = logoMaxHeight;
                        logoWidth = logoHeight * logoRatio;
                    }

                    // Centrar el logo en la celda
                    const logoX = cellX + (col1Width - logoWidth) / 2;
                    const logoY = cellY + ((rowHeight * 3) - logoHeight) / 2;

                    // Añadir el logo al PDF
                    pdf.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
                } else {
                    // Si no se puede cargar el logo, mostrar texto alternativo
                    pdf.setFontSize(10);
                    pdf.setFont("helvetica", "bold");
                    pdf.text("LOGO", cellX + col1Width / 2, cellY + rowHeight * 1.5, { align: "center" });
                }
            } catch (error) {
                console.error("Error al cargar logo:", error);
                // Mostrar texto alternativo si hay error
                pdf.setFontSize(10);
                pdf.setFont("helvetica", "bold");
                pdf.text("LOGO", cellX + col1Width / 2, cellY + rowHeight * 1.5, { align: "center" });
            }

            // === Texto dentro de la tabla ===
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");

            // Centrado vertical en la celda combinada
            //cerca



            // Fila 1
            pdf.setFont("helvetica", "bold");
            const textY1 = cellY + 7;
            pdf.text("REPORTE DE INSPECCIÓN DE CALIDAD", cellX + col1Width + col2Width / 2, textY1, { align: "center" });
            pdf.text("CÓDIGO:", cellX + col1Width + col2Width + col3Width / 12, textY1, { align: "left" });

            pdf.setFont("helvetica", "normal");
            pdf.text(" F.GE.MC.015", cellX + col1Width + col2Width + col3Width / 2.3, textY1, { align: "left" });

            // Fila 2
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            const textY2 = cellY + rowHeight + 7;
            pdf.text("TIPO DE DOCUMENTO:", cellX + col1Width + 2, textY2, { align: "left" });

            pdf.setFont("helvetica", "normal");
            pdf.text(" Formato", cellX + col1Width + 42, textY2, { align: "left" });

            pdf.setFont("helvetica", "bold");
            pdf.text("VERSIÓN:", cellX + col1Width + col2Width + 2, textY2, { align: "left" });

            pdf.setFont("helvetica", "normal");
            pdf.text(" 00", cellX + col1Width + col2Width + 19, textY2, { align: "left" });

            // Fila 3
            const textY3 = cellY + rowHeight * 2 + 7;
            pdf.setFont("helvetica", "bold");
            pdf.text("Area:", cellX + col1Width + 2, textY3, { align: "left" });

            pdf.setFont("helvetica", "normal");
            pdf.text(" Calidad y Mejora Continua", cellX + col1Width + 11, textY3, { align: "left" });

            pdf.setFont("helvetica", "bold");
            pdf.text("PÁGINA:", cellX + col1Width + col2Width + 2, textY3, { align: "left" });

            pdf.setFont("helvetica", "normal");
            pdf.text(" #", cellX + col1Width + col2Width + 18, textY3, { align: "left" });
            cellY += rowHeight * 3 + 2;



            // ===== INFORMACIÓN DEL DOCUMENTO =====

            const columnWidth = (pageWidth - 30) / 3;

            pdf.setLineWidth(0.1);       // Línea delgada
            pdf.setDrawColor(200);

            // === Dibujar tabla 2 filas × 3 columnas ===
            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 3; col++) {
                    pdf.rect(cellX + columnWidth * col, cellY + row * rowHeight, columnWidth, rowHeight);
                }
            }

            // === Fila 1: Títulos y cargos ===
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");

            // ELABORADO POR
            // Fila 1 - Títulos y Cargos
            pdf.setFontSize(10);


            // === ELABORADO POR ===
            pdf.setFont("helvetica", "bold");
            pdf.text("ELABORADO POR:", cellX + columnWidth / 1.8, cellY + 4, { align: "right" });

            pdf.setFont("helvetica", "normal");
            pdf.text("Coordinador de Calidad", cellX + columnWidth / 2, cellY + 8, { align: "center" });
            pdf.text("y Mejora Continua", cellX + columnWidth / 2, cellY + 12, { align: "center" });

            // === REVISADO POR ===
            pdf.setFont("helvetica", "bold");
            pdf.text("REVISADO POR:", cellX + columnWidth * 1.5, cellY + 4, { align: "right" });

            pdf.setFont("helvetica", "normal");
            pdf.text("Jefe de Calidad y Mejora", cellX + columnWidth * 1.5, cellY + 8, { align: "center" });
            pdf.text("Continua", cellX + columnWidth * 1.5, cellY + 12, { align: "center" });

            // === APROBADO POR ===
            pdf.setFont("helvetica", "bold");
            pdf.text("APROBADO POR:", cellX + columnWidth * 2.5, cellY + 4, { align: "right" });

            pdf.setFont("helvetica", "normal");
            pdf.text("Jefe de Calidad y Mejora", cellX + columnWidth * 2.5, cellY + 8, { align: "center" });
            pdf.text("Continua", cellX + columnWidth * 2.5, cellY + 12, { align: "center" });

            // === Fila 2: Fechas ===
            const dateRowY = cellY + rowHeight + 6;


            pdf.setFont("helvetica", "bold");
            pdf.text("Fecha:", cellX + columnWidth / 5, dateRowY, { align: "right" });

            pdf.setFont("helvetica", "normal");
            pdf.text("25/03/2024", cellX + columnWidth / 4.5, dateRowY, { align: "left" });

            pdf.setFont("helvetica", "bold");
            pdf.text("Fecha:", cellX + columnWidth * 1.5 - 17, dateRowY, { align: "right" });

            pdf.setFont("helvetica", "normal");
            pdf.text("27/03/2024", cellX + columnWidth * 1.5 - 16, dateRowY, { align: "left" });

            pdf.setFont("helvetica", "bold");
            pdf.text("Fecha:", cellX + columnWidth * 2.5 - 17, dateRowY, { align: "right" });

            pdf.setFont("helvetica", "normal");
            pdf.text("27/03/2024", cellX + columnWidth * 2.5 - 16, dateRowY, { align: "left" });
            // Avanza el cursor para el siguiente contenido
            y = cellY + rowHeight * 2 + 10;



            // ===== INFORMACIÓN DEL PRODUCTO =====


            pdf.setFontSize(10);

            // === Línea 1: Area y Fecha ===
            pdf.setFont("helvetica", "bold");
            pdf.text("Area:", margin, y);

            pdf.setFont("helvetica", "normal");
            pdf.text(` ${formData.area || 'No especificado'}`, margin + 10, y);

            pdf.setFont("helvetica", "bold");
            pdf.text("Fecha:", pageWidth / 1.4, y);

            pdf.setFont("helvetica", "normal");
            pdf.text(` ${formData.date || 'No especificada'}`, pageWidth / 1.4 + 12, y);

            y += 8;

            // funcion para devirter el texto a una nueva línea si es muy largo
            function splitTextByWords(text, wordsPerLine = 6) {
                const words = text.trim().split(/\s+/); // separar por espacios
                const lines = [];

                for (let i = 0; i < words.length; i += wordsPerLine) {
                    lines.push(words.slice(i, i + wordsPerLine).join(' '));
                }

                return lines;
            }


            // === Línea 2: Producto y Lote ===
            pdf.setFont("helvetica", "bold");
            pdf.text("Producto:", margin, y);

            pdf.setFont("helvetica", "normal");
            const productText = formData.product || 'No especificado';
            const wrappedLines = splitTextByWords(productText, 8); // o usa 8 si prefieres

            // Posición en la mitad derecha de la hoja
            const rightX = pageWidth / 2 - 70; // 10 mm después del centro
            let textY = y; // y actual, no lo modificamos directamente por si se usa después

            wrappedLines.forEach(line => {
                pdf.text(line, rightX, textY);
                textY += 6; // espacio entre líneas
            });


            pdf.setFont("helvetica", "bold");
            pdf.text("Lote:", pageWidth / 1.4, y);

            pdf.setFont("helvetica", "normal");
            pdf.text(` ${formData.lot || 'No especificada'}`, pageWidth / 1.4 + 9, y);

            y += 10;



            // Función para añadir texto con salto de línea automático
            const addWrappedText = (text, x, y, maxWidth, lineHeight = 7) => {
                const lines = pdf.splitTextToSize(text, maxWidth);
                pdf.text(lines, x, y);
                return y + lineHeight * lines.length;
            };

            // Función para añadir una nueva página
            const addNewPage = () => {
                pdf.addPage();
                return margin;
            };

            // Función para verificar si hay espacio suficiente en la página actual
            const checkPageBreak = (yPos, neededSpace) => {
                if (yPos + neededSpace > pageHeight - margin) {
                    return addNewPage();
                }
                return yPos;
            };

            // Función para añadir una línea horizontal
            const addHorizontalLine = (yPos) => {
                pdf.setDrawColor(200, 200, 200);
                pdf.line(margin, yPos, pageWidth - margin, yPos);
                return yPos + 3;
            };

            // Función para añadir un encabezado de sección
            const addSectionHeader = (text, yPos) => {
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(12);
                pdf.text(text, margin, yPos);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(10);
                return yPos + 7;
            };

            // Función para añadir una tabla simple
            const addSimpleTable = (headers, rows, yPos, colWidths, rowHeightMultiplier = 1) => {
                const baseRowHeight = 7;
                const tableWidth = contentWidth;

                // Encabezados
                pdf.setFont("helvetica", "bold");
                pdf.setFillColor(240, 240, 240);
                pdf.rect(margin, yPos - 5, tableWidth, baseRowHeight, "F");

                let xPos = margin;
                headers.forEach((header, i) => {
                    pdf.text(header, xPos + 2, yPos);
                    xPos += colWidths[i];
                });

                yPos += baseRowHeight;
                pdf.setFont("helvetica", "normal");

                // Filas
                for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                    const row = rows[rowIndex];

                    // Calcular la altura necesaria para esta fila
                    let rowHeight = baseRowHeight * rowHeightMultiplier;
                    let maxLines = 1;

                    // Si es la columna de preguntas, verificar cuántas líneas necesita
                    if (typeof row[0] === "string" && row[0].length > 50) {
                        const lines = pdf.splitTextToSize(row[0], colWidths[0] - 4);
                        maxLines = Math.max(maxLines, lines.length);
                        rowHeight = baseRowHeight * maxLines;
                    }

                    // Verificar si necesitamos una nueva página
                    if (yPos + rowHeight > pageHeight - margin) {
                        yPos = addNewPage();

                        // Repetir encabezados en la nueva página
                        pdf.setFont("helvetica", "bold");
                        pdf.setFillColor(240, 240, 240);
                        pdf.rect(margin, yPos - 5, tableWidth, baseRowHeight, "F");

                        xPos = margin;
                        headers.forEach((header, i) => {
                            pdf.text(header, xPos + 2, yPos);
                            xPos += colWidths[i];
                        });

                        yPos += baseRowHeight;
                        pdf.setFont("helvetica", "normal");
                    }

                    // Alternar colores de fondo para las filas
                    if (rowIndex % 2 === 1) {
                        pdf.setFillColor(250, 250, 250);
                        pdf.rect(margin, yPos - 5, tableWidth, rowHeight, "F");
                    }

                    // Contenido de la fila
                    xPos = margin;
                    for (let i = 0; i < row.length; i++) {
                        const cell = row[i] || "-";

                        // Si es la columna de preguntas y el texto es largo
                        if (i === 0 && typeof cell === "string" && cell.length > 50) {
                            const lines = pdf.splitTextToSize(cell, colWidths[i] - 4);
                            pdf.text(lines, xPos + 2, yPos);
                        } else {
                            // Para otras columnas o textos cortos
                            pdf.text(cell, xPos + 2, yPos);
                        }

                        xPos += colWidths[i];
                    }

                    yPos += rowHeight;
                }

                return yPos + 3;
            };

            // Añadir una línea horizontal
            y = addHorizontalLine(y);
            y += 5;

            // ===== CUESTIONARIO =====
            y = checkPageBreak(y, 40);
            y = addSectionHeader("1. Marcar con un X, según corresponda: Conformidad (C) / No conformidad (NC).", y);

            const questions = [
                "¿El formulador registra correctamente la información en la orden de producción?",
                "¿El formulador está correctamente uniformados?",
                "¿Las condiciones ambientales son registradas correctamente y se mantienen dentro de los parámetros establecidos?",
                "¿Las áreas se encuentran identificadas correctamente?",
                "¿El formulador realiza correctamente la limpieza del área, equipos y/o instrumentos?",
                "¿Se registra correctamente el análisis organoléptico del producto?",
                "¿La documentación del proceso se encuentra completa, vigente y legible?",
            ];

            const questionHeaders = ["Pregunta", "C", "NC"];
            const questionRows = questions.map((q, index) => {
                const questionKey = `q${index + 1}`;
                const value = formData.questionnaire && formData.questionnaire[questionKey];
                return [q, value === "C" ? "X" : "", value === "NC" ? "X" : ""];
            });

            const questionColWidths = [contentWidth * 0.8, contentWidth * 0.1, contentWidth * 0.1];
            y = addSimpleTable(questionHeaders, questionRows, y, questionColWidths, 1.5);
            y += 5;

            // ===== INFORMACIÓN DE TAMAÑO DE LOTE, MUESTRA Y NIVEL DE INSPECCIÓN =====
            y = checkPageBreak(y, 20);


            const infoInspeccionHeaders = ["Tamaño de lote", "Tamaño de muestra", "Nivel de inspección"];
            const infoInspeccionRows = [
                [formData.batchSize || "-", formData.sampleSize || "-", formData.inspectionLevel || "-"],
            ];
            const infoInspeccionColWidths = [contentWidth / 3, contentWidth / 3, contentWidth / 3];

            y = addSimpleTable(infoInspeccionHeaders, infoInspeccionRows, y, infoInspeccionColWidths);
            y += 5;

            y = addSectionHeader("2. Indicar la cantidad de unidades con el defecto detectado, caso contrario colocar (-).", y);
            y += 2;
            // ===== DEFECTOS =====
            // Defectos críticos
            y = checkPageBreak(y, 40);
            y = addSectionHeader("DEFECTOS CRÍTICOS (AQL 0.015%)", y);

            const criticalDefectsList = [
                "Filtración de producto.",
                "Degradación visible del producto (color, olor, separación en fase, decantación).",
                "Presencia de cuerpo extraño visible en contacto con el producto.",
                "Envase con suciedad interna.",
                "Envase sin contenido de producto o faltante.",
                "Mezcla de materiales con otro producto o lote.",
                "Faltante de unidades",
                "Información ausente, incorrecta y/o incompleta (etiqueta de identificación)",
            ];

            const defectHeaders = ["Descripción", "Unidades"];
            const criticalRows = criticalDefectsList.map((defect, index) => [
                defect,
                (formData.criticalDefects && formData.criticalDefects[index] && formData.criticalDefects[index].units) || "-",
            ]);

            const defectColWidths = [contentWidth * 0.8, contentWidth * 0.2];
            y = addSimpleTable(defectHeaders, criticalRows, y, defectColWidths);
            y += 5;

            // Defectos mayores
            y = checkPageBreak(y, 40);
            y = addSectionHeader("DEFECTOS MAYORES (AQL 1%)", y);

            const majorDefectsList = [
                "Deterioro superficial o deterioro del material que afecten apariencia externa.",
                "Tapas con presencia rota.",
                "Mal estado del producto que no afecta su seguridad.",
                "Dificultad para abrir o cerrar el envase (cuando aplique).",
                "Ausencia de la cantidad contenida en el envase.",
                "Ausencia del peso tara en el etiquetado.",
            ];

            const majorRows = majorDefectsList.map((defect, index) => [
                defect,
                (formData.majorDefects && formData.majorDefects[index] && formData.majorDefects[index].units) || "-"
            ]);

            y = addSimpleTable(defectHeaders, majorRows, y, defectColWidths);
            y += 5;

            // Defectos menores
            y = checkPageBreak(y, 40);
            y = addSectionHeader("DEFECTOS MENORES (AQL 4%)", y);

            const minorDefectsList = [
                "Envases ligeramente deformados.",
                "Manchas o suciedad en el exterior.",
                "Impresión de rotulado deficiente que no afecta la información.",
            ];

            const minorRows = minorDefectsList.map((defect, index) => [
                defect,
                (formData.minorDefects && formData.minorDefects[index] && formData.minorDefects[index].units) || "-"
            ]);

            y = addSimpleTable(defectHeaders, minorRows, y, defectColWidths);
            y += 5;

            // ===== OBSERVACIONES =====
            y = checkPageBreak(y, 40);
            y = addSectionHeader("OBSERVACIONES", y);

            if (formData.observations) {
                y = addWrappedText(formData.observations, margin, y, contentWidth);
            } else {
                pdf.text("Sin observaciones", margin, y);
            }

            y += 1;

            // ===== FIRMAS =====
            y = checkPageBreak(y - 30, 1);
            /*y = addSectionHeader("FIRMAS", y);
            */
            // Configuración de las firmas
            const signatureBoxWidth = (pageWidth - 2 * margin - 20) / 2;
            const signatureLineY = y + 30; // Línea donde va la firma

            // Estilo de línea
            pdf.setDrawColor(100, 100, 100);
            pdf.setLineWidth(0.5);

            // Dibujar solo línea inferior de firma
            // Línea izquierda
            const assistantX1 = margin;
            const assistantX2 = margin + signatureBoxWidth;
            pdf.line(assistantX1, signatureLineY, assistantX2, signatureLineY);

            // Línea derecha
            const chiefX1 = margin + signatureBoxWidth + 20;
            const chiefX2 = chiefX1 + signatureBoxWidth;
            pdf.line(chiefX1, signatureLineY, chiefX2, signatureLineY);

            // Añadir los nombres como firmas o línea punteada
            pdf.setFontSize(16);
            pdf.setFont("times", "italic");

            // Asistente
            if (formData.signatures?.assistant?.trim()) {
                const assistantName = formData.signatures.assistant.trim();
                const nameWidth = pdf.getTextWidth(assistantName);
                const nameX = assistantX1 + (signatureBoxWidth - nameWidth) / 2;
                pdf.text(assistantName, nameX, signatureLineY - 1.5);
            } else {
                pdf.setFontSize(12);
                pdf.setFont("helvetica", "normal");
                pdf.text("____________________", assistantX1 + 10, signatureLineY - 5);
            }

            // Jefe
            if (formData.signatures?.chief?.trim()) {
                const chiefName = formData.signatures.chief.trim();
                const nameWidth = pdf.getTextWidth(chiefName);
                const nameX = chiefX1 + (signatureBoxWidth - nameWidth) / 2;
                pdf.setFontSize(16);
                pdf.setFont("times", "italic");
                pdf.text(chiefName, nameX, signatureLineY - 1.5);
            } else {
                pdf.setFontSize(12);
                pdf.setFont("helvetica", "normal");
                pdf.text("____________________", chiefX1 + 10, signatureLineY - 5);
            }

            // Añadir etiquetas debajo
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");

            const labelY = signatureLineY + 10;

            const assistantLabelText = "Asistente de Calidad";
            const assistantLabelX = assistantX1 + (signatureBoxWidth - pdf.getTextWidth(assistantLabelText)) / 2;
            pdf.text(assistantLabelText, assistantLabelX, labelY);

            const chiefLabelText = "Jefe de Calidad y Mejora Continua";
            const chiefLabelX = chiefX1 + (signatureBoxWidth - pdf.getTextWidth(chiefLabelText)) / 2;
            pdf.text(chiefLabelText, chiefLabelX, labelY);

            // Actualizar Y
            y = labelY + 15;

            // Debug
            console.log("Firmas disponibles:", formData.signatures);


            // ===== EVIDENCIAS =====
            if (formData.images && formData.images.length > 0) {
                // Añadir una nueva página para las evidencias
                y = addNewPage();

                y = addSectionHeader("EVIDENCIAS FOTOGRÁFICAS", y);
                y += 5;

                // Añadir cada imagen
                for (let i = 0; i < formData.images.length; i++) {
                    const image = formData.images[i];

                    // Si no hay espacio suficiente, añadir nueva página
                    if (y > pageHeight - margin - 80) {
                        y = addNewPage();
                    }

                    // Título de la imagen
                    pdf.setFontSize(12);
                    pdf.setFont("helvetica", "bold");
                    pdf.text(`Evidencia ${i + 1}: ${image.name || `Imagen ${i + 1}`}`, margin, y);
                    y += 7;
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(10);

                    try {
                        // Cargar la imagen
                        const img = new Image();
                        img.crossOrigin = "Anonymous";
                        img.src = image.url;

                        // Esperar a que la imagen se cargue
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                            // Timeout para evitar esperar indefinidamente
                            setTimeout(resolve, 3000);
                        });

                        // Calcular dimensiones para mantener la proporción
                        const imgRatio = img.width / img.height;
                        let imgWidthPdf = contentWidth;
                        let imgHeightPdf = imgWidthPdf / imgRatio;

                        // Limitar altura máxima para que quepa en la página
                        const maxHeight = pageHeight - y - margin - 10;
                        if (imgHeightPdf > maxHeight) {
                            imgHeightPdf = maxHeight;
                            imgWidthPdf = imgHeightPdf * imgRatio;
                        }

                        // Añadir la imagen al PDF
                        pdf.addImage(image.url, "JPEG", margin, y, imgWidthPdf, imgHeightPdf);
                        y += imgHeightPdf + 15;
                    } catch (error) {
                        console.error("Error al procesar imagen:", error);
                        pdf.text(`[Error al cargar imagen: ${error.message}]`, margin, y);
                        y += 10;
                    }
                }
            }

            // ===== NUMERACIÓN DE PÁGINAS =====
            const totalPages = pdf.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(8);
                pdf.setTextColor(100);
                pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: "center" });
            }

            // Añadir un log para confirmar que el PDF se generó correctamente
            console.log("PDF generado correctamente");

            // Nombre del archivo con timestamp para evitar duplicados
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const fileName = `reporte-inspeccion-${formData.lot || "sin-lote"}-${formData.area || "sin-area"}-${timestamp}.pdf`;

            // Guardar los datos del PDF para uso posterior
            const pdfData = {
                blob: pdf.output("blob"),
                base64: pdf.output("datauristring").split(",")[1],
                fileName: fileName,
            };

            pdfDataRef.current = pdfData;

            return pdfData;
        } catch (error) {
            console.error("Error generar PDF:", error);
            throw error;
        }
    };

    const handleDownloadPDF = async () => {
        setLoading(prev => ({ ...prev, pdf: true }));
        try {
            const pdfData = await generatePDF();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(pdfData.blob);
            link.download = pdfData.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href); // Limpiar memoria
        } catch (error) {
            console.error("Error al descargar PDF:", error);
            alert("Error al generar PDF: " + error.message);
        } finally {
            setLoading(prev => ({ ...prev, pdf: false }));
        }
    };

    const handleSaveToDrive = async () => {
        setLoading(prev => ({ ...prev, drive: true }));
        setSuccess(prev => ({ ...prev, drive: false }));
        setError(prev => ({ ...prev, drive: null }));

        try {
            const pdfData = pdfDataRef.current || (await generatePDF());
            await new Promise(resolve => setTimeout(resolve, 1000));

            const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const saved = saveDataLocally("savedInspectionForms", {
                id: documentId,
                formData,
                pdfFileName: pdfData.fileName,
            });

            if (!saved) throw new Error("No se pudo guardar el formulario localmente");

            setSuccess(prev => ({ ...prev, drive: true }));
            setTimeout(() => {
                alert("Funcionalidad en desarrollo");
                setSuccess(prev => ({ ...prev, drive: false }));
            }, 500);
        } catch (error) {
            console.error("Error al guardar:", error);
            setError(prev => ({ ...prev, drive: error.message }));
            alert("Error al guardar: " + error.message);
        } finally {
            setLoading(prev => ({ ...prev, drive: false }));
        }
    };

    const handleSendEmail = async () => {
        if (!email) {
            alert("Por favor ingrese un email válido");
            return;
        }

        setLoading(prev => ({ ...prev, email: true }));
        setSuccess(prev => ({ ...prev, email: false }));
        setError(prev => ({ ...prev, email: null }));

        try {
            const pdfData = pdfDataRef.current || (await generatePDF());
            await new Promise(resolve => setTimeout(resolve, 1500));

            const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const saved = saveDataLocally("sentInspectionEmails", {
                id: messageId,
                to: email,
                subject,
                formData,
                pdfFileName: pdfData.fileName,
            });

            if (!saved) throw new Error("No se pudo guardar el registro del email localmente");

            setSuccess(prev => ({ ...prev, email: true }));
            setTimeout(() => {
                setEmailDialogOpen(false);
                alert("Funcionalidad en desarrollo");
                setSuccess(prev => ({ ...prev, email: false }));
            }, 500);
        } catch (error) {
            console.error("Error al enviar email:", error);
            setError(prev => ({ ...prev, email: error.message }));
            alert("Error al enviar email: " + error.message);
        } finally {
            setLoading(prev => ({ ...prev, email: false }));
        }
    };

    // Función para transformar formData al formato del db.json
    const transformToDbJsonFormat = (data) => {
        // Asegurarnos de que los defectos sean arrays válidos
        const safeCriticalDefects = Array.isArray(data.criticalDefects) ? data.criticalDefects : [];
        const safeMajorDefects = Array.isArray(data.majorDefects) ? data.majorDefects : [];
        const safeMinorDefects = Array.isArray(data.minorDefects) ? data.minorDefects : [];

        // Función segura para sumar unidades de defectos
        const sumDefectUnits = (defects) => {
            if (!Array.isArray(defects)) return 0;
            return defects.reduce((sum, item) => sum + (Number(item?.units) || 0), 0);
        };

        // Calcular totales de defectos
        const totalCriticos = sumDefectUnits(data.criticalDefects || []);
        const totalMayores = sumDefectUnits(data.majorDefects || []);
        const totalMenores = sumDefectUnits(data.minorDefects || []);
        const totalGeneral = totalCriticos + totalMayores + totalMenores;

        // Determinar el estado basado en los defectos y completitud
        let estado = "pendiente";
        if (data.completed) {
            estado = totalGeneral > 0 ? "rechazado" : "aprobado";
        }

        return {
            id: `INS-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            estado: estado,
            metadata: {
                codigo: "F.GE.MC.015",
                tipo_documento: "Formato",
                version: "00",
                area_responsable: "Calidad y Mejora Continua",
                paginas: 1, // Se actualizará después de generar el PDF
                completado: data.completed || false
            },
            elaboracion: {
                elaborado_por: data.elaboradoPor || "Usuario actual",
                revisado_por: data.revisadoPor || "",
                aprobado_por: data.aprobadoPor || "",
                fecha_elaboracion: data.fechaElaboracion || new Date().toISOString().split('T')[0],
                fecha_revision: data.fechaRevision || "",
                fecha_aprobacion: data.fechaAprobacion || ""
            },
            datos_inspeccion: {
                area: data.area || "",
                fecha: data.date || "",
                producto: data.product || "",
                lote: data.lot || "",
                tamano_lote: data.batchSize || "",
                tamano_muestra: data.sampleSize || "",
                nivel_inspeccion: data.inspectionLevel || ""
            },
            cuestionario: [
                {
                    pregunta: "¿El formulador registra correctamente la información en la orden de producción?",
                    conformidad: data.questionnaire?.q1 === "C",
                    no_conformidad: data.questionnaire?.q1 === "NC"
                },
                {
                    pregunta: "¿El formulador está correctamente uniformado?",
                    conformidad: data.questionnaire?.q2 === "C",
                    no_conformidad: data.questionnaire?.q2 === "NC"
                },
                {
                    pregunta: "¿Las condiciones ambientales son registradas correctamente y se mantienen dentro de los parámetros establecidos?",
                    conformidad: data.questionnaire?.q3 === "C",
                    no_conformidad: data.questionnaire?.q3 === "NC"
                },
                {
                    pregunta: "¿Las áreas se encuentran identificadas correctamente?",
                    conformidad: data.questionnaire?.q4 === "C",
                    no_conformidad: data.questionnaire?.q4 === "NC"
                },
                {
                    pregunta: "¿El formulador realiza correctamente la limpieza del área, equipos y/o instrumentos?",
                    conformidad: data.questionnaire?.q5 === "C",
                    no_conformidad: data.questionnaire?.q5 === "NC"
                },
                {
                    pregunta: "¿Se registra correctamente el análisis organoléptico del producto?",
                    conformidad: data.questionnaire?.q6 === "C",
                    no_conformidad: data.questionnaire?.q6 === "NC"
                },
                {
                    pregunta: "¿La documentación del proceso se encuentra completa, vigente y legible?",
                    conformidad: data.questionnaire?.q7 === "C",
                    no_conformidad: data.questionnaire?.q7 === "NC"
                }
            ],
            defectos: {
                criticos: {
                    aql: "0.015%",
                    items: [
                        {
                            descripcion: "Filtración de producto",
                            unidades: data.criticalDefects?.[0]?.units || 0
                        },
                        {
                            descripcion: "Degradación visible del producto (color, olor, separación en fase, decantación)",
                            unidades: data.criticalDefects?.[1]?.units || 0
                        },
                        {
                            descripcion: "Presencia de cuerpo extraño visible en contacto con el producto",
                            unidades: data.criticalDefects?.[2]?.units || 0
                        },
                        {
                            descripcion: "Envase con suciedad interna",
                            unidades: data.criticalDefects?.[3]?.units || 0
                        },
                        {
                            descripcion: "Envase sin contenido de producto o faltante",
                            unidades: data.criticalDefects?.[4]?.units || 0
                        },
                        {
                            descripcion: "Mezcla de materiales con otro producto o lote",
                            unidades: data.criticalDefects?.[5]?.units || 0
                        },
                        {
                            descripcion: "Faltante de unidades",
                            unidades: data.criticalDefects?.[6]?.units || 0
                        },
                        {
                            descripcion: "Información ausente, incorrecta y/o incompleta (etiqueta de identificación)",
                            unidades: data.criticalDefects?.[7]?.units || 0
                        }
                    ],
                    total_defectos: totalCriticos
                },
                mayores: {
                    aql: "1%",
                    items: [
                        {
                            descripcion: "Deterioro superficial o deterioro del material que afecten apariencia externa",
                            unidades: data.majorDefects?.[0]?.units || 0
                        },
                        {
                            descripcion: "Tapas con presencia rota",
                            unidades: data.majorDefects?.[1]?.units || 0
                        },
                        {
                            descripcion: "Mal estado del producto que no afecta su seguridad",
                            unidades: data.majorDefects?.[2]?.units || 0
                        },
                        {
                            descripcion: "Dificultad para abrir o cerrar el envase (cuando aplique)",
                            unidades: data.majorDefects?.[3]?.units || 0
                        },
                        {
                            descripcion: "Ausencia de la cantidad contenida en el envase",
                            unidades: data.majorDefects?.[4]?.units || 0
                        },
                        {
                            descripcion: "Ausencia del peso tara en el etiquetado",
                            unidades: data.majorDefects?.[5]?.units || 0
                        }
                    ],
                    total_defectos: totalMayores
                },
                menores: {
                    aql: "4%",
                    items: [
                        {
                            descripcion: "Envases ligeramente deformados",
                            unidades: data.minorDefects?.[0]?.units || 0
                        },
                        {
                            descripcion: "Manchas o suciedad en el exterior",
                            unidades: data.minorDefects?.[1]?.units || 0
                        },
                        {
                            descripcion: "Impresión de rotulado deficiente que no afecta la información",
                            unidades: data.minorDefects?.[2]?.units || 0
                        }
                    ],
                    total_defectos: totalMenores
                },
                total_general: totalGeneral
            },
            observaciones: data.observations ? [data.observations] : [],
            evidencias: data.images?.map((img, index) => ({
                id: `img-${index + 1}`,
                nombre: img.name || `evidencia-${index + 1}.jpg`,
                url: img.url,
                descripcion: img.description || ""
            })) || []
        };
    };

    // Función para resetear el formulario
    const resetForm = () => {
        setFormData({
            area: '',
            date: '',
            product: '',
            lot: '',
            batchSize: '',
            sampleSize: '',
            inspectionLevel: '',
            questionnaire: {},
            criticalDefects: [],
            majorDefects: [],
            minorDefects: [],
            observations: '',
            images: [],
            completed: false,
            elaboradoPor: '',
            revisadoPor: '',
            aprobadoPor: '',
            fechaElaboracion: '',
            fechaRevision: '',
            fechaAprobacion: ''
        });

        setValidationErrors({});
        setTouchedFields({});
    };

    const handleSave = async () => {

        // Validación básica antes de guardar
        if (!formData.area || !formData.date) {
            setError({ save: "Los campos Área y Fecha son requeridos" });
            return;
        }
        setLoading(prev => ({ ...prev, save: true }));
        setSuccess(prev => ({ ...prev, save: false }));
        setError(prev => ({ ...prev, save: null }));

        try {
            // Transformar los datos al formato de db.json
            const reportData = transformToDbJsonFormat(formData);

            // Intentar guardar en db.json mediante API
            try {
                const savedReport = await saveToDbJson(reportData);
                console.log('Reporte guardado en db.json:', savedReport);
                alert("Reporte guardado correctamente");
                setSuccess(prev => ({ ...prev, save: true }));
                // Limpiar el formulario después de guardar exitosamente
                resetForm(); // <-- Aquí llamamos a la función para limpiar el formulario
            } catch (apiError) {
                console.warn('No se pudo guardar en db.json, usando localStorage:', apiError);

                // Fallback a localStorage
                const saved = saveDataLocally("savedReports", reportData);
                if (!saved) throw new Error("No se pudo guardar el reporte localmente");

                setSuccess(prev => ({ ...prev, save: true }));
            }

            // Mostrar éxito por 3 segundos
            setTimeout(() => {
                setSuccess(prev => ({ ...prev, save: false }));
            }, 3000);
        } catch (error) {
            console.error("Error al guardar:", error);
            setError(prev => ({ ...prev, save: error.message }));
        } finally {
            setLoading(prev => ({ ...prev, save: false }));
        }
    };

    return (
        <Container>
            <ButtonsWrapper>
                <Button
                    $variant="outline"
                    onClick={handleDownloadPDF}
                    disabled={loading.pdf}
                >
                    <IconWrapper>
                        {loading.pdf ? <Loader2 className="animate-spin" /> : <Download />}
                    </IconWrapper>
                    Descargar PDF
                </Button>

                <Button
                    onClick={handleSave}
                    disabled={loading.save}
                    className="relative"
                >
                    <IconWrapper>
                        {loading.save ? (
                            <Loader2 className="animate-spin" />
                        ) : success.drive ? (
                            <Check className="text-success" />
                        ) : (
                            <Save />
                        )}
                    </IconWrapper>
                    Guardar
                    {success.save && (
                        <SuccessIndicator>
                            <span className="ping-dot" />
                            <span className="solid-dot" />
                        </SuccessIndicator>
                    )}
                </Button>

                <Button
                    $variant="outline"
                    onClick={handleSaveToDrive}
                    disabled={loading.drive}
                    className="relative"
                >
                    <IconWrapper>
                        {loading.drive ? (
                            <Loader2 className="animate-spin" />
                        ) : success.drive ? (
                            <Check className="text-success" />
                        ) : (
                            <Save />
                        )}
                    </IconWrapper>
                    Guardar en Drive
                    {success.drive && (
                        <SuccessIndicator>
                            <span className="ping-dot" />
                            <span className="solid-dot" />
                        </SuccessIndicator>
                    )}
                </Button>

                <Button
                    $variant="outline"
                    onClick={() => setEmailDialogOpen(true)}
                >
                    <IconWrapper>
                        <Mail />
                    </IconWrapper>
                    Enviar por correo
                </Button>
            </ButtonsWrapper>

            {/* Mostrar errores de guardado */}
            {error.save && (
                <ErrorAlert>
                    <AlertCircle className="icon" />
                    <ErrorContent>
                        <p className="error-title">Error al guardar</p>
                        <p className="error-message">{error.save}</p>
                    </ErrorContent>
                </ErrorAlert>
            )}

            {emailDialogOpen && (
                <DialogOverlay>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Enviar reporte por correo electrónico</DialogTitle>
                            <DialogDescription>
                                Complete los siguientes campos para enviar el reporte por correo electrónico.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogForm>
                            <FormGroup>
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label htmlFor="subject">Asunto</Label>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </FormGroup>
                        </DialogForm>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setEmailDialogOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSendEmail}
                                disabled={!email || loading.email}
                                className="relative"
                            >
                                <IconWrapper>
                                    {loading.email ? (
                                        <Loader2 className="animate-spin" />
                                    ) : success.email ? (
                                        <Check className="text-success" />
                                    ) : null}
                                </IconWrapper>
                                Enviar
                                {success.email && (
                                    <SuccessIndicator>
                                        <span className="ping-dot" />
                                        <span className="solid-dot" />
                                    </SuccessIndicator>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </DialogOverlay>
            )}

            {(error.drive || error.email) && (
                <ErrorAlert>
                    <AlertCircle className="icon" />
                    <ErrorContent>
                        <p className="error-title">Error en la operación</p>
                        <p className="error-message">{error.drive || error.email}</p>
                    </ErrorContent>
                </ErrorAlert>
            )}
        </Container>
    );
};

export default Buttons;