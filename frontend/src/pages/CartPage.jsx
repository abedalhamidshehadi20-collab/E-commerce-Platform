import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  removeCartItem,
  updateCartItemQuantity,
} from "../store/slices/cartSlice";
import { formatCurrency } from "../utils/formatters";

export default function CartPage() {
  useDocumentTitle("Cart");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { cart, loading, updating, error } = useSelector((state) => state.cart);

  if (!isAuthenticated) {
    return (
      <section className="container section">
        <EmptyState
          title="Sign in to manage your cart"
          description="Your shopping cart is tied to your secure account."
          action={<Button onClick={() => navigate("/login")}>Go to login</Button>}
        />
      </section>
    );
  }

  if (loading) {
    return (
      <section className="container section">
        <LoadingSpinner label="Loading your cart..." />
      </section>
    );
  }

  if (!cart.items.length) {
    return (
      <section className="container section">
        <EmptyState
          title="Your cart is empty"
          description="Browse the catalog and add a few products to start checkout."
          action={<Link className="button button-primary" to="/products">Browse products</Link>}
        />
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="section-header">
        <div>
          <span className="eyebrow">Cart</span>
          <h1>Review quantities and head to checkout when you’re ready.</h1>
        </div>
      </div>

      {error ? <p className="page-error">{error}</p> : null}

      <div className="checkout-layout">
        <div className="cart-list">
          {cart.items.map((item) => (
            <article className="cart-item-card" key={item.id}>
              <div className="cart-item-media">
                {item.product.primary_image ? (
                  <img src={item.product.primary_image} alt={item.product.name} />
                ) : (
                  <div className="product-card-placeholder">No image</div>
                )}
              </div>
              <div className="cart-item-copy">
                <h3>{item.product.name}</h3>
                <p>{formatCurrency(item.product.price)} each</p>
                <div className="cart-item-actions">
                  <label>
                    Quantity
                    <input
                      type="number"
                      min="1"
                      max={item.product.stock}
                      value={item.quantity}
                      onChange={(event) =>
                        dispatch(
                          updateCartItemQuantity({
                            product_id: item.product.id,
                            quantity: Number(event.target.value || 1),
                          })
                        )
                      }
                    />
                  </label>
                  <button
                    className="text-button danger"
                    onClick={() => dispatch(removeCartItem(item.product.id))}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <strong>{formatCurrency(item.line_total)}</strong>
            </article>
          ))}
        </div>

        <aside className="summary-card">
          <h3>Order summary</h3>
          <div className="summary-row">
            <span>Items</span>
            <strong>{cart.total_items}</strong>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(cart.subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <strong>Calculated at checkout</strong>
          </div>
          <Button className="stretch" loading={updating} onClick={() => navigate("/checkout")}>
            Proceed to checkout
          </Button>
        </aside>
      </div>
    </section>
  );
}
