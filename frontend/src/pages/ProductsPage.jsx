import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Pagination from "../components/Pagination";
import Button from "../components/Button";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { fetchCategories, fetchProducts } from "../store/slices/productsSlice";

const sortOptions = [
  { value: "-created_at", label: "Newest first" },
  { value: "price", label: "Price: low to high" },
  { value: "-price", label: "Price: high to low" },
];

export default function ProductsPage() {
  useDocumentTitle("Products");
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, categories, pagination, loading, error } = useSelector(
    (state) => state.products
  );
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("min_price") || "",
    maxPrice: searchParams.get("max_price") || "",
    ordering: searchParams.get("ordering") || "-created_at",
    page: Number(searchParams.get("page") || 1),
  });

  const deferredSearch = useDeferredValue(filters.search);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const nextParams = {};
    if (filters.search) nextParams.search = filters.search;
    if (filters.category) nextParams.category = filters.category;
    if (filters.minPrice) nextParams.min_price = filters.minPrice;
    if (filters.maxPrice) nextParams.max_price = filters.maxPrice;
    if (filters.ordering && filters.ordering !== "-created_at") {
      nextParams.ordering = filters.ordering;
    }
    if (filters.page > 1) nextParams.page = String(filters.page);
    setSearchParams(nextParams, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    dispatch(
      fetchProducts({
        search: deferredSearch || undefined,
        category: filters.category || undefined,
        min_price: filters.minPrice || undefined,
        max_price: filters.maxPrice || undefined,
        ordering: filters.ordering,
        page: filters.page,
      })
    );
  }, [dispatch, deferredSearch, filters.category, filters.minPrice, filters.maxPrice, filters.ordering, filters.page]);

  const activeFilters = useMemo(
    () => [filters.search, filters.category, filters.minPrice, filters.maxPrice].filter(Boolean),
    [filters]
  );

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? value : 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      ordering: "-created_at",
      page: 1,
    });
  };

  return (
    <section className="container section">
      <div className="section-header">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Search, filter, and sort the full store in a few taps.</h1>
        </div>
      </div>

      <div className="catalog-layout">
        <aside className="filter-panel">
          <div className="filter-panel-header">
            <h3>Filters</h3>
            {activeFilters.length ? (
              <button className="text-button" onClick={clearFilters}>
                Clear all
              </button>
            ) : null}
          </div>
          <Input
            label="Search products"
            placeholder="Search by name, SKU, or category"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
          />
          <Input
            as="select"
            label="Category"
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value)}
            options={[
              { value: "", label: "All categories" },
              ...categories.map((category) => ({
                value: String(category.id),
                label: category.name,
              })),
            ]}
          />
          <div className="field-row">
            <Input
              label="Min price"
              type="number"
              min="0"
              placeholder="0"
              value={filters.minPrice}
              onChange={(event) => updateFilter("minPrice", event.target.value)}
            />
            <Input
              label="Max price"
              type="number"
              min="0"
              placeholder="500"
              value={filters.maxPrice}
              onChange={(event) => updateFilter("maxPrice", event.target.value)}
            />
          </div>
          <Input
            as="select"
            label="Sort by"
            value={filters.ordering}
            onChange={(event) => updateFilter("ordering", event.target.value)}
            options={sortOptions}
          />
        </aside>

        <div className="catalog-results">
          <div className="catalog-summary">
            <p>
              Showing <strong>{items.length}</strong> products on page{" "}
              <strong>{pagination.current_page || 1}</strong>.
            </p>
            <p>{pagination.count || 0} total matching items.</p>
          </div>

          {loading ? <LoadingSpinner label="Loading products..." /> : null}
          {!loading && error ? <p className="page-error">{error}</p> : null}
          {!loading && !error && !items.length ? (
          <EmptyState
              title="No products matched your filters"
              description="Try widening the price range or clearing the search."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Reset filters
                </Button>
              }
            />
          ) : null}

          <div className="product-grid">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <Pagination
            currentPage={pagination.current_page || 1}
            totalPages={pagination.total_pages || 1}
            onPageChange={(page) => updateFilter("page", page)}
          />
        </div>
      </div>
    </section>
  );
}
