import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn } from "../utils/api";
import { SYNC_EVENT, loadSummary } from "../utils/learningSync";
import { publishSarthiContext } from "../utils/sarthiContext";

import {
  getAllOfflineLessons,
} from "../utils/offlineDB";

function Learning() {
  const [selectedSubject, setSelectedSubject] =
    useState(null);

  const [downloadedLessons, setDownloadedLessons] =
    useState([]);

  const [offlineLoading, setOfflineLoading] =
    useState(true);

  const navigate = useNavigate();

  // =====================================================
  // SUBJECT DATA
  // =====================================================

  const baseSubjects = [
    {
      name: "Mathematics",
      icon: "📐",
      color: "green",
      description:
        "Learn numbers, algebra, geometry and more.",
      progress: 0,
      topics: [
        "Number System",
        "Algebra",
        "Geometry",
        "Percentage",
        "Ratio and Proportion",
      ],
    },

    {
      name: "Science",
      icon: "🔬",
      color: "blue",
      description:
        "Explore physics, chemistry, biology and nature.",
      progress: 0,
      topics: [
        "Physics",
        "Chemistry",
        "Biology",
        "Environment",
        "Human Body",
      ],
    },

    {
      name: "Computer",
      icon: "💻",
      color: "purple",
      description:
        "Learn computers, programming and technology.",
      progress: 0,
      topics: [
        "Computer Basics",
        "Programming Basics",
        "Web Development",
        "Database",
        "Cyber Security",
      ],
    },

    {
      name: "English",
      icon: "📖",
      color: "orange",
      description:
        "Improve grammar, vocabulary and communication.",
      progress: 0,
      topics: [
        "Grammar",
        "Vocabulary",
        "Speaking",
        "Reading",
        "Communication",
      ],
    },
  ];

  // Real progress: share of a subject's topics whose lesson is completed.
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) return undefined;
    const load = () =>
      loadSummary("Mathematics")
        .then(({ data }) => setSummary(data))
        .catch(() => setSummary(null));
    load();
    const onSync = (e) => e.detail?.status === "done" && load();
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, []);

  const subjects = baseSubjects.map((subject) => {
    const stats = summary?.subjects?.find((x) => x.name === subject.name);
    return {
      ...subject,
      progress: stats
        ? Math.round((stats.lessonsCompleted / stats.totalTopics) * 100)
        : 0,
    };
  });

  const overallProgress = Math.round(
    subjects.reduce((sum, item) => sum + item.progress, 0) / subjects.length
  );

  useEffect(() => {
    publishSarthiContext({
      subject: selectedSubject || undefined,
      topic: undefined,
    });
  }, [selectedSubject]);

  // =====================================================
  // LOAD DOWNLOADED LESSONS FROM INDEXED DB
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const loadOfflineLessons = async () => {
      try {
        setOfflineLoading(true);

        const lessons =
          await getAllOfflineLessons();

        if (mounted) {
          setDownloadedLessons(
            Array.isArray(lessons)
              ? lessons
              : []
          );
        }
      } catch (error) {
        console.error(
          "Failed to load downloaded lessons:",
          error
        );

        if (mounted) {
          setDownloadedLessons([]);
        }
      } finally {
        if (mounted) {
          setOfflineLoading(false);
        }
      }
    };

    loadOfflineLessons();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // SUBJECT
  // =====================================================

  const selectedSubjectData =
    subjects.find(
      (subject) =>
        subject.name === selectedSubject
    );

  // =====================================================
  // OPEN NORMAL LESSON
  // =====================================================

  const openLesson = (topic) => {
    if (!selectedSubjectData) return;

    navigate("/lesson", {
      state: {
        subject:
          selectedSubjectData.name,
        topic,
      },
    });
  };

  // =====================================================
  // OPEN DOWNLOADED LESSON
  // =====================================================

  const openDownloadedLesson = (
    downloadedLesson
  ) => {
    navigate("/lesson", {
      state: {
        subject:
          downloadedLesson.subject,
        topic:
          downloadedLesson.topic,
      },
    });
  };

  // =====================================================
  // OPEN TEST
  // =====================================================

  const openTest = (subject) => {
    navigate("/lesson", {
      state: {
        subject: subject.name,
        topic: subject.topics[0],
        startTest: true,
        scope: "subject",
      },
    });
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDownloadedDate = (
    savedAt
  ) => {
    if (!savedAt) {
      return "Saved on this device";
    }

    try {
      return `Downloaded ${new Date(
        savedAt
      ).toLocaleDateString()}`;
    } catch {
      return "Saved on this device";
    }
  };

  return (
    <div className="learning-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="learning-hero">

        <div>

          <div className="learning-badge">
            🌱 Learn at your own pace
          </div>

          <h1>
            Build your skills.
            <span>
              Shape your future.
            </span>
          </h1>

          <p>
            Explore subjects, learn important
            concepts and improve your knowledge
            with simple and accessible lessons.
          </p>

          {isLoggedIn() && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <Link to="/learning-path" className="ss-btn">
                🧭 Your Learning Path
              </Link>
              <Link to="/voice" className="ss-btn ghost">
                🎙️ Voice Learning
              </Link>
              <Link to="/offline" className="ss-btn ghost">
                📥 Offline packs
              </Link>
            </div>
          )}

        </div>

        {/* Progress Card */}

        <div className="learning-hero-card">

          <div className="hero-card-icon">
            🎯
          </div>

          <div>

            <small>
              YOUR LEARNING JOURNEY
            </small>

            <strong>
              Keep going, you're doing great!
            </strong>

            <div className="hero-progress">
              <div
                style={{
                  width: `${overallProgress}%`,
                }}
              ></div>
            </div>

            <span>
              {overallProgress}% overall progress
            </span>

          </div>

        </div>

      </section>

      {/* =================================================
          OFFLINE STATUS
      ================================================= */}

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto 25px",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
            flexWrap: "wrap",
            padding: "14px 18px",
            borderRadius: "15px",
            border: "1px solid #e4e7ec",
            background: "#ffffff",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: navigator.onLine
                  ? "#12b76a"
                  : "#f79009",
              }}
            ></span>

            <span
              style={{
                color: "#475467",
                fontSize: "13px",
                fontWeight: "650",
              }}
            >
              {navigator.onLine
                ? "Online learning available"
                : "Offline mode active"}
            </span>
          </div>

          <span
            style={{
              color: "#667085",
              fontSize: "12px",
            }}
          >
            {downloadedLessons.length} lesson
            {downloadedLessons.length === 1
              ? ""
              : "s"} saved offline
          </span>

        </div>
      </section>

      {/* =================================================
          DOWNLOADED LESSONS
      ================================================= */}

      {downloadedLessons.length > 0 && (
        <section
          style={{
            maxWidth: "1200px",
            margin: "0 auto 35px",
            padding: "0 20px",
          }}
        >

          <div
            style={{
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                color: "#2d3f9f",
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "1.2px",
              }}
            >
              OFFLINE LIBRARY
            </span>

            <h2
              style={{
                margin: "6px 0 5px",
                color: "#11162b",
                fontSize: "26px",
              }}
            >
              📥 Downloaded Lessons
            </h2>

            <p
              style={{
                margin: 0,
                color: "#667085",
                fontSize: "14px",
              }}
            >
              Continue learning even without
              an internet connection.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "15px",
            }}
          >

            {downloadedLessons.map(
              (item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e4e7ec",
                    borderRadius: "18px",
                    padding: "19px",
                    boxShadow:
                      "0 8px 25px rgba(16,24,40,.05)",
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "13px",
                    }}
                  >

                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          "center",
                        background: "#eef2ff",
                        fontSize: "20px",
                      }}
                    >
                      📚
                    </div>

                    <span
                      style={{
                        padding: "5px 8px",
                        borderRadius: "7px",
                        background: "#ecfdf3",
                        color: "#067647",
                        fontSize: "9px",
                        fontWeight: "800",
                      }}
                    >
                      OFFLINE
                    </span>

                  </div>

                  <div
                    style={{
                      color: "#98a2b3",
                      fontSize: "11px",
                      fontWeight: "700",
                      marginBottom: "5px",
                    }}
                  >
                    {item.subject}
                  </div>

                  <h3
                    style={{
                      margin: "0 0 7px",
                      color: "#11162b",
                      fontSize: "17px",
                    }}
                  >
                    {item.topic}
                  </h3>

                  <p
                    style={{
                      margin: "0 0 15px",
                      color: "#667085",
                      fontSize: "12px",
                      lineHeight: "1.5",
                    }}
                  >
                    {formatDownloadedDate(
                      item.savedAt
                    )}
                  </p>

                  <button
                    onClick={() =>
                      openDownloadedLesson(
                        item
                      )
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      padding: "11px 15px",
                      borderRadius: "10px",
                      background:
                        "linear-gradient(135deg,#11162b,#3447a8)",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "750",
                      cursor: "pointer",
                    }}
                  >
                    📖 Open Lesson
                  </button>

                </div>
              )
            )}

          </div>

        </section>
      )}

      {/* =================================================
          SUBJECT STATS
      ================================================= */}

      <section className="learning-stats">

        <div className="learning-stat">

          <div>📚</div>

          <section>
            <strong>4</strong>
            <span>Subjects</span>
          </section>

        </div>

        <div className="learning-stat">

          <div>📖</div>

          <section>
            <strong>20+</strong>
            <span>Topics</span>
          </section>

        </div>

        <div className="learning-stat">

          <div>🎯</div>

          <section>
            <strong>{overallProgress}%</strong>
            <span>Progress</span>
          </section>

        </div>

        <div className="learning-stat">

          <div>🏆</div>

          <section>
            <strong>12</strong>
            <span>
              Lessons completed
            </span>
          </section>

        </div>

      </section>

      {/* =================================================
          SUBJECT SECTION
      ================================================= */}

      <section className="subjects-section">

        <div className="subjects-heading">

          <div>

            <span>
              EXPLORE SUBJECTS
            </span>

            <h2>
              What do you want to learn?
            </h2>

          </div>

          <p>
            Choose a subject and start learning
            through simple, beginner-friendly
            lessons.
          </p>

        </div>

        {/* SUBJECT GRID */}

        <div className="subject-grid">

          {subjects.map(
            (subject) => (

              <div
                key={subject.name}
                className={`subject-card ${subject.color}`}
              >

                {/* SUBJECT TOP */}

                <div className="subject-top">

                  <div className="subject-icon">
                    {subject.icon}
                  </div>

                  <div className="subject-arrow">
                    →
                  </div>

                </div>

                {/* NAME */}

                <h3>
                  {subject.name}
                </h3>

                {/* DESCRIPTION */}

                <p>
                  {subject.description}
                </p>

                {/* PROGRESS */}

                <div className="subject-progress-info">

                  <span>
                    Learning progress
                  </span>

                  <strong>
                    {subject.progress}%
                  </strong>

                </div>

                <div className="subject-progress">

                  <div
                    style={{
                      width:
                        `${subject.progress}%`,
                    }}
                  ></div>

                </div>

                {/* BUTTONS */}

                <div className="subject-bottom">

                  <span>
                    {subject.topics.length}
                    {" "}
                    topics
                  </span>

                  <div
                    style={{
                      display: "flex",
                      gap: "7px",
                      flexWrap: "wrap",
                      justifyContent:
                        "flex-end",
                    }}
                  >

                    <button
                      onClick={() =>
                        setSelectedSubject(
                          subject.name
                        )
                      }
                    >
                      Start Learning →
                    </button>

                    <button
                      onClick={() =>
                        openTest(subject)
                      }
                      style={{
                        background:
                          "#f0fdf4",
                        color: "#15803d",
                        border:
                          "1px solid #bbf7d0",
                      }}
                    >
                      📝 Test
                    </button>

                  </div>

                </div>

              </div>
            )
          )}

        </div>

      </section>

      {/* =================================================
          TOPIC SECTION
      ================================================= */}

      {selectedSubjectData && (
        <section className="topic-section">

          <div className="topic-header">

            <div>

              <span>
                SELECTED SUBJECT
              </span>

              <h2>
                {selectedSubjectData.icon}{" "}
                {selectedSubjectData.name}
              </h2>

              <p>
                Choose a topic and start
                your lesson.
              </p>

            </div>

            <button
              className="close-topic"
              onClick={() =>
                setSelectedSubject(null)
              }
            >
              ✕
            </button>

          </div>

          {/* TOPIC LIST */}

          <div className="topic-list">

            {selectedSubjectData.topics.map(
              (topic, index) => (

                <button
                  key={topic}
                  className="topic-item"
                  onClick={() =>
                    openLesson(topic)
                  }
                >

                  <div className="topic-number">
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </div>

                  <div className="topic-content">

                    <strong>
                      {topic}
                    </strong>

                    <span>
                      Beginner friendly
                      lesson • Learn step
                      by step
                    </span>

                  </div>

                  <div className="topic-arrow">
                    →
                  </div>

                </button>
              )
            )}

          </div>

        </section>
      )}

      {/* =================================================
          OFFLINE EMPTY STATE
      ================================================= */}

      {downloadedLessons.length === 0 &&
        !offlineLoading && (
          <section
            style={{
              maxWidth: "1200px",
              margin: "0 auto 30px",
              padding: "0 20px",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderRadius: "18px",
                background: "#f8fafc",
                border: "1px dashed #d0d5dd",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  marginBottom: "8px",
                }}
              >
                📥
              </div>

              <h3
                style={{
                  margin: "0 0 6px",
                  color: "#11162b",
                }}
              >
                No lessons downloaded yet
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                  fontSize: "13px",
                }}
              >
                Open any lesson and choose
                “Download for Offline” to
                save it on your device.
              </p>
            </div>
          </section>
        )}

      {/* =================================================
          MOTIVATION
      ================================================= */}

      <section className="learning-motivation">

        <div className="motivation-icon">
          🚀
        </div>

        <div>

          <span>
            KEEP LEARNING
          </span>

          <h2>
            Every lesson takes you one
            step closer to your dream.
          </h2>

          <p>
            Learn today. Practice tomorrow.
            Build your future.
          </p>

        </div>

        <div className="motivation-quote">

          “

          <strong>
            Knowledge creates opportunity.
          </strong>

        </div>

      </section>

    </div>
  );
}

export default Learning;