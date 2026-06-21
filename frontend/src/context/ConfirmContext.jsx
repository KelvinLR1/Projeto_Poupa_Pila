import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext();

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'danger',
    onConfirm: null,
    onCancel: null
  });

  const confirm = useCallback(({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'danger' }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, confirmState }}>
      {children}
    </ConfirmContext.Provider>
  );
}
