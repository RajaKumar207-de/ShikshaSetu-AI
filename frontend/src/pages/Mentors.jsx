import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { ToastStack, useToasts } from "../components/Toast";

function Mentors() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");

  const [mentors, setMentors] = useState([]);
  const [mentorRequests, setMentorRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [incomingLoading, setIncomingLoading] = useState(false);

  const [error, setError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [incomingError, setIncomingError] = useState("");

  const { toasts, showToast, dismissToast } = useToasts();

  const scrollToRequests = () => {
    document
      .getElementById("mentor-requests")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ==========================================
  // CURRENT USER
  // ==========================================

  const token = localStorage.getItem("token");

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("user")
    );
  } catch (error) {
    currentUser = null;
  }

  const isMentor = currentUser?.role === "mentor";

  // ==========================================
  // FETCH MENTORS
  // ==========================================

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        setError("");

        const savedToken = localStorage.getItem("token");

        const response = await axios.get(
          `${API_URL}/api/mentors`,
          savedToken
            ? { headers: { Authorization: `Bearer ${savedToken}` } }
            : undefined
        );

        setMentors(response.data.mentors || []);
      } catch (error) {
        console.error(
          "Failed to fetch mentors:",
          error
        );

        setError(
          "Unable to load mentors. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  // ==========================================
  // STUDENT → FETCH MY REQUESTS
  // ==========================================

  const fetchMyRequests = async () => {
    try {
      const authToken =
        localStorage.getItem("token");

      if (!authToken) {
        setMentorRequests([]);
        return;
      }

      setRequestsLoading(true);
      setRequestError("");

      const response = await axios.get(
        `${API_URL}/api/mentors/my-requests`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      setMentorRequests(
        response.data.requests || []
      );
    } catch (error) {
      console.error(
        "Failed to fetch mentor requests:",
        error
      );

      setRequestError(
        error.response?.data?.message ||
          "Unable to load your mentor requests."
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  // ==========================================
  // MENTOR → FETCH INCOMING REQUESTS
  // ==========================================

  const fetchIncomingRequests = async () => {
    try {
      const authToken =
        localStorage.getItem("token");

      if (!authToken) {
        setIncomingRequests([]);
        return;
      }

      setIncomingLoading(true);
      setIncomingError("");

      const response = await axios.get(
        `${API_URL}/api/mentors/requests`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      setIncomingRequests(
        response.data.requests || []
      );
    } catch (error) {
      console.error(
        "Failed to fetch incoming requests:",
        error
      );

      setIncomingError(
        error.response?.data?.message ||
          "Unable to load incoming mentor requests."
      );
    } finally {
      setIncomingLoading(false);
    }
  };

  // ==========================================
  // LOAD REQUESTS
  // ==========================================

  useEffect(() => {
    fetchMyRequests();
    fetchIncomingRequests();
  }, []);

  // ==========================================
  // FILTER MENTORS
  // ==========================================

  const filteredMentors = mentors.filter(
    (mentor) => {
      const mentorName =
        mentor.name?.toLowerCase() || "";

      const mentorEmail =
        mentor.email?.toLowerCase() || "";

      const mentorLanguage =
        mentor.language?.toLowerCase() || "";

      const mentorSubject =
        mentor.subject?.toLowerCase() || "";

      const searchText =
        search.toLowerCase();

      const matchesSearch =
        mentorName.includes(searchText) ||
        mentorEmail.includes(searchText) ||
        mentorLanguage.includes(searchText) ||
        mentorSubject.includes(searchText);

      const matchesSubject =
        subject === "All" ||
        mentor.subject === subject;

      return (
        matchesSearch &&
        matchesSubject
      );
    }
  );

  // ==========================================
  // STUDENT → CONNECT WITH MENTOR
  // ==========================================

  const connectMentor = async (mentor) => {
    try {
      const authToken =
        localStorage.getItem("token");

      if (!authToken) {
        showToast({
          type: "warning",
          title: "Login required",
          message: "Please login first to connect with a mentor.",
        });
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/mentors/request`,
        {
          mentorId: mentor._id,
          message: `I want to connect with ${mentor.name} as my mentor.`,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      showToast({
        type: "success",
        title: "Request sent 🤝",
        message: `Your request has been sent to ${mentor.name}. You'll be notified once they respond.`,
        action: {
          label: "View my requests",
          onClick: scrollToRequests,
        },
      });

      fetchMyRequests();
    } catch (error) {
      console.error(
        "Mentor request error:",
        error
      );

      const alreadySent = error.response?.status === 409;

      showToast({
        type: alreadySent ? "warning" : "error",
        title: alreadySent
          ? "Already requested"
          : "Request failed",
        message:
          error.response?.data?.message ||
          "Unable to send mentor request.",
        action: alreadySent
          ? {
              label: "View my requests",
              onClick: scrollToRequests,
            }
          : undefined,
      });
    }
  };

  // ==========================================
  // MENTOR → ACCEPT / REJECT
  // ==========================================

  const updateRequestStatus = async (
    requestId,
    status
  ) => {
    try {
      const authToken =
        localStorage.getItem("token");

      if (!authToken) {
        showToast({
          type: "warning",
          title: "Login required",
          message: "Please login first.",
        });
        return;
      }

      await axios.patch(
        `${API_URL}/api/mentors/request/${requestId}`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      showToast(
        status === "accepted"
          ? {
              type: "success",
              title: "Request accepted",
              message: "The student has been notified.",
            }
          : {
              type: "info",
              title: "Request rejected",
              message: "The request has been declined.",
            }
      );

      fetchIncomingRequests();
    } catch (error) {
      console.error(
        "Update mentor request error:",
        error
      );

      showToast({
        type: "error",
        title: "Update failed",
        message:
          error.response?.data?.message ||
          "Unable to update mentor request.",
      });
    }
  };

  // ==========================================
  // REQUEST STATUS CLASS
  // ==========================================

  const getRequestStatusClass = (
    status
  ) => {
    if (status === "accepted") {
      return "request-status accepted";
    }

    if (status === "rejected") {
      return "request-status rejected";
    }

    return "request-status pending";
  };

  // ==========================================
  // REQUEST STATUS TEXT
  // ==========================================

  const getRequestStatusText = (
    status
  ) => {
    if (status === "accepted") {
      return "✓ Accepted";
    }

    if (status === "rejected") {
      return "✕ Rejected";
    }

    return "⏳ Pending";
  };

  return (
    <div className="mentors-page">

      <ToastStack
        toasts={toasts}
        onDismiss={dismissToast}
      />

      {/* ==========================================
          HERO
      ========================================== */}

      <section className="mentors-hero">

        <div className="mentors-hero-content">

          <span className="mentors-badge">
            👨‍🏫 Learn from experienced mentors
          </span>

          <h1>
            Connect with a
            <span> Mentor.</span>
          </h1>

          <p>
            Get personal guidance, clear your doubts
            and build the right path for your education
            and career.
          </p>

          <div className="mentor-hero-stats">

            <div>
              <strong>
                {mentors.length}+
              </strong>
              <span>Mentors</span>
            </div>

            <div>
              <strong>10+</strong>
              <span>Subjects</span>
            </div>

            <div>
              <strong>24×7</strong>
              <span>Learning Support</span>
            </div>

          </div>

        </div>

        <div className="mentor-hero-visual">

          <div className="mentor-main-icon">
            👨‍🏫
          </div>

          <div className="mentor-floating-card mentor-online-card">

            🟢

            <div>
              <strong>Online Mentors</strong>
              <span>Ready to help</span>
            </div>

          </div>

          <div className="mentor-floating-card mentor-guidance-card">

            🎯

            <div>
              <strong>Personal Guidance</strong>
              <span>Learn & grow</span>
            </div>

          </div>

        </div>

      </section>


      {/* ==========================================
          MENTOR → INCOMING REQUESTS
      ========================================== */}

      {isMentor && (

        <section
          id="mentor-requests"
          className="my-mentor-requests-section"
        >

          <div className="my-requests-header">

            <div>

              <span>
                MENTOR DASHBOARD
              </span>

              <h2>
                Student Requests
              </h2>

              <p>
                Manage students who want to
                connect with you.
              </p>

            </div>

            <button
              className="refresh-requests-btn"
              onClick={fetchIncomingRequests}
              disabled={incomingLoading}
            >
              🔄{" "}
              {incomingLoading
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>


          {incomingError && (

            <div className="request-error-box">
              ⚠️ {incomingError}
            </div>

          )}


          {incomingLoading && (

            <div className="requests-loading">
              ⏳ Loading student requests...
            </div>

          )}


          {!incomingLoading &&
            !incomingError &&
            incomingRequests.length === 0 && (

            <div className="no-requests-box">

              <div className="no-request-icon">
                📩
              </div>

              <h3>
                No student requests
              </h3>

              <p>
                New mentor connection requests
                will appear here.
              </p>

            </div>

          )}


          {!incomingLoading &&
            incomingRequests.length > 0 && (

            <div className="mentor-requests-grid">

              {incomingRequests.map(
                (request) => (

                <div
                  className="mentor-request-card"
                  key={request._id}
                >

                  <div className="request-card-top">

                    <div className="request-mentor-avatar">
                      👨‍🎓
                    </div>

                    <span
                      className={getRequestStatusClass(
                        request.status
                      )}
                    >
                      {getRequestStatusText(
                        request.status
                      )}
                    </span>

                  </div>


                  <h3>
                    {request.student?.name ||
                      "Student"}
                  </h3>


                  <p className="request-subject">
                    📧{" "}
                    {request.student?.email ||
                      "Email not available"}
                  </p>


                  <div className="request-details">

                    <div>
                      <span>
                        Language
                      </span>

                      <strong>
                        {request.student?.language ||
                          "Hindi"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Status
                      </span>

                      <strong>
                        {request.status ||
                          "pending"}
                      </strong>
                    </div>

                  </div>


                  <div className="request-message">

                    <span>
                      Student message
                    </span>

                    <p>
                      {request.message ||
                        "Student wants to connect with you."}
                    </p>

                  </div>


                  {request.status ===
                    "pending" && (

                    <div className="request-actions">

                      <button
                        className="request-action-btn accept"
                        onClick={() =>
                          updateRequestStatus(
                            request._id,
                            "accepted"
                          )
                        }
                      >
                        ✓ Accept
                      </button>

                      <button
                        className="request-action-btn reject"
                        onClick={() =>
                          updateRequestStatus(
                            request._id,
                            "rejected"
                          )
                        }
                      >
                        ✕ Reject
                      </button>

                    </div>

                  )}

                </div>

              ))}

            </div>

          )}

        </section>

      )}


      {/* ==========================================
          STUDENT → MY REQUESTS
      ========================================== */}

      {!isMentor && (

        <section
          id="mentor-requests"
          className="my-mentor-requests-section"
        >

          <div className="my-requests-header">

            <div>

              <span>
                YOUR MENTOR CONNECTIONS
              </span>

              <h2>
                My Mentor Requests
              </h2>

              <p>
                Track the mentor requests you have sent.
              </p>

            </div>

            <button
              className="refresh-requests-btn"
              onClick={fetchMyRequests}
              disabled={requestsLoading}
            >
              🔄{" "}
              {requestsLoading
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>


          {requestError && (

            <div className="request-error-box">
              ⚠️ {requestError}
            </div>

          )}


          {requestsLoading && (

            <div className="requests-loading">
              ⏳ Loading your mentor requests...
            </div>

          )}


          {!requestsLoading &&
            !requestError &&
            mentorRequests.length === 0 && (

            <div className="no-requests-box">

              <div className="no-request-icon">
                📩
              </div>

              <h3>
                No mentor requests yet
              </h3>

              <p>
                Connect with a mentor below to
                start your learning journey.
              </p>

            </div>

          )}


          {!requestsLoading &&
            mentorRequests.length > 0 && (

            <div className="mentor-requests-grid">

              {mentorRequests.map(
                (request) => (

                <div
                  className="mentor-request-card"
                  key={request._id}
                >

                  <div className="request-card-top">

                    <div className="request-mentor-avatar">
                      👨‍🏫
                    </div>

                    <span
                      className={getRequestStatusClass(
                        request.status
                      )}
                    >
                      {getRequestStatusText(
                        request.status
                      )}
                    </span>

                  </div>


                  <h3>
                    {request.mentor?.name ||
                      "Mentor"}
                  </h3>


                  <p className="request-subject">
                    📚{" "}
                    {request.mentor?.subject ||
                      "General Mentor"}
                  </p>


                  <div className="request-details">

                    <div>
                      <span>
                        Experience
                      </span>

                      <strong>
                        {request.mentor?.experience ||
                          "Not specified"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Language
                      </span>

                      <strong>
                        {request.mentor?.language ||
                          "Hindi"}
                      </strong>
                    </div>

                  </div>


                  <div className="request-message">

                    <span>
                      Your message
                    </span>

                    <p>
                      {request.message ||
                        "Mentor connection request sent."}
                    </p>

                  </div>


                  <div className="request-availability">

                    🕐{" "}
                    {request.mentor?.availability ||
                      "Availability not specified"}

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      )}


      {/* ==========================================
          SEARCH + FILTER
      ========================================== */}

      <section className="mentor-controls">

        <div className="mentor-search">

          🔎

          <input
            type="text"
            placeholder="Search mentor..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>


        <select
          value={subject}
          onChange={(e) =>
            setSubject(e.target.value)
          }
          className="mentor-filter"
        >

          <option value="All">
            All Subjects
          </option>

          <option value="Mathematics">
            Mathematics
          </option>

          <option value="Science">
            Science
          </option>

          <option value="Computer">
            Computer
          </option>

          <option value="English">
            English
          </option>

          <option value="Career Guidance">
            Career Guidance
          </option>

        </select>

      </section>


      {/* ==========================================
          MENTORS
      ========================================== */}

      <section className="mentors-list-section">

        <div className="mentors-section-heading">

          <div>

            <span>
              FIND YOUR MENTOR
            </span>

            <h2>
              Meet our mentors
            </h2>

          </div>

          <p>
            Choose a mentor based on your subject
            and learning needs.
          </p>

        </div>


        {loading && (

          <div className="no-mentor">

            <div>⏳</div>

            <h3>
              Loading mentors...
            </h3>

            <p>
              Please wait while we find available
              mentors.
            </p>

          </div>

        )}


        {!loading && error && (

          <div className="no-mentor">

            <div>⚠️</div>

            <h3>
              Something went wrong
            </h3>

            <p>
              {error}
            </p>

          </div>

        )}


        {!loading &&
          !error && (

          <div className="mentor-grid">

            {filteredMentors.length > 0 ? (

              filteredMentors.map(
                (mentor) => (

                <div
                  className="mentor-card"
                  key={mentor._id}
                >

                  <div className="mentor-card-top">

                    <div className="mentor-avatar">
                      👨‍🏫
                    </div>

                    <span
                      className={`mentor-status ${
                        mentor.availability ===
                        "Available"
                          ? "online"
                          : "offline"
                      }`}
                    >
                      ●{" "}
                      {mentor.availability ||
                        "Available"}
                    </span>

                  </div>


                  <h3>
                    {mentor.name}
                  </h3>


                  <p className="mentor-subject">

                    📚{" "}
                    {mentor.subject ||
                      "General Mentor"}

                  </p>


                  <div className="mentor-details">

                    <div>

                      <span>
                        Experience
                      </span>

                      <strong>
                        {mentor.experience ||
                          "Not specified"}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Language
                      </span>

                      <strong>
                        {mentor.language ||
                          "Hindi"}
                      </strong>

                    </div>

                  </div>


                  <div className="mentor-email">
                    <span aria-hidden="true">📧</span>
                    <span>{mentor.email}</span>
                  </div>


                  {!isMentor && (

                    <button
                      className="connect-mentor-btn"
                      onClick={() =>
                        connectMentor(mentor)
                      }
                    >
                      💬 Connect with Mentor
                    </button>

                  )}

                </div>

              )
              )

            ) : (

              <div className="no-mentor">

                <div>🔎</div>

                <h3>
                  No mentor found
                </h3>

                <p>
                  Try searching for another mentor.
                </p>

              </div>

            )}

          </div>

        )}

      </section>


      {/* ==========================================
          WHY MENTORING
      ========================================== */}

      <section className="why-mentor-section">

        <div className="why-mentor-content">

          <span>
            WHY ONLINE MENTORING?
          </span>

          <h2>
            You don't have to learn
            <span> alone.</span>
          </h2>

          <p>
            ShikshaSetu connects students with mentors
            who can provide academic support, career
            guidance and personalized learning advice.
          </p>

        </div>


        <div className="mentor-benefits">

          <div className="mentor-benefit-card">

            <div>📚</div>

            <h3>
              Academic Support
            </h3>

            <p>
              Get help understanding difficult
              concepts and subjects.
            </p>

          </div>


          <div className="mentor-benefit-card">

            <div>🎯</div>

            <h3>
              Career Guidance
            </h3>

            <p>
              Understand career options and the
              skills required for your goals.
            </p>

          </div>


          <div className="mentor-benefit-card">

            <div>💬</div>

            <h3>
              Personal Guidance
            </h3>

            <p>
              Talk directly with mentors and get
              personalized advice.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Mentors;