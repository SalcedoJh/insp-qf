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

const Buttons = ({ formData = {} }) => {
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("Reporte de Inspección de Calidad");
    const [loading, setLoading] = useState({
        pdf: false,
        drive: false,
        email: false,
    });
    const [success, setSuccess] = useState({
        drive: false,
        email: false,
    });
    const [error, setError] = useState({
        drive: null,
        email: null,
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

            // ===== ENCABEZADO =====
            pdf.setFontSize(16);
            pdf.setFont("helvetica", "bold");
            pdf.text("REPORTE DE INSPECCIÓN DE CALIDAD", pageWidth / 2, y, { align: "center" });
            y += 10;

            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Código: F.GE.MC.015`, margin, y);
            pdf.text(`Versión: 00`, pageWidth - margin, y, { align: "right" });
            y += 15;

            // ===== INFORMACIÓN DEL PRODUCTO =====
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text("INFORMACIÓN DEL PRODUCTO", margin, y);
            y += 7;

            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Lote: ${formData.lot || 'No especificado'}`, margin, y);
            pdf.text(`Área: ${formData.area || 'No especificada'}`, pageWidth / 2, y);
            y += 5;
            pdf.text(`Producto: ${formData.product || 'No especificado'}`, margin, y);
            y += 5;
            pdf.text(`Fecha: ${formData.date || 'No especificada'}`, margin, y);
            pdf.text(`Hora: ${formData.time || 'No especificada'}`, pageWidth / 2, y);
            y += 15;

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

            if (formData.observations ) {
                y = addWrappedText(formData.observations , margin, y, contentWidth);
            } else {
                pdf.text("Sin observaciones", margin, y);
            }

            y += 10;

            // ===== FIRMAS =====
            y = checkPageBreak(y, 60);
            y = addSectionHeader("FIRMAS", y);

            // Añadir firmas si existen
            if (formData.signatures && (formData.signatures.assistant || formData.signatures.chief)) {
                pdf.text("Asistente de Calidad", margin, y);
                pdf.text("Jefe de Calidad y Mejora Continua", pageWidth / 2 + 10, y);
                y += 5;

                // Espacio para las firmas
                pdf.setDrawColor(200, 200, 200);
                pdf.rect(margin, y, pageWidth / 2 - margin - 10, 30);
                pdf.rect(pageWidth / 2 + 10, y, pageWidth / 2 - margin - 10, 30);

                // Si hay firmas, añadirlas como imágenes
                if (formData.signatures.assistant) {
                    try {
                        pdf.addImage(formData.signatures.assistant, "PNG", margin + 5, y + 5, pageWidth / 2 - margin - 20, 20);
                    } catch (error) {
                        console.error("Error al añadir firma del asistente:", error);
                        pdf.text("Firma del Asistente", margin + 10, y + 15);
                    }
                }

                if (formData.signatures.chief) {
                    try {
                        pdf.addImage(formData.signatures.chief, "PNG", pageWidth / 2 + 15, y + 5, pageWidth / 2 - margin - 20, 20);
                    } catch (error) {
                        console.error("Error al añadir firma del jefe:", error);
                        pdf.text("Firma del Jefe", pageWidth / 2 + 20, y + 15);
                    }
                }

                y += 35;
            } else {
                pdf.text("No hay firmas registradas", margin, y);
                y += 10;
            }

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