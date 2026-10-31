const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 });
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export const formatMoney = (value) => currency.format(value || 0);
export const formatPercent = (value) => percent.format(value || 0);
export const formatNumber = (value) => number.format(value || 0);

export function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}
