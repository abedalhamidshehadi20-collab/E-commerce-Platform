import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import WishlistItemCard from "../components/WishlistItemCard";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  clearWishlist,
  clearWishlistMessage,
  fetchWishlist,
  selectVisibleWishlistItems,
  selectWishlistCount,
} from "../store/slices/wishlistSlice";

function WishlistEmptyIllustration() {
  return (
    <div className="wishlist-empty-illustration" aria-hidden="true">
      <span>{"\u2661"}</span>
      <span>{"\u2764"}</span>
      <span>{"\u2661"}</span>
    </div>
  );
}

export default function WishlistPage() {
  useDocumentTitle("Wishlist");
  const dispatch = useDispatch();
  const items = useSelector(selectVisibleWishlistItems);
  const count = useSelector(selectWishlistCount);
  const { loading, loaded, updating, error, message } = useSelector(
    (state) => state.wishlist
  );

  useEffect(() => {
    if (!loaded) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, loaded]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(clearWishlistMessage());
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, message]);

  if (loading && !loaded) {
    return (
      <section className="container section">
        <LoadingSpinner label="Loading your wishlist..." />
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="section-header">
        <div>
          <span className="eyebrow">Wishlist</span>
          <h1>Keep your favorite products close and move them to cart anytime.</h1>
        </div>
        <div className="wishlist-summary-pill">
          <strong>{count}</strong>
          <span>{count === 1 ? "saved item" : "saved items"}</span>
        </div>
      </div>

      {message ? <p className="wishlist-status-banner success">{message}</p> : null}
      {error ? <p className="wishlist-status-banner error">{error}</p> : null}

      {!items.length ? (
        <div className="wishlist-empty-panel">
          <WishlistEmptyIllustration />
          <EmptyState
            title="Your wishlist is empty"
            description="Save products you want to revisit later, then come back here to compare and move them into your cart."
            action={
              <Link className="button button-primary" to="/products">
                Explore products
              </Link>
            }
          />
        </div>
      ) : (
        <div className="wishlist-page-shell">
          <div className="wishlist-toolbar">
            <p>
              You have <strong>{count}</strong> products saved for later.
            </p>
            <Button
              variant="ghost"
              onClick={() => dispatch(clearWishlist())}
              loading={updating}
            >
              Clear wishlist
            </Button>
          </div>

          <div className="wishlist-items-grid">
            {items.map((item) => (
              <WishlistItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
