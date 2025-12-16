import React from "react";
import { SUPPORTED_CURRENCIES, useCurrency } from "./CurrencyContext";

export function CurrencySelector() {
  const { currency, setCurrency, status } = useCurrency();

  return (
    <div className="currency-selector-wrap">
      <label className="currency-selector-label" htmlFor="currency-select">
        Currency
      </label>
      <div className="currency-selector-shell">
        <select
          id="currency-select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="currency-selector"
        >
          {SUPPORTED_CURRENCIES.map((cur) => (
            <option key={cur} value={cur}>
              {cur}
            </option>
          ))}
        </select>
        <span className={`currency-status ${status}`}>
          {status === "loading" && "Updating rates"}
          {status === "ready" && "Live rates"}
          {status === "error" && "Fallback rates"}
          {status === "idle" && "Rates ready"}
        </span>
      </div>
    </div>
  );
}
