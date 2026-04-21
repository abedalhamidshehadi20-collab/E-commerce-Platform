import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "./Button";
import { addItemToCart } from "../store/slices/cartSlice";
import { formatCurrency } from "../utils/formatters";

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
      <Link className="product-card-media" to={`/products/${product.id}`}>
        {product.primary_image ? (
          <img src={product.primary_image} alt={product.name} />
        ) : (
          <div className="product-card-placeholder">No image</div>
        )}
      </Link>
      <div className="product-card-body">
        <div className="product-card-meta">
          <span>{product.category_name}</span>
          {product.stock > 0 ? <span>In stock</span> : <span>Sold out</span>}
        </div>
        <Link to={`/products/${product.id}`} className="product-card-title">
          {product.name}
        </Link>
        <p className="product-card-description">
          {product.short_description || "Designed for everyday performance and modern living."}
        </p>
        <div className="product-card-footer">
          <strong>{formatCurrency(product.price)}</strong>
          <Button
            variant="secondary"
            onClick={handleQuickAdd}
            loading={updating}
            disabled={product.stock <= 0}
          >
            Add to cart
          </Button>
        </div>
      </div>
    </article>
  );
}
