import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBagShopping,
  faReceipt,
  faShieldHeart,
  faTruckFast,
} from "@fortawesome/free-solid-svg-icons";
import { useCart } from "../components/CartContext";
import "./master.css";

const TIME_WINDOW_OPTIONS = [
  { value: "9am-11am", label: "9:00am – 11:00am", endMinutes: 11 * 60 },
  { value: "11am-1pm", label: "11:00am – 1:00pm", endMinutes: 13 * 60 },
  { value: "1pm-3pm", label: "1:00pm – 3:00pm", endMinutes: 15 * 60 },
  { value: "3pm-5pm", label: "3:00pm – 5:00pm", endMinutes: 17 * 60 },
  { value: "5pm-7pm", label: "5:00pm – 7:00pm", endMinutes: 19 * 60 },
];

const Checkout = () => {
  const { cart, convertPrice, formatCurrency, currency, clearCart } = useCart();
  const [fulfillment, setFulfillment] = useState("delivery");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({ state: "idle", message: "" });
  const [orderSuccess, setOrderSuccess] = useState("");
  const [confirmedAmount, setConfirmedAmount] = useState("");
  const [deliveryDetails, setDeliveryDetails] = useState({
    address: "",
    contact: "",
    date: "",
    window: "",
    notes: "",
  });
  const [pickupDetails, setPickupDetails] = useState({
    date: "",
    window: "",
    notes: "",
  });
  const [paymentDetails, setPaymentDetails] = useState({
    name: "",
    email: "",
    phone: "",
    method: "card",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    momoProvider: "",
    momoNumber: "",
    transferRef: "",
  });
  const [momoSameAsPhone, setMomoSameAsPhone] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const draftLoadedRef = useRef(false);
  const itemCount = cart.reduce((acc, item) => acc + item.cartQuantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
  const formattedSubtotal = formatCurrency(convertPrice(subtotal));
  const itemLabel = itemCount === 1 ? "item" : "items";
  const today = now.toISOString().split("T")[0];
  const amountCents = Math.round(convertPrice(subtotal) * 100);
  const modalAmount = confirmedAmount || formattedSubtotal;
  const draftKey = "checkoutPaymentDraft";
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const cartItems = useMemo(
    () =>
      cart.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.cartQuantity,
        unitPrice: convertPrice(item.price),
        lineTotal: convertPrice(item.price * item.cartQuantity),
        imageUrl: item.image || item.imageUrl || item.image_url || "/imgs/placeholder.png",
      })),
    [cart, convertPrice]
  );

  const getItemImage = (item) =>
    item.image || item.imageUrl || item.image_url || "/imgs/placeholder.png";

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!momoSameAsPhone) return;
    setPaymentDetails((prev) => {
      if (prev.momoNumber === prev.phone) return prev;
      return { ...prev, momoNumber: prev.phone };
    });
  }, [momoSameAsPhone, paymentDetails.phone]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(draftKey);
    if (!stored) {
      draftLoadedRef.current = true;
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.fulfillment) setFulfillment(parsed.fulfillment);
      if (parsed.deliveryDetails) setDeliveryDetails(parsed.deliveryDetails);
      if (parsed.pickupDetails) setPickupDetails(parsed.pickupDetails);
      if (typeof parsed.momoSameAsPhone === "boolean") {
        setMomoSameAsPhone(parsed.momoSameAsPhone);
      }
      if (parsed.paymentDetails) {
        setPaymentDetails((prev) => ({
          ...prev,
          ...parsed.paymentDetails,
          cardCvc: "",
        }));
        if (
          parsed.paymentDetails.phone &&
          parsed.paymentDetails.momoNumber &&
          parsed.paymentDetails.phone === parsed.paymentDetails.momoNumber
        ) {
          setMomoSameAsPhone(true);
        }
      }
    } catch {
      window.localStorage.removeItem(draftKey);
    } finally {
      draftLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!draftLoadedRef.current) return;
    if (paymentStatus.state === "success") return;
    const payload = {
      fulfillment,
      deliveryDetails,
      pickupDetails,
      momoSameAsPhone,
      paymentDetails: {
        ...paymentDetails,
        cardCvc: "",
      },
    };
    window.localStorage.setItem(draftKey, JSON.stringify(payload));
  }, [fulfillment, deliveryDetails, pickupDetails, paymentDetails, paymentStatus.state]);

  const isWindowDisabled = (selectedDate, option) => {
    if (!selectedDate || selectedDate !== today) return false;
    return currentMinutes >= option.endMinutes;
  };

  const pruneWindowSelection = (selectedDate, selectedValue) => {
    if (!selectedDate || selectedDate !== today) return selectedValue;
    const match = TIME_WINDOW_OPTIONS.find((option) => option.value === selectedValue);
    if (!match) return selectedValue;
    return currentMinutes >= match.endMinutes ? "" : selectedValue;
  };

  const updateDelivery = (field) => (event) => {
    const value = event.target.value;
    setDeliveryDetails((prev) => {
      if (field !== "date") {
        return { ...prev, [field]: value };
      }
      return {
        ...prev,
        date: value,
        window: pruneWindowSelection(value, prev.window),
      };
    });
  };

  const updatePickup = (field) => (event) => {
    const value = event.target.value;
    setPickupDetails((prev) => {
      if (field !== "date") {
        return { ...prev, [field]: value };
      }
      return {
        ...prev,
        date: value,
        window: pruneWindowSelection(value, prev.window),
      };
    });
  };

  const updatePayment = (field) => (event) => {
    const value = event.target.value;
    setPaymentDetails((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMomoSameAsPhone = (event) => {
    const checked = event.target.checked;
    setMomoSameAsPhone(checked);
    if (!checked) return;
    setPaymentDetails((prev) => ({ ...prev, momoNumber: prev.phone }));
  };

  const resetPaymentStatus = () => setPaymentStatus({ state: "idle", message: "" });

  useEffect(() => {
    setDeliveryDetails((prev) => {
      if (!prev.date || prev.date !== today) return prev;
      const pruned = pruneWindowSelection(prev.date, prev.window);
      if (pruned === prev.window) return prev;
      return { ...prev, window: pruned };
    });
    setPickupDetails((prev) => {
      if (!prev.date || prev.date !== today) return prev;
      const pruned = pruneWindowSelection(prev.date, prev.window);
      if (pruned === prev.window) return prev;
      return { ...prev, window: pruned };
    });
  }, [today, currentMinutes]);

  const resolveCustomer = async () => {
    const name = paymentDetails.name.trim();
    const email = paymentDetails.email.trim();
    const phone = paymentDetails.phone.trim();
    const normalizeName = (value) =>
      value.toLowerCase().replace(/\s+/g, " ").trim();
    const normalizeEmail = (value) => value.toLowerCase().trim();
    const normalizePhone = (value) => value.replace(/[^\d+]/g, "").trim();

    const createRes = await fetch("/.netlify/functions/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone }),
    });

    if (createRes.ok) {
      return createRes.json();
    }

    if (createRes.status !== 409) {
      const errorData = await createRes.json().catch(() => ({}));
      throw new Error(errorData?.error || "Failed to create customer.");
    }

    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (phone) params.set("phone", phone);
    if (name) params.set("name", name);
    const lookupRes = await fetch(`/.netlify/functions/customers?${params.toString()}`);
    if (lookupRes.ok) {
      const match = await lookupRes.json();
      if (match?.id) return match;
    }
    const listRes = await fetch("/.netlify/functions/customers");
    if (!listRes.ok) {
      throw new Error("Failed to load existing customers.");
    }
    const listData = await listRes.json().catch(() => []);
    const match = Array.isArray(listData)
      ? listData.find((row) => {
        const rowEmail = row.email ? normalizeEmail(String(row.email)) : "";
        const rowName = row.name ? normalizeName(String(row.name)) : "";
        const rowPhone = row.phone ? normalizePhone(String(row.phone)) : "";
        if (email && rowEmail === normalizeEmail(email)) return true;
        if (phone && rowPhone && rowPhone === normalizePhone(phone)) return true;
        if (name && rowName === normalizeName(name)) return true;
        return false;
      })
      : null;
    if (!match) {
      return { id: null, name, email, phone };
    }
    return match;
  };

  const validatePayment = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = paymentDetails.phone.replace(/\D/g, "");
    const phoneLengthOk = phoneDigits.length >= 9 && phoneDigits.length <= 15;
    if (!paymentDetails.name.trim() || !paymentDetails.email.trim()) {
      return "Add your name and email.";
    }
    if (!emailPattern.test(paymentDetails.email.trim())) {
      return "Enter a valid email address.";
    }
    if (!paymentDetails.phone.trim()) {
      return "Add a phone number.";
    }
    if (!phoneLengthOk) {
      return "Enter a valid phone number.";
    }
    if (fulfillment === "delivery" && !deliveryDetails.address.trim()) {
      return "Add a delivery address.";
    }
    if (fulfillment === "delivery" && !deliveryDetails.date) {
      return "Select a delivery date.";
    }
    if (fulfillment === "pickup" && !pickupDetails.date) {
      return "Select a pickup date.";
    }
    if (paymentDetails.method === "card") {
      if (!paymentDetails.cardNumber.trim() || !paymentDetails.cardExpiry.trim()) {
        return "Add a card number and expiry date.";
      }
    }
    if (paymentDetails.method === "momo" && !paymentDetails.momoNumber.trim()) {
      return "Add a mobile money number.";
    }
    return "";
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    resetPaymentStatus();
    setOrderSuccess("");
    const validationError = validatePayment();
    if (validationError) {
      setPaymentStatus({ state: "error", message: validationError });
      return;
    }
    if (cart.length === 0) {
      setPaymentStatus({ state: "error", message: "Your cart is empty." });
      return;
    }

    setPaymentStatus({ state: "saving", message: "Saving payment details..." });
    try {
      const customer = await resolveCustomer();
      setPaymentStatus({ state: "saving", message: "Creating order..." });
      if (!customer.id) {
        throw new Error("Customer already exists but could not be found.");
      }
      const orderPayload = {
        customerId: customer.id,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.cartQuantity,
          price: item.price,
        })),
        status: "pending",
        deliveryMethod: fulfillment,
        deliveryDetails: fulfillment === "delivery" ? deliveryDetails : null,
        pickupDetails: fulfillment === "pickup" ? pickupDetails : null,
        source: "checkout",
      };

      const orderRes = await fetch("/.netlify/functions/createOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData?.error || "Failed to create order.");
      }

      setPaymentStatus({
        state: "success",
        message: "Order created. Payment details were not stored.",
      });
      setConfirmedAmount(formattedSubtotal);
      setOrderSuccess(
        `Order ${orderData.orderNumber || orderData.orderId} confirmed.`
      );
      clearCart();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftKey);
      }
    } catch (err) {
      setPaymentStatus({ state: "error", message: err.message || "Payment failed." });
    }
  };

  return (
    <main className="checkout-shell" id="main">
      <section className="checkout-hero" aria-labelledby="checkout-heading">
        <div className="checkout-hero-copy">
          <p className="checkout-kicker">Checkout</p>
          <h1 id="checkout-heading">Finalize your bag</h1>
          <p className="checkout-sub">
            Review your items and confirm the next steps. We will follow up with delivery details and payment options.
          </p>
          <div className="checkout-highlights" aria-label="Order highlights">
            <span className="pill">{itemCount} {itemLabel}</span>
            <span className="pill pill-accent">Subtotal {formattedSubtotal}</span>
            <span className="pill pill-ghost">Currency {currency}</span>
          </div>
        </div>
      </section>

      {orderSuccess && (
        <div className="checkout-success" role="status" aria-live="polite">
          {orderSuccess}
        </div>
      )}
      {cart.length === 0 ? (
        <section className="checkout-empty-card" aria-live="polite">
          <div className="checkout-empty-illus" aria-hidden="true">⋆</div>
          <h2>Your bag is empty</h2>
          <p>Add rentals or supplies to move to checkout.</p>
          <div className="checkout-empty-actions">
            <Link className="hero-btn hero-btn-primary" to="/Shop">Browse shop</Link>
            <Link className="hero-btn hero-btn-ghost" to="/Rentals">View rentals</Link>
          </div>
        </section>
      ) : (
        <section className="checkout-grid">
          <div className="checkout-card checkout-details">
            <div className="checkout-section">
              <p className="kicker">Next steps</p>
              <h2>We will confirm delivery and payment</h2>
              <p className="checkout-hint">
                Checkout is handled manually for now. Reach out with your delivery date and location and we will send a
                payment link.
              </p>
            </div>
            <div className="checkout-steps">
              <div className="checkout-step">
                <span className="checkout-step-icon">
                  <FontAwesomeIcon icon={faBagShopping} />
                </span>
                <div>
                  <h3>Review your cart</h3>
                  <p>Double-check quantities and item choices before confirming.</p>
                </div>
              </div>
              <div className="checkout-step">
                <span className="checkout-step-icon">
                  <FontAwesomeIcon icon={faTruckFast} />
                </span>
                <div>
                  <h3>Share delivery details</h3>
                  <p>Send your preferred delivery date, time, and venue.</p>
                </div>
              </div>
              <div className="checkout-step">
                <span className="checkout-step-icon">
                  <FontAwesomeIcon icon={faReceipt} />
                </span>
                <div>
                  <h3>Receive your invoice</h3>
                  <p>We will send the final invoice and payment instructions.</p>
                </div>
              </div>
              <div className="checkout-step">
                <span className="checkout-step-icon">
                  <FontAwesomeIcon icon={faShieldHeart} />
                </span>
                <div>
                  <h3>We confirm the booking</h3>
                  <p>Once payment is received, your delivery is locked in.</p>
                </div>
              </div>
            </div>
            <div className="checkout-section">
              <p className="kicker">Fulfillment</p>
              <h2>Delivery or pickup?</h2>
              <p className="checkout-hint">Choose how you want to receive your items and fill in the details.</p>
            </div>
            <div className="checkout-option-card" role="group" aria-label="Fulfillment method">
              <label className={`checkout-option ${fulfillment === "delivery" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="fulfillment"
                  value="delivery"
                  checked={fulfillment === "delivery"}
                  onChange={() => setFulfillment("delivery")}
                />
                <span>
                  <strong>Delivery</strong>
                  <small>Share your address and preferred time window.</small>
                </span>
              </label>
              <label className={`checkout-option ${fulfillment === "pickup" ? "is-active" : ""}`}>
                <input
                  type="radio"
                  name="fulfillment"
                  value="pickup"
                  checked={fulfillment === "pickup"}
                  onChange={() => setFulfillment("pickup")}
                />
                <span>
                  <strong>Pickup</strong>
                  <small>Select a pickup window at our studio.</small>
                </span>
              </label>
            </div>
            {fulfillment === "delivery" ? (
              <div className="checkout-form" aria-label="Delivery details">
                <div className="checkout-field">
                  <label htmlFor="delivery-address">Delivery address</label>
                  <input
                    id="delivery-address"
                    type="text"
                    name="deliveryAddress"
                    value={deliveryDetails.address}
                    onChange={updateDelivery("address")}
                    placeholder="Street, neighborhood, landmark"
                  />
                </div>
                <div className="checkout-field">
                  <label htmlFor="delivery-contact">Contact number</label>
                  <input
                    id="delivery-contact"
                    type="tel"
                    name="deliveryContact"
                    value={deliveryDetails.contact}
                    onChange={updateDelivery("contact")}
                    placeholder="+233 24 123 4567"
                  />
                </div>
                <div className="checkout-field">
                  <label htmlFor="delivery-date">Preferred delivery date</label>
                  <input
                    id="delivery-date"
                    type="date"
                    name="deliveryDate"
                    min={today}
                    value={deliveryDetails.date}
                    onChange={updateDelivery("date")}
                  />
                </div>
                <div className="checkout-field">
                  <label htmlFor="delivery-window">Time window</label>
                  <select
                    id="delivery-window"
                    name="deliveryWindow"
                    value={deliveryDetails.window}
                    onChange={updateDelivery("window")}
                  >
                    <option value="" disabled>Select a window</option>
                    {TIME_WINDOW_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={isWindowDisabled(deliveryDetails.date, option)}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="checkout-field full-width">
                  <label htmlFor="delivery-notes">Delivery notes</label>
                  <textarea
                    id="delivery-notes"
                    name="deliveryNotes"
                    rows="3"
                    value={deliveryDetails.notes}
                    onChange={updateDelivery("notes")}
                    placeholder="Gate access, floor level, or anything we should know"
                  />
                </div>
              </div>
            ) : (
              <div className="checkout-form" aria-label="Pickup details">
                <div className="checkout-field">
                  <label htmlFor="pickup-date">Pickup date</label>
                  <input
                    id="pickup-date"
                    type="date"
                    name="pickupDate"
                    min={today}
                    value={pickupDetails.date}
                    onChange={updatePickup("date")}
                  />
                </div>
                <div className="checkout-field">
                  <label htmlFor="pickup-window">Pickup window</label>
                  <select
                    id="pickup-window"
                    name="pickupWindow"
                    value={pickupDetails.window}
                    onChange={updatePickup("window")}
                  >
                    <option value="" disabled>Select a window</option>
                    {TIME_WINDOW_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={isWindowDisabled(pickupDetails.date, option)}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="checkout-field full-width">
                  <label htmlFor="pickup-notes">Pickup notes</label>
                  <textarea
                    id="pickup-notes"
                    name="pickupNotes"
                    rows="3"
                    value={pickupDetails.notes}
                    onChange={updatePickup("notes")}
                    placeholder="Who is picking up, vehicle type, or anything we should know"
                  />
                </div>
              </div>
            )}
            <div className="checkout-actions">
              <button
                className="hero-btn hero-btn-primary"
                type="button"
                onClick={() => {
                  resetPaymentStatus();
                  setPaymentOpen(true);
                }}
              >
                Confirm order
              </button>
              <Link className="hero-btn hero-btn-ghost" to="/Cart">
                Back to cart
              </Link>
            </div>
          </div>

          <aside className="checkout-card checkout-summary" aria-label="Order summary">
            <div className="summary-head">
              <p className="kicker">Summary</p>
              <h3>Your order</h3>
              <p className="muted">Totals update automatically with your cart.</p>
            </div>
            <div className="checkout-items">
              {cart.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <img src={getItemImage(item)} alt={item.name} loading="lazy" />
                  <div>
                    <p className="checkout-item-name">{item.name}</p>
                    <p className="checkout-item-meta">
                      {item.cartQuantity} x {formatCurrency(convertPrice(item.price))}
                    </p>
                  </div>
                  <div className="checkout-item-total">
                    {formatCurrency(convertPrice(item.price * item.cartQuantity))}
                  </div>
                </div>
              ))}
            </div>
            <div className="checkout-total-rows">
              <div className="checkout-total-row">
                <span>Items</span>
                <span>{itemCount}</span>
              </div>
              <div className="checkout-total-row">
                <span>Subtotal</span>
                <strong>{formattedSubtotal}</strong>
              </div>
              <div className="checkout-total-row">
                <span>Fulfillment</span>
                <strong>{fulfillment === "delivery" ? "Delivery" : "Pickup"}</strong>
              </div>
            </div>
            <p className="checkout-note">Taxes and delivery are confirmed in the final invoice.</p>
          </aside>
        </section>
      )}
      {paymentOpen && (
        <div
          className="checkout-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-payment-title"
          onClick={() => setPaymentOpen(false)}
        >
          <div className="checkout-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="checkout-modal-head">
              <div>
                <p className="kicker">Payment</p>
                <h2 id="checkout-payment-title">Pay for your order</h2>
                <p className="muted">
                  This is a test form. We are saving fake payment details to confirm the connection.
                </p>
              </div>
              <button
                type="button"
                className="checkout-modal-close"
                onClick={() => setPaymentOpen(false)}
                aria-label="Close payment form"
              >
                ×
              </button>
            </div>
            <form className="checkout-modal-form" onSubmit={submitPayment}>
              <div className="checkout-field">
                <label htmlFor="payer-name">Full name</label>
                <input
                  id="payer-name"
                  type="text"
                  value={paymentDetails.name}
                  onChange={updatePayment("name")}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="payer-email">Email address</label>
                <input
                  id="payer-email"
                  type="email"
                  value={paymentDetails.email}
                  onChange={updatePayment("email")}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="payer-phone">Phone</label>
                <input
                  id="payer-phone"
                  type="tel"
                  value={paymentDetails.phone}
                  onChange={updatePayment("phone")}
                  placeholder="+233 24 123 4567"
                  pattern="^[0-9+\\-()\\s]{7,}$"
                  required
                />
              </div>
              <div className="checkout-field">
                <label htmlFor="payment-method">Payment method</label>
                <select
                  id="payment-method"
                  value={paymentDetails.method}
                  onChange={updatePayment("method")}
                >
                  <option value="card">Card</option>
                  <option value="momo">Mobile money</option>
                  <option value="bank">Bank transfer</option>
                </select>
              </div>

              {paymentDetails.method === "card" && (
                <>
                  <div className="checkout-field">
                    <label htmlFor="card-name">Name on card</label>
                    <input
                      id="card-name"
                      type="text"
                      value={paymentDetails.cardName}
                      onChange={updatePayment("cardName")}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="card-number">Card number</label>
                    <input
                      id="card-number"
                      type="text"
                      value={paymentDetails.cardNumber}
                      onChange={updatePayment("cardNumber")}
                      placeholder="1111 2222 3333 4444"
                    />
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="card-expiry">Expiry</label>
                    <input
                      id="card-expiry"
                      type="text"
                      value={paymentDetails.cardExpiry}
                      onChange={updatePayment("cardExpiry")}
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="card-cvc">CVC</label>
                    <input
                      id="card-cvc"
                      type="text"
                      value={paymentDetails.cardCvc}
                      onChange={updatePayment("cardCvc")}
                      placeholder="123"
                    />
                  </div>
                </>
              )}

              {paymentDetails.method === "momo" && (
                <>
                  <div className="checkout-field">
                    <label htmlFor="momo-provider">Provider</label>
                    <select
                      id="momo-provider"
                      value={paymentDetails.momoProvider}
                      onChange={updatePayment("momoProvider")}
                    >
                      <option value="">Select provider</option>
                      <option value="mtn">MTN</option>
                      <option value="vodafone">Vodafone</option>
                      <option value="airtel-tigo">AirtelTigo</option>
                    </select>
                  </div>
                  <div className="checkout-field">
                    <label htmlFor="momo-number">Mobile money number</label>
                    <input
                      id="momo-number"
                      type="tel"
                      value={paymentDetails.momoNumber}
                      onChange={updatePayment("momoNumber")}
                      readOnly={momoSameAsPhone}
                      placeholder="+233 24 123 4567"
                    />
                  </div>
                  <div className="checkout-field checkout-checkbox full-width">
                    <label className="checkout-checkbox-label" htmlFor="momo-same-phone">
                      <input
                        id="momo-same-phone"
                        type="checkbox"
                        checked={momoSameAsPhone}
                        onChange={toggleMomoSameAsPhone}
                      />
                      <span>Same as phone number</span>
                    </label>
                  </div>
                </>
              )}

              {paymentDetails.method === "bank" && (
                <div className="checkout-field full-width">
                  <label htmlFor="transfer-ref">Transfer reference</label>
                  <input
                    id="transfer-ref"
                    type="text"
                    value={paymentDetails.transferRef}
                    onChange={updatePayment("transferRef")}
                    placeholder="BANK-REF-1234"
                  />
                </div>
              )}

              <div className="checkout-modal-summary">
                <span>Amount due</span>
                <strong>{modalAmount}</strong>
              </div>

              {paymentStatus.message && (
                <div className={`checkout-modal-status ${paymentStatus.state}`}>
                  {paymentStatus.message}
                </div>
              )}

              <div className="checkout-modal-actions">
                <button
                  className="hero-btn hero-btn-primary"
                  type="submit"
                  disabled={paymentStatus.state === "saving" || paymentStatus.state === "success"}
                >
                  {paymentStatus.state === "saving" ? "Saving..." : "Confirm payment"}
                </button>
                <button
                  className="hero-btn hero-btn-ghost"
                  type="button"
                  onClick={() => setPaymentOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Checkout;
