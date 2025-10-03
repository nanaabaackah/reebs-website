import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus, faShoppingCart, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "/src/components/CartContext";

function AddToCartButton({ item }) {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const inCart = cart.find(i => i.id === item.id);

  return inCart ? (
    <div className="main-quantity-controls">
      <button onClick={() => updateQuantity(item.id, -1)}><FontAwesomeIcon icon={faMinus}/></button>
      <span>{inCart.quantity}</span>
      <button onClick={() => updateQuantity(item.id, 1)}><FontAwesomeIcon icon={faPlus}/></button>
      <button className="remove-btn" onClick={() => removeFromCart(item.id)}><FontAwesomeIcon icon={faTrash}/></button>
    </div>
  ) : (
    <button className="add-to-cart" onClick={() => addToCart(item)}>
      <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
    </button>
  );
}

export default AddToCartButton;
