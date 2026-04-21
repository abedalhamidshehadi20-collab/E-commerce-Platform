import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import Button from "../components/Button";
import Input from "../components/Input";
import contactApi from "../api/contactApi";
import useDocumentTitle from "../hooks/useDocumentTitle";

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
    <section className="container section">
      <div className="contact-layout">
        <div className="contact-copy">
          <span className="eyebrow">Contact</span>
          <h1>Questions about orders, products, or operations?</h1>
          <p>
            Send a message and the support team will receive it directly inside the admin
            dashboard.
          </p>
          <div className="contact-note-card">
            <strong>What we can help with</strong>
            <span>Order issues, product information, inventory, partnerships, and support.</span>
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <Input
            label="Name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Input
            label="Subject"
            value={form.subject}
            onChange={(event) =>
              setForm((current) => ({ ...current, subject: event.target.value }))
            }
            required
          />
          <Input
            as="textarea"
            rows="6"
            label="Message"
            value={form.message}
            onChange={(event) =>
              setForm((current) => ({ ...current, message: event.target.value }))
            }
            required
          />
          {error ? <p className="page-error">{error}</p> : null}
          {success ? <p className="page-success">{success}</p> : null}
          <Button type="submit" loading={loading}>
            Send message
          </Button>
        </form>
      </div>
    </section>
  );
}
