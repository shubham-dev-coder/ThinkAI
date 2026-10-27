
import { useState } from "react";
import "./signup.css";

function Login({ onLoginSuccess, onSignupClick }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      // Open ThinkAI after successful login
      onLoginSuccess?.(data.user);
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-card">
      <div className="signup-icon">✦</div>

      <h1 className="signup-heading">Welcome Back</h1>

      <p className="signup-subtitle">
        Login to continue to ThinkAI.
      </p>

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="signup-field">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </div>

        <div className="signup-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
        </div>

        <button
          className="signup-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {message && (
        <p className="signup-message">{message}</p>
      )}

      <p className="signup-subtitle">
        Don't have an account?{" "}
        <button type="button" onClick={onSignupClick}>
          Sign Up
        </button>
      </p>
    </div>
  );
}

export default Login;
