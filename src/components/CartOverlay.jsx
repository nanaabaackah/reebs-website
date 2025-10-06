import React from "react";
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinus, faPlus, faTimes, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useCart } from "./CartContext";

function CartOverlay({ open, onClose }) {
  const { cart, updateQuantity, removeFromCart, clearCart, convertPrice, formatCurrency } = useCart();
  
  const subtotal = cart.reduce(
    (acc, item) => acc + convertPrice(item.price) * item.cartQuantity,
    0
  );

  return (
    <div className={`cart-overlay ${open ? "open" : ""}`}>
      <div className="cart-header">
        <h2>Your Cart ({cart.reduce((acc, item) => acc + item.cartQuantity, 0)})</h2>
        <button className="close-cart" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-name">
                  <p>{item.name}</p>
                </div>
                <div className="individual">
                  <img className="cart-image" src={item.image_url || "/imgs/placeholder.png"} alt={item.name} />
                  <div className="item-quantity-controls">
                    <div className="item-quantity">
                      <div className="quant">
                        <p>Quantity: </p>
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={item.cartQuantity <= 1}
                        >
                          <FontAwesomeIcon icon={faMinus} />
                        </button>

                        <span>{item.cartQuantity}</span>

                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.cartQuantity >= item.quantity}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                        <div className="remove-btn">
                          <button onClick={() => removeFromCart(item.id)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                      <div className="stock-info">
                        <p>
                          {item.quantity - item.cartQuantity > 0
                            ? `${item.quantity - item.cartQuantity} left in stock`
                            : "No more stock available"}
                        </p>
                      </div>
                      
                    </div>
                    <div className="cart-price">
                      <span>{formatCurrency(convertPrice(item.price * item.cartQuantity))}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <p className="subtotal">
              <div className="text">
                <strong>Subtotal </strong> 
                ({cart.reduce((acc, item) => acc + item.cartQuantity, 0)}{" "}
                {cart.reduce((acc, item) => acc + item.cartQuantity, 0) === 1 ? "item" : "items"})
              </div>
              <div className="amount">
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
            </p>
            <Link to="/Cart" ><button className="checkout-btn">Proceed To Bag</button></Link>
            <div className="foot-items">
              <button className="clear-cart" onClick={clearCart}> Clear Cart</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CartOverlay;
