import { Link } from "react-router-dom";

const footerGroups = [
  {
    title: "Company",
    links: [
      { label: "About", to: "/contact" },
      { label: "Stores", to: "/products" },
      { label: "Careers", to: "/contact" },
      { label: "Blogs", to: "/contact" },
    ],
  },
  {
    title: "Buyers",
    links: [
      { label: "My orders", to: "/orders" },
      { label: "Wishlist", to: "/products" },
      { label: "Register", to: "/register" },
      { label: "Profile", to: "/profile" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact us", to: "/contact" },
      { label: "Support", to: "/contact" },
      { label: "Documentation", to: "/contact" },
      { label: "Account", to: "/profile" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "Sell on platform", to: "/contact" },
      { label: "Source supplier", to: "/contact" },
      { label: "Products", to: "/products" },
      { label: "Promotions", to: "/products" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4>{group.title}</h4>
              {group.links.map((link) => (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="footer-bottom-row">
          <p>Copyright 2026 Brandname. All rights reserved.</p>
          <p>Language: English</p>
        </div>
      </div>
    </footer>
  );
}
