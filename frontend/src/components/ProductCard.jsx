import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "./Button";
import { addItemToCart } from "../store/slices/cartSlice";
import { formatCurrency } from "../utils/formatters";
import WishlistButton from "./WishlistButton";

function getPlaceholderLabel(name = "Catalog") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { updating } = useSelector((state) => state.cart);

  const handleQuickAdd = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/products" } });
      return;
    }

    try {
      await dispatch(addItemToCart({ product_id: product.id, quantity: 1 })).unwrap();
    } catch {
      // Global error surfaces through slice state.
    }
  };

  return (
    <article className="product-card">
      <div className="product-card-media-shell">
        <Link className="product-card-media" to={`/products/${product.id}`}>
          {product.primary_image ? (
            <img src={product.primary_image} alt={product.name} />
          ) : (
            <div className="product-card-placeholder">{getPlaceholderLabel(product.name)}</div>
          )}
        </Link>
        <WishlistButton product={product} className="product-card-wishlist" />
      </div>

      <div className="product-card-body">
        <div className="product-card-meta">
          <span>{product.category_name || "Catalog"}</span>
          <span className={`product-card-stock ${product.stock > 0 ? "in-stock" : "sold-out"}`}>
            {product.stock > 0 ? "Ready to ship" : "Sold out"}
          </span>
        </div>

        <Link to={`/products/${product.id}`} className="product-card-title">
          {product.name}
        </Link>

        <p className="product-card-description">
          {product.short_description || "Structured product details and a faster way to buy."}
        </p>

        <div className="product-card-footer">
          <div className="product-card-price-stack">
            <strong>{formatCurrency(product.price)}</strong>
            <span>{product.stock > 0 ? `${product.stock} in stock` : "Unavailable"}</span>
          </div>

          <Button
            variant="secondary"
            className="product-card-button"
            onClick={handleQuickAdd}
            loading={updating}
            disabled={product.stock <= 0}
          >
            Add
          </Button>
        </div>
      </div>
    </article>
  );
}
