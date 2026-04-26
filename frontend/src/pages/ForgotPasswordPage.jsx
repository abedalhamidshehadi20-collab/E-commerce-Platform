import { useState } from "react";
import { Link } from "react-router-dom";

import authApi from "../api/authApi";
import { getApiErrorMessage } from "../api/apiClient";
import Button from "../components/Button";
import Input from "../components/Input";
import useDocumentTitle from "../hooks/useDocumentTitle";

function getFormError(error) {
  return (
    error?.response?.data?.email?.[0] ||
    error?.response?.data?.message ||
    getApiErrorMessage(error)
  );
}

export default function ForgotPasswordPage() {
  useDocumentTitle("Forgot Password");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const response = await authApi.forgotPassword({ email });
      setSuccess(
        response.data?.message ||
          "If an account with that email exists, a password reset link has been sent."
      );
    } catch (requestError) {
      setError(getFormError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container section narrow">
      <div className="auth-card">
        <span className="eyebrow">Account recovery</span>
        <h1>Reset your password securely.</h1>
        <p className="auth-supporting-copy">
          Enter the email address linked to your account and we will send you a reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {error ? <p className="page-error">{error}</p> : null}
          {success ? <p className="page-success">{success}</p> : null}
          <Button type="submit" className="stretch" loading={loading}>
            Send reset link
          </Button>
        </form>

        <p className="auth-footnote">
          Back to <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
}
