/**
 * Handles fetching FX rates from the Frankfurter API, caching them in
 * localStorage for the session, and broadcasting rate changes so the
 * pricing table can re-render in the selected currency.
 */

const FRANKFURTER_CURRENCIES_URL = "https://api.frankfurter.dev/v1/currencies";
const FRANKFURTER_LATEST_URL = "https://api.frankfurter.dev/v1/latest";
const STORAGE_KEY_CURRENCY = "dp:currency";
const STORAGE_KEY_RATES = "dp:rates";
const STORAGE_KEY_RATES_DATE = "dp:rates:date";

export interface RatesPayload {
  base: string;
  date: string;
  rates: Record<string, number>;
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Populates the currency <select> with all currencies Frankfurter supports. */
export async function populateCurrencyOptions(select: HTMLSelectElement) {
  try {
    const res = await fetch(FRANKFURTER_CURRENCIES_URL);
    if (!res.ok) throw new Error(`currencies fetch failed: ${res.status}`);
    const list: Record<string, string> = await res.json();

    const saved = localStorage.getItem(STORAGE_KEY_CURRENCY) ?? "USD";

    // USD is always first since it's the base/default.
    const codes = Object.keys(list).sort();
    select.innerHTML = "";

    const usdOption = document.createElement("option");
    usdOption.value = "USD";
    usdOption.textContent = "USD — US Dollar";
    select.appendChild(usdOption);

    for (const code of codes) {
      if (code === "USD") continue;
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = `${code} — ${list[code]}`;
      select.appendChild(opt);
    }

    select.value = saved;
  } catch (err) {
    console.error("Could not load currency list from Frankfurter:", err);
    // Leave the default USD-only option already in the markup.
  }
}

/**
 * Returns USD->all rates, using a same-day localStorage cache to avoid
 * refetching on every page view.
 */
export async function getRates(): Promise<RatesPayload | null> {
  const cachedDate = localStorage.getItem(STORAGE_KEY_RATES_DATE);
  const cachedRates = localStorage.getItem(STORAGE_KEY_RATES);

  if (cachedDate === todayStamp() && cachedRates) {
    try {
      return JSON.parse(cachedRates) as RatesPayload;
    } catch {
      // fall through to refetch
    }
  }

  try {
    const res = await fetch(`${FRANKFURTER_LATEST_URL}?base=USD`);
    if (!res.ok) throw new Error(`rates fetch failed: ${res.status}`);
    const data = (await res.json()) as RatesPayload;

    localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY_RATES_DATE, todayStamp());

    return data;
  } catch (err) {
    console.error("Could not load exchange rates from Frankfurter:", err);
    return null;
  }
}

export function getSavedCurrency(): string {
  return localStorage.getItem(STORAGE_KEY_CURRENCY) ?? "USD";
}

export function saveCurrency(code: string) {
  localStorage.setItem(STORAGE_KEY_CURRENCY, code);
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: "A$",
  BGN: "лв",
  BRL: "R$",
  CAD: "C$",
  CHF: "CHF",
  CNY: "¥",
  CZK: "Kč",
  DKK: "kr",
  EUR: "€",
  GBP: "£",
  HKD: "HK$",
  HUF: "Ft",
  IDR: "Rp",
  ILS: "₪",
  INR: "₹",
  ISK: "kr",
  JPY: "¥",
  KRW: "₩",
  MXN: "MX$",
  MYR: "RM",
  NOK: "kr",
  NZD: "NZ$",
  PHP: "₱",
  PLN: "zł",
  RON: "lei",
  SEK: "kr",
  SGD: "S$",
  THB: "฿",
  TRY: "₺",
  USD: "$",
  VND: "₫",
  ZAR: "R",
};

/** Currencies conventionally shown without decimal places. */
const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "HUF", "ISK", "IDR", "VND"]);

/** Converts a USD amount into the target currency and formats it for display. */
export function formatAmount(usdAmount: number, currency: string, rates: RatesPayload | null): string {
  let amount = usdAmount;
  if (currency !== "USD" && rates?.rates[currency]) {
    amount = usdAmount * rates.rates[currency];
  }

  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  const zeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);
  const formatted = zeroDecimal ? Math.round(amount).toString() : amount.toFixed(2);

  return symbol ? `${symbol}${formatted}` : `${formatted} ${currency}`;
}
