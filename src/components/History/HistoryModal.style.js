import styled from 'styled-components';

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s ease-in-out;
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
  
  h2 {
    margin: 0;
    color: #333;
    font-size: 1.5rem;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e9ecef;
    color: #333;
  }
`;

export const FilterSection = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
`;

export const FilterButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  background-color: ${props => props.active ? '#00d4aa' : 'white'};
  color: ${props => props.active ? 'white' : '#6c757d'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#00b89a' : '#f8f9fa'};
  }
`;

export const ModalBody = styled.div`
  padding: 0;
  max-height: 50vh;
  overflow-y: auto;
`;

export const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

export const HistoryDate = styled.div`
  font-size: 0.875rem;
  color: #6c757d;
  min-width: 80px;
  margin-right: 16px;
`;

export const HistoryTitle = styled.div`
  flex: 1;
  
  strong {
    color: #333;
    font-size: 1rem;
  }
  
  small {
    color: #6c757d;
    font-size: 0.875rem;
  }
`;

export const HistoryStatus = styled.div`
  background-color: ${props => props.color};
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  min-width: 80px;
`;

export const NoResults = styled.div`
  text-align: center;
  padding: 40px 24px;
  color: #6c757d;
  font-style: italic;
`;