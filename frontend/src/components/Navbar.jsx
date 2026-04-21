import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "./Button";
import { BACKEND_BASE_URL } from "../api/apiClient";
import { logout } from "../store/slices/authSlice";
import { clearCartState } from "../store/slices/cartSlice";
import { getInitials } from "../utils/formatters";

const publicLinks = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/products" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cart = useSelector((state) => state.cart.cart);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCartState());
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link className="brand-mark" to="/">
          <span className="brand-orb" />
          <div>
            <strong>Northstar</strong>
            <span>Commerce</span>
          </div>
        </Link>

        <nav className={`nav-links ${mobileOpen ? "open" : ""}`}>
          {publicLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" onClick={() => setMobileOpen(false)}>
                Dashboard
              </NavLink>
              <NavLink to="/orders" onClick={() => setMobileOpen(false)}>
                Orders
              </NavLink>
              <NavLink to="/profile" onClick={() => setMobileOpen(false)}>
                Profile
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="header-actions">
          <Link className="cart-pill" to="/cart">
            Cart
            <span>{cart.total_items || 0}</span>
          </Link>

          {isAuthenticated ? (
            <div className="user-chip">
              <span className="avatar-chip">{getInitials(user?.full_name || user?.email)}</span>
              <div className="user-chip-meta">
                <strong>{user?.first_name || "Account"}</strong>
                <span>{user?.email}</span>
              </div>
            </div>
          ) : null}

          {user?.is_staff ? (
            <a className="admin-link" href={`${BACKEND_BASE_URL}/admin/`} target="_blank" rel="noreferrer">
              Admin
            </a>
          ) : null}

          {isAuthenticated ? (
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <div className="auth-actions">
              <Link className="text-link" to="/login">
                Sign in
              </Link>
              <Button onClick={() => navigate("/register")}>Create account</Button>
            </div>
          )}

          <button className="menu-button" onClick={() => setMobileOpen((value) => !value)}>
            Menu
          </button>
        </div>
      </div>
    </header>
  );
}
