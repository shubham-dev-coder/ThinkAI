
import { useState } from "react";
import "./signup.css";

function Signup({ onSignupSuccess, onLoginClick }) {
  const [formData, setFormData] = useState({
    username: "",
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
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Signup failed. Please try again.");
        return;
      }

      setMessage(data.message || "Account created successfully!");

      setFormData({
        username: "",
        email: "",
        password: "",
      });

      // Open the Login page after successful signup
      onSignupSuccess?.();
    } catch (error) {
      console.error("Signup error:", error);
      setMessage("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-card">
      <div className="signup-icon">✦</div>

      <h1 className="signup-heading">Create Account</h1>

      <p className="signup-subtitle">
        Join ThinkAI and start your journey.
      </p>

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="signup-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            name="username"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            required
          />
        </div>

        <div className="signup-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
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
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <button
          className="signup-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      {message && (
        <p className="signup-message">{message}</p>
      )}

      <p className="signup-subtitle">
        Already have an account?{" "}
        <button type="button" onClick={onLoginClick}>
          Login
        </button>
      </p>
    </div>
  );
}

export default Signup;
