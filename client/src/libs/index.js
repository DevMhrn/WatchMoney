import { v4 as uuidv4 } from "uuid";

export const maskAccountNumber = (accountNumber) => {
  if (typeof accountNumber !== "string" || accountNumber.length < 12) {
    return accountNumber;
  }

  const firstFour = accountNumber.substring(0, 4);
  const lastFour = accountNumber.substring(accountNumber.length - 4);

  const maskedDigits = "*".repeat(accountNumber.length - 8);

  return `${firstFour}${maskedDigits}${lastFour}`;
};

export const formatCurrency = (value, currency) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (isNaN(value)) {
    return "Invalid input";
  }

  const numberValue = typeof value === "string" ? parseFloat(value) : value;
  const currencyCode = currency || user?.currency || "USD";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(numberValue);
  } catch (error) {
    // Fallback if currency code is invalid
    console.warn(`Invalid currency code: ${currencyCode}, falling back to USD`);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(numberValue);
  }
};

export const formatCurrencyWithCode = (value, currency) => {
  const formattedAmount = formatCurrency(value, currency);
  return `${formattedAmount} ${currency || 'USD'}`;
};

export const getDateSevenDaysAgo = () => {
  const today = new Date();

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  return sevenDaysAgo.toISOString().split("T")[0];
};

export async function fetchCountries() {
  try {
    const response = await fetch("https://restcountries.com/v3.1/all");
    const data = await response.json();

    if (response.ok) {
      const countries = data.map((country) => {
        const currencies = country.currencies || {};
        const currencyCode = Object.keys(currencies)[0];

        return {
          country: country.name?.common || "",
          flag: country.flags?.png || "",
          currency: currencyCode || "",
          cca2: country.cca2 || "", // ISO 3166-1 alpha-2 code
          currencySymbol: currencies[currencyCode]?.symbol || "$"
        };
      });

      const sortedCountries = countries.sort((a, b) =>
        a.country.localeCompare(b.country)
      );

      return sortedCountries;
    } else {
      console.error(`Error: ${data.message}`);
      return [];
    }
  } catch (error) {
    console.error("An error occurred while fetching data:", error);
    return [];
  }
}

export function generateAccountNumber() {
  let accountNumber = "";
  while (accountNumber.length < 13) {
    const uuid = uuidv4().replace(/-/g, "");
    accountNumber += uuid.replace(/\D/g, "");
  }
  return accountNumber.substr(0, 13);
}

export const getCurrencySymbol = (currency) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'INR': '₹',
    'CNY': '¥',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RUB': '₽',
    'BRL': 'R$',
    'MXN': '$',
    'ZAR': 'R',
    'KRW': '₩',
    'SGD': 'S$',
    'HKD': 'HK$',
    'NZD': 'NZ$',
    'TRY': '₺',
    'THB': '฿',
    'MYR': 'RM',
    'PHP': '₱',
    'IDR': 'Rp',
    'VND': '₫',
    'AED': 'د.إ',
    'SAR': '﷼',
    'QAR': '﷼',
    'KWD': 'د.ك',
    'BHD': '.د.ب',
    'OMR': '﷼',
    'JOD': 'د.ا',
    'EGP': '£',
    'LBP': '£',
    'ILS': '₪',
    'PKR': '₨',
    'LKR': '₨',
    'NPR': '₨',
    'BGN': 'лв',
    'RON': 'lei',
    'HRK': 'kn',
    'RSD': 'дин',
    'ISK': 'kr',
    'CLP': '$',
    'COP': '$',
    'PEN': 'S/',
    'UYU': '$U',
    'BOB': '$b',
    'PYG': 'Gs',
    'GHS': '¢',
    'NGN': '₦',
    'KES': 'KSh',
    'UGX': 'USh',
    'TZS': 'TSh',
    'ETB': 'Br',
    'MAD': 'د.م.',
    'TND': 'د.ت',
    'DZD': 'دج',
    'TWD': 'NT$',
    'HNL': 'L',
    'GTQ': 'Q',
    'NIO': 'C$',
    'CRC': '₡',
    'PAB': 'B/.',
    'JMD': 'J$',
    'BBD': 'Bds$',
    'TTD': 'TT$',
    'XCD': 'EC$',
    'BSD': 'B$',
    'BZD': 'BZ$',
    'FJD': 'FJ$',
    'SBD': 'SI$',
    'TOP': 'T$',
    'WST': 'WS$',
    'VUV': 'VT',
    'PGK': 'K',
    'MOP': 'MOP$',
    'BND': 'B$',
    'KHR': '៛',
    'LAK': '₭',
    'MMK': 'K',
    'MNT': '₮',
    'KZT': '₸',
    'UZS': 'лв',
    'KGS': 'лв',
    'TJS': 'SM',
    'TMT': 'T',
    'AFN': '؋',
    'IRR': '﷼',
    'IQD': 'ع.د',
    'SYP': '£',
    'LYD': 'ل.د',
    'SDG': 'ج.س.',
    'SOS': 'S',
    'DJF': 'Fdj',
    'ERN': 'Nfk',
    'MWK': 'MK',
    'ZMW': 'ZK',
    'BWP': 'P',
    'SZL': 'E',
    'LSL': 'M',
    'NAD': 'N$',
    'ANG': 'ƒ',
    'AWG': 'ƒ',
    'SRD': '$',
    'GYD': '$',
    'FKP': '£',
    'SHP': '£',
    'GIP': '£',
    'JEP': '£',
    'GGP': '£',
    'IMP': '£',
  };
  
  // Return the symbol if found, otherwise return the currency code itself
  return symbols[currency?.toUpperCase()] || currency || '$';
};

// Enhanced formatCurrency function that uses getCurrencySymbol as fallback
export const formatCurrencyWithSymbol = (value, currency) => {
  if (isNaN(value)) {
    return "Invalid input";
  }

  const numberValue = typeof value === "string" ? parseFloat(value) : value;
  const currencyCode = currency || 'USD';
  
  try {
    // Try to use Intl.NumberFormat first
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(numberValue);
  } catch (error) {
    // Fallback to manual formatting with symbol
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${numberValue.toFixed(2)}`;
  }
};