import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">

      {/* ================= HERO ================= */}
      <section className="rural-hero">

        <div className="hero-overlay"></div>

        <div className="hero-content">

          {/* LOGO */}
          <div className="home-logo">
            <img
              src="/ShikshaSetu-pwa-512.png"
              alt="ShikshaSetu AI Logo"
            />

            <span>ShikshaSetu AI</span>
          </div>

          <div className="hackathon-badge">
            🏆 AI FOR INCLUSIVE EDUCATION
          </div>

          <h1>
            Education should reach
            <span> every village.</span>
          </h1>

          <p>
            ShikshaSetu AI is an inclusive digital learning platform
            designed to help rural and tribal students learn,
            ask questions and discover better opportunities.
          </p>

          <div className="hero-actions">

            <Link to="/learning" className="hero-primary">
              📚 Start Learning
            </Link>

            <Link to="/ai-tutor" className="hero-secondary">
              🤖 Ask AI Tutor
            </Link>

          </div>

          <div className="hero-mini-stats">

            <div>
              <strong>24×7</strong>
              <span>AI Support</span>
            </div>

            <div>
              <strong>🌐</strong>
              <span>Regional Language</span>
            </div>

            <div>
              <strong>📶</strong>
              <span>Low Internet</span>
            </div>

          </div>

        </div>


        {/* STUDENT CARD */}
        <div className="student-showcase">

          <div className="student-glow"></div>

          <div className="student-card">

            <div className="student-emoji">
              👩‍🎓
            </div>

            <div className="student-info">
              <span>Learning with ShikshaSetu</span>

              <h3>
                मेरी पढ़ाई, मेरा भविष्य 🚀
              </h3>

              <p>
                Learn • Ask • Grow
              </p>
            </div>

          </div>


          <div className="ai-floating-card">

            <div className="ai-icon">
              🤖
            </div>

            <div>
              <strong>AI Tutor</strong>

              <small>
                Doubt solved instantly
              </small>
            </div>

          </div>


          <div className="offline-floating-card">

            <span>📶</span>

            <div>
              <strong>Offline Learning</strong>

              <small>
                Learn with limited internet
              </small>
            </div>

          </div>

        </div>

      </section>


      {/* ================= PROBLEM ================= */}

      <section className="problem-section">

        <div className="section-title">

          <span>THE PROBLEM</span>

          <h2>
            A student’s location
            <br />
            should not decide their future.
          </h2>

          <p>
            Many students in rural and tribal areas face challenges
            in accessing quality educational resources.
          </p>

        </div>


        <div className="problem-grid">

          <div className="problem-card">

            <div>📡</div>

            <h3>
              Limited Internet
            </h3>

            <p>
              Poor connectivity makes online learning difficult.
            </p>

          </div>


          <div className="problem-card">

            <div>🗣️</div>

            <h3>
              Language Barrier
            </h3>

            <p>
              Students may understand concepts better in regional languages.
            </p>

          </div>


          <div className="problem-card">

            <div>📚</div>

            <h3>
              Limited Resources
            </h3>

            <p>
              Quality learning material is not always easily available.
            </p>

          </div>


          <div className="problem-card">

            <div>🎓</div>

            <h3>
              Career Awareness
            </h3>

            <p>
              Students may have limited information about future opportunities.
            </p>

          </div>

        </div>

      </section>


      {/* ================= SOLUTION ================= */}

      <section className="solution-section">

        <div className="solution-heading">

          <span>OUR SOLUTION</span>

          <h2>
            Meet <span>ShikshaSetu AI</span>
          </h2>

          <p>
            One platform connecting learning, AI assistance
            and opportunities for every student.
          </p>

        </div>


        <div className="solution-grid">

          <div className="solution-card big-card">

            <div className="solution-icon">
              🤖
            </div>

            <h3>
              AI Doubt Resolution
            </h3>

            <p>
              Students can ask questions using text or voice
              and receive simple explanations.
            </p>

            <Link to="/ai-tutor">
              Ask AI Tutor →
            </Link>

          </div>


          <div className="solution-card">

            <div className="solution-icon">
              📚
            </div>

            <h3>
              Offline Learning
            </h3>

            <p>
              Access lessons even with limited connectivity.
            </p>

            <Link to="/learning">
              Start Learning →
            </Link>

          </div>


          <div className="solution-card">

            <div className="solution-icon">
              🌐
            </div>

            <h3>
              Regional Languages
            </h3>

            <p>
              Learn concepts in a language students understand.
            </p>

          </div>


          <div className="solution-card">

            <div className="solution-icon">
              🎤
            </div>

            <h3>
              Voice Interaction
            </h3>

            <p>
              Speak your doubt instead of typing it.
            </p>

          </div>


          <div className="solution-card">

            <div className="solution-icon">
              🎓
            </div>

            <h3>
              Career Opportunities
            </h3>

            <p>
              Discover scholarships, careers and future paths.
            </p>

          </div>

        </div>

      </section>


      {/* ================= HACKATHON IMPACT ================= */}

      <section className="impact-banner">

        <div>

          <span>🌱 OUR MISSION</span>

          <h2>
            From a small village
            <br />
            to a bigger future.
          </h2>

          <p>
            Technology can become a bridge between
            students and opportunities.
          </p>

        </div>


        <div className="impact-quote">

          <div className="quote-icon">
            “
          </div>

          <p>
            Learn anywhere.
            Ask anything.
            Grow without limits.
          </p>

          <span>
            — ShikshaSetu AI
          </span>

        </div>

      </section>


      {/* ================= FINAL CTA ================= */}

      <section className="final-section">

        <div className="final-content">

          {/* REAL LOGO */}
          <div className="final-logo">
            <img
              src="/ShikshaSetu-pwa-512.png"
              alt="ShikshaSetu AI Logo"
            />
          </div>

          <h2>
            आपका भविष्य,
            <br />
            आपकी शिक्षा।
          </h2>

          <p>
            Your future should not depend on where you live.
          </p>

          <Link
            to="/learning"
            className="final-button"
          >
            Start Your Journey 🚀
          </Link>

        </div>

      </section>


      {/* ================= HOME LOGO CSS ================= */}

      <style>{`

        .home-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 8px 14px 8px 8px;
          border-radius: 16px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.16);
          backdrop-filter: blur(10px);
        }

        .home-logo img {
          width: 48px;
          height: 48px;
          object-fit: contain;
          border-radius: 12px;
          display: block;
        }

        .home-logo span {
          color: white;
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .final-logo {
          width: 82px;
          height: 82px;
          margin: 0 auto 20px;
          display: grid;
          place-items: center;
          border-radius: 22px;
          background: rgba(255,255,255,0.95);
          box-shadow: 0 15px 40px rgba(0,0,0,0.12);
          overflow: hidden;
        }

        .final-logo img {
          width: 68px;
          height: 68px;
          object-fit: contain;
          display: block;
        }

        @media (max-width: 600px) {

          .home-logo {
            gap: 9px;
            padding: 6px 11px 6px 6px;
            margin-bottom: 16px;
            border-radius: 13px;
          }

          .home-logo img {
            width: 40px;
            height: 40px;
            border-radius: 10px;
          }

          .home-logo span {
            font-size: 14px;
          }

          .final-logo {
            width: 70px;
            height: 70px;
            border-radius: 18px;
          }

          .final-logo img {
            width: 58px;
            height: 58px;
          }

        }

      `}</style>

    </div>
  );
}

export default Home;