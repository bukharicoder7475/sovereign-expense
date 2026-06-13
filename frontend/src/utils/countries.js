const COUNTRIES = [
  { code: '+1', name: 'US', flag: '🇺🇸', currency: 'USD', symbol: '$' },
  { code: '+44', name: 'UK', flag: '🇬🇧', currency: 'GBP', symbol: '£' },
  { code: '+91', name: 'IN', flag: '🇮🇳', currency: 'INR', symbol: '₹' },
  { code: '+86', name: 'CN', flag: '🇨🇳', currency: 'CNY', symbol: '¥' },
  { code: '+81', name: 'JP', flag: '🇯🇵', currency: 'JPY', symbol: '¥' },
  { code: '+82', name: 'KR', flag: '🇰🇷', currency: 'KRW', symbol: '₩' },
  { code: '+49', name: 'DE', flag: '🇩🇪', currency: 'EUR', symbol: '€' },
  { code: '+33', name: 'FR', flag: '🇫🇷', currency: 'EUR', symbol: '€' },
  { code: '+39', name: 'IT', flag: '🇮🇹', currency: 'EUR', symbol: '€' },
  { code: '+34', name: 'ES', flag: '🇪🇸', currency: 'EUR', symbol: '€' },
  { code: '+61', name: 'AU', flag: '🇦🇺', currency: 'AUD', symbol: 'A$' },
  { code: '+1', name: 'CA', flag: '🇨🇦', currency: 'CAD', symbol: 'C$' },
  { code: '+55', name: 'BR', flag: '🇧🇷', currency: 'BRL', symbol: 'R$' },
  { code: '+52', name: 'MX', flag: '🇲🇽', currency: 'MXN', symbol: 'MX$' },
  { code: '+7', name: 'RU', flag: '🇷🇺', currency: 'RUB', symbol: '₽' },
  { code: '+27', name: 'ZA', flag: '🇿🇦', currency: 'ZAR', symbol: 'R' },
  { code: '+971', name: 'AE', flag: '🇦🇪', currency: 'AED', symbol: 'د.إ' },
  { code: '+966', name: 'SA', flag: '🇸🇦', currency: 'SAR', symbol: '﷼' },
  { code: '+65', name: 'SG', flag: '🇸🇬', currency: 'SGD', symbol: 'S$' },
  { code: '+60', name: 'MY', flag: '🇲🇾', currency: 'MYR', symbol: 'RM' },
  { code: '+63', name: 'PH', flag: '🇵🇭', currency: 'PHP', symbol: '₱' },
  { code: '+62', name: 'ID', flag: '🇮🇩', currency: 'IDR', symbol: 'Rp' },
  { code: '+66', name: 'TH', flag: '🇹🇭', currency: 'THB', symbol: '฿' },
  { code: '+84', name: 'VN', flag: '🇻🇳', currency: 'VND', symbol: '₫' },
  { code: '+92', name: 'PK', flag: '🇵🇰', currency: 'PKR', symbol: 'Rs' },
  { code: '+880', name: 'BD', flag: '🇧🇩', currency: 'BDT', symbol: '৳' },
  { code: '+94', name: 'LK', flag: '🇱🇰', currency: 'LKR', symbol: 'Rs' },
  { code: '+234', name: 'NG', flag: '🇳🇬', currency: 'NGN', symbol: '₦' },
  { code: '+254', name: 'KE', flag: '🇰🇪', currency: 'KES', symbol: 'KSh' },
  { code: '+20', name: 'EG', flag: '🇪🇬', currency: 'EGP', symbol: 'E£' },
];

const CURRENCY_MAP = {};
COUNTRIES.forEach(c => { CURRENCY_MAP[c.code] = { currency: c.currency, symbol: c.symbol, name: c.name, flag: c.flag }; });

export function getCurrencyByCountryCode(countryCode) {
  return CURRENCY_MAP[countryCode] || { currency: 'USD', symbol: '$', name: 'US', flag: '🇺🇸' };
}

export function formatCurrency(amount, symbol) {
  if (symbol === undefined) symbol = '$';
  return `${symbol}${Number(amount).toFixed(2)}`;
}

export default COUNTRIES;
