import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const VaultContext = createContext();

const VAULT_COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444'];

export function VaultProvider({ children }) {
  const { token, isAuthenticated, activeWorkspace } = useAuth();
  const [vault, setVault] = useState([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Busca a árvore do cofre de senhas do backend
  const fetchVaultData = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/vault/data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setVault(data || []);
      }
    } catch (e) {
      console.error('Erro ao buscar dados do cofre no backend:', e);
    }
  };

  // Carrega ao logar ou mudar workspace
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchVaultData();
    } else {
      setVault([]);
    }
  }, [isAuthenticated, token, activeWorkspace]);

  // ─── Groups ───
  const addGroup = async ({ name, color }) => {
    const id = generateId();
    try {
      const res = await fetch('/api/vault/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, name, color })
      });
      if (res.ok) {
        await fetchVaultData();
      }
    } catch (e) {
      console.error('Erro ao adicionar grupo no cofre:', e);
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      const res = await fetch(`/api/vault/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchVaultData();
      }
    } catch (e) {
      console.error('Erro ao excluir grupo do cofre:', e);
    }
  };

  // ─── Subgroups ───
  const addSubgroup = async (groupId, { name }) => {
    const id = generateId();
    try {
      const res = await fetch('/api/vault/subgroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, groupId, name })
      });
      if (res.ok) {
        await fetchVaultData();
      }
    } catch (e) {
      console.error('Erro ao adicionar subgrupo no cofre:', e);
    }
  };

  const deleteSubgroup = async (groupId, subgroupId) => {
    try {
      const res = await fetch(`/api/vault/subgroups/${groupId}/${subgroupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchVaultData();
      }
    } catch (e) {
      console.error('Erro ao deletar subgrupo do cofre:', e);
    }
  };

  // ─── Entries ───
  const addEntry = async (groupId, subgroupId, entryData) => {
    const id = generateId();
    try {
      const res = await fetch('/api/vault/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, groupId, subgroupId, ...entryData })
      });
      if (res.ok) {
        await fetchVaultData();
      }
    } catch (e) {
      console.error('Erro ao adicionar credencial no cofre:', e);
    }
  };

  const editEntry = async (groupId, subgroupId, entryId, entryData) => {
    try {
      const res = await fetch(`/api/vault/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entryData)
      });
      if (res.ok) {
        await fetchVaultData();
      }
    } catch (e) {
      console.error('Erro ao editar credencial no cofre:', e);
    }
  };

  const deleteEntry = async (groupId, subgroupId, entryId) => {
    try {
      const res = await fetch(`/api/vault/entries/${groupId}/${subgroupId || 'null'}/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchVaultData();
      }
    } catch (e) {
      console.error('Erro ao excluir credencial do cofre:', e);
    }
  };

  return (
    <VaultContext.Provider value={{
      vault,
      VAULT_COLORS,
      addGroup,
      deleteGroup,
      addSubgroup,
      deleteSubgroup,
      addEntry,
      editEntry,
      deleteEntry,
    }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be inside VaultProvider');
  return ctx;
}

