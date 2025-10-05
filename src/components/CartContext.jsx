import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage on first render
    const storedCart = localStorage.getItem("cart");
    return storedCart ? JSON.parse(storedCart) : [];
  });

  const [currency, setCurrency] = useState(() => {
    // Load currency preference from localStorage if available
    return localStorage.getItem("currency") || "GHS";
  });

  const [rates, setRates] = useState({ GHS: 1 });
  const apiKey = import.meta.env.VITE_CURRENCY_API_KEY;

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Persist currency to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  // Fetch exchange rates once
  useEffect(() => {
    async function fetchRates() {
      try {
        const response = await fetch(
          `https://v6.exchangerate-api.com/v6/${apiKey}/latest/GHS`
        );
        const data = await response.json();
        if (data.result === "success") {
          setRates(data.conversion_rates);

          // Detect user region for default currency
          if (!localStorage.getItem("currency")) {
            const region = navigator.language.split("-")[1];
            let defaultCurrency = "GHS";
            if (region === "US") defaultCurrency = "USD";
            else if (region === "GB") defaultCurrency = "GBP";
            else if (region === "CA") defaultCurrency = "CAD";
            else if (["DE","FR","ES","IT","NL","BE","PT","FI","IE"].includes(region)) {
              defaultCurrency = "EUR";
            }
            setCurrency(defaultCurrency);
          }
        } else {
          console.error("Error fetching rates:", data["error-type"]);
        }
      } catch (error) {
        console.error("Error fetching rates:", error);
      }
    }
    fetchRates();
  }, [apiKey]);

  // Cart actions
  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((p) => p.id !== id));

  const updateQuantity = (id, delta) => {
    setCart(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newQty = p.quantity + delta;
          if (newQty < 1) return p; // prevent going below 1
          if (newQty > p.stock) return p; // prevent exceeding stock
          return { ...p, quantity: newQty };
        }
        return p;
      })
    );
  };


  const decreaseQty = (id) =>
    setCart((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(p.quantity - 1, 1) } : p
      )
    );

  // 🔹 Currency helpers
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
        decreaseQty,
        currency,
        setCurrency,
        convertPrice,
        formatCurrency,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
