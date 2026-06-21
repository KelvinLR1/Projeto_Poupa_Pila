import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import './CustomSelect.css';

export function CustomSelect({ value, onChange, options = [], placeholder = 'Selecione...', className = '', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ left: 0, top: 0, width: 0 });
  const containerRef = useRef(null);

  // Find the selected option label
  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        left: rect.left,
        top: rect.bottom + window.scrollY,
        width: rect.width
      });
    }
  };

  // Handle click outside and scroll to close the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // Also ensure the click isn't inside the portal itself
        const portalEl = document.getElementById('select-portal-root');
        if (portalEl && portalEl.contains(event.target)) return;
        setIsOpen(false);
      }
    }

    function handleScroll() {
      if (isOpen) {
        // Close on scroll to prevent detached dropdowns
        setIsOpen(false);
      }
    }

    function handleResize() {
      if (isOpen) {
        updateCoords();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true); // true to catch all scroll events
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen) {
        updateCoords();
      }
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

  // Portal render
  const renderDropdown = () => {
    if (!isOpen) return null;
    
    // Create portal root if it doesn't exist
    let portalRoot = document.getElementById('select-portal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'select-portal-root';
      document.body.appendChild(portalRoot);
    }

    const dropdownStyle = {
      position: 'absolute',
      left: `${coords.left}px`,
      top: `${coords.top + 6}px`, // +6px gap
      width: `${coords.width}px`,
      zIndex: 9999
    };

    return createPortal(
      <ul className="custom-select-options animate-select-fade portal-dropdown" style={dropdownStyle}>
        {options.map((option) => (
          <li 
            key={option.value} 
            className={`custom-select-option ${String(option.value) === String(value) ? 'selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(option.value);
            }}
          >
            {option.label}
          </li>
        ))}
      </ul>,
      portalRoot
    );
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
      
      {renderDropdown()}
    </div>
  );
}
