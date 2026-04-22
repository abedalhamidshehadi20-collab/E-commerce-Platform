import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "./Button";
import { BACKEND_BASE_URL } from "../api/apiClient";
import { logout } from "../store/slices/authSlice";
import { clearCartState } from "../store/slices/cartSlice";

const publicLinks = [
  { label: "Products", to: "/products" },
  { label: "New arrivals", to: "/products?ordering=-created_at" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart.cart);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCartState());
    navigate("/");
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    navigate(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <header className="site-header">
      <div className="container header-main-row">
        <Link className="brand-mark" to="/">
          <span className="brand-badge">A-SH</span>
          <div className="brand-copy">
            <strong>A-SH Store</strong>
            <span>Global wholesale store</span>
          </div>
        </Link>

        <form className="header-search-form" onSubmit={handleSearchSubmit}>
          <Link className="header-search-category" to="/products">
            Store directory
          </Link>
          <input
            className="header-search-input"
            type="search"
            placeholder="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="header-search-submit" type="submit">
            Search
          </button>
        </form>

        <div className="header-main-actions">
          <Link className="header-action-link" to="/products?ordering=-created_at">
            <strong>New</strong>
            <span>Arrivals</span>
          </Link>

          <Link className="header-action-link" to="/cart">
            <strong>Cart</strong>
            <span>{cart.total_items || 0} items</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link className="header-action-link account-link" to="/profile">
                <strong>{user?.first_name || "Account"}</strong>
                <span>{user?.email || "Profile"}</span>
              </Link>
              <button className="header-logout-button" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <div className="auth-actions">
              <Link className="text-link" to="/login">
                Sign in
              </Link>
              <Button onClick={() => navigate("/register")}>Join free</Button>
            </div>
          )}

          <button className="menu-button" type="button" onClick={() => setMobileOpen((open) => !open)}>
            Menu
          </button>
        </div>
      </div>

      <div className="header-nav-strip">
        <div className="container header-nav-row">
          <Link className="departments-trigger" to="/products">
            All category
          </Link>

          <nav className={`nav-links ${mobileOpen ? "open" : ""}`}>
            {publicLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {link.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/orders">Orders</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                <button className="mobile-nav-action" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="mobile-nav-action" to="/login">
                  Sign in
                </Link>
                <Link className="mobile-nav-action" to="/register">
                  Join free
                </Link>
              </>
            )}

            {user?.is_staff ? (
              <a className="admin-link" href={`${BACKEND_BASE_URL}/admin/`} target="_blank" rel="noreferrer">
                Admin
              </a>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
