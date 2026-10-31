import { formatMoney, formatNumber, formatPercent } from './format.js';

const FORMATTERS = {
  money: formatMoney,
  percent: formatPercent,
  number: formatNumber,
};

const PLACEHOLDER = /\{\{\s*(\w+)\s*(?:\|\s*(\w+)\s*)?\}\}/g;

// Fills "{{name}}" and "{{name|money}}" placeholders from vars.
export function fillTemplate(text, vars = {}) {
  return String(text ?? '').replace(PLACEHOLDER, (_, name, format) => {
    const value = vars[name];
    if (value === undefined || value === null) return '—';
    const formatter = FORMATTERS[format];
    return formatter ? formatter(value) : String(value);
  });
}

// An item listing "requires" is shown only when all those vars are set and non-zero.
export function meetsRequirements(item, vars = {}) {
  return (item.requires ?? []).every((name) => Boolean(vars[name]));
}
