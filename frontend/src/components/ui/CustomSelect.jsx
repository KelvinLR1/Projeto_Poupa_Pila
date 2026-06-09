import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './CustomSelect.css';

export function CustomSelect({ value, onChange, options = [], placeholder = 'Selecione...', className = '', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Find the selected option label
  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Handle click outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue) => {
    if (onChange) {
      // Mimic native change event to avoid changing parent handlers
      onChange({ target: { value: optionValue } });
    }
    setIsOpen(false);
  };

  return (
    <div 
      className={`custom-select-container ${className} ${disabled ? 'disabled' : ''} ${isOpen ? 'is-open' : ''}`} 
      ref={containerRef}
    >
      <div className="custom-select-trigger" onClick={handleToggle}>
        <span className="custom-select-value">{displayLabel}</span>
        <ChevronDown size={16} className="custom-select-arrow" />
      </div>
      
      {isOpen && (
        <ul className="custom-select-options animate-select-fade">
          {options.map((option) => (
            <li 
              key={option.value} 
              className={`custom-select-option ${String(option.value) === String(value) ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
