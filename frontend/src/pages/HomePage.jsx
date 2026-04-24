import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import contactApi from "../api/contactApi";
import productsApi from "../api/productsApi";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { formatCurrency } from "../utils/formatters";

const countdownUnits = [
  { value: "04", label: "Days" },
  { value: "13", label: "Hour" },
  { value: "34", label: "Min" },
  { value: "56", label: "Sec" },
];

const categorySummaries = [
  "Popular picks for everyday upgrades.",
  "Reliable items for work, home, and gifting.",
  "Best-performing products from recent arrivals.",
  "Fast-moving products with practical value.",
];

function dedupeProducts(...collections) {
  const byId = new Map();

  collections.flat().forEach((product) => {
    if (product?.id && !byId.has(product.id)) {
      byId.set(product.id, product);
    }
  });

  return Array.from(byId.values());
}

function getCategoryTone(index) {
  return ["tone-sand", "tone-blue", "tone-mint", "tone-peach"][index % 4];
}

function getPlaceholderLabel(text = "Catalog") {
  return text
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function CompactProductTile({ product }) {
  return (
    <Link className="compact-product-tile" to={`/products/${product.id}`}>
      <div className="compact-product-thumb">
        {product.primary_image ? (
          <img src={product.primary_image} alt={product.name} />
        ) : (
          <div className="compact-product-placeholder">
            {getPlaceholderLabel(product.name)}
          </div>
        )}
      </div>
      <div className="compact-product-copy">
        <strong>{product.name}</strong>
        <span>{formatCurrency(product.price)}</span>
      </div>
    </Link>
  );
}

function ShelfRow({ title, linkTo, items }) {
  return (
    <section className="market-shelf-row">
      <div className="market-shelf-heading">
        <h3>{title}</h3>
        <Link to={linkTo}>Source now</Link>
      </div>
      <div className="compact-product-grid">
        {items.map((product) => (
          <CompactProductTile key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle("Home");
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [supplierForm, setSupplierForm] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [supplierStatus, setSupplierStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  useEffect(() => {
    if (user) {
      setSupplierForm((current) => ({
        ...current,
        name: current.name || user.full_name || "",
        email: current.email || user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        setError("");

        const [featuredResponse, catalogResponse, categoriesResponse] = await Promise.all([
          productsApi.getProducts({ featured: true, page_size: 7, ordering: "-created_at" }),
          productsApi.getProducts({ page_size: 18, ordering: "-created_at" }),
          productsApi.getCategories(),
        ]);

        setFeaturedProducts(featuredResponse.data.results || []);
        setCatalogProducts(catalogResponse.data.results || []);
        setCategories(categoriesResponse.data || []);
      } catch {
        setError("Unable to load the storefront right now.");
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const combinedProducts = dedupeProducts(featuredProducts, catalogProducts);
  const heroProduct = combinedProducts[0] || null;
  const promoProduct = combinedProducts[1] || heroProduct;
  const topDeals = combinedProducts.slice(2, 7);
  const recommendedProducts = combinedProducts.slice(0, 8);
  const spotlightCategories = categories.slice(0, 2);
  const sidebarCategories = categories.slice(0, 8);
  const supplierPreviewProducts = combinedProducts.slice(0, 3);

  const getProductWindow = (start, count) => {
    const window = combinedProducts.slice(start, start + count);
    return window.length ? window : combinedProducts.slice(0, count);
  };

  const shelves = [
    {
      title: `The ${categories[0]?.name || "popular"} source`,
      linkTo: categories[0] ? `/products?category=${categories[0].id}` : "/products",
      items: getProductWindow(0, 5),
    },
    {
      title: `The ${categories[1]?.name || "recommended"} source`,
      linkTo: categories[1] ? `/products?category=${categories[1].id}` : "/products",
      items: getProductWindow(5, 5),
    },
  ];

  const handleSupplierSubmit = async (event) => {
    event.preventDefault();
    setSupplierStatus({ loading: true, error: "", success: "" });

    try {
      await contactApi.sendMessage({
        name: supplierForm.name,
        email: supplierForm.email,
        subject: supplierForm.subject || "Supplier request",
        message: supplierForm.message,
      });

      setSupplierStatus({
        loading: false,
        error: "",
        success: "Your request has been sent to the supplier support inbox.",
      });
      setSupplierForm((current) => ({
        ...current,
        subject: "",
        message: "",
      }));
    } catch {
      setSupplierStatus({
        loading: false,
        error: "Unable to send your request right now.",
        success: "",
      });
    }
  };

  if (loading) {
    return (
      <section className="container section">
        <LoadingSpinner label="Loading the storefront..." />
      </section>
    );
  }

  return (
    <section className="marketplace-home section">
      <div className="container marketplace-home-inner">
        <div className="market-layout-top">
          <aside className="market-sidebar">
            <div className="market-panel department-panel">
              <div className="panel-title-row department-title-row">
                <h2>Browse categories</h2>
                <span className="department-title-meta">Top picks</span>
              </div>
              <p className="department-intro">Shop by department and compare inventory quickly.</p>
              <div className="department-list">
                {sidebarCategories.map((category) => (
                  <Link
                    key={category.id}
                    className="department-link"
                    to={`/products?category=${category.id}`}
                  >
                    <span className="department-link-name">{category.name}</span>
                    <small>{category.product_count || 0} items</small>
                  </Link>
                ))}
                {!sidebarCategories.length ? (
                  <div className="department-link placeholder">
                    Catalog categories will appear here.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="market-panel countdown-panel">
              <div className="panel-title-row">
                <h3>Deals and offers</h3>
                <Link to="/products">See all</Link>
              </div>
              <p>Fresh markdowns on featured products and fast-moving inventory.</p>
              <div className="countdown-row">
                {countdownUnits.map((unit) => (
                  <div key={unit.label} className="countdown-box">
                    <strong>{unit.value}</strong>
                    <span>{unit.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="market-stage">
            <div className="hero-banner-row">
              <div className="hero-banner hero-banner-main">
                <div className="hero-banner-copy">
                  <span className="hero-kicker">New trending</span>
                  <h1>{heroProduct?.category_name || "Electronic"} items</h1>
                  <p>
                    Explore a dense marketplace layout with new arrivals, practical
                    filters, and quick jumps into the full catalog.
                  </p>
                  <div className="hero-cta-row">
                    <Button className="hero-cta-button" onClick={() => navigate("/products")}>
                      Explore catalog
                    </Button>
                    <Link
                      className="hero-inline-link"
                      to={heroProduct ? `/products/${heroProduct.id}` : "/products"}
                    >
                      View featured item
                    </Link>
                  </div>
                  <div className="hero-metrics" aria-label="Storefront overview">
                    <div className="hero-metric-item">
                      <strong>{categories.length || 0}</strong>
                      <span>Categories</span>
                    </div>
                    <div className="hero-metric-item">
                      <strong>{combinedProducts.length || 0}</strong>
                      <span>Live products</span>
                    </div>
                    <div className="hero-metric-item">
                      <strong>24/7</strong>
                      <span>Secure checkout</span>
                    </div>
                  </div>
                </div>
                <Link
                  className="hero-banner-media"
                  to={heroProduct ? `/products/${heroProduct.id}` : "/products"}
                >
                  <div className="hero-media-stage">
                    <div className="hero-media-details">
                      <span>Featured item</span>
                      <strong>{heroProduct?.name || "Catalog highlight"}</strong>
                      {heroProduct ? <em>{formatCurrency(heroProduct.price)}</em> : null}
                    </div>
                    {heroProduct?.primary_image ? (
                      <img src={heroProduct.primary_image} alt={heroProduct.name} />
                    ) : (
                      <div className="hero-image-placeholder">Catalog</div>
                    )}
                  </div>
                </Link>
              </div>

              <div className="hero-banner hero-banner-side">
                <div className="hero-side-copy">
                  <span>Get US $10 off</span>
                  <h2>for the first order</h2>
                  <p>Use the marketplace layout to spot deals quickly and move faster.</p>
                </div>
                <Link
                  className="hero-side-product"
                  to={promoProduct ? `/products/${promoProduct.id}` : "/products"}
                >
                  {promoProduct?.primary_image ? (
                    <img src={promoProduct.primary_image} alt={promoProduct.name} />
                  ) : (
                    <div className="hero-image-placeholder side">Offer</div>
                  )}
                  <span>Shop now</span>
                </Link>
              </div>
            </div>

            <div className="top-deals-grid">
              {topDeals.map((product) => (
                <article key={product.id} className="top-deal-card">
                  <Link className="top-deal-media" to={`/products/${product.id}`}>
                    {product.primary_image ? (
                      <img src={product.primary_image} alt={product.name} />
                    ) : (
                      <div className="top-deal-placeholder">
                        {getPlaceholderLabel(product.name)}
                      </div>
                    )}
                  </Link>
                  <div className="top-deal-copy">
                    <Link className="top-deal-title" to={`/products/${product.id}`}>
                      {product.name}
                    </Link>
                    <div className="top-deal-price-row">
                      <strong>{formatCurrency(product.price)}</strong>
                      <span>{product.stock > 0 ? "Ready to ship" : "Sold out"}</span>
                    </div>
                  </div>
                </article>
              ))}
              {!topDeals.length ? (
                <div className="top-deal-empty">
                  New arrivals will appear here as products are added.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="market-merch-grid">
          <div className="market-feature-column">
            {spotlightCategories.map((category, index) => (
              <Link
                key={category.id}
                className={`feature-category-card ${getCategoryTone(index)}`}
                to={`/products?category=${category.id}`}
              >
                <div className="feature-category-copy">
                  <span>{category.name}</span>
                  <strong>{category.description || categorySummaries[index % categorySummaries.length]}</strong>
                  <em>Source now</em>
                </div>
                <div className="feature-category-art">
                  {category.image_url ? (
                    <img src={category.image_url} alt={category.name} />
                  ) : (
                    <div className="feature-category-placeholder">
                      {getPlaceholderLabel(category.name)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {!spotlightCategories.length ? (
              <div className="feature-category-card empty">
                Feature collections will appear here once categories are available.
              </div>
            ) : null}
          </div>

          <div className="market-shelf-column">
            {shelves.map((shelf) =>
              shelf.items.length ? (
                <ShelfRow
                  key={shelf.title}
                  title={shelf.title}
                  linkTo={shelf.linkTo}
                  items={shelf.items}
                />
              ) : null
            )}
          </div>
        </div>

        <section className="market-recommended-section">
          <div className="section-header market-section-header">
            <div>
              <span className="eyebrow">Recommended items</span>
              <h2>Popular picks arranged in a cleaner marketplace card grid.</h2>
            </div>
            <Link className="text-link" to="/products">
              View all products
            </Link>
          </div>

          {error ? <p className="page-error market-inline-message">{error}</p> : null}

          <div className="product-grid market-recommended-grid">
            {recommendedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="supplier-banner">
          <div className="supplier-copy-panel">
            <span className="eyebrow">Send one request</span>
            <h2>An easy way to send requests to all suppliers</h2>
            <p>
              Tell us what you need once and we will route it to the right product,
              fulfillment, and support teams.
            </p>

            <div className="supplier-chip-row">
              <span>Single inbox</span>
              <span>Fast quotes</span>
              <span>Real catalog data</span>
            </div>

            <div className="supplier-collage">
              {supplierPreviewProducts.map((product) => (
                <Link
                  key={product.id}
                  className="supplier-collage-card"
                  to={`/products/${product.id}`}
                >
                  <div className="supplier-collage-media">
                    {product.primary_image ? (
                      <img src={product.primary_image} alt={product.name} />
                    ) : (
                      <div className="compact-product-placeholder">
                        {getPlaceholderLabel(product.name)}
                      </div>
                    )}
                  </div>
                  <strong>{product.name}</strong>
                  <span>{formatCurrency(product.price)}</span>
                </Link>
              ))}
            </div>
          </div>

          <form className="supplier-form-panel" onSubmit={handleSupplierSubmit}>
            <h3>Send quote to suppliers</h3>
            <input
              className="supplier-form-control"
              type="text"
              placeholder="Your name"
              value={supplierForm.name}
              onChange={(event) =>
                setSupplierForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
            />
            <input
              className="supplier-form-control"
              type="text"
              placeholder="What item are you sourcing?"
              value={supplierForm.subject}
              onChange={(event) =>
                setSupplierForm((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
              required
            />
            <input
              className="supplier-form-control"
              type="email"
              placeholder="Email"
              value={supplierForm.email}
              onChange={(event) =>
                setSupplierForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
            />
            <textarea
              className="supplier-form-control supplier-form-textarea"
              placeholder="Type more details"
              value={supplierForm.message}
              onChange={(event) =>
                setSupplierForm((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              required
            />
            {supplierStatus.error ? (
              <p className="page-error market-inline-message">{supplierStatus.error}</p>
            ) : null}
            {supplierStatus.success ? (
              <p className="page-success market-inline-message">{supplierStatus.success}</p>
            ) : null}
            <div className="supplier-form-actions">
              <Button type="submit" loading={supplierStatus.loading}>
                Send inquiry
              </Button>
              <Link className="text-link" to="/contact">
                Contact sales
              </Link>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}
