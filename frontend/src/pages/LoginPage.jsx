import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Button from "../components/Button";
import Input from "../components/Input";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { loginUser } from "../store/slices/authSlice";

export default function LoginPage() {
  useDocumentTitle("Login");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [localError, setLocalError] = useState("");

  const redirectTo = location.state?.from || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLocalError("");
      await dispatch(loginUser(form)).unwrap();
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setLocalError(requestError || "Unable to sign in.");
    }
  };

  return (
    <section className="container section narrow">
      <div className="auth-card">
        <span className="eyebrow">Welcome back</span>
        <h1>Sign in to manage your orders and cart.</h1>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
          <div className="auth-helper-row">
            <Link className="auth-helper-link" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
          {error || localError ? <p className="page-error">{localError || error}</p> : null}
          <Button type="submit" className="stretch" loading={loading}>
            Sign in
          </Button>
        </form>
        <p className="auth-footnote">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  );
}
