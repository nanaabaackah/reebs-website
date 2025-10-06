import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus, faShoppingCart, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "/src/components/CartContext";

function AddToCartButton({ item }) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const inCart = cart.find((i) => i.id === item.id);

  return inCart ? (
    <div className="main-quantity-controls">
      {/* Decrease quantity */}
      <button
        onClick={() => updateQuantity(item.id, -1)}
        disabled={inCart.cartQuantity <= 1}
      >
        <FontAwesomeIcon icon={faMinus} />
      </button>

      {/* Current qty */}
      <span>{inCart.cartQuantity}</span>

      {/* Increase only if stock not reached */}
      {inCart.cartQuantity < item.quantity && (
        <button
          onClick={() => updateQuantity(item.id, 1)}
          disabled={inCart.cartQuantity >= item.quantity}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      )}

      {/* Remove item */}
      <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </div>
  ) : (
    <button
      className="add-to-cart"
      onClick={() => {
        if (item.quantity > 0) addToCart(item);
      }}
      disabled={item.quantity === 0}
    >
      <FontAwesomeIcon icon={faShoppingCart} />{" "}
      {item.quantity > 0 ? "Add to Cart" : "Out of Stock"}
    </button>
  );
}

export default AddToCartButton;
