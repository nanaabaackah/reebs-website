import React from "react";
import "./AddToCartButton.css";
import { AppIcon } from "/src/components/Icon/Icon";
import { faMinus, faPlus, faShoppingCart, faTrash } from "/src/icons/iconSet";
import { useCart } from "/src/components/CartContext/CartContext";

const getCartItemKey = (entry = {}) =>
  String(entry.id ?? entry.productId ?? entry.slug ?? entry.name ?? "").trim();

function AddToCartButton({ item, onCartChange }) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const itemKey = getCartItemKey(item);
  const inCart = cart.find((entry) => getCartItemKey(entry) === itemKey);
  const statusValue =
    typeof item.status === "string"
      ? item.status.toLowerCase()
      : item.status === false || item.isActive === false
        ? "unavailable"
        : "";
  const quantity = Number(item.quantity ?? item.stock ?? 0) || 0;
  const isUnavailable = statusValue === "unavailable";
  const maxedOut = inCart && inCart.cartQuantity >= quantity;
  const canAdd = quantity > 0 && !isUnavailable;

  const handleAdd = () => {
    if (canAdd) {
      addToCart(item);
      onCartChange?.("added");
    }
  };

  const handleDecrease = () => {
    if (!inCart) return;

    if (inCart.cartQuantity > 1) {
      updateQuantity(item, -1);
      onCartChange?.("decremented");
      return;
    }

    removeFromCart(item);
    onCartChange?.("removed");
  };

  const handleIncrease = () => {
    if (!inCart || maxedOut || isUnavailable) return;
    updateQuantity(item, 1);
    onCartChange?.("incremented");
  };

  return inCart ? (
    <div
      className="shop-cart-controls"
      data-maxed={maxedOut || undefined}
      aria-label={`Update quantity for ${item.name || "item"}`}
    >
      <button
        type="button"
        className="shop-cart-control is-decrease"
        onClick={handleDecrease}
        aria-label={inCart.cartQuantity > 1 ? "Remove one" : "Remove item"}
      >
        <AppIcon icon={inCart.cartQuantity > 1 ? faMinus : faTrash} />
      </button>

      <span className="shop-cart-count" aria-live="polite">
        {inCart.cartQuantity}
      </span>

      <button
        type="button"
        className="shop-cart-control is-increase"
        onClick={handleIncrease}
        disabled={maxedOut || isUnavailable}
        aria-label="Add one"
      >
        <AppIcon icon={faPlus} />
      </button>
    </div>
  ) : (
    <button
      type="button"
      className="shop-add-to-cart"
      onClick={handleAdd}
      disabled={!canAdd}
      aria-live="polite"
      aria-label={canAdd ? "Add to cart" : "Out of stock"}
    >
      <AppIcon icon={faShoppingCart} />
      <span>{canAdd ? "Add to cart" : "Out of stock"}</span>
    </button>
  );
}

export default AddToCartButton;
