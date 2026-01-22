import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus, faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "./CartContext";

const CURRENCIES = ["GHS", "USD", "CAD", "GBP", "EUR", "NGN"];

function CartOverlay({ open, onClose }) {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    convertPrice,
    formatCurrency,
    currency,
    setCurrency,
  } = useCart();
  const itemCount = cart.reduce((acc, item) => acc + item.cartQuantity, 0);
  const subtotal = cart.reduce(
    (acc, item) => acc + convertPrice(item.price) * item.cartQuantity,
    0
  );
  const getItemQuantity = (item) => item.quantity ?? item.stock ?? 0;
  const getItemImage = (item) =>
    item.image || item.imageUrl || item.image_url || "/imgs/placeholder.png";
  const getItemCategory = (item) =>
    item.specificCategory || item.specificcategory || item.type || null;

  return (
    <div className={`cart-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="cart-backdrop" onClick={onClose} />
      <aside
        className={`cart-overlay ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="cart-header">
          <div>
            <p className="cart-kicker">Bag</p>
            <h2 id="cart-title">Your Cart ({itemCount})</h2>
          </div>
          <div className="cart-header-actions">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="cart-currency"
              aria-label="Select currency"
            >
              {CURRENCIES.map((cur) => (
                <option key={cur} value={cur}>
                  {cur}
                </option>
              ))}
            </select>
            <button className="close-cart" onClick={onClose} aria-label="Close cart">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <Link to="/shop" className="checkout-btn ghost" onClick={onClose}>
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => {
                const available = getItemQuantity(item) - item.cartQuantity;
                return (
                  <div key={item.id} className="cart-item">
                    <img
                      className="cart-image"
                      src={getItemImage(item)}
                      alt={item.name}
                    />
                    <div className="cart-item-body">
                      <div className="cart-item-top">
                        <div>
                          <p className="cart-item-name">{item.name}</p>
                          {getItemCategory(item) && (
                            <span className="cart-item-type">{getItemCategory(item)}</span>
                          )}
                        </div>
                        <button
                          className="cart-remove"
                          onClick={() => removeFromCart(item.id)}
                          aria-label="Remove item"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>

                      <div className="cart-item-meta">
                        <div className="cart-qty-controls">
                          <button
                            onClick={() =>
                              item.cartQuantity <= 1
                                ? removeFromCart(item.id)
                                : updateQuantity(item.id, -1)
                            }
                            aria-label="Decrease quantity"
                          >
                            <FontAwesomeIcon icon={faMinus} />
                          </button>
                          <span>{item.cartQuantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={item.cartQuantity >= getItemQuantity(item)}
                            aria-label="Increase quantity"
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </button>
                          <p className="cart-stock">
                            {available > 0 ? `${available} left` : "Max stock"}
                          </p>
                        </div>
                        <div className="cart-price">
                          <span className="cart-price-each">
                            {formatCurrency(convertPrice(item.price))} ea
                          </span>
                          <span className="cart-price-total">
                            {formatCurrency(convertPrice(item.price * item.cartQuantity))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-footer">
              <div className="subtotal">
                <div className="text">
                  <strong>Subtotal</strong>
                  <span>
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="amount">
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
              </div>
              <p className="cart-note">Taxes and pickup timing confirmed at checkout.</p>
              <Link to="/Cart" onClick={onClose}>
                <button className="checkout-btn">Proceed To Bag</button>
              </Link>
              <div className="foot-items">
                <button className="clear-cart" onClick={clearCart}>Clear Cart</button>
                <button className="ghost-btn" onClick={onClose}>Continue shopping</button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default CartOverlay;
