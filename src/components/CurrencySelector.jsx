import React from "react";
import { useCurrency } from "./CurrencyContext";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="currency-selector"
    >
      {["GHS", "USD", "CAD", "GBP", "EUR", "NGN"].map((cur) => (
        <option key={cur} value={cur}>
          {cur}
        </option>
      ))}
    </select>
  );
}
