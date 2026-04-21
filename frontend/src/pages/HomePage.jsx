import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import productsApi from "../api/productsApi";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Button from "../components/Button";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function HomePage() {
  useDocumentTitle("Home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [productsResponse, categoriesResponse] = await Promise.all([
          productsApi.getProducts({ featured: true, page_size: 4, ordering: "-created_at" }),
          productsApi.getCategories(),
        ]);
        setFeaturedProducts(productsResponse.data.results || []);
        setCategories(categoriesResponse.data || []);
      } catch (requestError) {
        setError("Unable to load the storefront right now.");
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  if (loading) {
    return (
      <section className="container section">
        <LoadingSpinner label="Loading the storefront..." />
      </section>
    );
  }

  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Modern retail infrastructure</span>
            <h1>Design-forward essentials with a smoother buying journey.</h1>
            <p>
              Browse curated categories, discover new arrivals, and manage every order
              from a single clean customer dashboard.
            </p>
            <div className="hero-actions">
              <Button onClick={() => (window.location.href = "/products")}>Shop products</Button>
              <Link className="text-link hero-link" to="/contact">
                Talk to the team
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <strong>Fast search</strong>
                <span>Filter by category, price, and freshness.</span>
              </div>
              <div>
                <strong>Secure checkout</strong>
                <span>JWT-protected order placement and tracking.</span>
              </div>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-highlight-card">
              <span>Featured collection</span>
              <h3>Built for calm workflows</h3>
              <p>
                Soft surfaces, responsive layouts, and clear purchase details across every
                screen size.
              </p>
            </div>
            <div className="hero-floating-grid">
              {categories.slice(0, 4).map((category) => (
                <div key={category.id} className="category-chip-card">
                  <strong>{category.name}</strong>
                  <span>{category.product_count || 0} products</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-header">
          <div>
            <span className="eyebrow">Browse categories</span>
            <h2>Collections built for real-world shopping patterns.</h2>
          </div>
          <Link className="text-link" to="/products">
            View full catalog
          </Link>
        </div>
        {error ? <p className="page-error">{error}</p> : null}
        <div className="category-grid">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              className="category-card"
              to={`/products?category=${category.id}`}
            >
              <span>{category.name}</span>
              <strong>{category.product_count || 0} items</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-header">
          <div>
            <span className="eyebrow">Featured now</span>
            <h2>Fresh products with a clean, professional presentation.</h2>
          </div>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </>
  );
}
