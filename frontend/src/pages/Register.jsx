import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../config";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("English");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        {
          name,
          email,
          password,
          role: "student",
          language,
        }
      );

      console.log("Register response:", response.data);

      setMessage("Registration successful! ✅");

      // Login page par bhejo
      setTimeout(() => {
        navigate("/login");
      }, 1000);

    } catch (error) {
      console.error("Register error:", error);

      setMessage(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
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
        background: "#f5f7fb",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "#ffffff",
          padding: "35px",
          borderRadius: "20px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
            color: "#172033",
          }}
        >
          Create Account 🎓
        </h1>

        <p
          style={{
            color: "#667085",
            marginBottom: "28px",
          }}
        >
          Join ShikshaSetu and start your learning journey.
        </p>

        <form onSubmit={handleRegister}>

          {/* Name */}
          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontWeight: "600",
              }}
            >
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                border: "1px solid #d0d5dd",
                fontSize: "15px",
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontWeight: "600",
              }}
            >
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                border: "1px solid #d0d5dd",
                fontSize: "15px",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontWeight: "600",
              }}
            >
              Password
            </label>

            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                border: "1px solid #d0d5dd",
                fontSize: "15px",
              }}
            />
          </div>

          {/* Language */}
          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontWeight: "600",
              }}
            >
              Preferred Language
            </label>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                border: "1px solid #d0d5dd",
                fontSize: "15px",
                background: "#ffffff",
              }}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
              <option value="Bengali">Bengali</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
              <option value="Gujarati">Gujarati</option>
              <option value="Punjabi">Punjabi</option>
            </select>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: "#3157d5",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "18px",
              padding: "12px",
              borderRadius: "8px",
              background: "#f2f4f7",
              color: "#344054",
            }}
          >
            {message}
          </p>
        )}

        <p
          style={{
            marginTop: "22px",
            textAlign: "center",
            color: "#667085",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#3157d5",
              fontWeight: "600",
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;