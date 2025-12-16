import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus, faShoppingCart, faTrash, faPlus as faPlusIcon } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "/src/components/CartContext";

function AddToCartButton({ item, onAdded }) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const inCart = cart.find((i) => i.id === item.id);
  const statusValue =
    typeof item.status === "string"
      ? item.status.toLowerCase()
      : item.status === false
        ? "unavailable"
        : "";
  const quantity = item.quantity ?? item.stock ?? 0;
  const isUnavailable = statusValue === "unavailable";
  const maxedOut = inCart && inCart.cartQuantity >= quantity;
  const canAdd = quantity > 0 && !isUnavailable;

  const handleAdd = () => {
    if (canAdd) {
      addToCart(item);
      onAdded?.();
    }
  };

  return inCart ? (
    <div className="main-quantity-controls" data-maxed={maxedOut || undefined} aria-label="Update quantity">
      <button
        className="remove-btn"
        onClick={() => {
          if (inCart.cartQuantity > 1) {
            updateQuantity(item.id, -1);
          } else {
            removeFromCart(item.id);
          }
        }}
        aria-label={inCart.cartQuantity > 1 ? "Remove one" : "Remove item"}
      >
        <FontAwesomeIcon icon={inCart.cartQuantity > 1 ? faMinus : faTrash} />
      </button>

      <span>{inCart.cartQuantity}</span>

      <button
        onClick={() => updateQuantity(item.id, 1)}
        disabled={maxedOut || isUnavailable}
        aria-label="Add one"
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
    </div>
  ) : (
    <button
      className="add-to-cart add-to-cart--glow"
      onClick={handleAdd}
      disabled={!canAdd}
      aria-live="polite"
      aria-label={canAdd ? "Add to cart" : "Out of stock"}
    >
      <FontAwesomeIcon icon={faPlusIcon} />
    </button>
  );
}

export default AddToCartButton;
