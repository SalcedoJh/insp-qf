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
  NoResults,
  DeleteButton,
  ConfirmDialog,
  DialogOverlay,
  DialogActions,
  DialogButton,
  ClearAllButton,
  HeaderActions
} from './HistoryModal.style.js';

const HistoryModal = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'approved', 'pending', 'rejected'
  const [showConfirm, setShowConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Datos de ejemplo del historial
  const [historyData, setHistoryData] = useState([
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
  ]);

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

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      setHistoryData(prev => prev.filter(item => item.id !== itemToDelete.id));
      setShowConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setItemToDelete(null);
  };

  const handleClearAllClick = () => {
    setShowClearAllConfirm(true);
  };

  const handleConfirmClearAll = () => {
    setHistoryData([]);
    setShowClearAllConfirm(false);
  };

  const handleCancelClearAll = () => {
    setShowClearAllConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <h2>Historial de Reportes</h2>
            <HeaderActions>
              {historyData.length > 0 && (
                <ClearAllButton onClick={handleClearAllClick}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M3 6H5H21" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                    <path 
                      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                  Vaciar Todo
                </ClearAllButton>
              )}
              <CloseButton onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </CloseButton>
            </HeaderActions>
          </ModalHeader>
          
          <FilterSection>
            <FilterButton 
              $active={filter === 'all'} 
              onClick={() => setFilter('all')}
            >
              Todos
            </FilterButton>
            <FilterButton 
              $active={filter === 'approved'} 
              onClick={() => setFilter('approved')}
            >
              Aprobados
            </FilterButton>
            <FilterButton 
              $active={filter === 'pending'} 
              onClick={() => setFilter('pending')}
            >
              Pendientes
            </FilterButton>
            <FilterButton 
              $active={filter === 'rejected'} 
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
                    <DeleteButton 
                      onClick={() => handleDeleteClick(item)}
                      title="Eliminar reporte"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M3 6H5H21" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        <path 
                          d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        <path 
                          d="M10 11V17" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                        <path 
                          d="M14 11V17" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    </DeleteButton>
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

      {/* Diálogo de confirmación para eliminar un elemento */}
      {showConfirm && (
        <DialogOverlay>
          <ConfirmDialog>
            <h3>Confirmar eliminación</h3>
            <p>
              ¿Estás seguro de que deseas eliminar el reporte de{' '}
              <strong>{itemToDelete?.product}</strong> - {itemToDelete?.lot}?
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6c757d' }}>
              Esta acción no se puede deshacer.
            </p>
            <DialogActions>
              <DialogButton variant="secondary" onClick={handleCancelDelete}>
                Cancelar
              </DialogButton>
              <DialogButton variant="danger" onClick={handleConfirmDelete}>
                Eliminar
              </DialogButton>
            </DialogActions>
          </ConfirmDialog>
        </DialogOverlay>
      )}

      {/* Diálogo de confirmación para vaciar todo el historial */}
      {showClearAllConfirm && (
        <DialogOverlay>
          <ConfirmDialog>
            <h3>Vaciar historial completo</h3>
            <p>
              ¿Estás seguro de que deseas eliminar <strong>todos los reportes</strong> del historial?
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6c757d' }}>
              Se eliminarán <strong>{historyData.length} reportes</strong> permanentemente. 
              Esta acción no se puede deshacer.
            </p>
            <DialogActions>
              <DialogButton variant="secondary" onClick={handleCancelClearAll}>
                Cancelar
              </DialogButton>
              <DialogButton variant="danger" onClick={handleConfirmClearAll}>
                Vaciar Todo
              </DialogButton>
            </DialogActions>
          </ConfirmDialog>
        </DialogOverlay>
      )}
    </>
  );
};

export default HistoryModal;