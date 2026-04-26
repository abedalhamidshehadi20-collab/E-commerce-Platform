import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  addProductToWishlist,
  removeProductFromWishlist,
  selectIsProductInWishlist,
  selectIsWishlistProductPending,
} from "../store/slices/wishlistSlice";

export default function WishlistButton({
  product,
  className = "",
  showLabel = false,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const isInWishlist = useSelector((state) =>
    selectIsProductInWishlist(state, product.id)
  );
  const isPending = useSelector((state) =>
    selectIsWishlistProductPending(state, product.id)
  );

  const handleToggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}` },
      });
      return;
    }

    try {
      if (isInWishlist) {
        await dispatch(removeProductFromWishlist(product.id)).unwrap();
      } else {
        await dispatch(addProductToWishlist(product.id)).unwrap();
      }
    } catch {
      // Wishlist errors are surfaced by the slice and page-level state.
    }
  };

  return (
    <button
      type="button"
      className={`wishlist-button ${isInWishlist ? "active" : ""} ${
        isPending ? "pending" : ""
      } ${className}`.trim()}
      onClick={handleToggleWishlist}
      disabled={isPending}
      aria-label={
        isInWishlist
          ? `Remove ${product.name} from wishlist`
          : `Add ${product.name} to wishlist`
      }
      aria-pressed={isInWishlist}
      title={isInWishlist ? "Saved to wishlist" : "Save to wishlist"}
    >
      <span className="wishlist-button-icon" aria-hidden="true">
        {isInWishlist ? "\u2764" : "\u2661"}
      </span>
      {showLabel ? (
        <span className="wishlist-button-text">
          {isInWishlist ? "Saved" : "Save"}
        </span>
      ) : null}
    </button>
  );
}
