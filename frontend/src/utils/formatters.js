export const formatCurrency = (value, hideValues = false) => {
  if (hideValues) {
    return 'R$ •••••••';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  // Ajuste de timezone se necessário
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short'
  }).format(date);
};

export const maskCurrencyBRL = (value) => {
  if (value === undefined || value === null) return '0,00';
  
  let cleanValue = "";
  if (typeof value === 'number') {
    cleanValue = Math.round(value * 100).toString();
  } else {
    cleanValue = value.replace(/\D/g, '');
  }
  
  if (!cleanValue) return '0,00';
  
  const cents = parseInt(cleanValue, 10) / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents);
};

export const parseCurrencyBRL = (formattedValue) => {
  if (formattedValue === undefined || formattedValue === null) return 0;
  if (typeof formattedValue === 'number') return formattedValue;
  const clean = formattedValue.replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};
