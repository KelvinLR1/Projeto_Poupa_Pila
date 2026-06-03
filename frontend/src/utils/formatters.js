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
