import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [mentorRequests, setMentorRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LEARNING PROGRESS DATA
  // ==========================================

  const progressData = {
    overall: 70,
    lessonsCompleted: 66,
    streak: "7 Days",
    learningTime: "18h",
  };

  // ==========================================
  // SUBJECT PROGRESS
  // ==========================================

  const subjects = [
    {
      name: "Mathematics",
      icon: "📐",
      progress: 72,
      completed: 18,
      total: 25,
    },
    {
      name: "Science",
      icon: "🔬",
      progress: 58,
      completed: 14,
      total: 24,
    },
    {
      name: "Computer",
      icon: "💻",
      progress: 84,
      completed: 21,
      total: 25,
    },
    {
      name: "English",
      icon: "📖",
      progress: 65,
      completed: 13,
      total: 20,
    },
  ];

  // ==========================================
  // LOAD USER
  // ==========================================

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("User data error:", error);
      }
    }

    loadDashboardData();
  }, []);

  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        const mentorResponse = await axios.get(
          "http://localhost:5000/api/mentors/my-requests",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMentorRequests(
          mentorResponse.data.requests || []
        );
      }
    } catch (error) {
      console.log(
        "Dashboard data loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GET MENTOR STATUS
  // ==========================================

  const getMentorStatus = () => {
    if (mentorRequests.length === 0) {
      return "No mentor connected";
    }

    const accepted = mentorRequests.find(
      (request) => request.status === "accepted"
    );

    if (accepted) {
      return "Mentor connected";
    }

    const pending = mentorRequests.find(
      (request) => request.status === "pending"
    );

    if (pending) {
      return "Request pending";
    }

    return "No active mentor";
  };

  // ==========================================
  // USER NAME
  // ==========================================

  const studentName =
    user?.name?.split(" ")[0] || "Student";

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f6f8fc",
          color: "#475467",
          fontSize: "18px",
        }}
      >
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f8fc",
        padding: "30px 20px 50px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >

        {/* ==========================================
            HEADER
        ========================================== */}

        <div
          style={{
            background:
              "linear-gradient(135deg, #172554, #3157d5)",
            borderRadius: "24px",
            padding: "35px",
            color: "white",
            marginBottom: "25px",
            boxShadow:
              "0 15px 40px rgba(49,87,213,0.18)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              opacity: 0.8,
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            STUDENT DASHBOARD
          </p>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "32px",
            }}
          >
            Welcome back, {studentName}! 👋
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.9,
              fontSize: "16px",
              lineHeight: "1.6",
            }}
          >
            Continue your learning journey with
            ShikshaSetu AI.
          </p>
        </div>

        {/* ==========================================
            QUICK STATS
        ========================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "25px",
          }}
        >

          {/* PROGRESS */}

          <div
            style={{
              background: "#ffffff",
              padding: "22px",
              borderRadius: "18px",
              boxShadow:
                "0 8px 25px rgba(16,24,40,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                marginBottom: "10px",
              }}
            >
              📊
            </div>

            <h3
              style={{
                margin: "0 0 5px",
              }}
            >
              Learning Progress
            </h3>

            <p
              style={{
                margin: 0,
                color: "#3157d5",
                fontSize: "28px",
                fontWeight: "700",
              }}
            >
              {progressData.overall}%
            </p>

            <div
              style={{
                height: "8px",
                background: "#e4e7ec",
                borderRadius: "20px",
                marginTop: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressData.overall}%`,
                  height: "100%",
                  background:
                    "linear-gradient(90deg, #3157d5, #5b7cfa)",
                  borderRadius: "20px",
                }}
              />
            </div>

            <p
              style={{
                margin: "8px 0 0",
                color: "#667085",
                fontSize: "13px",
              }}
            >
              Overall learning progress
            </p>
          </div>

          {/* LESSONS */}

          <div
            style={{
              background: "#ffffff",
              padding: "22px",
              borderRadius: "18px",
              boxShadow:
                "0 8px 25px rgba(16,24,40,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                marginBottom: "10px",
              }}
            >
              📚
            </div>

            <h3
              style={{
                margin: "0 0 5px",
              }}
            >
              Lessons Completed
            </h3>

            <p
              style={{
                margin: 0,
                color: "#3157d5",
                fontSize: "28px",
                fontWeight: "700",
              }}
            >
              {progressData.lessonsCompleted}
            </p>

            <p
              style={{
                margin: "5px 0 0",
                color: "#667085",
                fontSize: "13px",
              }}
            >
              Lessons completed
            </p>
          </div>

          {/* STREAK */}

          <div
            style={{
              background: "#ffffff",
              padding: "22px",
              borderRadius: "18px",
              boxShadow:
                "0 8px 25px rgba(16,24,40,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                marginBottom: "10px",
              }}
            >
              🔥
            </div>

            <h3
              style={{
                margin: "0 0 5px",
              }}
            >
              Learning Streak
            </h3>

            <p
              style={{
                margin: 0,
                color: "#3157d5",
                fontSize: "28px",
                fontWeight: "700",
              }}
            >
              {progressData.streak}
            </p>

            <p
              style={{
                margin: "5px 0 0",
                color: "#667085",
                fontSize: "13px",
              }}
            >
              Keep the streak going!
            </p>
          </div>

          {/* LEARNING TIME */}

          <div
            style={{
              background: "#ffffff",
              padding: "22px",
              borderRadius: "18px",
              boxShadow:
                "0 8px 25px rgba(16,24,40,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                marginBottom: "10px",
              }}
            >
              ⏱️
            </div>

            <h3
              style={{
                margin: "0 0 5px",
              }}
            >
              Learning Time
            </h3>

            <p
              style={{
                margin: 0,
                color: "#3157d5",
                fontSize: "28px",
                fontWeight: "700",
              }}
            >
              {progressData.learningTime}
            </p>

            <p
              style={{
                margin: "5px 0 0",
                color: "#667085",
                fontSize: "13px",
              }}
            >
              Total learning time
            </p>
          </div>

        </div>

        {/* ==========================================
            MENTOR + LANGUAGE + OFFLINE
        ========================================== */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "25px",
          }}
        >

          {/* MENTOR */}

          <div
            style={{
              background: "#ffffff",
              padding: "22px",
              borderRadius: "18px",
              boxShadow:
                "0 8px 25px rgba(16,24,40,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                marginBottom: "10px",
              }}
            >
              🤝
            </div>

            <h3
              style={{
                margin: "0 0 5px",
              }}
            >
              Mentor
            </h3>

            <p
              style={{
                margin: 0,
                color: "#667085",
              }}
            >
              {getMentorStatus()}
            </p>
          </div>

          {/* LANGUAGE */}

          <div
            style={{
              background: "#ffffff",
              padding: "22px",
              borderRadius: "18px",
              boxShadow:
                "0 8px 25px rgba(16,24,40,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                marginBottom: "10px",
              }}
            >
              🌐
            </div>

            <h3
              style={{
                margin: "0 0 5px",
              }}
            >
              Language
            </h3>

            <p
              style={{
                margin: 0,
                color: "#667085",
              }}
            >
              {user?.language || "Hindi"}
            </p>
          </div>

          {/* OFFLINE */}

          <div
            style={{
              background: "#ffffff",
              padding: "22px",
              borderRadius: "18px",
              boxShadow:
                "0 8px 25px rgba(16,24,40,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                marginBottom: "10px",
              }}
            >
              📶
            </div>

            <h3
              style={{
                margin: "0 0 5px",
              }}
            >
              Learning Mode
            </h3>

            <p
              style={{
                margin: 0,
                color: "#667085",
              }}
            >
              Online & Offline Ready
            </p>
          </div>

        </div>

        {/* ==========================================
            SUBJECT PROGRESS
        ========================================== */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "25px",
            boxShadow:
              "0 8px 25px rgba(16,24,40,0.06)",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
              marginBottom: "22px",
            }}
          >
            <div>
              <span
                style={{
                  color: "#3157d5",
                  fontSize: "12px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                }}
              >
                LEARNING OVERVIEW
              </span>

              <h2
                style={{
                  margin: "6px 0",
                }}
              >
                Your Learning Progress
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                }}
              >
                Track your progress across different subjects.
              </p>
            </div>

            <Link
              to="/progress"
              style={{
                color: "#3157d5",
                fontWeight: "600",
              }}
            >
              View Full Progress →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gap: "16px",
            }}
          >
            {subjects.map((subject) => (
              <div
                key={subject.name}
                style={{
                  padding: "18px",
                  background: "#f8fafc",
                  border: "1px solid #eaecf0",
                  borderRadius: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "12px",
                        background: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                      }}
                    >
                      {subject.icon}
                    </div>

                    <div>
                      <strong
                        style={{
                          display: "block",
                        }}
                      >
                        {subject.name}
                      </strong>

                      <small
                        style={{
                          color: "#667085",
                        }}
                      >
                        {subject.completed} of{" "}
                        {subject.total} lessons
                      </small>
                    </div>
                  </div>

                  <strong
                    style={{
                      color: "#3157d5",
                      fontSize: "18px",
                    }}
                  >
                    {subject.progress}%
                  </strong>
                </div>

                <div
                  style={{
                    height: "8px",
                    background: "#e4e7ec",
                    borderRadius: "20px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${subject.progress}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg, #3157d5, #5b7cfa)",
                      borderRadius: "20px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ==========================================
            CONTINUE LEARNING
        ========================================== */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "25px",
            boxShadow:
              "0 8px 25px rgba(16,24,40,0.06)",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: "0 0 5px",
                }}
              >
                📚 Continue Learning
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                }}
              >
                Pick up where you left off.
              </p>
            </div>

            <Link
              to="/learning"
              style={{
                color: "#3157d5",
                fontWeight: "600",
              }}
            >
              View Courses →
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >

            <Link
              to="/learning"
              style={{
                padding: "22px",
                borderRadius: "16px",
                background: "#eef4ff",
                border: "1px solid #dbe7ff",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "10px",
                }}
              >
                💻
              </div>

              <h3
                style={{
                  margin: "0 0 7px",
                  color: "#172033",
                }}
              >
                Computer Science
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                  fontSize: "14px",
                }}
              >
                Learn programming and digital skills.
              </p>
            </Link>

            <Link
              to="/learning"
              style={{
                padding: "22px",
                borderRadius: "16px",
                background: "#f5f3ff",
                border: "1px solid #e9e3ff",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "10px",
                }}
              >
                🔬
              </div>

              <h3
                style={{
                  margin: "0 0 7px",
                  color: "#172033",
                }}
              >
                Science
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                  fontSize: "14px",
                }}
              >
                Explore science concepts easily.
              </p>
            </Link>

            <Link
              to="/learning"
              style={{
                padding: "22px",
                borderRadius: "16px",
                background: "#ecfdf3",
                border: "1px solid #d1fadf",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "10px",
                }}
              >
                ➗
              </div>

              <h3
                style={{
                  margin: "0 0 7px",
                  color: "#172033",
                }}
              >
                Mathematics
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                  fontSize: "14px",
                }}
              >
                Practice mathematics step by step.
              </p>
            </Link>

          </div>
        </div>

        {/* ==========================================
            QUICK ACTIONS
        ========================================== */}

        <div
          style={{
            marginBottom: "25px",
          }}
        >
          <h2
            style={{
              marginBottom: "18px",
            }}
          >
            🚀 Quick Actions
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
            }}
          >

            <Link
              to="/ai-tutor"
              style={{
                background: "#172554",
                color: "white",
                padding: "25px",
                borderRadius: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "10px",
                }}
              >
                🤖
              </div>

              <h3
                style={{
                  margin: "0 0 7px",
                }}
              >
                Ask AI Tutor
              </h3>

              <p
                style={{
                  margin: 0,
                  opacity: 0.8,
                  fontSize: "14px",
                }}
              >
                Get instant help with your doubts.
              </p>
            </Link>

            <Link
              to="/mentors"
              style={{
                background: "#ffffff",
                padding: "25px",
                borderRadius: "18px",
                border: "1px solid #e4e7ec",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "10px",
                }}
              >
                🤝
              </div>

              <h3
                style={{
                  margin: "0 0 7px",
                }}
              >
                Find a Mentor
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                  fontSize: "14px",
                }}
              >
                Connect with a mentor for guidance.
              </p>
            </Link>

            <Link
              to="/scholarships"
              style={{
                background: "#ffffff",
                padding: "25px",
                borderRadius: "18px",
                border: "1px solid #e4e7ec",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "10px",
                }}
              >
                🎓
              </div>

              <h3
                style={{
                  margin: "0 0 7px",
                }}
              >
                Find Scholarships
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                  fontSize: "14px",
                }}
              >
                Discover opportunities for your education.
              </p>
            </Link>

            <Link
              to="/career"
              style={{
                background: "#ffffff",
                padding: "25px",
                borderRadius: "18px",
                border: "1px solid #e4e7ec",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "10px",
                }}
              >
                💼
              </div>

              <h3
                style={{
                  margin: "0 0 7px",
                }}
              >
                Explore Careers
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                  fontSize: "14px",
                }}
              >
                Explore career paths and opportunities.
              </p>
            </Link>

          </div>
        </div>

        {/* ==========================================
            MENTOR STATUS
        ========================================== */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "28px",
            marginBottom: "25px",
            boxShadow:
              "0 8px 25px rgba(16,24,40,0.06)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
            }}
          >
            🤝 Mentor Connection
          </h2>

          {mentorRequests.length === 0 ? (
            <div>
              <p
                style={{
                  color: "#667085",
                }}
              >
                You have not connected with a mentor yet.
              </p>

              <Link
                to="/mentors"
                style={{
                  display: "inline-block",
                  marginTop: "8px",
                  padding: "11px 18px",
                  borderRadius: "10px",
                  background: "#3157d5",
                  color: "white",
                  fontWeight: "600",
                }}
              >
                Find a Mentor
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {mentorRequests
                .slice(0, 3)
                .map((request) => (
                  <div
                    key={request._id}
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "15px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong>
                        {request.mentor?.name ||
                          "Mentor"}
                      </strong>

                      <p
                        style={{
                          margin: "5px 0 0",
                          color: "#667085",
                          fontSize: "14px",
                        }}
                      >
                        {request.mentor?.subject ||
                          "Mentor Guidance"}
                      </p>
                    </div>

                    <span
                      style={{
                        padding: "7px 12px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: "600",
                        background:
                          request.status ===
                          "accepted"
                            ? "#dcfae6"
                            : request.status ===
                              "rejected"
                            ? "#fee4e2"
                            : "#fff4cc",
                        color:
                          request.status ===
                          "accepted"
                            ? "#027a48"
                            : request.status ===
                              "rejected"
                            ? "#b42318"
                            : "#946200",
                      }}
                    >
                      {request.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ==========================================
            FOOTER
        ========================================== */}

        <div
          style={{
            textAlign: "center",
            padding: "20px",
            color: "#667085",
            fontSize: "14px",
          }}
        >
          🌱 Keep learning. Keep growing. Keep moving
          forward with ShikshaSetu.
        </div>

      </div>
    </div>
  );
}

export default Dashboard;