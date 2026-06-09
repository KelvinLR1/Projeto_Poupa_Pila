import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import './Login.css';

export function Login() {
  const { login, authError, setAuthError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState('');

  const handleSubmit = async (e, confirmRegister = false) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      setAuthError('Preencha todos os campos para continuar.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(username, password, confirmRegister);
    setIsSubmitting(false);

    if (result && result.askRegister) {
      setShowRegisterPrompt(true);
      setPromptMessage(result.message);
    } else if (result && result.success) {
      setShowRegisterPrompt(false);
    }
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
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>© 2026 Poupa Pila - Finanças com elegância.</p>
        </div>
      </div>

      {showRegisterPrompt && (
        <div className="modal-overlay">
          <div className="modal-container glass-card" style={{ maxWidth: '400px', width: '90%' }}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h3>Criar Nova Conta?</h3>
                <p>O usuário informado não existe no sistema.</p>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                {promptMessage}
              </p>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => setShowRegisterPrompt(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem' }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-save" 
                onClick={() => handleSubmit(null, true)}
                style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--accent-emerald)', color: '#000', fontWeight: 'bold' }}
              >
                Sim, Criar Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
