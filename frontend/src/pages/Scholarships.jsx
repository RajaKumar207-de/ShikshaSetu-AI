
import { useEffect, useState } from "react";
import axios from "axios";

function Scholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [state, setState] = useState("All India");
  const [category, setCategory] = useState("All");
  const [educationLevel, setEducationLevel] =
    useState("All");

  // Personalized scholarship states
  const [showPersonalized, setShowPersonalized] =
    useState(false);

  const [findingScholarships, setFindingScholarships] =
    useState(false);

  // ==========================================
  // FETCH SCHOLARSHIPS
  // ==========================================

  const fetchScholarships = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        "http://localhost:5000/api/scholarships/search",
        {
          params: {
            state,
            category,
            educationLevel,
          },
        }
      );

      setScholarships(
        response.data.scholarships || []
      );

      setShowPersonalized(false);
    } catch (error) {
      console.error(
        "Failed to fetch scholarships:",
        error
      );

      setError(
        "Unable to load scholarships. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FIND SCHOLARSHIPS FOR ME
  // ==========================================

  const findScholarshipsForMe = async () => {
    try {
      setFindingScholarships(true);
      setError("");

      const response = await axios.post(
        "http://localhost:5000/api/scholarships/find-for-me",
        {
          state,
          category,
          educationLevel,
        }
      );

      setScholarships(
        response.data.scholarships || []
      );

      setShowPersonalized(true);
    } catch (error) {
      console.error(
        "Failed to find personalized scholarships:",
        error
      );

      setError(
        "Unable to find scholarships. Please try again."
      );
    } finally {
      setFindingScholarships(false);
    }
  };

  // ==========================================
  // FETCH WHEN FILTER CHANGES
  // ==========================================

  useEffect(() => {
    fetchScholarships();
  }, [state, category, educationLevel]);

  return (
    <div className="scholarships-page">

      {/* ==========================================
          HERO
      ========================================== */}

      <section className="scholarship-hero">

        <div className="scholarship-hero-content">

          <span className="scholarship-badge">
            🎓 Financial Support for Students
          </span>

          <h1>
            Find the Right
            <span> Scholarship.</span>
          </h1>

          <p>
            Discover scholarships based on your
            state, category and education level.
          </p>

          <div className="scholarship-stats">

            <div>
              <strong>
                {scholarships.length}+
              </strong>

              <span>
                Scholarships
              </span>
            </div>

            <div>
              <strong>
                28+
              </strong>

              <span>
                States
              </span>
            </div>

            <div>
              <strong>
                100%
              </strong>

              <span>
                Student Focused
              </span>
            </div>

          </div>

        </div>


        <div className="scholarship-hero-visual">

          <div className="scholarship-main-icon">
            🎓
          </div>

          <div className="scholarship-floating-card scholarship-card-one">

            💰

            <div>
              <strong>
                Financial Help
              </strong>

              <span>
                Support your education
              </span>
            </div>

          </div>


          <div className="scholarship-floating-card scholarship-card-two">

            📚

            <div>
              <strong>
                Easy Discovery
              </strong>

              <span>
                Find opportunities
              </span>
            </div>

          </div>

        </div>

      </section>


      {/* ==========================================
          FILTERS
      ========================================== */}

      <section className="scholarship-filters">

        <div className="scholarship-filter-group">

          <label>
            📍 State
          </label>

          <select
            value={state}
            onChange={(e) =>
              setState(e.target.value)
            }
          >

            <option value="All India">
              All India
            </option>

            <option value="Bihar">
              Bihar
            </option>

            <option value="Chhattisgarh">
              Chhattisgarh
            </option>

            <option value="Madhya Pradesh">
              Madhya Pradesh
            </option>

            <option value="Uttar Pradesh">
              Uttar Pradesh
            </option>

            <option value="Maharashtra">
              Maharashtra
            </option>

            <option value="Rajasthan">
              Rajasthan
            </option>

            <option value="Jharkhand">
              Jharkhand
            </option>

            <option value="Odisha">
              Odisha
            </option>

            <option value="West Bengal">
              West Bengal
            </option>

          </select>

        </div>


        <div className="scholarship-filter-group">

          <label>
            👥 Category
          </label>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >

            <option value="All">
              All Categories
            </option>

            <option value="General">
              General
            </option>

            <option value="OBC">
              OBC
            </option>

            <option value="SC">
              SC
            </option>

            <option value="ST">
              ST
            </option>

            <option value="EWS">
              EWS
            </option>

            <option value="Minority">
              Minority
            </option>

          </select>

        </div>


        <div className="scholarship-filter-group">

          <label>
            🎓 Education Level
          </label>

          <select
            value={educationLevel}
            onChange={(e) =>
              setEducationLevel(e.target.value)
            }
          >

            <option value="All">
              All Levels
            </option>

            <option value="Class 10">
              Class 10
            </option>

            <option value="Class 11">
              Class 11
            </option>

            <option value="Class 12">
              Class 12
            </option>

            <option value="College">
              College
            </option>

            <option value="Undergraduate">
              Undergraduate
            </option>

            <option value="Postgraduate">
              Postgraduate
            </option>

          </select>

        </div>

      </section>


      {/* ==========================================
          PERSONALIZED SCHOLARSHIP FINDER
      ========================================== */}

      <section className="personalized-scholarship-section">

        <div className="personalized-scholarship-content">

          <div className="personalized-scholarship-icon">
            ✨
          </div>

          <div>

            <span className="personalized-badge">
              AI-POWERED DISCOVERY
            </span>

            <h2>
              Find Scholarships
              <span> for You</span>
            </h2>

            <p>
              Tell us your state, category and
              education level. ShikshaSetu will
              find matching scholarship
              opportunities for you.
            </p>

          </div>

        </div>


        <button
          className="find-scholarship-btn"
          onClick={findScholarshipsForMe}
          disabled={findingScholarships}
        >

          {findingScholarships
            ? "🔍 Finding Scholarships..."
            : "✨ Find Scholarships for Me"}

        </button>

      </section>


      {/* ==========================================
          PERSONALIZED RESULT MESSAGE
      ========================================== */}

      {showPersonalized && !loading && !error && (

        <div className="personalized-result-message">

          <span>
            ✨ Personalized Results
          </span>

          <p>
            We found{" "}
            <strong>
              {scholarships.length}
            </strong>{" "}
            scholarship
            {scholarships.length !== 1
              ? "s"
              : ""}{" "}
            matching your selected details.
          </p>

        </div>

      )}


      {/* ==========================================
          SCHOLARSHIP LIST
      ========================================== */}

      <section className="scholarship-list-section">

        <div className="scholarship-section-heading">

          <div>

            <span>
              SCHOLARSHIP OPPORTUNITIES
            </span>

            <h2>
              Scholarships for you
            </h2>

          </div>

          <p>
            Explore financial opportunities and
            continue your education journey.
          </p>

        </div>


        {/* LOADING */}

        {loading && (

          <div className="scholarship-empty">

            <div>
              ⏳
            </div>

            <h3>
              Finding scholarships...
            </h3>

            <p>
              Please wait while we search
              for opportunities.
            </p>

          </div>

        )}


        {/* ERROR */}

        {!loading && error && (

          <div className="scholarship-empty">

            <div>
              ⚠️
            </div>

            <h3>
              Something went wrong
            </h3>

            <p>
              {error}
            </p>

          </div>

        )}


        {/* NO SCHOLARSHIP */}

        {!loading &&
          !error &&
          scholarships.length === 0 && (

            <div className="scholarship-empty">

              <div>
                🔎
              </div>

              <h3>
                No scholarships found
              </h3>

              <p>
                Try changing your filters.
              </p>

            </div>

          )}


        {/* SCHOLARSHIP CARDS */}

        {!loading &&
          !error &&
          scholarships.length > 0 && (

            <div className="scholarship-grid">

              {scholarships.map(
                (scholarship) => (

                  <div
                    className="scholarship-card"
                    key={scholarship._id}
                  >

                    {/* CARD TOP */}

                    <div className="scholarship-card-top">

                      <div className="scholarship-icon">
                        🎓
                      </div>

                      <span className="scholarship-state">
                        📍 {scholarship.state}
                      </span>

                    </div>


                    {/* TITLE */}

                    <h3>
                      {scholarship.name}
                    </h3>


                    {/* PROVIDER */}

                    <p className="scholarship-provider">
                      🏛️ {scholarship.provider}
                    </p>


                    {/* DESCRIPTION */}

                    <p className="scholarship-description">
                      {scholarship.description}
                    </p>


                    {/* AMOUNT + DEADLINE */}

                    <div className="scholarship-info">

                      <div>

                        <span>
                          Scholarship Amount
                        </span>

                        <strong>
                          💰 {scholarship.amount}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Deadline
                        </span>

                        <strong>
                          📅 {scholarship.deadline}
                        </strong>

                      </div>

                    </div>


                    {/* CATEGORY TAGS */}

                    <div className="scholarship-tags">

                      {scholarship.category?.map(
                        (item) => (

                          <span key={item}>
                            {item}
                          </span>

                        )
                      )}

                    </div>


                    {/* EDUCATION LEVEL */}

                    <div className="scholarship-eligibility">

                      <strong>
                        🎓 Education Level
                      </strong>

                      <p>
                        {scholarship.educationLevel?.join(
                          ", "
                        )}
                      </p>

                    </div>


                    {/* INCOME */}

                    <div className="scholarship-eligibility">

                      <strong>
                        💳 Income Limit
                      </strong>

                      <p>
                        {scholarship.incomeLimit}
                      </p>

                    </div>


                    {/* DOCUMENTS */}

                    <div className="scholarship-documents">

                      <strong>
                        📄 Required Documents
                      </strong>

                      <ul>

                        {scholarship.documents?.map(
                          (document) => (

                            <li key={document}>
                              {document}
                            </li>

                          )
                        )}

                      </ul>

                    </div>


                    {/* OFFICIAL WEBSITE */}

                    <a
                      href={
                        scholarship.officialLink
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="apply-scholarship-btn"
                    >
                      🔗 Check Official Website
                    </a>

                  </div>

                )
              )}

            </div>

          )}

      </section>


      {/* ==========================================
          INFORMATION SECTION
      ========================================== */}

      <section className="scholarship-info-section">

        <div className="scholarship-info-content">

          <span>
            SCHOLARSHIP GUIDANCE
          </span>

          <h2>
            Education should not stop
            because of <span>money.</span>
          </h2>

          <p>
            ShikshaSetu helps students discover
            scholarship opportunities according
            to their education level, category
            and location.
          </p>

        </div>


        <div className="scholarship-benefits">

          <div>

            <div>
              🔎
            </div>

            <h3>
              Easy Discovery
            </h3>

            <p>
              Find scholarships using simple
              filters.
            </p>

          </div>


          <div>

            <div>
              📍
            </div>

            <h3>
              State Based
            </h3>

            <p>
              Discover opportunities available
              in your state.
            </p>

          </div>


          <div>

            <div>
              🎓
            </div>

            <h3>
              Student Focused
            </h3>

            <p>
              Find opportunities based on
              your education level.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Scholarships;

