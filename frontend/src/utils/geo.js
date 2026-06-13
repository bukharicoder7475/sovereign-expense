const GEO_API = 'https://ipapi.co/json/';

const COUNTRY_TO_CODE = {
  SA: '+966', US: '+1', UK: '+44', IN: '+91', CN: '+86', JP: '+81', KR: '+82',
  DE: '+49', FR: '+33', IT: '+39', ES: '+34', AU: '+61', CA: '+1', BR: '+55',
  MX: '+52', RU: '+7', ZA: '+27', AE: '+971', SG: '+65', MY: '+60', PH: '+63',
  ID: '+62', TH: '+66', VN: '+84', PK: '+92', BD: '+880', LK: '+94', NG: '+234',
  KE: '+254', EG: '+20',
};

export async function detectCountryCode() {
  try {
    const res = await fetch(GEO_API);
    const data = await res.json();
    if (data && data.country_code && COUNTRY_TO_CODE[data.country_code]) {
      return COUNTRY_TO_CODE[data.country_code];
    }
  } catch (e) {
    // Silent fail
  }
  return '+966';
}

export function getCountryCodeForPhone(phone, currentCode) {
  if (!phone) return currentCode;
  const cleaned = phone.replace(/\D/g, '');
  for (const [country, code] of Object.entries(COUNTRY_TO_CODE)) {
    const codeNum = code.replace('+', '');
    if (cleaned.startsWith(codeNum) && cleaned.length > codeNum.length) {
      return code;
    }
  }
  return currentCode;
}
