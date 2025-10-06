import React from "react";
import { useCart } from "../components/CartContext";
import AddToCartButton from "/src/components/AddToCartButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import "./master.css";
//import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";

const Cart = () => {
  const { currency, setCurrency, cart, removeFromCart, updateQuantity, convertPrice, formatCurrency } = useCart();

  const itemCount = cart.reduce((acc, item) => acc + item.cartQuantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);

  return (
    <div className="r1">
      <main className="r1-back">
        <section id="r7-intro">
          <div className="r7 back-heading">
            <h1>Your Cart</h1>
            <p>Party supplies, toys, and decorations available for purchase.</p>
          </div>
          <img
            src="/imgs/blue2.svg"
            alt="wave overflow"
            className="absolute top-[500px] left-1/2 transform -translate-x-1/2 w-[1600px] z-60 pointer-events-none"
          />
        </section>
        <section id="r7-cart-info">
          <div className="cart-page">
            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty.</p>
              
            ) : (
              <>
                <div className="cart-items">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="cart-currency-selector"
                  >
                    {["GHS", "USD", "CAD", "GBP", "EUR", "NGN"].map((cur) => (
                      <option key={cur} value={cur}>
                        {cur}
                      </option>
                    ))}
                  </select>
                  {cart.map((item) => (
                    <div className="cart-item-row" key={item.id}>
                      {/* Image */}
                      <div className="cart-item-image">
                        <img src={item.image_url} alt={item.name} />
                        
                      </div>

                      {/* Name & details */}
                      <div className="cart-item-info">
                        <h3>{item.name}</h3>
                        {/* optional: add type or description */}
                        <p className="cart-item-type">{item.type}</p>
                        <p className="stock">
                          {item.quantity} available in stock
                        </p>
                      </div>

                      {/* Price */}
                      <div className="cart-item-price">
                        <p>Price</p>
                        {formatCurrency(convertPrice(item.price))}
                      </div>

                      {/* Quantity (use input with stepper) */}
                      <div className="cart-item-quantity">
                        <p>Quantity</p>
                        <input
                          type="number"
                          min="1"
                          max={item.quantity}
                          value={item.cartQuantity}
                          onChange={(e) =>
                            updateQuantity(item.id, parseInt(e.target.value) - item.cartQuantity)
                          }
                        />
                      </div>

                      {/* Total */}
                      <div className="cart-item-total">
                        <p>Total</p>
                        {formatCurrency(convertPrice(item.price * item.cartQuantity))}
                      </div>

                      {/* Remove */}
                      <div className="cart-item-remove">
                        <button onClick={() => removeFromCart(item.id)}>Remove ✕</button>
                      </div>
                    </div>
                  ))}
                </div>


                <div className="cart-summary">
                  <h3>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"}):</h3>
                  <p>{formatCurrency(convertPrice(subtotal))}</p>
                  <button className="checkout-btn">Proceed to Checkout</button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Cart;
