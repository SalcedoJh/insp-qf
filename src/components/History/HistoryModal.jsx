import React, { useState } from 'react';
import { 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  CloseButton,
  HistoryList,
  HistoryItem,
  HistoryDate,
  HistoryTitle,
  HistoryStatus,
  FilterSection,
  FilterButton,
  NoResults
} from './HistoryModal.style.js';

const HistoryModal = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'approved', 'pending', 'rejected'
  
  // Datos de ejemplo del historial
  const historyData = [
    {
      id: 1,
      date: '2023-03-27',
      product: 'Producto A',
      lot: 'LOT001',
      status: 'approved',
      area: 'Área de Producción'
    },
    {
      id: 2,
      date: '2023-03-26',
      product: 'Producto B',
      lot: 'LOT002',
      status: 'pending',
      area: 'Área de Empaque'
    },
    {
      id: 3,
      date: '2023-03-25',
      product: 'Producto C',
      lot: 'LOT003',
      status: 'rejected',
      area: 'Área de Control'
    }
  ];

  const filteredHistory = historyData.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'pending': return '#ffc107';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Historial de Reportes</h2>
          <CloseButton onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </CloseButton>
        </ModalHeader>
        
        <FilterSection>
          <FilterButton 
            active={filter === 'all'} 
            onClick={() => setFilter('all')}
          >
            Todos
          </FilterButton>
          <FilterButton 
            active={filter === 'approved'} 
            onClick={() => setFilter('approved')}
          >
            Aprobados
          </FilterButton>
          <FilterButton 
            active={filter === 'pending'} 
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </FilterButton>
          <FilterButton 
            active={filter === 'rejected'} 
            onClick={() => setFilter('rejected')}
          >
            Rechazados
          </FilterButton>
        </FilterSection>

        <ModalBody>
          <HistoryList>
            {filteredHistory.length > 0 ? (
              filteredHistory.map(item => (
                <HistoryItem key={item.id}>
                  <HistoryDate>{item.date}</HistoryDate>
                  <HistoryTitle>
                    <strong>{item.product}</strong> - {item.lot}
                    <br />
                    <small>{item.area}</small>
                  </HistoryTitle>
                  <HistoryStatus color={getStatusColor(item.status)}>
                    {getStatusText(item.status)}
                  </HistoryStatus>
                </HistoryItem>
              ))
            ) : (
              <NoResults>
                No se encontraron reportes para el filtro seleccionado
              </NoResults>
            )}
          </HistoryList>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default HistoryModal;