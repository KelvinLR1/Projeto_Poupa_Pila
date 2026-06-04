import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Carrega o usuário do localStorage ao iniciar a aplicação
  useEffect(() => {
    const savedUser = localStorage.getItem('poupa_pila_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('poupa_pila_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setAuthError('');
    
    // Simula um delay de requisição para efeito de carregamento premium
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!username || !password) {
          setAuthError('Por favor, preencha todos os campos.');
          resolve(false);
          return;
        }

        // Senha padrão aceita: "admin" para facilitar o teste local
        if (password !== 'admin') {
          setAuthError('Usuário ou senha incorretos.');
          resolve(false);
          return;
        }

        // Define o nome de exibição de forma amigável
        let name = '';
        const lowerUser = username.toLowerCase().trim();
        if (lowerUser === 'joao' || lowerUser === 'joão') {
          name = 'João';
        } else if (lowerUser === 'kelvin') {
          name = 'Kelvin';
        } else if (lowerUser === 'admin') {
          name = 'Administrador';
        } else {
          // Capitaliza o nome digitado
          name = username.charAt(0).toUpperCase() + username.slice(1);
        }

        const userData = { username: lowerUser, name };
        localStorage.setItem('poupa_pila_user', JSON.stringify(userData));
        setUser(userData);
        resolve(true);
      }, 1000);
    });
  };

  const logout = () => {
    localStorage.removeItem('poupa_pila_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, authError, login, logout, setAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
