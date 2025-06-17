import React from 'react';
import {
    Container,
    LeftColumn,
    RightColumn,
    FieldGroup,
    Label,
    Input
} from './ProductSection.style.js';
import './ProductSection.css';

const ProductSection = ({
    product,
    lot,
    date,
    area,
    onProductChange,
    onLotChange,
    onDateChange,
    onAreaChange,
}) => {
    return (
        <Container>
            {/* Columna izquierda: Área y Producto */}
            <LeftColumn>
                <FieldGroup className="mb-4">
                    <Label>Área:</Label>
                    <Input
                        type="text"
                        value={area}
                        onChange={(e) => onAreaChange(e.target.value)}
                        placeholder="Ingrese el área"
                    />
                </FieldGroup>
                <FieldGroup>
                    <Label>Producto:</Label>
                    <Input
                        type="text"
                        value={product}
                        onChange={(e) => onProductChange(e.target.value)}
                        placeholder="Ingrese el producto"
                    />
                </FieldGroup>
            </LeftColumn>

            {/* Columna derecha: Fecha y Lote */}
            <RightColumn>
                <FieldGroup className="mb-4">
                    <Label>Fecha:</Label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => onDateChange(e.target.value)}
                    />
                </FieldGroup>
                <FieldGroup>
                    <Label>Lote:</Label>
                    <Input
                        type="text"
                        value={lot}
                        onChange={(e) => onLotChange(e.target.value)}
                        placeholder="Ingrese el lote"
                    />
                </FieldGroup>
            </RightColumn>
        </Container>
    );
};

export default ProductSection;