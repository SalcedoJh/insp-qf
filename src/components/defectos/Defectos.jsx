import React from 'react';
import {
    Container,
    SectionHeader,
    DefectTable,
    TableHeader,
    TableHeaderCell,
    TableRow,
    DefectDescription,
    InputContainer,
    DefectInput
} from './Defectos.style.js';
import './Defectos.css';

const DefectsSection = ({
    criticalDefects = [],
    majorDefects = [],
    minorDefects = [],
    onDefectChange = () => {},
}) => {
    const criticalDefectsList = [
        "Filtración de producto.",
        "Degradación visible del producto (color, olor, separación en fase, decantación).",
        "Presencia de cuerpo extraño visible en contacto con el producto.",
        "Envase con suciedad interna.",
        "Envase sin contenido de producto o faltante.",
        "Mezcla de materiales con otro producto o lote.",
        "faltante de unidades",
        "información ausente, incorrecta y/o incompleta (etiqueta de identifiación)",
    ];

    const majorDefectsList = [
        
        "Deterioro superficial o deterioro del material que afecten apariencia externa.",
        "Tapas con presencia rota.",
        "Mal estado del producto que no afecta su seguridad.",
        "Dificultad para abrir o cerrar el envase (cuando aplique).",
        "Ausencia de la cantidad contenida en el envase.",
        "Ausencia del peso tara en el etiquetado.",
    ];

    const minorDefectsList = [
        "Envaces ligeramente deformados.",
        "Manchas o suciedad en el exterior.",
        "Impresión de rotulado deficiente que no afecta la información.",
    ];

    const renderDefectSection = (title, defectsList, defectsData = [], defectType) => (
        <DefectTable className="mb-4">
            <TableHeader>
                <TableHeaderCell className="defect-type">
                    {title}
                </TableHeaderCell>
                <TableHeaderCell className="units-header">
                    Unidades
                </TableHeaderCell>
            </TableHeader>

            {defectsList.map((defect, index) => (
                <TableRow 
                    key={`${defectType}-${index}`}
                    data-question-index={index}
                    data-section={defectType}
                >
                    <DefectDescription>
                        {defect}
                    </DefectDescription>
                    <InputContainer>
                        <DefectInput
                            type="text"
                            value={defectsData[index]?.units || ""}
                            onChange={(e) => onDefectChange(defectType, index, "units", e.target.value)}
                            placeholder="-"
                        />
                    </InputContainer>
                </TableRow>
            ))}
        </DefectTable>
    );

    return (
        <Container>
            <SectionHeader>
                2. Indicar la cantidad de unidades con el defecto detectado, caso contrario colocar (-).
            </SectionHeader>

            {/* Critical Defects */}
            {renderDefectSection(
                "2.1 Defecto crítico (AQL 0.015%)",
                criticalDefectsList,
                criticalDefects,
                "criticalDefects"
            )}

            {/* Major Defects */}
            {renderDefectSection(
                "2.2 Defecto mayor (AQL 1%)",
                majorDefectsList,
                majorDefects,
                "majorDefects"
            )}

            {/* Minor Defects */}
            {renderDefectSection(
                "2.3 Defecto menor (AQL 4%)",
                minorDefectsList,
                minorDefects,
                "minorDefects"
            )}
        </Container>
    );
};

export default DefectsSection;