import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('poupa_pila_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Carrega o usuário e valida o token com o backend ao iniciar
  useEffect(() => {
    const validateToken = async () => {
      const savedToken = localStorage.getItem('poupa_pila_token');
      const savedUser = localStorage.getItem('poupa_pila_user');
      
      if (savedToken && savedUser) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setToken(savedToken);
          } else {
            // Token expirado ou inválido
            localStorage.removeItem('poupa_pila_token');
            localStorage.removeItem('poupa_pila_user');
            setUser(null);
            setToken(null);
          }
        } catch (e) {
          console.error('Erro de conexão ao validar token:', e);
          // Em caso de erro de rede, mantém o estado offline caso já estivesse salvo
          try {
            setUser(JSON.parse(savedUser));
          } catch (err) {
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const login = async (username, password, confirmRegister = false) => {
    setAuthError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, confirmRegister })
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Usuário ou senha incorretos.');
        return { success: false };
      }

      if (data.status === 'ask_register') {
        return { success: false, askRegister: true, message: data.message };
      }

      localStorage.setItem('poupa_pila_token', data.token);
      localStorage.setItem('poupa_pila_user', JSON.stringify(data.user));
      
      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (e) {
      console.error('Erro ao efetuar login:', e);
      setAuthError('Erro ao conectar com o servidor.');
      return { success: false };
    }
  };

  const logout = async () => {
    const savedToken = localStorage.getItem('poupa_pila_token');
    if (savedToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });
      } catch (e) {
        console.error('Erro ao deslogar do servidor:', e);
      }
    }
    localStorage.removeItem('poupa_pila_token');
    localStorage.removeItem('poupa_pila_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, loading, authError, login, logout, setAuthError }}>
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
