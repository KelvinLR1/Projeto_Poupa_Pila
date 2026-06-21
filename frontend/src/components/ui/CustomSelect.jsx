import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './CustomSelect.css';

export function CustomSelect({ value, onChange, options = [], placeholder = 'Selecione...', className = '', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue) => {
    if (onChange) {
      onChange({ target: { value: optionValue } });
    }
    setIsOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const renderDropdown = () => {
    if (!isOpen) return null;

    const dropdownStyle = {
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      width: '100%',
      zIndex: 9999,
      pointerEvents: 'auto'
    };

    return (
      <div className="custom-select-options-wrapper animate-select-fade" style={dropdownStyle}>
        <ul className="custom-select-options">
          {options.map((opt) => (
            <li 
              key={opt.value} 
              className={`custom-select-option ${String(value) === String(opt.value) ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(opt.value);
              }}
            >
              <span className="option-label">{opt.label}</span>
              {String(value) === String(opt.value) && (
                <Check size={16} className="option-check-icon" />
              )}
            </li>
          ))}
          {options.length === 0 && (
            <li className="custom-select-option" style={{ justifyContent: 'center', color: 'var(--text-muted)' }}>
              Nenhuma opção
            </li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div 
      className={`custom-select-container ${className} ${disabled ? 'disabled' : ''} ${isOpen ? 'is-open' : ''}`} 
      ref={containerRef}
    >
      <div className="custom-select-trigger" onClick={handleToggle}>
        <span className="custom-select-value" style={{ color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {displayLabel}
        </span>
        <ChevronDown size={18} className="custom-select-arrow" />
      </div>
      {renderDropdown()}
    </div>
  );
}
