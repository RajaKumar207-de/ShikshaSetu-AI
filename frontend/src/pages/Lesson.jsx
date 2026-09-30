import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  saveOfflineLesson,
  getOfflineLesson,
  deleteOfflineLesson,
} from "../utils/offlineDB";
import { lessonLibrary, testQuestions } from "../data/lessonLibrary";
import { recordLearningEvent } from "../utils/learningSync";

function Lesson() {
  const location = useLocation();
  const navigate = useNavigate();

  const subject =
    location.state?.subject || "Mathematics";

  const topic =
    location.state?.topic || "Number System";

  const startTest =
    location.state?.startTest || false;

  // A test opened from the Learning page covers the whole subject, so its
  // score is not attributed to a single topic.
  const topicScoped = location.state?.scope !== "subject";

  // =====================================================
  // LESSON LIBRARY
  // =====================================================


  const subjectLessons =
    lessonLibrary[subject] ||
    lessonLibrary.Mathematics;

  const availableTopics =
    Object.values(subjectLessons);

  const lesson =
    subjectLessons[topic] ||
    availableTopics[0];

  // =====================================================
  // OFFLINE STATE
  // =====================================================

  const [isDownloaded, setIsDownloaded] =
    useState(false);

  const [offlineLoading, setOfflineLoading] =
    useState(true);

  const [offlineMessage, setOfflineMessage] =
    useState("");

  // =====================================================
  // PROGRESS STATE
  // =====================================================

  const [isCompleted, setIsCompleted] =
    useState(false);

  // =====================================================
  // CHECK OFFLINE LESSON
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const checkOfflineLesson = async () => {
      try {
        setOfflineLoading(true);

        const savedLesson =
          await getOfflineLesson(
            subject,
            topic
          );

        if (mounted) {
          setIsDownloaded(
            Boolean(savedLesson)
          );
        }
      } catch (error) {
        console.error(
          "Failed to check offline lesson:",
          error
        );
      } finally {
        if (mounted) {
          setOfflineLoading(false);
        }
      }
    };

    checkOfflineLesson();

    return () => {
      mounted = false;
    };
  }, [subject, topic]);

  // =====================================================
  // CHECK PROGRESS
  // =====================================================

  useEffect(() => {
    try {
      const progressKey =
        `shikshasetu-progress-${subject}`;

      const savedProgress =
        JSON.parse(
          localStorage.getItem(
            progressKey
          ) || "[]"
        );

      setIsCompleted(
        savedProgress.includes(topic)
      );
    } catch (error) {
      console.error(
        "Failed to load progress:",
        error
      );
    }
  }, [subject, topic]);

  // =====================================================
  // DOWNLOAD FOR OFFLINE
  // =====================================================

  const handleDownloadOffline =
    async () => {
      try {
        setOfflineLoading(true);
        setOfflineMessage("");

        const saved =
          await saveOfflineLesson({
            subject,
            topic,
            lesson,
          });

        if (saved) {
          setIsDownloaded(true);

          setOfflineMessage(
            "Lesson downloaded for offline learning ✅"
          );
        } else {
          setOfflineMessage(
            "Unable to download lesson."
          );
        }
      } catch (error) {
        console.error(
          "Offline download failed:",
          error
        );

        setOfflineMessage(
          "Something went wrong while downloading."
        );
      } finally {
        setOfflineLoading(false);
      }
    };

  // =====================================================
  // REMOVE OFFLINE LESSON
  // =====================================================

  const handleRemoveOffline =
    async () => {
      try {
        setOfflineLoading(true);
        setOfflineMessage("");

        const removed =
          await deleteOfflineLesson(
            subject,
            topic
          );

        if (removed) {
          setIsDownloaded(false);

          setOfflineMessage(
            "Lesson removed from offline storage."
          );
        }
      } catch (error) {
        console.error(
          "Failed to remove offline lesson:",
          error
        );

        setOfflineMessage(
          "Unable to remove offline lesson."
        );
      } finally {
        setOfflineLoading(false);
      }
    };

  // =====================================================
  // MARK COMPLETE
  // =====================================================

  const markLessonComplete =
    () => {
      try {
        const progressKey =
          `shikshasetu-progress-${subject}`;

        const savedProgress =
          JSON.parse(
            localStorage.getItem(
              progressKey
            ) || "[]"
          );

        if (
          !savedProgress.includes(topic)
        ) {
          savedProgress.push(topic);
        }

        localStorage.setItem(
          progressKey,
          JSON.stringify(savedProgress)
        );

        setIsCompleted(true);

        recordLearningEvent({
          type: "lesson_complete",
          subject,
          topic,
        });
      } catch (error) {
        console.error(
          "Failed to save progress:",
          error
        );
      }
    };

  // =====================================================
  // TEST QUESTIONS
  // =====================================================


  const questions =
    testQuestions[subject] ||
    testQuestions.Mathematics;

  // =====================================================
  // TEST STATE
  // =====================================================

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState("");

  const [answers, setAnswers] =
    useState({});

  const [submitted, setSubmitted] =
    useState(false);

  const [score, setScore] =
    useState(0);

  // =====================================================
  // TEST FUNCTIONS
  // =====================================================

  const selectAnswer = (
    answer
  ) => {
    if (submitted) return;

    setSelectedAnswer(answer);

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion]: answer,
    }));
  };

  const submitTest = () => {
    let finalScore = 0;

    questions.forEach(
      (question, index) => {
        if (
          answers[index] ===
          question.answer
        ) {
          finalScore++;
        }
      }
    );

    setScore(finalScore);
    setSubmitted(true);

    recordLearningEvent({
      type: "quiz",
      subject,
      topic: topicScoped ? topic : "",
      score: finalScore,
      total: questions.length,
    });
  };

  const nextQuestion = () => {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) =>
          previous + 1
      );

      setSelectedAnswer(
        answers[
          currentQuestion + 1
        ] || ""
      );
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(
        (previous) =>
          previous - 1
      );

      setSelectedAnswer(
        answers[
          currentQuestion - 1
        ] || ""
      );
    }
  };

  const retryTest = () => {
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  // =====================================================
  // TEST SCREEN
  // =====================================================

  if (startTest) {
    const question =
      questions[currentQuestion];

    return (
      <div className="lesson-page">
        <div className="test-container">

          <div className="test-header">
            <div>
              <span className="test-label">
                📝 PRACTICE TEST
              </span>

              <h1>
                {subject} Test
              </h1>

              <p>
                Test your knowledge and
                see how much you have learned.
              </p>
            </div>

            <div className="test-score-box">
              <strong>
                {currentQuestion + 1}/
                {questions.length}
              </strong>

              <span>
                Questions
              </span>
            </div>
          </div>

          {!submitted ? (
            <>
              <div className="test-progress">
                <div
                  style={{
                    width:
                      `${
                        ((currentQuestion + 1) /
                          questions.length) *
                        100
                      }%`,
                  }}
                />
              </div>

              <div className="question-card">

                <span className="question-number">
                  Question{" "}
                  {currentQuestion + 1}
                </span>

                <h2>
                  {question.question}
                </h2>

                <div className="options-list">

                  {question.options.map(
                    (option) => {
                      const selected =
                        selectedAnswer ===
                        option;

                      return (
                        <button
                          key={option}
                          className={`test-option ${
                            selected
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            selectAnswer(
                              option
                            )
                          }
                        >
                          <span className="option-circle">
                            {selected
                              ? "✓"
                              : ""}
                          </span>

                          {option}
                        </button>
                      );
                    }
                  )}

                </div>
              </div>

              <div className="test-controls">

                <button
                  className="test-secondary-button"
                  onClick={
                    previousQuestion
                  }
                  disabled={
                    currentQuestion ===
                    0
                  }
                >
                  ← Previous
                </button>

                {currentQuestion <
                questions.length - 1 ? (
                  <button
                    className="test-primary-button"
                    onClick={
                      nextQuestion
                    }
                    disabled={
                      !selectedAnswer
                    }
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    className="test-primary-button"
                    onClick={
                      submitTest
                    }
                    disabled={
                      !selectedAnswer
                    }
                  >
                    Submit Test ✓
                  </button>
                )}

              </div>
            </>
          ) : (
            <div className="test-result">

              <div className="result-icon">
                {score >= 4
                  ? "🏆"
                  : score >= 2
                  ? "👏"
                  : "📚"}
              </div>

              <span className="test-label">
                TEST COMPLETED
              </span>

              <h2>
                {score ===
                questions.length
                  ? "Perfect Score! 🎉"
                  : "Good effort! Keep learning 🚀"}
              </h2>

              <div className="final-score">
                {score}
                <span>
                  /{questions.length}
                </span>
              </div>

              <p>
                You answered{" "}
                <strong>
                  {score}
                </strong>{" "}
                out of{" "}
                <strong>
                  {questions.length}
                </strong>{" "}
                questions correctly.
              </p>

              <div className="result-buttons">

                <button
                  className="test-primary-button"
                  onClick={
                    retryTest
                  }
                >
                  🔄 Retry Test
                </button>

                <button
                  className="test-secondary-button"
                  onClick={() =>
                    navigate(
                      "/learning"
                    )
                  }
                >
                  📚 Back to Learning
                </button>

              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =====================================================
  // NORMAL LESSON SCREEN
  // =====================================================

  return (
    <div className="lesson-page">

      <div className="lesson-container">

        {/* BACK */}

        <button
          className="lesson-back"
          onClick={() =>
            navigate("/learning")
          }
        >
          ← Back to Learning
        </button>

        {/* HEADER */}

        <div className="lesson-header">

          <span className="lesson-label">
            📘 {subject}
          </span>

          <h1>
            {lesson.title}
          </h1>

          <p>
            Learn this concept step
            by step with a simple explanation.
          </p>

        </div>

        {/* OFFLINE DOWNLOAD CARD */}

        <div
          style={{
            marginBottom: "20px",
            padding: "18px 20px",
            borderRadius: "18px",
            background: isDownloaded
              ? "#ecfdf3"
              : "#f8fafc",
            border: `1px solid ${
              isDownloaded
                ? "#abefc6"
                : "#e4e7ec"
            }`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>

            <div
              style={{
                fontSize: "14px",
                fontWeight: "800",
                color: "#11162b",
                marginBottom: "5px",
              }}
            >
              {isDownloaded
                ? "✓ Available Offline"
                : "📥 Learn Without Internet"}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#667085",
              }}
            >
              {isDownloaded
                ? "This lesson is saved on your device."
                : "Download this lesson to access it when you are offline."}
            </div>

            {offlineMessage && (
              <div
                style={{
                  marginTop: "7px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: isDownloaded
                    ? "#067647"
                    : "#667085",
                }}
              >
                {offlineMessage}
              </div>
            )}
          </div>

          {isDownloaded ? (
            <button
              onClick={
                handleRemoveOffline
              }
              disabled={offlineLoading}
              style={{
                border: "1px solid #fda29b",
                background: "#fff",
                color: "#b42318",
                borderRadius: "10px",
                padding: "10px 15px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {offlineLoading
                ? "Removing..."
                : "Remove Download"}
            </button>
          ) : (
            <button
              onClick={
                handleDownloadOffline
              }
              disabled={offlineLoading}
              style={{
                border: "none",
                background:
                  "linear-gradient(135deg,#11162b,#3447a8)",
                color: "#fff",
                borderRadius: "10px",
                padding: "10px 17px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {offlineLoading
                ? "Please wait..."
                : "📥 Download for Offline"}
            </button>
          )}
        </div>

        {/* LESSON CARD */}

        <div className="lesson-card">

          <div className="lesson-icon">
            📖
          </div>

          <h2>
            What is {lesson.title}?
          </h2>

          <p>
            {lesson.explanation}
          </p>

        </div>

        {/* KEY POINTS */}

        <div className="lesson-card">

          <h2>
            💡 Key Points
          </h2>

          <div className="lesson-points">

            {lesson.points.map(
              (point, index) => (
                <div
                  className="lesson-point"
                  key={index}
                >
                  <span>
                    {index + 1}
                  </span>

                  <p>
                    {point}
                  </p>
                </div>
              )
            )}

          </div>

        </div>

        {/* EXAMPLE */}

        <div className="lesson-example">

          <span>
            ✨ Example
          </span>

          <p>
            {lesson.example}
          </p>

        </div>

        {/* COMPLETE LESSON */}

        <div
          style={{
            marginTop: "24px",
            padding: "22px",
            borderRadius: "18px",
            border: "1px solid #e4e7ec",
            background: "#ffffff",
            textAlign: "center",
          }}
        >

          {isCompleted ? (
            <>
              <div
                style={{
                  fontSize: "32px",
                  marginBottom: "8px",
                }}
              >
                ✅
              </div>

              <h2
                style={{
                  margin: "0 0 7px",
                  color: "#067647",
                }}
              >
                Lesson Completed
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#667085",
                }}
              >
                Great work! This topic is
                already marked as completed.
              </p>
            </>
          ) : (
            <>
              <h2>
                🎯 Finished this lesson?
              </h2>

              <p>
                Mark it as complete to
                update your learning progress.
              </p>

              <button
                onClick={
                  markLessonComplete
                }
                style={{
                  border: "none",
                  background:
                    "linear-gradient(135deg,#11162b,#3447a8)",
                  color: "#fff",
                  borderRadius: "11px",
                  padding: "12px 20px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                ✓ Mark as Complete
              </button>
            </>
          )}

        </div>

        {/* TEST CARD */}

        <div className="lesson-test-card">

          <div>

            <span>
              📝 TEST YOUR KNOWLEDGE
            </span>

            <h2>
              Ready to check your understanding?
            </h2>

            <p>
              Take a quick test and see how
              much you remember.
            </p>

          </div>

          <button
            onClick={() =>
              navigate(
                "/lesson",
                {
                  state: {
                    subject,
                    topic,
                    startTest: true,
                  },
                }
              )
            }
          >
            Start Test →
          </button>

        </div>

      </div>
    </div>
  );
}

export default Lesson;