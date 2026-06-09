import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import './CustomDatePicker.css';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function parseDate(val) {
  if (!val) return new Date();
  const [year, month, day] = val.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateString(y, m, d) {
  const mm = String(m + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function formatDisplayDate(val) {
  if (!val) return '';
  const parts = val.split('-');
  if (parts.length !== 3) return val;
  return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
}

export function CustomDatePicker({ value, onChange, placeholder = 'Selecione uma data...', className = '', disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedDate = parseDate(value);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  // Sync state with prop value when picker opens
  useEffect(() => {
    if (isOpen && value) {
      const parsed = parseDate(value);
      setCurrentMonth(parsed.getMonth());
      setCurrentYear(parsed.getFullYear());
    }
  }, [isOpen, value]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelectDay = (cell) => {
    const dateStr = formatDateString(cell.year, cell.month, cell.day);
    if (onChange) {
      onChange({ target: { value: dateStr } });
    }
    setIsOpen(false);
  };

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Generate calendar days
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const totalDaysPrev = new Date(currentYear, currentMonth, 0).getDate();

  const cells = [];

  // Previous month spacer days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      day: totalDaysPrev - i,
      month: currentMonth === 0 ? 11 : currentMonth - 1,
      year: currentMonth === 0 ? currentYear - 1 : currentYear,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      day: d,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true
    });
  }

  // Next month spacer days
  const totalCells = 42; // 6 rows of 7 days
  const nextMonthSpacers = totalCells - cells.length;
  for (let d = 1; d <= nextMonthSpacers; d++) {
    cells.push({
      day: d,
      month: currentMonth === 11 ? 0 : currentMonth + 1,
      year: currentMonth === 11 ? currentYear + 1 : currentYear,
      isCurrentMonth: false
    });
  }

  const today = new Date();

  return (
    <div className={`custom-datepicker-container ${className} ${isOpen ? 'is-open' : ''} ${disabled ? 'disabled' : ''}`} ref={containerRef}>
      <div className="custom-datepicker-trigger" onClick={() => !disabled && setIsOpen(prev => !prev)}>
        <span className={value ? 'has-value' : 'placeholder'}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar size={16} className="datepicker-icon" />
      </div>

      {isOpen && (
        <div className="custom-datepicker-calendar animate-datepicker-fade">
          <div className="calendar-header">
            <button type="button" className="calendar-nav-btn" onClick={handlePrevMonth} title="Mês anterior">
              <ChevronLeft size={16} />
            </button>
            <span className="calendar-month-title">
              {MONTHS[currentMonth]} de {currentYear}
            </span>
            <button type="button" className="calendar-nav-btn" onClick={handleNextMonth} title="Próximo mês">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="calendar-weekdays">
            {WEEKDAYS.map((day, i) => (
              <span key={i} className="weekday-label">{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {cells.map((cell, idx) => {
              const isSelected = value && 
                selectedDate.getDate() === cell.day && 
                selectedDate.getMonth() === cell.month && 
                selectedDate.getFullYear() === cell.year;

              const isToday = today.getDate() === cell.day &&
                today.getMonth() === cell.month &&
                today.getFullYear() === cell.year;

              return (
                <div
                  key={idx}
                  className={`calendar-day-cell ${cell.isCurrentMonth ? 'current-month' : 'other-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleSelectDay(cell)}
                >
                  <span className="day-number">{cell.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
