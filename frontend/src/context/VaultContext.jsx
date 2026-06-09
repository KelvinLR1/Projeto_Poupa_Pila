import React, { createContext, useContext, useState } from 'react';

const VaultContext = createContext();

const VAULT_COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444'];

const initialVault = [
  {
    id: 'g1',
    name: 'Trabalho',
    color: '#6366f1',
    subgroups: [
      {
        id: 'sg1',
        name: 'E-mails',
        entries: [
          { id: 'e1', name: 'Gmail Corporativo', username: 'kelvin@empresa.com', password: 'G0rp0Email#2024', url: 'https://mail.google.com', notes: '' },
        ]
      },
      {
        id: 'sg2',
        name: 'Sistemas Internos',
        entries: [
          { id: 'e2', name: 'ERP da Empresa', username: 'kelvin.user', password: 'Erp@Sys2024!', url: 'https://erp.empresa.com.br', notes: 'Trocar senha a cada 90 dias' },
        ]
      }
    ],
    entries: []
  },
  {
    id: 'g2',
    name: 'Pessoal',
    color: '#10b981',
    subgroups: [
      {
        id: 'sg3',
        name: 'Redes Sociais',
        entries: [
          { id: 'e3', name: 'Instagram', username: '@kelvin_lr', password: 'Insta@P3ss0al!', url: 'https://instagram.com', notes: '' },
        ]
      }
    ],
    entries: [
      { id: 'e4', name: 'Netflix', username: 'kelvin@gmail.com', password: 'Netf1ix#Casa', url: 'https://netflix.com', notes: 'Plano Premium' },
    ]
  },
  {
    id: 'g3',
    name: 'Financeiro',
    color: '#f59e0b',
    subgroups: [],
    entries: [
      { id: 'e5', name: 'Nubank', username: 'kelvin@gmail.com', password: 'NuB@nk#2024!', url: 'https://nubank.com.br', notes: '' },
      { id: 'e6', name: 'Itaú Internet Banking', username: '0001.123456', password: 'It@uBank2024', url: 'https://itau.com.br', notes: 'Agência 0001, Conta 123456-7' },
    ]
  }
];

export function VaultProvider({ children }) {
  const [vault, setVault] = useState(initialVault);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // ─── Groups ───
  const addGroup = ({ name, color }) => {
    setVault(prev => [...prev, {
      id: generateId(),
      name: name.trim(),
      color: color || VAULT_COLORS[0],
      subgroups: [],
      entries: []
    }]);
  };

  const deleteGroup = (groupId) => {
    setVault(prev => prev.filter(g => g.id !== groupId));
  };

  // ─── Subgroups ───
  const addSubgroup = (groupId, { name }) => {
    setVault(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, subgroups: [...(g.subgroups || []), { id: generateId(), name: name.trim(), entries: [] }] }
        : g
    ));
  };

  const deleteSubgroup = (groupId, subgroupId) => {
    setVault(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, subgroups: (g.subgroups || []).filter(sg => sg.id !== subgroupId) }
        : g
    ));
  };

  // ─── Entries ───
  const addEntry = (groupId, subgroupId, entryData) => {
    const entry = { id: generateId(), ...entryData };
    setVault(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      if (subgroupId) {
        return {
          ...g,
          subgroups: (g.subgroups || []).map(sg =>
            sg.id === subgroupId
              ? { ...sg, entries: [...sg.entries, entry] }
              : sg
          )
        };
      }
      return { ...g, entries: [...(g.entries || []), entry] };
    }));
  };

  const editEntry = (groupId, subgroupId, entryId, entryData) => {
    setVault(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      if (subgroupId) {
        return {
          ...g,
          subgroups: (g.subgroups || []).map(sg =>
            sg.id === subgroupId
              ? { ...sg, entries: sg.entries.map(e => e.id === entryId ? { ...e, ...entryData } : e) }
              : sg
          )
        };
      }
      return { ...g, entries: (g.entries || []).map(e => e.id === entryId ? { ...e, ...entryData } : e) };
    }));
  };

  const deleteEntry = (groupId, subgroupId, entryId) => {
    setVault(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      if (subgroupId) {
        return {
          ...g,
          subgroups: (g.subgroups || []).map(sg =>
            sg.id === subgroupId
              ? { ...sg, entries: sg.entries.filter(e => e.id !== entryId) }
              : sg
          )
        };
      }
      return { ...g, entries: (g.entries || []).filter(e => e.id !== entryId) };
    }));
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
