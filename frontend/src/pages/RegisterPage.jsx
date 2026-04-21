import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "../components/Button";
import Input from "../components/Input";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { registerUser } from "../store/slices/authSlice";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  password: "",
  confirm_password: "",
};

export default function RegisterPage() {
  useDocumentTitle("Register");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState(initialForm);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLocalError("");
      await dispatch(registerUser(form)).unwrap();
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setLocalError(requestError || "Unable to create account.");
    }
  };

  return (
    <section className="container section narrow">
      <div className="auth-card">
        <span className="eyebrow">Create account</span>
        <h1>Start shopping and tracking orders with a secure profile.</h1>
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <Input
              label="First name"
              value={form.first_name}
              onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
              required
            />
            <Input
              label="Last name"
              value={form.last_name}
              onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Input
            label="Phone number"
            value={form.phone_number}
            onChange={(event) => setForm((current) => ({ ...current, phone_number: event.target.value }))}
          />
          <div className="field-row">
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              value={form.confirm_password}
              onChange={(event) =>
                setForm((current) => ({ ...current, confirm_password: event.target.value }))
              }
              required
            />
          </div>
          {error || localError ? <p className="page-error">{localError || error}</p> : null}
          <Button type="submit" className="stretch" loading={loading}>
            Create account
          </Button>
        </form>
        <p className="auth-footnote">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
}
