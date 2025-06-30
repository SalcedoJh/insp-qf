import React from 'react';
import {
    Container,
    BatchInfoField,
    FieldLabel,
    FieldInput
} from './Inspection.style.js';
import './Inspection.css';

const Inspection = ({ formData, handleChange, handleSimpleChange }) => {
    return (
        <>

            <Container>
                <BatchInfoField>
                    <FieldLabel>Tamaño de lote:</FieldLabel>
                    <FieldInput
                        type="text"
                        value={formData.batchSize}
                        onChange={(e) => handleSimpleChange("batchSize", e.target.value)}
                        placeholder="Ingrese el tamaño de lote"
                    />
                </BatchInfoField>

                <BatchInfoField>
                    <FieldLabel>Tamaño de muestra:</FieldLabel>
                    <FieldInput
                        type="text"
                        value={formData.sampleSize}
                        onChange={(e) => handleSimpleChange("sampleSize", e.target.value)}
                        placeholder="Ingrese el tamaño de muestra"
                    />
                </BatchInfoField>

                <BatchInfoField>
                    <FieldLabel>Tamaño de muestra:</FieldLabel>
                    <FieldInput
                        type="text"
                        value={formData.sampleSize}
                        onChange={(e) => handleSimpleChange("sampleSize", e.target.value)}
                        placeholder="Ingrese el tamaño de muestra"
                    />
                </BatchInfoField>


            </Container>


        </>
    );
};

export default Inspection;
