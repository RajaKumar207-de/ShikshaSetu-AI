import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // INPUT CHANGE
  // =========================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // LOGIN
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        {
          email: formData.email,
          password: formData.password,
        }
      );

      console.log("Login response:", response.data);

      // =========================
      // SAVE TOKEN
      // =========================
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      // =========================
      // SAVE USER
      // =========================
      if (response.data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        console.log("User saved:", response.data.user);
      }

      // =========================
      // REDIRECT
      // =========================

      const user = response.data.user;

      if (user?.role === "admin") {
        navigate("/admin");
      } else if (user?.role === "mentor") {
        navigate("/mentor-panel");
      } else {
        navigate("/learning");
      }
    } catch (error) {
      console.error("Login failed:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Login failed. Please check your email and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        background:
          "linear-gradient(135deg, #f7f8fc 0%, #eef2ff 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#ffffff",
          padding: "35px",
          borderRadius: "20px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
        }}
      >
        {/* LOGO */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          <img
            src="/ShikshaSetu-pwa-512.png"
            alt="ShikshaSetu AI"
            style={{
              width: "75px",
              height: "75px",
              objectFit: "contain",
              marginBottom: "10px",
            }}
          />

          <h1
            style={{
              margin: "0",
              fontSize: "28px",
              color: "#11162b",
            }}
          >
            Welcome Back
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#6b7280",
            }}
          >
            Sign in to continue learning with ShikshaSetu AI
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "18px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          {/* EMAIL */}
          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>

          {/* PASSWORD */}
          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#1f2937",
              }}
            >
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "#11162b",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* REGISTER */}
        <p
          style={{
            textAlign: "center",
            marginTop: "22px",
            color: "#6b7280",
          }}
        >
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#4f46e5",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
