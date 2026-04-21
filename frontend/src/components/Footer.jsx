import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>Northstar Commerce</h3>
          <p>
            A calm, dependable shopping experience built for modern retail teams and
            customers who value clarity.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/products">Products</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/orders">Orders</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/cart">Cart</Link>
        </div>
      </div>
    </footer>
  );
}
