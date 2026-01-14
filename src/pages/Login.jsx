import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./master.css";
import { useAuth } from "../components/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

function Login() {
  const navigate = useNavigate();
  const { login, authLoading, authError } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    if (!form.email || !form.password) {
      setLocalError("Email and password are required.");
      return;
    }
    try {
      const email = form.email.trim().toLowerCase();
      const password = form.password.trim();
      await login(email, password, form.remember);
      navigate("/admin");
    } catch (err) {
      setLocalError(err.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <p className="login-eyebrow">ERP Access</p>
          <h1>Sign in</h1>
          <p className="login-subtitle">Authenticate to load your role-based workspace.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </label>
          <label className="login-password-row">
            Password
            <div className="login-password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <button
                type="button"
                className="login-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </label>

          <div className="login-aux">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm((prev) => ({ ...prev, remember: e.target.checked }))}
              />
              Remember me
            </label>
            <button type="button" className="login-link">Forgot password?</button>
          </div>

          {(localError || authError) && <p className="customers-error">{localError || authError}</p>}

          <button type="submit" className="login-button" disabled={authLoading}>
            {authLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
