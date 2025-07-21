import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
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
  HeaderActions,
  LoadingSpinner,
  ErrorMessage,
  RefreshButton
} from './HistoryModal.style.js';

const HistoryModal = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'approved', 'pending', 'rejected'
  const [showConfirm, setShowConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Mapeo de estados en inglés a español
  const statusMap = {
    'aprobado': 'approved',
    'pendiente': 'pending',
    'rechazado': 'rejected',
    'approved': 'approved',
    'pending': 'pending',
    'rejected': 'rejected'
  };

  // Mapeo inverso para mostrar en español
  const statusDisplayMap = {
    'approved': 'aprobado',
    'pending': 'pendiente',
    'rejected': 'rechazado',
    'aprobado': 'aprobado',
    'pendiente': 'pendiente',
    'rechazado': 'rechazado'
  };

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadHistoryData();
    }
  }, [isOpen]);

  // Detectar cambios en la conectividad
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isOpen) loadHistoryData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOpen]);

  const loadHistoryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let reportes;
      
      // Intentar cargar desde la API primero
      if (isOnline) {
        try {
          reportes = await apiService.getReportes();
        } catch (apiError) {
          console.warn('API no disponible, cargando datos locales:', apiError);
          reportes = await apiService.loadFromLocalJson();
        }
      } else {
        // Si está offline, cargar datos locales
        reportes = await apiService.loadFromLocalJson();
      }

      // Formatear los datos para el historial
      const formattedData = apiService.formatReportesForHistory(reportes);
      setHistoryData(formattedData);
      
    } catch (err) {
      console.error('Error cargando historial:', err);
      setError('No se pudo cargar el historial. Mostrando datos de ejemplo.');
      
      // Usar datos de respaldo
      const fallbackData = apiService.getFallbackData();
      const formattedData = apiService.formatReportesForHistory(fallbackData);
      setHistoryData(formattedData);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadHistoryData();
  };

  const filteredHistory = historyData.filter(item => {
    if (filter === 'all') return true;
    const itemStatus = statusMap[item.status] || item.status;
    return itemStatus === filter;
  });

  const getStatusColor = (status) => {
    const normalizedStatus = statusDisplayMap[status] || status;
    switch (normalizedStatus) {
      case 'aprobado': return '#28a745';
      case 'pendiente': return '#ffc107';
      case 'rechazado': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    const normalizedStatus = statusDisplayMap[status] || status;
    switch (normalizedStatus) {
      case 'aprobado': return 'Aprobado';
      case 'pendiente': return 'Pendiente';
      case 'rechazado': return 'Rechazado';
      default: return 'Desconocido';
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        setLoading(true);
        
        // Intentar eliminar del servidor si está online
        if (isOnline) {
          try {
            await apiService.deleteReporte(itemToDelete.id);
          } catch (apiError) {
            console.warn('No se pudo eliminar del servidor:', apiError);
          }
        }
        
        // Eliminar del estado local
        setHistoryData(prev => prev.filter(item => item.id !== itemToDelete.id));
        setShowConfirm(false);
        setItemToDelete(null);
        
      } catch (error) {
        console.error('Error eliminando reporte:', error);
        setError('Error al eliminar el reporte');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setItemToDelete(null);
  };

  const handleClearAllClick = () => {
    setShowClearAllConfirm(true);
  };

  const handleConfirmClearAll = async () => {
    try {
      setLoading(true);
      
      // Si está online, intentar eliminar todos del servidor
      if (isOnline) {
        try {
          const deletePromises = historyData.map(item => 
            apiService.deleteReporte(item.id).catch(err => 
              console.warn(`Error eliminando ${item.id}:`, err)
            )
          );
          await Promise.all(deletePromises);
        } catch (error) {
          console.warn('Algunos reportes no se pudieron eliminar del servidor:', error);
        }
      }
      
      setHistoryData([]);
      setShowClearAllConfirm(false);
      
    } catch (error) {
      console.error('Error limpiando historial:', error);
      setError('Error al limpiar el historial');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClearAll = () => {
    setShowClearAllConfirm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <div>
              <h2>Historial de Reportes</h2>
              {!isOnline && (
                <small style={{ color: '#ffc107', fontSize: '0.75rem' }}>
                  📶 Modo sin conexión - Datos locales
                </small>
              )}
            </div>
            <HeaderActions>
              <RefreshButton onClick={refreshData} disabled={loading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M1 4V10H7" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M23 20V14H17" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                {loading ? 'Actualizando...' : 'Actualizar'}
              </RefreshButton>
              
              {historyData.length > 0 && (
                <ClearAllButton onClick={handleClearAllClick} disabled={loading}>
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
              Todos ({historyData.length})
            </FilterButton>
            <FilterButton 
              $active={filter === 'approved'} 
              onClick={() => setFilter('approved')}
            >
              Aprobados ({historyData.filter(item => statusMap[item.status] === 'approved').length})
            </FilterButton>
            <FilterButton 
              $active={filter === 'pending'} 
              onClick={() => setFilter('pending')}
            >
              Pendientes ({historyData.filter(item => statusMap[item.status] === 'pending').length})
            </FilterButton>
            <FilterButton 
              $active={filter === 'rejected'} 
              onClick={() => setFilter('rejected')}
            >
              Rechazados ({historyData.filter(item => statusMap[item.status] === 'rejected').length})
            </FilterButton>
          </FilterSection>

          <ModalBody>
            {error && (
              <ErrorMessage>
                ⚠️ {error}
                <button onClick={refreshData} style={{ marginLeft: '10px' }}>
                  Reintentar
                </button>
              </ErrorMessage>
            )}

            {loading ? (
              <LoadingSpinner>
                <div className="spinner"></div>
                <p>Cargando historial...</p>
              </LoadingSpinner>
            ) : (
              <HistoryList>
                {filteredHistory.length > 0 ? (
                  filteredHistory.map(item => (
                    <HistoryItem key={item.id}>
                      <HistoryDate>{formatDate(item.date)}</HistoryDate>
                      <HistoryTitle>
                        <strong>{item.product || 'Producto no especificado'}</strong>
                        {item.lot && ` - ${item.lot}`}
                        <br />
                        <small>{item.area || 'Área no especificada'}</small>
                        {item.elaborado_por && (
                          <><br /><small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                            Por: {item.elaborado_por}
                          </small></>
                        )}
                        {item.total_defectos !== null && item.total_defectos !== undefined && (
                          <><br /><small style={{ 
                            color: item.total_defectos > 0 ? '#dc3545' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            Defectos: {item.total_defectos}
                          </small></>
                        )}
                      </HistoryTitle>
                      <HistoryStatus color={getStatusColor(item.status)}>
                        {getStatusText(item.status)}
                        {!item.completado && (
                          <><br /><small style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                            Incompleto
                          </small></>
                        )}
                      </HistoryStatus>
                      <DeleteButton 
                        onClick={() => handleDeleteClick(item)}
                        title={`Eliminar reporte ${item.id}`}
                        disabled={loading}
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
                    {filter === 'all' 
                      ? 'No se encontraron reportes en el historial'
                      : `No se encontraron reportes ${getStatusText(filter).toLowerCase()}`
                    }
                  </NoResults>
                )}
              </HistoryList>
            )}
          </ModalBody>
        </ModalContent>
      </ModalOverlay>

      {/* Diálogo de confirmación para eliminar un elemento */}
      {showConfirm && (
        <DialogOverlay>
          <ConfirmDialog>
            <h3>Confirmar eliminación</h3>
            <p>
              ¿Estás seguro de que deseas eliminar el reporte{' '}
              <strong>{itemToDelete?.id}</strong>?
            </p>
            <p>
              <strong>Producto:</strong> {itemToDelete?.product || 'No especificado'}
              {itemToDelete?.lot && <><br /><strong>Lote:</strong> {itemToDelete.lot}</>}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6c757d' }}>
              Esta acción no se puede deshacer.
            </p>
            <DialogActions>
              <DialogButton variant="secondary" onClick={handleCancelDelete} disabled={loading}>
                Cancelar
              </DialogButton>
              <DialogButton variant="danger" onClick={handleConfirmDelete} disabled={loading}>
                {loading ? 'Eliminando...' : 'Eliminar'}
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
              <DialogButton variant="secondary" onClick={handleCancelClearAll} disabled={loading}>
                Cancelar
              </DialogButton>
              <DialogButton variant="danger" onClick={handleConfirmClearAll} disabled={loading}>
                {loading ? 'Eliminando...' : 'Vaciar Todo'}
              </DialogButton>
            </DialogActions>
          </ConfirmDialog>
        </DialogOverlay>
      )}
    </>
  );
};

export default HistoryModal;