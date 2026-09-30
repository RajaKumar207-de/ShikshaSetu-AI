import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  saveOfflineLesson,
  getOfflineLesson,
  deleteOfflineLesson,
} from "../utils/offlineDB";

function Lesson() {
  const location = useLocation();
  const navigate = useNavigate();

  const subject =
    location.state?.subject || "Mathematics";

  const topic =
    location.state?.topic || "Number System";

  const startTest =
    location.state?.startTest || false;

  // =====================================================
  // LESSON LIBRARY
  // =====================================================

  const lessonLibrary = {
    Mathematics: {
      "Number System": {
        title: "Number System",
        explanation:
          "The number system is used to represent and classify different types of numbers.",
        points: [
          "Natural numbers start from 1.",
          "Whole numbers include 0.",
          "Integers include positive and negative numbers.",
          "Rational numbers can be written in the form p/q.",
        ],
        example:
          "Example: 5, 10 and 25 are natural numbers. -3 and -7 are integers.",
      },

      Algebra: {
        title: "Algebra",
        explanation:
          "Algebra uses letters and symbols to represent unknown values.",
        points: [
          "Variables represent unknown values.",
          "Constants are fixed values.",
          "Expressions can contain numbers and variables.",
          "Equations contain an equal sign.",
        ],
        example:
          "Example: In x + 5 = 10, x is the unknown value.",
      },

      Geometry: {
        title: "Geometry",
        explanation:
          "Geometry is the study of shapes, sizes, angles and measurements.",
        points: [
          "A triangle has 3 sides.",
          "A square has 4 equal sides.",
          "A rectangle has opposite sides equal.",
          "A circle has a centre and radius.",
        ],
        example:
          "Example: The sum of angles of a triangle is 180°.",
      },

      Percentage: {
        title: "Percentage",
        explanation:
          "Percentage represents a number as a fraction of 100.",
        points: [
          "Percentage means per hundred.",
          "25% means 25 out of 100.",
          "50% means half.",
          "100% means the complete amount.",
        ],
        example:
          "Example: 25% of 200 = 50.",
      },

      "Ratio and Proportion": {
        title: "Ratio and Proportion",
        explanation:
          "Ratio compares two quantities, while proportion shows that two ratios are equal.",
        points: [
          "Ratio compares two quantities.",
          "Ratio is written using ':'.",
          "Proportion means two ratios are equal.",
          "Ratios can be simplified.",
        ],
        example:
          "Example: 2:4 can be simplified to 1:2.",
      },
    },

    Science: {
      Physics: {
        title: "Physics",
        explanation:
          "Physics studies matter, energy, motion, force and the laws of nature.",
        points: [
          "Force can change motion.",
          "Gravity pulls objects towards Earth.",
          "Energy can change from one form to another.",
          "Motion describes a change in position.",
        ],
        example:
          "Example: A ball falling towards the ground is an effect of gravity.",
      },

      Chemistry: {
        title: "Chemistry",
        explanation:
          "Chemistry studies matter, its properties and the changes it undergoes.",
        points: [
          "Matter exists as solid, liquid and gas.",
          "Atoms are building blocks of matter.",
          "Elements contain one type of atom.",
          "Chemical reactions create new substances.",
        ],
        example:
          "Example: Water is made from hydrogen and oxygen.",
      },

      Biology: {
        title: "Biology",
        explanation:
          "Biology is the study of living organisms and their life processes.",
        points: [
          "Cells are basic units of life.",
          "Plants can make food through photosynthesis.",
          "Animals have different organ systems.",
          "Living organisms grow and reproduce.",
        ],
        example:
          "Example: Plants use sunlight to make food.",
      },

      Environment: {
        title: "Environment",
        explanation:
          "The environment includes living and non-living things around us.",
        points: [
          "Air, water and soil are important resources.",
          "Plants and animals depend on ecosystems.",
          "Pollution can harm the environment.",
          "Conservation protects natural resources.",
        ],
        example:
          "Example: Planting trees helps improve the environment.",
      },

      "Human Body": {
        title: "Human Body",
        explanation:
          "The human body contains organs and systems that work together.",
        points: [
          "The heart pumps blood.",
          "The lungs help us breathe.",
          "The brain controls many body functions.",
          "The digestive system processes food.",
        ],
        example:
          "Example: The lungs take oxygen into the body.",
      },
    },

    Computer: {
      "Computer Basics": {
        title: "Computer Basics",
        explanation:
          "Computer basics introduce hardware, software, input, output and storage.",
        points: [
          "CPU processes instructions.",
          "Keyboard is an input device.",
          "Monitor is an output device.",
          "Storage keeps data for later use.",
        ],
        example:
          "Example: A keyboard is used to enter text into a computer.",
      },

      "Programming Basics": {
        title: "Programming Basics",
        explanation:
          "Programming is the process of writing instructions for a computer.",
        points: [
          "Variables store values.",
          "Conditions control decisions.",
          "Loops repeat instructions.",
          "Functions organize reusable code.",
        ],
        example:
          "Example: A loop can repeat a task multiple times.",
      },

      "Web Development": {
        title: "Web Development",
        explanation:
          "Web development is the process of building websites and web applications.",
        points: [
          "HTML creates page structure.",
          "CSS controls appearance.",
          "JavaScript adds behavior.",
          "Frontend runs in the browser.",
        ],
        example:
          "Example: HTML creates a heading and CSS changes its appearance.",
      },

      Database: {
        title: "Database",
        explanation:
          "A database stores and manages structured information.",
        points: [
          "Tables can store related data.",
          "Rows represent records.",
          "Columns represent fields.",
          "Queries help retrieve data.",
        ],
        example:
          "Example: A student database can store names, emails and courses.",
      },

      "Cyber Security": {
        title: "Cyber Security",
        explanation:
          "Cyber security protects systems, networks and information from attacks.",
        points: [
          "Passwords should be strong.",
          "Never share sensitive information carelessly.",
          "Updates can fix security problems.",
          "Phishing messages can steal information.",
        ],
        example:
          "Example: A strong password reduces the risk of account compromise.",
      },
    },

    English: {
      Grammar: {
        title: "Grammar",
        explanation:
          "Grammar provides rules for forming correct sentences.",
        points: [
          "A sentence normally has a clear structure.",
          "Verbs describe actions or states.",
          "Nouns name people, places or things.",
          "Adjectives describe nouns.",
        ],
        example:
          "Example: 'She reads a book' is a simple sentence.",
      },

      Vocabulary: {
        title: "Vocabulary",
        explanation:
          "Vocabulary means the words a person knows and uses.",
        points: [
          "Reading helps build vocabulary.",
          "Synonyms have similar meanings.",
          "Antonyms have opposite meanings.",
          "Context helps understand new words.",
        ],
        example:
          "Example: 'Happy' and 'joyful' are synonyms.",
      },

      Speaking: {
        title: "Speaking",
        explanation:
          "Speaking practice helps improve confidence and communication.",
        points: [
          "Speak clearly.",
          "Use simple sentences.",
          "Listen carefully.",
          "Practice every day.",
        ],
        example:
          "Example: Introduce yourself using your name, study and goals.",
      },

      Reading: {
        title: "Reading",
        explanation:
          "Reading helps improve vocabulary, comprehension and communication.",
        points: [
          "Read slowly when a topic is difficult.",
          "Identify the main idea.",
          "Look for important details.",
          "Learn new words from context.",
        ],
        example:
          "Example: After reading a paragraph, explain its main idea.",
      },

      Communication: {
        title: "Communication",
        explanation:
          "Communication is the process of sharing ideas and information clearly.",
        points: [
          "Good communication requires listening.",
          "Use clear and simple language.",
          "Body language also communicates meaning.",
          "Confidence improves with practice.",
        ],
        example:
          "Example: Explain an idea using a clear beginning, middle and end.",
      },
    },
  };

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

  const testQuestions = {
    Mathematics: [
      {
        question:
          "What is 25% of 200?",
        options: [
          "25",
          "40",
          "50",
          "75",
        ],
        answer: "50",
      },
      {
        question:
          "Which number is a natural number?",
        options: [
          "-5",
          "0",
          "7",
          "-2",
        ],
        answer: "7",
      },
      {
        question:
          "What is the value of 10 + 5?",
        options: [
          "10",
          "15",
          "20",
          "25",
        ],
        answer: "15",
      },
      {
        question:
          "How many sides does a triangle have?",
        options: [
          "2",
          "3",
          "4",
          "5",
        ],
        answer: "3",
      },
      {
        question:
          "What is 50% of 100?",
        options: [
          "25",
          "40",
          "50",
          "75",
        ],
        answer: "50",
      },
    ],

    Science: [
      {
        question:
          "Which organ helps us to breathe?",
        options: [
          "Heart",
          "Lungs",
          "Brain",
          "Stomach",
        ],
        answer: "Lungs",
      },
      {
        question:
          "What is H2O commonly called?",
        options: [
          "Salt",
          "Water",
          "Oxygen",
          "Hydrogen",
        ],
        answer: "Water",
      },
      {
        question:
          "Which planet do we live on?",
        options: [
          "Mars",
          "Venus",
          "Earth",
          "Jupiter",
        ],
        answer: "Earth",
      },
      {
        question:
          "What force pulls objects towards Earth?",
        options: [
          "Friction",
          "Gravity",
          "Magnetism",
          "Pressure",
        ],
        answer: "Gravity",
      },
      {
        question:
          "Which gas do humans need to breathe?",
        options: [
          "Oxygen",
          "Carbon dioxide",
          "Hydrogen",
          "Nitrogen",
        ],
        answer: "Oxygen",
      },
    ],

    Computer: [
      {
        question:
          "What does CPU stand for?",
        options: [
          "Central Processing Unit",
          "Computer Personal Unit",
          "Central Program Unit",
          "Control Processing User",
        ],
        answer:
          "Central Processing Unit",
      },
      {
        question:
          "Which device is used to type text?",
        options: [
          "Mouse",
          "Keyboard",
          "Monitor",
          "Speaker",
        ],
        answer: "Keyboard",
      },
      {
        question:
          "Which one is a programming language?",
        options: [
          "HTML",
          "JavaScript",
          "Chrome",
          "Windows",
        ],
        answer: "JavaScript",
      },
      {
        question:
          "What does WWW stand for?",
        options: [
          "World Wide Web",
          "World Web Window",
          "Web World Wide",
          "Wide World Web",
        ],
        answer:
          "World Wide Web",
      },
      {
        question:
          "Which device displays computer output?",
        options: [
          "Keyboard",
          "Mouse",
          "Monitor",
          "CPU",
        ],
        answer: "Monitor",
      },
    ],

    English: [
      {
        question:
          "Which word is a noun?",
        options: [
          "Run",
          "Beautiful",
          "Teacher",
          "Quickly",
        ],
        answer: "Teacher",
      },
      {
        question:
          "What is the past tense of 'go'?",
        options: [
          "Goed",
          "Gone",
          "Went",
          "Going",
        ],
        answer: "Went",
      },
      {
        question:
          "Choose the correct sentence.",
        options: [
          "He go to school.",
          "He goes to school.",
          "He going school.",
          "He gone school.",
        ],
        answer:
          "He goes to school.",
      },
      {
        question:
          "Which word is an adjective?",
        options: [
          "Beautiful",
          "Run",
          "School",
          "Quickly",
        ],
        answer: "Beautiful",
      },
      {
        question:
          "What is the opposite of 'hot'?",
        options: [
          "Warm",
          "Cold",
          "Big",
          "Fast",
        ],
        answer: "Cold",
      },
    ],
  };

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