import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Eye, EyeOff, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';
import './Login.css';

export function Login() {
  const { login, authError, setAuthError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setAuthError('Preencha todos os campos para continuar.');
      return;
    }

    setIsSubmitting(true);
    const success = await login(username, password);
    setIsSubmitting(false);
  };

  return (
    <div className="login-wrapper">
      {/* Elementos Decorativos de Glow no Background */}
      <div className="login-bg-glow glow-1"></div>
      <div className="login-bg-glow glow-2"></div>

      <div className="login-container animate-slide-up">
        {/* Logo/Header */}
        <div className="login-header">
          <div className="login-logo-icon">
            <Sparkles size={32} className="text-emerald" />
          </div>
          <h1>Poupa<span className="text-emerald">Pila</span></h1>
          <p>Insira suas credenciais para acessar o painel financeiro</p>
        </div>

        {/* Card de Login */}
        <div className="login-card glass-card">
          <form onSubmit={handleSubmit} className="login-form">
            
            {/* Mensagem de Erro */}
            {authError && (
              <div className="login-error-message animate-fade-in">
                <AlertCircle size={18} className="text-coral" />
                <span>{authError}</span>
              </div>
            )}

            {/* Campo Usuário */}
            <div className="form-group">
              <label htmlFor="username">Usuário</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  placeholder="Seu nome de usuário ou e-mail"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  disabled={isSubmitting}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Sua senha de acesso"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  title={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              className={`login-submit-btn ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="spinner"></div>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          {/* Dica de Acesso */}
          <div className="login-hint-box">
            <ShieldAlert size={16} className="text-gold" />
            <p>
              Dica: Use o usuário <strong className="text-emerald">joao</strong> ou <strong className="text-emerald">kelvin</strong> e a senha <strong className="text-emerald">admin</strong> para testar.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>© 2026 Poupa Pila - Finanças com elegância.</p>
        </div>
      </div>
    </div>
  );
}
