import React, { createContext, useContext, useEffect, useState } from "react";

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState("GHS");
  const [rates, setRates] = useState({});

  useEffect(() => {
    fetch(`https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/GHS`)
      .then((res) => res.json())
      .then((data) => setRates(data.conversion_rates))
      .catch((err) => console.error("Error fetching exchange rates", err));
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function usePrice(amount) {
  const { currency, rates } = useCurrency();
  if (!rates || !rates[currency]) return amount + " GHS";
  return `${(amount * rates[currency]).toFixed(2)} ${currency}`;
}
