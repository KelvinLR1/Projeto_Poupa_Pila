import React from 'react';
import './GlassCard.css';

export function GlassCard({ children, className = '', onClick }) {
  return (
    <div 
      className={`glass-card-component ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
