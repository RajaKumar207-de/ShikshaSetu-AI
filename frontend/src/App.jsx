import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AITutor from "./pages/AITutor";
import Learning from "./pages/Learning";
import Lesson from "./pages/Lesson";
import Mentors from "./pages/Mentors";
import Scholarships from "./pages/Scholarships";
import Career from "./pages/Career";
import Progress from "./pages/Progress";

// ======================================================
// NAVBAR
// ======================================================

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem("user");

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("User load failed:", error);
        setUser(null);
      }
    };

    loadUser();

    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const isLoggedIn = Boolean(
    localStorage.getItem("token")
  );

  const closeMenus = () => {
    setMobileOpen(false);
    setProfileOpen(false);
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setProfileOpen(false);
    setMobileOpen(false);

    navigate("/");
  };

  const getInitials = () => {
    if (!user?.name) return "U";

    return (
      user.name
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U"
    );
  };

  const navItems = [
    {
      label: "Home",
      path: "/",
      icon: "🏠",
    },
    {
      label: "Learning",
      path: "/learning",
      icon: "📚",
    },
    {
      label: "AI Tutor",
      path: "/ai-tutor",
      icon: "🤖",
      badge: "AI",
    },
    {
      label: "Mentors",
      path: "/mentors",
      icon: "👨‍🏫",
    },
    {
      label: "Scholarships",
      path: "/scholarships",
      icon: "🎓",
    },
    {
      label: "Career",
      path: "/career",
      icon: "💼",
    },
    {
      label: "Progress",
      path: "/progress",
      icon: "📊",
    },
  ];

  return (
    <>
      <style>{`
        .ss-navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100%;
          background: rgba(255,255,255,0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid #e8ecf2;
        }

        .ss-navbar-inner {
          max-width: 1360px;
          height: 76px;
          margin: 0 auto;
          padding: 0 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .ss-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          text-decoration: none;
          min-width: max-content;
        }

        .ss-logo-image {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          object-fit: cover;
          box-shadow: 0 9px 22px rgba(45,63,159,0.18);
        }

        .ss-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .ss-brand-title {
          color: #11162b;
          font-size: 17px;
          font-weight: 850;
        }

        .ss-brand-subtitle {
          margin-top: 5px;
          color: #98a2b3;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .ss-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 5px;
          border: 1px solid #edf0f5;
          border-radius: 17px;
          background: #f8fafc;
        }

        .ss-nav-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 11px;
          border-radius: 11px;
          text-decoration: none;
          color: #667085;
          font-size: 13px;
          font-weight: 650;
          white-space: nowrap;
          transition: 0.2s ease;
        }

        .ss-nav-link:hover {
          color: #11162b;
          background: #ffffff;
          transform: translateY(-1px);
        }

        .ss-nav-link.active {
          color: #11162b;
          background: #ffffff;
          box-shadow: 0 5px 17px rgba(16,24,40,0.07);
        }

        .ss-nav-link.active::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -6px;
          transform: translateX(-50%);
          width: 18px;
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(90deg,#2d3f9f,#6878ff);
        }

        .ss-ai-badge {
          padding: 3px 5px;
          border-radius: 5px;
          background: linear-gradient(135deg,#6d5dfc,#3b82f6);
          color: #fff;
          font-size: 8px;
          font-weight: 800;
        }

        .ss-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ss-signin {
          padding: 10px 14px;
          border-radius: 11px;
          text-decoration: none;
          color: #344054;
          font-size: 13px;
          font-weight: 700;
        }

        .ss-signin:hover {
          background: #f2f4f7;
          color: #11162b;
        }

        .ss-signup {
          padding: 11px 17px;
          border-radius: 11px;
          text-decoration: none;
          color: #fff;
          font-size: 13px;
          font-weight: 750;
          background: linear-gradient(135deg,#11162b,#3447a8);
          box-shadow: 0 9px 19px rgba(17,22,43,0.16);
        }

        .ss-profile-wrap {
          position: relative;
        }

        .ss-profile-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 5px 8px 5px 5px;
          border: 1px solid #e4e7ec;
          border-radius: 13px;
          background: #fff;
          cursor: pointer;
        }

        .ss-avatar {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          color: #fff;
          background: linear-gradient(135deg,#11162b,#6575ff);
          font-size: 12px;
          font-weight: 800;
        }

        .ss-profile-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .ss-profile-name {
          max-width: 110px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #11162b;
          font-size: 12px;
          font-weight: 750;
        }

        .ss-profile-role {
          margin-top: 3px;
          color: #98a2b3;
          font-size: 9px;
          text-transform: capitalize;
        }

        .ss-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 240px;
          padding: 8px;
          border: 1px solid #eaecf0;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 22px 55px rgba(16,24,40,0.14);
        }

        .ss-dropdown-user {
          padding: 12px;
          margin-bottom: 7px;
          border-radius: 12px;
          background: #f8fafc;
        }

        .ss-dropdown-user-name {
          color: #11162b;
          font-size: 13px;
          font-weight: 800;
        }

        .ss-dropdown-user-email {
          margin-top: 4px;
          color: #98a2b3;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ss-dropdown-link {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 11px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: #475467;
          text-decoration: none;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          text-align: left;
        }

        .ss-dropdown-link:hover {
          background: #f5f7fa;
          color: #11162b;
        }

        .ss-dropdown-link.logout:hover {
          color: #d92d20;
          background: #fff1f0;
        }

        .ss-mobile-btn {
          display: none;
          width: 42px;
          height: 42px;
          border: 1px solid #e4e7ec;
          border-radius: 11px;
          background: #fff;
          color: #11162b;
          font-size: 20px;
          cursor: pointer;
        }

        .ss-mobile-panel {
          display: none;
        }

        .ss-offline-banner {
          width: 100%;
          padding: 10px 16px;
          text-align: center;
          background: #fff4cc;
          border-bottom: 1px solid #f1df91;
          color: #7a5b00;
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 1240px) {
          .ss-nav-link {
            padding-left: 8px;
            padding-right: 8px;
            font-size: 12px;
          }

          .ss-brand-subtitle {
            display: none;
          }
        }

        @media (max-width: 900px) {
          .ss-nav,
          .ss-right {
            display: none;
          }

          .ss-mobile-btn {
            display: block;
          }

          .ss-mobile-panel {
            display: block;
            padding: 0 18px 18px;
            border-top: 1px solid #edf0f5;
            background: #fff;
          }

          .ss-mobile-links {
            display: grid;
            gap: 7px;
            padding-top: 14px;
          }

          .ss-mobile-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 13px 14px;
            border-radius: 12px;
            background: #f8fafc;
            color: #475467;
            text-decoration: none;
            font-size: 14px;
            font-weight: 650;
          }

          .ss-mobile-link.active {
            background: #eef2ff;
            color: #2d3f9f;
          }

          .ss-mobile-link-left {
            display: flex;
            align-items: center;
            gap: 9px;
          }

          .ss-mobile-auth {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 10px;
          }

          .ss-mobile-auth a {
            padding: 12px;
            border-radius: 11px;
            text-align: center;
            text-decoration: none;
            font-size: 13px;
            font-weight: 700;
          }

          .ss-mobile-login {
            color: #11162b;
            border: 1px solid #e4e7ec;
          }

          .ss-mobile-register {
            color: #fff;
            background: #11162b;
          }
        }

        @media (max-width: 520px) {
          .ss-navbar-inner {
            height: 68px;
            padding: 0 15px;
          }

          .ss-brand-title {
            font-size: 15px;
          }

          .ss-logo-image {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>

      <header className="ss-navbar">
        <div className="ss-navbar-inner">

          <Link
            to="/"
            className="ss-brand"
            onClick={closeMenus}
          >
            <img
              src="/ShikshaSetu-pwa-512.png"
              alt="ShikshaSetu AI"
              className="ss-logo-image"
            />

            <div className="ss-brand-text">
              <span className="ss-brand-title">
                ShikshaSetu
              </span>

              <span className="ss-brand-subtitle">
                AI EDUCATION
              </span>
            </div>
          </Link>

          <nav className="ss-nav">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`ss-nav-link ${
                  isActive(item.path) ? "active" : ""
                }`}
                onClick={closeMenus}
              >
                <span>{item.icon}</span>

                <span>{item.label}</span>

                {item.badge && (
                  <span className="ss-ai-badge">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="ss-right">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="ss-signin"
                  onClick={closeMenus}
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="ss-signup"
                  onClick={closeMenus}
                >
                  Get Started
                </Link>
              </>
            ) : (
              <div className="ss-profile-wrap">

                <button
                  className="ss-profile-btn"
                  onClick={() =>
                    setProfileOpen(
                      (prev) => !prev
                    )
                  }
                >
                  <div className="ss-avatar">
                    {getInitials()}
                  </div>

                  <div className="ss-profile-info">
                    <span className="ss-profile-name">
                      {user?.name || "Student"}
                    </span>

                    <span className="ss-profile-role">
                      {user?.role || "student"}
                    </span>
                  </div>

                  <span>⌄</span>
                </button>

                {profileOpen && (
                  <div className="ss-dropdown">

                    <div className="ss-dropdown-user">
                      <div className="ss-dropdown-user-name">
                        {user?.name || "Student"}
                      </div>

                      <div className="ss-dropdown-user-email">
                        {user?.email || ""}
                      </div>
                    </div>

                    <Link
                      to="/progress"
                      className="ss-dropdown-link"
                      onClick={closeMenus}
                    >
                      📊 My Progress
                    </Link>

                    <Link
                      to="/learning"
                      className="ss-dropdown-link"
                      onClick={closeMenus}
                    >
                      📚 My Learning
                    </Link>

                    <Link
                      to="/mentors"
                      className="ss-dropdown-link"
                      onClick={closeMenus}
                    >
                      👨‍🏫 My Mentors
                    </Link>

                    <button
                      className="ss-dropdown-link logout"
                      onClick={handleLogout}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className="ss-mobile-btn"
            onClick={() =>
              setMobileOpen(
                (prev) => !prev
              )
            }
            aria-label="Toggle navigation"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileOpen && (
          <div className="ss-mobile-panel">
            <div className="ss-mobile-links">

              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenus}
                  className={`ss-mobile-link ${
                    isActive(item.path)
                      ? "active"
                      : ""
                  }`}
                >
                  <span className="ss-mobile-link-left">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>

                    {item.badge && (
                      <span className="ss-ai-badge">
                        {item.badge}
                      </span>
                    )}
                  </span>

                  <span>›</span>
                </Link>
              ))}

            </div>

            {!isLoggedIn && (
              <div className="ss-mobile-auth">

                <Link
                  to="/login"
                  onClick={closeMenus}
                  className="ss-mobile-login"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenus}
                  className="ss-mobile-register"
                >
                  Get Started
                </Link>

              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}

// ======================================================
// APP CONTENT
// ======================================================

function AppContent() {
  const [isOffline, setIsOffline] = useState(
    !navigator.onLine
  );

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
    };

    window.addEventListener(
      "offline",
      handleOffline
    );

    window.addEventListener(
      "online",
      handleOnline
    );

    return () => {
      window.removeEventListener(
        "offline",
        handleOffline
      );

      window.removeEventListener(
        "online",
        handleOnline
      );
    };
  }, []);

  return (
    <>
      {isOffline && (
        <div className="ss-offline-banner">
          📶 You are offline — Cached pages and
          downloaded lessons remain available.
        </div>
      )}

      <Navbar />

      <main>
        <Routes>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/ai-tutor"
            element={<AITutor />}
          />

          <Route
            path="/learning"
            element={<Learning />}
          />

          <Route
            path="/lesson"
            element={<Lesson />}
          />

          <Route
            path="/progress"
            element={<Progress />}
          />

          <Route
            path="/mentors"
            element={<Mentors />}
          />

          <Route
            path="/scholarships"
            element={<Scholarships />}
          />

          <Route
            path="/career"
            element={<Career />}
          />

        </Routes>
      </main>
    </>
  );
}

// ======================================================
// MAIN APP
// ======================================================

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

