import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import authApi from "../api/authApi";
import { getApiErrorMessage } from "../api/apiClient";
import Button from "../components/Button";
import Input from "../components/Input";
import useDocumentTitle from "../hooks/useDocumentTitle";

const initialForm = {
  new_password: "",
  confirm_password: "",
};

function getFormError(error) {
  return (
    error?.response?.data?.new_password?.[0] ||
    error?.response?.data?.confirm_password?.[0] ||
    error?.response?.data?.message ||
    getApiErrorMessage(error)
  );
}

export default function ResetPasswordPage() {
  useDocumentTitle("Reset Password");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";
  const isLinkValid = useMemo(() => Boolean(uid && token), [uid, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.new_password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const response = await authApi.resetPassword({
        uid,
        token,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      });
      setSuccess(
        response.data?.message || "Password has been reset successfully. You can now sign in."
      );
      setForm(initialForm);
    } catch (requestError) {
      setError(getFormError(requestError));
    } finally {
      setLoading(false);
    }
  };

  if (!isLinkValid) {
    return (
      <section className="container section narrow">
        <div className="auth-card">
          <span className="eyebrow">Invalid reset link</span>
          <h1>This password reset link is missing required details.</h1>
          <p className="auth-supporting-copy">
            Request a new password reset email and use the latest link.
          </p>
          <Button className="stretch" onClick={() => navigate("/forgot-password")}>
            Request new reset link
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container section narrow">
      <div className="auth-card">
        <span className="eyebrow">Set a new password</span>
        <h1>Create a new password for your account.</h1>
        <p className="auth-supporting-copy">
          Use at least 8 characters and choose a password that you have not used before.
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            label="New password"
            type="password"
            value={form.new_password}
            onChange={(event) =>
              setForm((current) => ({ ...current, new_password: event.target.value }))
            }
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={form.confirm_password}
            onChange={(event) =>
              setForm((current) => ({ ...current, confirm_password: event.target.value }))
            }
            required
          />

          {error ? <p className="page-error">{error}</p> : null}
          {success ? <p className="page-success">{success}</p> : null}

          <Button type="submit" className="stretch" loading={loading}>
            Reset password
          </Button>
        </form>

        <p className="auth-footnote">
          Remembered your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
}
