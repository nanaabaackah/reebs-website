import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const storedCart = localStorage.getItem("cart");
    return storedCart ? JSON.parse(storedCart) : [];
  });

  const [currency, setCurrency] = useState(
    () => localStorage.getItem("currency") || "GHS"
  );

  const [rates, setRates] = useState({ GHS: 1 });
  const apiKey = import.meta.env.VITE_CURRENCY_API_KEY;

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  // fetch exchange rates
  useEffect(() => {
    async function fetchRates() {
      try {
        const response = await fetch(
          `https://v6.exchangerate-api.com/v6/${apiKey}/latest/GHS`
        );
        const data = await response.json();
        if (data.result === "success") {
          setRates(data.conversion_rates);

          if (!localStorage.getItem("currency")) {
            const region = navigator.language.split("-")[1];
            let defaultCurrency = "GHS";
            if (region === "US") defaultCurrency = "USD";
            else if (region === "GB") defaultCurrency = "GBP";
            else if (region === "CA") defaultCurrency = "CAD";
            else if (
              ["DE", "FR", "ES", "IT", "NL", "BE", "PT", "FI", "IE"].includes(region)
            ) {
              defaultCurrency = "EUR";
            }
            setCurrency(defaultCurrency);
          }
        } else {
          setRates({ GHS: 1 });
        }
      } catch (error) {
        console.error("Error fetching rates:", error);
        setRates({ GHS: 1 });
      }
    }
    fetchRates();
  }, [apiKey]);

  // 🔹 Cart actions
  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) {
        // prevent exceeding stock
        if (exists.cartQuantity >= item.quantity) return prev;
        return prev.map((p) =>
          p.id === item.id
            ? { ...p, cartQuantity: Math.min(p.cartQuantity + 1, item.quantity) }
            : p
        );
      }
      // initial add
      return [...prev, { ...item, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((p) => p.id !== id));

  // now updateQuantity expects a delta (+1 / -1)
  const updateQuantity = (id, change) => {
    if (Number.isNaN(change) || change === 0) return;
    setCart((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          let newQty = p.cartQuantity + change;

          if (newQty < 1) newQty = 1;
          if (newQty > p.quantity) newQty = p.quantity; // cap to stock

          return { ...p, cartQuantity: newQty };
        }
        return p;
      })
    );
  };

  const clearCart = () => setCart([]);

  // Currency helpers
  const convertPrice = (priceInGHS) => {
    if (!rates || !rates[currency]) return priceInGHS;
    return Number((priceInGHS * rates[currency]).toFixed(2));
  };

  const formatCurrency = (value) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).format(value);
    } catch {
      return value + " " + currency;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        currency,
        setCurrency,
        convertPrice,
        formatCurrency,
        rates,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
