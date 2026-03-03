import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppIcon } from "/src/components/Icon";
import { faMinus, faPlus, faShoppingCart, faTimes, faTrash } from "/src/icons/iconSet";
import { useCart } from "./CartContext";
import "../styles/components/CartOverlay.css";
import {
  getCatalogItemBackgroundStyle,
  getCatalogItemImage,
} from "/src/utils/itemMediaBackgrounds";

const getCartItemKey = (item = {}) =>
  String(item.id ?? item.productId ?? item.slug ?? item.name ?? "").trim();

function CartOverlay({ open, onClose }) {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const {
    cart,
    cartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    convertPrice,
    formatCurrency,
  } = useCart();
  const isOpen = typeof open === "boolean" ? open : cartOpen;
  const handleClose = onClose || closeCart;
  const getItemPrice = (item) =>
    item.price ?? (typeof item.priceCents === "number" ? item.priceCents / 100 : 0);
  const itemCount = cart.reduce((acc, item) => acc + item.cartQuantity, 0);
  const subtotal = cart.reduce(
    (acc, item) => acc + convertPrice(getItemPrice(item)) * item.cartQuantity,
    0
  );
  const getItemQuantity = (item) => item.quantity ?? item.stock ?? 0;
  const getItemCategory = (item) =>
    item.specificCategory || item.specificcategory || item.type || null;
  const subtotalLabel = formatCurrency(subtotal);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose, isOpen]);

  useEffect(() => {
    if (location.pathname !== previousPathRef.current && isOpen) {
      handleClose();
    }
    previousPathRef.current = location.pathname;
  }, [handleClose, isOpen, location.pathname]);

  return (
    <div className={`cart-drawer ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
      <button
        type="button"
        className="cart-backdrop"
        onClick={handleClose}
        aria-label="Close cart"
      />
      <aside
        className={`cart-overlay ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="cart-header">
          <div className="cart-header-copy">
            <p className="cart-kicker">Bag</p>
            <h2 id="cart-title">Your Cart</h2>
            <p className="cart-header-summary">
              {itemCount > 0
                ? `${itemCount} ${itemCount === 1 ? "item" : "items"} ready`
                : "No items added yet"}
            </p>
          </div>
          <div className="cart-header-actions">
            <button type="button" className="close-cart" onClick={handleClose} aria-label="Close cart">
              <AppIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-illus" aria-hidden="true">
              <AppIcon icon={faShoppingCart} />
            </div>
            <strong>Your cart is empty.</strong>
            <p>Add balloons, supplies, or rentals to start building your order.</p>
            <div className="cart-empty-actions">
              <Link to="/shop" className="checkout-btn" onClick={handleClose}>
                Browse the shop
              </Link>
              <Link to="/rentals" className="ghost-btn" onClick={handleClose}>
                Explore rentals
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => {
                const available = getItemQuantity(item) - item.cartQuantity;
                const itemKey = getCartItemKey(item);
                const itemCategory = getItemCategory(item);
                return (
                  <div key={itemKey} className="cart-item">
                    <div
                      className="cart-item-media category-image-bg"
                      style={getCatalogItemBackgroundStyle(item)}
                    >
                      <img
                        className="cart-image"
                        src={getCatalogItemImage(item)}
                        alt={item.name}
                      />
                    </div>
                    <div className="cart-item-body">
                      <div className="cart-item-top">
                        <div>
                          <p className="cart-item-name">{item.name}</p>
                          {itemCategory && (
                            <span className="cart-item-type">{itemCategory}</span>
                          )}
                        </div>
                        <button
                          className="cart-remove"
                          type="button"
                          onClick={() => removeFromCart(item)}
                          aria-label="Remove item"
                        >
                          <AppIcon icon={faTrash} />
                        </button>
                      </div>

                      <div className="cart-item-meta">
                        <div className="cart-qty-controls">
                          <button
                            type="button"
                            onClick={() =>
                              item.cartQuantity <= 1
                                ? removeFromCart(item)
                                : updateQuantity(item, -1)
                            }
                            aria-label="Decrease quantity"
                          >
                            <AppIcon icon={faMinus} />
                          </button>
                          <span>{item.cartQuantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, 1)}
                            disabled={item.cartQuantity >= getItemQuantity(item)}
                            aria-label="Increase quantity"
                          >
                            <AppIcon icon={faPlus} />
                          </button>
                          <p className="cart-stock">
                            {available > 0 ? `${available} left` : "Max stock"}
                          </p>
                        </div>
                        <div className="cart-price">
                          <span className="cart-price-each">
                            {formatCurrency(convertPrice(getItemPrice(item)))} ea
                          </span>
                          <span className="cart-price-total">
                            {formatCurrency(convertPrice(getItemPrice(item) * item.cartQuantity))}
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
                <div className="cart-footer-copy">
                  <strong>Subtotal</strong>
                  <span>
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="cart-footer-total">
                  <strong>{subtotalLabel}</strong>
                </div>
              </div>
              <p className="cart-note">Taxes, pickup, and delivery timing are confirmed at checkout.</p>
              <Link to="/cart" className="checkout-btn cart-primary-action" onClick={handleClose}>
                Go to cart
              </Link>
              <div className="foot-items">
                <button type="button" className="clear-cart" onClick={clearCart}>
                  Clear Cart
                </button>
                <button type="button" className="ghost-btn" onClick={handleClose}>
                  Continue shopping
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default CartOverlay;
