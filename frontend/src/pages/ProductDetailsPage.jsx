import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import WishlistButton from "../components/WishlistButton";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { addItemToCart } from "../store/slices/cartSlice";
import { fetchProductDetails } from "../store/slices/productsSlice";
import { formatCurrency } from "../utils/formatters";

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct, detailLoading, error } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { updating } = useSelector((state) => state.cart);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [localError, setLocalError] = useState("");

  useDocumentTitle(selectedProduct?.name || "Product details");

  useEffect(() => {
    dispatch(fetchProductDetails(productId));
  }, [dispatch, productId]);

  useEffect(() => {
    if (selectedProduct?.images?.length) {
      setSelectedImage(selectedProduct.images[0].image_url);
    } else {
      setSelectedImage(selectedProduct?.primary_image || "");
    }
  }, [selectedProduct]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/products/${productId}` } });
      return;
    }

    try {
      setLocalError("");
      await dispatch(
        addItemToCart({
          product_id: selectedProduct.id,
          quantity: Number(quantity),
        })
      ).unwrap();
      navigate("/cart");
    } catch (requestError) {
      setLocalError(requestError || "Unable to add the item to the cart.");
    }
  };

  if (detailLoading || !selectedProduct) {
    return (
      <section className="container section">
        <LoadingSpinner label="Loading product details..." />
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="product-gallery-main">
            {selectedImage ? (
              <img src={selectedImage} alt={selectedProduct.name} />
            ) : (
              <div className="product-card-placeholder large">No image available</div>
            )}
          </div>
          <div className="product-gallery-thumbs">
            {(selectedProduct.images?.length ? selectedProduct.images : [{ image_url: selectedProduct.primary_image }])
              .filter((image) => image?.image_url)
              .map((image) => (
                <button
                  key={image.image_url}
                  className={`thumb-button ${
                    selectedImage === image.image_url ? "active" : ""
                  }`}
                  onClick={() => setSelectedImage(image.image_url)}
                >
                  <img src={image.image_url} alt={selectedProduct.name} />
                </button>
              ))}
          </div>
        </div>

        <div className="product-detail-copy">
          <span className="eyebrow">{selectedProduct.category?.name}</span>
          <h1>{selectedProduct.name}</h1>
          <p className="product-price">{formatCurrency(selectedProduct.price)}</p>
          <p className="product-stock-status">{selectedProduct.stock_status}</p>
          <p className="product-description">{selectedProduct.description}</p>
          <div className="detail-secondary-actions">
            <WishlistButton product={selectedProduct} showLabel />
          </div>

          <div className="detail-purchase-card">
            <div className="field-row align-end">
              <InputQuantity quantity={quantity} setQuantity={setQuantity} max={selectedProduct.stock} />
              <Button
                className="stretch"
                onClick={handleAddToCart}
                loading={updating}
                disabled={selectedProduct.stock <= 0}
              >
                Add to cart
              </Button>
            </div>
            <div className="detail-microcopy">
              <span>SKU: {selectedProduct.sku}</span>
              <span>{selectedProduct.stock} units available</span>
            </div>
          </div>

          {error || localError ? <p className="page-error">{localError || error}</p> : null}
        </div>
      </div>
    </section>
  );
}

function InputQuantity({ quantity, setQuantity, max }) {
  return (
    <div className="quantity-control">
      <span>Quantity</span>
      <div className="quantity-box">
        <button onClick={() => setQuantity((current) => Math.max(1, current - 1))}>-</button>
        <input
          type="number"
          min="1"
          max={max || 1}
          value={quantity}
          onChange={(event) => {
            const nextValue = Number(event.target.value || 1);
            setQuantity(Math.min(Math.max(nextValue, 1), max || 1));
          }}
        />
        <button onClick={() => setQuantity((current) => Math.min(max || 1, current + 1))}>+</button>
      </div>
    </div>
  );
}
