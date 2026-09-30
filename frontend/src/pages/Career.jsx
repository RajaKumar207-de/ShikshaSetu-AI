
import { useState } from "react";
import axios from "axios";

function Career() {
  const [selectedInterest, setSelectedInterest] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");

  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const careerPaths = [
    {
      icon: "💻",
      title: "Software Developer",
      description:
        "Build websites, applications and software products.",
      skills: ["Programming", "DSA", "Web Development"],
      demand: "High Demand",
    },
    {
      icon: "🤖",
      title: "AI & Data Science",
      description:
        "Work with Artificial Intelligence, data and machine learning.",
      skills: ["Python", "AI", "Machine Learning"],
      demand: "Growing Fast",
    },
    {
      icon: "🎨",
      title: "UI/UX Designer",
      description:
        "Design simple, useful and beautiful digital experiences.",
      skills: ["Figma", "Design", "User Research"],
      demand: "Creative Career",
    },
    {
      icon: "📊",
      title: "Data Analyst",
      description:
        "Turn data into useful insights for organizations.",
      skills: ["Excel", "SQL", "Data Analysis"],
      demand: "High Demand",
    },
  ];

  const handleExplore = async () => {
    if (!selectedInterest || !selectedGoal) {
      alert("Please select your interest and career goal.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setRoadmap(null);

      const response = await axios.post(
        "http://localhost:5000/api/ai/career",
        {
          interest: selectedInterest,
          goal: selectedGoal,
        }
      );

      setRoadmap(response.data.roadmap);

    } catch (error) {
      console.error("Career AI Error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to generate career roadmap. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="career-page">

      {/* ================= HERO ================= */}

      <section className="career-hero">

        <div className="career-hero-content">

          <span className="career-badge">
            🎯 AI-POWERED CAREER GUIDANCE
          </span>

          <h1>
            Discover Your
            <span> Career Path.</span>
          </h1>

          <p>
            Confused about your future? ShikshaSetu helps you
            discover suitable career options, required skills
            and a clear roadmap to reach your goal.
          </p>

          <div className="career-hero-actions">

            <a
              href="#career-navigator"
              className="career-primary-btn"
            >
              🚀 Explore My Career
            </a>

            <a
              href="#career-paths"
              className="career-secondary-btn"
            >
              View Career Paths →
            </a>

          </div>

          <div className="career-mini-stats">

            <div>
              <strong>50+</strong>
              <span>Career Paths</span>
            </div>

            <div>
              <strong>100+</strong>
              <span>Skills</span>
            </div>

            <div>
              <strong>AI</strong>
              <span>Guidance</span>
            </div>

          </div>

        </div>


        <div className="career-hero-visual">

          <div className="career-orbit career-orbit-one">
            <span>💻</span>
          </div>

          <div className="career-orbit career-orbit-two">
            <span>📊</span>
          </div>

          <div className="career-main-icon">
            🎯
          </div>

          <div className="career-floating-card career-float-one">

            <span>🧠</span>

            <div>
              <strong>AI Guidance</strong>
              <small>Personalized for you</small>
            </div>

          </div>

          <div className="career-floating-card career-float-two">

            <span>🛣️</span>

            <div>
              <strong>Career Roadmap</strong>
              <small>Step-by-step journey</small>
            </div>

          </div>

        </div>

      </section>


      {/* ================= CAREER NAVIGATOR ================= */}

      <section
        className="career-navigator-section"
        id="career-navigator"
      >

        <div className="career-navigator-header">

          <span className="career-section-badge">
            ✨ PERSONALIZED DISCOVERY
          </span>

          <h2>
            Find the Career That
            <span> Fits You</span>
          </h2>

          <p>
            Tell us a little about yourself and discover
            career options that match your interests.
          </p>

        </div>


        <div className="career-navigator-card">

          {/* INTEREST */}

          <div className="career-question">

            <div className="career-question-number">
              01
            </div>

            <div>

              <h3>
                What are you interested in?
              </h3>

              <p>
                Choose the area you enjoy learning about.
              </p>

            </div>

          </div>


          <div className="career-interest-grid">

            {[
              ["💻", "Technology"],
              ["🤖", "Artificial Intelligence"],
              ["📊", "Data & Analytics"],
              ["🎨", "Design & Creativity"],
              ["🔬", "Science"],
              ["💼", "Business"],
            ].map(([icon, title]) => (

              <button
                key={title}
                className={`career-interest-option ${
                  selectedInterest === title
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedInterest(title)
                }
              >

                <span>{icon}</span>

                <strong>{title}</strong>

              </button>

            ))}

          </div>


          {/* GOAL */}

          <div className="career-question">

            <div className="career-question-number">
              02
            </div>

            <div>

              <h3>
                What is your current goal?
              </h3>

              <p>
                Select what you want to achieve.
              </p>

            </div>

          </div>


          <div className="career-goal-grid">

            {[
              ["💼", "Get a Job"],
              ["🎓", "Higher Studies"],
              ["🚀", "Start a Career"],
              ["🏛️", "Government Job"],
            ].map(([icon, title]) => (

              <button
                key={title}
                className={`career-goal-option ${
                  selectedGoal === title
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedGoal(title)
                }
              >

                <span>{icon}</span>

                <strong>{title}</strong>

              </button>

            ))}

          </div>


          {/* GENERATE */}

          <button
            className="career-generate-btn"
            onClick={handleExplore}
            disabled={loading}
          >

            {loading
              ? "🤖 AI is Creating Your Roadmap..."
              : "✨ Generate My Career Roadmap"}

          </button>

        </div>


        {/* ================= LOADING ================= */}

        {loading && (

          <div className="career-ai-loading">

            <div className="career-ai-loading-icon">
              🤖
            </div>

            <h3>
              Creating your personalized career roadmap...
            </h3>

            <p>
              ShikshaSetu AI is analyzing your
              interest and career goal.
            </p>

          </div>

        )}


        {/* ================= ERROR ================= */}

        {error && (

          <div className="career-ai-error">

            <span>⚠️</span>

            <div>

              <h3>
                Something went wrong
              </h3>

              <p>
                {error}
              </p>

            </div>

          </div>

        )}


        {/* ================= AI RESULT ================= */}

        {roadmap && !loading && (

          <div className="career-ai-result">

            {/* RESULT HEADER */}

            <div className="career-ai-result-header">

              <div className="career-ai-result-icon">
                🤖
              </div>

              <div>

                <span>
                  AI CAREER RECOMMENDATION
                </span>

                <h2>
                  Your Personalized Career Roadmap
                </h2>

              </div>

            </div>


            {/* SELECTED INFORMATION */}

            <div className="career-ai-result-details">

              <div>

                <span>
                  Your Interest
                </span>

                <strong>
                  {selectedInterest}
                </strong>

              </div>

              <div>

                <span>
                  Your Goal
                </span>

                <strong>
                  {selectedGoal}
                </strong>

              </div>

            </div>


            {/* RECOMMENDED CAREER */}

            <div className="career-ai-recommended">

              <div className="career-ai-section-icon">
                🎯
              </div>

              <div>

                <span>
                  RECOMMENDED CAREER
                </span>

                <h3>
                  {roadmap.recommendedCareer}
                </h3>

                <p>
                  {roadmap.whyThisCareer}
                </p>

              </div>

            </div>


            {/* SKILLS */}

            <div className="career-ai-section">

              <div className="career-ai-section-heading">

                <span className="career-ai-section-icon">
                  🧠
                </span>

                <div>

                  <span>
                    SKILLS TO LEARN
                  </span>

                  <h3>
                    Build Your Skill Set
                  </h3>

                </div>

              </div>


              <div className="career-ai-skills">

                {roadmap.skills?.map((skill, index) => (

                  <div
                    className="career-ai-skill"
                    key={index}
                  >

                    <span>
                      ✓
                    </span>

                    {skill}

                  </div>

                ))}

              </div>

            </div>


            {/* ROADMAP */}

            <div className="career-ai-section">

              <div className="career-ai-section-heading">

                <span className="career-ai-section-icon">
                  🛣️
                </span>

                <div>

                  <span>
                    STEP-BY-STEP ROADMAP
                  </span>

                  <h3>
                    Your Learning Journey
                  </h3>

                </div>

              </div>


              <div className="career-ai-roadmap">

                {roadmap.roadmap?.map((item, index) => (

                  <div
                    className="career-ai-roadmap-item"
                    key={index}
                  >

                    <div className="career-ai-roadmap-number">
                      {item.step}
                    </div>

                    <div>

                      <h4>
                        {item.title}
                      </h4>

                      <p>
                        {item.description}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            </div>


            {/* PROJECTS + JOB PREPARATION */}

            <div className="career-ai-two-column">

              <div className="career-ai-section">

                <div className="career-ai-section-heading">

                  <span className="career-ai-section-icon">
                    🛠️
                  </span>

                  <div>

                    <span>
                      PROJECTS
                    </span>

                    <h3>
                      Build & Practice
                    </h3>

                  </div>

                </div>


                <ul className="career-ai-list">

                  {roadmap.projects?.map(
                    (project, index) => (

                      <li key={index}>
                        {project}
                      </li>

                    )
                  )}

                </ul>

              </div>


              <div className="career-ai-section">

                <div className="career-ai-section-heading">

                  <span className="career-ai-section-icon">
                    💼
                  </span>

                  <div>

                    <span>
                      JOB PREPARATION
                    </span>

                    <h3>
                      Prepare for Opportunities
                    </h3>

                  </div>

                </div>


                <ul className="career-ai-list">

                  {roadmap.jobPreparation?.map(
                    (item, index) => (

                      <li key={index}>
                        {item}
                      </li>

                    )
                  )}

                </ul>

              </div>

            </div>


            {/* HIGHER STUDIES */}

            <div className="career-ai-section">

              <div className="career-ai-section-heading">

                <span className="career-ai-section-icon">
                  🎓
                </span>

                <div>

                  <span>
                    HIGHER EDUCATION
                  </span>

                  <h3>
                    Continue Your Education
                  </h3>

                </div>

              </div>


              <div className="career-ai-list-grid">

                {roadmap.higherStudies?.map(
                  (option, index) => (

                    <div
                      className="career-ai-list-card"
                      key={index}
                    >
                      🎓 {option}
                    </div>

                  )
                )}

              </div>

            </div>


            {/* NEXT STEPS */}

            <div className="career-ai-next">

              <div>

                <span>
                  🚀 YOUR NEXT STEPS
                </span>

                <h3>
                  Start Building Your Future
                </h3>

              </div>


              <div className="career-ai-next-list">

                {roadmap.nextSteps?.map(
                  (step, index) => (

                    <div key={index}>

                      <strong>
                        {index + 1}
                      </strong>

                      <span>
                        {step}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        )}

      </section>


      {/* ================= CAREER PATHS ================= */}

      <section
        className="career-paths-section"
        id="career-paths"
      >

        <div className="career-section-heading">

          <div>

            <span>
              EXPLORE POSSIBILITIES
            </span>

            <h2>
              Popular Career
              <span> Paths</span>
            </h2>

          </div>

          <p>
            Explore different career options and understand
            the skills you need to build your future.
          </p>

        </div>


        <div className="career-path-grid">

          {careerPaths.map((career) => (

            <div
              className="career-path-card"
              key={career.title}
            >

              <div className="career-path-top">

                <div className="career-path-icon">
                  {career.icon}
                </div>

                <span className="career-demand">
                  {career.demand}
                </span>

              </div>

              <h3>
                {career.title}
              </h3>

              <p>
                {career.description}
              </p>

              <div className="career-skill-label">
                <span>
                  Required Skills
                </span>
              </div>

              <div className="career-skill-tags">

                {career.skills.map((skill) => (

                  <span key={skill}>
                    {skill}
                  </span>

                ))}

              </div>

              <button className="career-view-btn">
                Explore Career →
              </button>

            </div>

          ))}

        </div>

      </section>


      {/* ================= ROADMAP ================= */}

      <section className="career-roadmap-section">

        <div className="career-roadmap-content">

          <span className="career-section-badge">
            🛣️ YOUR JOURNEY
          </span>

          <h2>
            From Learning to
            <span> Your Dream Career</span>
          </h2>

          <p>
            ShikshaSetu helps students understand what to learn,
            what skills to build and what steps to take next.
          </p>

          <div className="career-roadmap">

            <div className="career-roadmap-step">

              <div className="career-step-number">
                01
              </div>

              <div>

                <h3>
                  Discover
                </h3>

                <p>
                  Understand your interests and strengths.
                </p>

              </div>

            </div>

            <div className="career-roadmap-line"></div>

            <div className="career-roadmap-step">

              <div className="career-step-number">
                02
              </div>

              <div>

                <h3>
                  Learn
                </h3>

                <p>
                  Build the skills required for your career.
                </p>

              </div>

            </div>

            <div className="career-roadmap-line"></div>

            <div className="career-roadmap-step">

              <div className="career-step-number">
                03
              </div>

              <div>

                <h3>
                  Practice
                </h3>

                <p>
                  Work on projects and real-world problems.
                </p>

              </div>

            </div>

            <div className="career-roadmap-line"></div>

            <div className="career-roadmap-step">

              <div className="career-step-number">
                04
              </div>

              <div>

                <h3>
                  Grow
                </h3>

                <p>
                  Apply for internships, jobs and opportunities.
                </p>

              </div>

            </div>

          </div>

        </div>


        <div className="career-roadmap-visual">

          <div className="career-roadmap-circle">

            <div className="career-roadmap-center">
              🚀
              <span>
                Your Future
              </span>
            </div>

            <div className="career-roadmap-bubble bubble-one">
              📚
            </div>

            <div className="career-roadmap-bubble bubble-two">
              🧠
            </div>

            <div className="career-roadmap-bubble bubble-three">
              💼
            </div>

            <div className="career-roadmap-bubble bubble-four">
              🎯
            </div>

          </div>

        </div>

      </section>


      {/* ================= WHY SHIKSHASETU ================= */}

      <section className="career-benefits-section">

        <div className="career-benefits-header">

          <span>
            WHY SHIKSHASETU?
          </span>

          <h2>
            Career guidance made
            <span> simple.</span>
          </h2>

          <p>
            Every student deserves access to clear career
            information — no matter where they come from.
          </p>

        </div>


        <div className="career-benefits-grid">

          <div className="career-benefit-card">

            <div>
              🤖
            </div>

            <h3>
              AI-Powered Guidance
            </h3>

            <p>
              Get personalized career suggestions based
              on your interests and goals.
            </p>

          </div>


          <div className="career-benefit-card">

            <div>
              🗣️
            </div>

            <h3>
              Simple Language
            </h3>

            <p>
              Understand career options without complicated
              technical language.
            </p>

          </div>


          <div className="career-benefit-card">

            <div>
              📱
            </div>

            <h3>
              Accessible Anywhere
            </h3>

            <p>
              Learn and explore career opportunities even
              with limited connectivity.
            </p>

          </div>


          <div className="career-benefit-card">

            <div>
              🤝
            </div>

            <h3>
              Mentor Support
            </h3>

            <p>
              Connect with mentors when you need
              personalized guidance.
            </p>

          </div>

        </div>

      </section>


      {/* ================= FINAL CTA ================= */}

      <section className="career-final-section">

        <div className="career-final-icon">
          🌟
        </div>

        <span>
          YOUR FUTURE STARTS TODAY
        </span>

        <h2>
          Don't just choose a career.
          <br />

          <strong>
            Build your future.
          </strong>

        </h2>

        <p>
          Explore. Learn. Practice. Grow.
          Let ShikshaSetu guide your journey.
        </p>

        <a
          href="#career-navigator"
          className="career-final-btn"
        >
          🚀 Start Your Career Journey
        </a>

      </section>

    </div>
  );
}

export default Career;

