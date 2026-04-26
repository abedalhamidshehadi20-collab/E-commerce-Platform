import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "./Button";
import { addItemToCart } from "../store/slices/cartSlice";
import {
  removeProductFromWishlist,
  selectIsWishlistProductPending,
} from "../store/slices/wishlistSlice";
import { formatCurrency } from "../utils/formatters";

function getPlaceholderLabel(name = "Wishlist") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function WishlistItemCard({ item }) {
  const dispatch = useDispatch();
  const isPending = useSelector((state) =>
    selectIsWishlistProductPending(state, item.product.id)
  );
  const { updating: cartUpdating } = useSelector((state) => state.cart);
  const [feedback, setFeedback] = useState({ error: "", success: "" });

  const handleRemove = async () => {
    try {
      setFeedback({ error: "", success: "" });
      await dispatch(removeProductFromWishlist(item.product.id)).unwrap();
    } catch (error) {
      setFeedback({
        error: error || "Unable to remove this product from your wishlist.",
        success: "",
      });
    }
  };

  const handleAddToCart = async () => {
    try {
      setFeedback({ error: "", success: "" });
      await dispatch(
        addItemToCart({ product_id: item.product.id, quantity: 1 })
      ).unwrap();
      setFeedback({ error: "", success: "Added to cart." });
    } catch (error) {
      setFeedback({
        error: error || "Unable to add this item to the cart.",
        success: "",
      });
    }
  };

  return (
    <article className="wishlist-item-card">
      <Link className="wishlist-item-media" to={`/products/${item.product.id}`}>
        {item.product.image ? (
          <img src={item.product.image} alt={item.product.name} />
        ) : (
          <div className="product-card-placeholder">
            {getPlaceholderLabel(item.product.name)}
          </div>
        )}
      </Link>

      <div className="wishlist-item-copy">
        <div className="wishlist-item-header">
          <div>
            <Link className="wishlist-item-title" to={`/products/${item.product.id}`}>
              {item.product.name}
            </Link>
            <p className="wishlist-item-description">{item.product.description}</p>
          </div>
          <strong className="wishlist-item-price">
            {formatCurrency(item.product.price)}
          </strong>
        </div>

        {feedback.error ? <p className="page-error">{feedback.error}</p> : null}
        {feedback.success ? <p className="page-success">{feedback.success}</p> : null}

        <div className="wishlist-item-actions">
          <Button
            variant="secondary"
            onClick={handleAddToCart}
            loading={cartUpdating}
            disabled={item.product.stock <= 0}
          >
            {item.product.stock > 0 ? "Add to cart" : "Out of stock"}
          </Button>
          <button
            type="button"
            className="text-button danger"
            onClick={handleRemove}
            disabled={isPending}
          >
            {isPending ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </article>
  );
}
