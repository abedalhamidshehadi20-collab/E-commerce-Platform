import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import Button from "../components/Button";
import Input from "../components/Input";
import contactApi from "../api/contactApi";
import useDocumentTitle from "../hooks/useDocumentTitle";

const contactHighlights = ["Admin-routed inbox", "Order and product support", "Response within 1 business day"];

const contactRoutes = [
  {
    title: "Orders and delivery",
    description: "Shipment questions, order updates, replacements, and post-purchase support.",
  },
  {
    title: "Catalog and sourcing",
    description: "Product details, availability, bulk requests, and supplier coordination.",
  },
  {
    title: "Operations and partnerships",
    description: "Store operations, collaborations, integrations, and business inquiries.",
  },
];

const contactStandards = [
  { label: "Coverage", value: "Sales, support, and operations" },
  { label: "Routing", value: "Sent directly to the admin dashboard" },
  { label: "Replies", value: "Usually within one business day" },
];

export default function ContactPage() {
  useDocumentTitle("Contact");
  const { user } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        name: current.name || user.full_name || "",
        email: current.email || user.email || "",
      }));
    }
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await contactApi.sendMessage(form);
      setSuccess("Thanks for reaching out. Our team will respond shortly.");
      setForm((current) => ({ ...current, subject: "", message: "" }));
    } catch {
      setError("Unable to send your message right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-page section">
      <div className="container contact-page-shell">
        <div className="contact-hero-panel">
          <div className="contact-copy">
            <span className="eyebrow">Contact</span>
            <h1>Questions about orders, products, or operations?</h1>
            <p>
              Reach the right team with one message. We route requests directly into the admin
              dashboard so support, sourcing, and operations can respond faster.
            </p>
            <div className="contact-highlight-row">
              {contactHighlights.map((item) => (
                <span key={item} className="contact-highlight-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="contact-hero-summary">
            {contactStandards.map((item) => (
              <div key={item.label} className="contact-hero-summary-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="contact-layout">
          <div className="contact-info-column">
            <div className="contact-note-card contact-panel">
              <div className="contact-panel-header-block">
                <span className="contact-panel-kicker">Support lanes</span>
                <h2>What we can help with</h2>
              </div>
              <div className="contact-route-list">
                {contactRoutes.map((route) => (
                  <article key={route.title} className="contact-route-card">
                    <strong>{route.title}</strong>
                    <p>{route.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="contact-info-grid">
              <div className="contact-panel">
                <span className="contact-panel-kicker">Best for</span>
                <h3>Popular request topics</h3>
                <div className="contact-topic-list">
                  <span>Order issues</span>
                  <span>Product information</span>
                  <span>Inventory checks</span>
                  <span>Bulk sourcing</span>
                  <span>Partnerships</span>
                  <span>Platform support</span>
                </div>
              </div>

              <div className="contact-panel">
                <span className="contact-panel-kicker">Service standards</span>
                <h3>How requests are handled</h3>
                <div className="contact-standard-list">
                  {contactStandards.map((item) => (
                    <div key={item.label} className="contact-standard-item">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <form className="form-card contact-form-card" onSubmit={handleSubmit}>
            <div className="contact-form-header">
              <span className="contact-panel-kicker">Send a message</span>
              <h2>Tell us what you need</h2>
              <p>
                Share a few details and we will route your request to the right team without
                losing context.
              </p>
            </div>

            <div className="field-row">
              <Input
                label="Name"
                placeholder="Your full name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </div>

            <Input
              label="Subject"
              placeholder="How can we help?"
              value={form.subject}
              onChange={(event) =>
                setForm((current) => ({ ...current, subject: event.target.value }))
              }
              required
            />
            <Input
              as="textarea"
              rows="7"
              label="Message"
              placeholder="Add the details that will help our team respond faster."
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({ ...current, message: event.target.value }))
              }
              required
            />
            {error ? <p className="contact-status contact-status-error">{error}</p> : null}
            {success ? <p className="contact-status contact-status-success">{success}</p> : null}
            <div className="contact-form-actions">
              <Button type="submit" loading={loading} className="contact-submit-button">
                Send message
              </Button>
              <span className="contact-form-note">Usually answered within one business day.</span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
