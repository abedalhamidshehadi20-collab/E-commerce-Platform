import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "./Button";
import { BACKEND_BASE_URL } from "../api/apiClient";
import { logout } from "../store/slices/authSlice";
import { clearCartState } from "../store/slices/cartSlice";
import {
  clearWishlistState,
  selectWishlistCount,
} from "../store/slices/wishlistSlice";

const publicLinks = [
  { label: "Products", to: "/products" },
  { label: "New arrivals", to: "/products?ordering=-created_at" },
  { label: "Contact", to: "/contact" },
];

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6.5 18.25a5.5 5.5 0 0 1 11 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChevronIcon({ open = false }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={open ? "open" : ""}
    >
      <path
        d="M5.25 7.75 10 12.5l4.75-4.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 6H6.75A1.75 1.75 0 0 0 5 7.75v8.5C5 17.22 5.78 18 6.75 18H10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M13 8.25 16.75 12 13 15.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9.75 12h7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function getDisplayName(user) {
  const fullName = String(user?.full_name || "").trim();
  if (fullName) {
    return fullName;
  }

  const firstName = String(user?.first_name || "").trim();
  if (firstName) {
    return firstName;
  }

  const username = String(user?.username || "").trim();
  if (username) {
    return username;
  }

  const emailName = String(user?.email || "").split("@")[0];
  return emailName || "Account";
}

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const accountMenuRef = useRef(null);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart.cart);
  const wishlistCount = useSelector(selectWishlistCount);
  const displayName = getDisplayName(user);

  useEffect(() => {
    setMobileOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!accountMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  const handleLogout = () => {
    setAccountMenuOpen(false);
    dispatch(logout());
    dispatch(clearCartState());
    dispatch(clearWishlistState());
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

          <Link className="header-action-link wishlist-header-link" to="/wishlist">
            <strong>Wishlist</strong>
            <span>{wishlistCount} saved</span>
          </Link>

          {isAuthenticated ? (
            <div className="header-account-menu" ref={accountMenuRef}>
              <button
                className="header-account-trigger"
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                aria-label="Open account menu"
              >
                <span className="header-account-avatar">
                  <AccountIcon />
                </span>
                <span className="header-account-copy">
                  <strong>{displayName}</strong>
                  <span>{user?.email || "Account"}</span>
                </span>
                <span className="header-account-chevron">
                  <ChevronIcon open={accountMenuOpen} />
                </span>
              </button>

              {accountMenuOpen ? (
                <div className="header-account-dropdown" role="menu" aria-label="Account">
                  <div className="header-account-summary">
                    <strong>{displayName}</strong>
                    <span>{user?.email || "Account"}</span>
                  </div>

                  <Link
                    className="header-account-menu-item active"
                    to="/dashboard"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    <DashboardIcon />
                    <span>My Dashboard</span>
                  </Link>

                  <button
                    className="header-account-menu-item danger"
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogoutIcon />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
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

            <NavLink to="/wishlist">Wishlist</NavLink>

            {isAuthenticated ? (
              <>
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
