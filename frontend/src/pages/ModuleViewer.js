import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ModuleViewer.css";
//import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const ModuleViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("slides");
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [progress, setProgress] = useState({
    completedSlides: [],
    totalSlides: 0,
    percentComplete: 0,
    status: "Not Started",
    lastSlideIndex: 0,
    canRetake: true
  });
  const calculateModuleStatus = (completedSlides, totalSlides) => {
    if (completedSlides.length === 0) {
      return "Not Started";
    } else if (completedSlides.length === totalSlides) {
      return "Completed";
    } else {
      return "In Progress";
    }
  };
  useEffect(() => {
    const fetchModule = async () => {
      try {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        setUserRole(role);

        // Fetch module content
        const response = await axios.get(`http://localhost:5000/modules/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setModule(response.data);

        // Initialize quiz answers
        if (response.data.quizzes && response.data.quizzes.length > 0) {
          const initialAnswers = {};
          response.data.quizzes.forEach((_, index) => {
            initialAnswers[index] = null;
          });
          setQuizAnswers(initialAnswers);
        }

        // Only get user-specific data if not admin
        if (role !== "admin") {
          try {
            // Fetch user progress for this module
            const progressResponse = await axios.get(`http://localhost:5000/progress/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const totalSlides = response.data.slides.length;
            
            // Update progress state with calculated status
            const updatedProgress = {
              ...progressResponse.data,
              totalSlides,
              percentComplete: Math.round((progressResponse.data.completedSlides.length / totalSlides) * 100),
              status: calculateModuleStatus(progressResponse.data.completedSlides, totalSlides)
            };
            
            setProgress(updatedProgress);
            
            // Set the current slide to last viewed
            if (progressResponse.data.lastSlideIndex !== undefined) {
              setCurrentSlideIndex(progressResponse.data.lastSlideIndex);
            }
            
            // Check if quiz has been taken already
            if (progressResponse.data.quizResults) {
              setQuizResults(progressResponse.data.quizResults.answers || {});
              setQuizSubmitted(true);
            }
          } catch (err) {
            console.error("Error fetching progress:", err);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching module:", error);
        alert("Failed to load module data.");
        navigate("/dashboard");
      }
    };

    fetchModule();
  }, [id, navigate]);

  // Track slide viewing and mark as completed
  useEffect(() => {
    const markSlideAsViewed = async () => {
      // Skip for admins or if module not loaded
      if (userRole === "admin" || !module || loading) return;
      
      try {
        const token = localStorage.getItem("token");
        
        // Mark the current slide as completed
        const response = await axios.post(
          "http://localhost:5000/progress/slide-complete",
          { moduleId: id, slideIndex: currentSlideIndex },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Log the response from the server
        //console.log("Slide completion response:", response.data);
        
        // Update the local progress state
        if (response.data.progress) {
          const { completedSlides, totalSlides, percentComplete } = response.data.progress;
          
          setProgress(prev => ({
            ...prev,
            completedSlides,
            totalSlides,
            percentComplete,
            status: calculateModuleStatus(completedSlides, totalSlides),
            lastSlideIndex: currentSlideIndex
          }));
        }
      } catch (error) {
        console.error("Error marking slide as completed:", error);
      }
    };
    markSlideAsViewed();
  }, [currentSlideIndex, id, module, userRole, loading]);

  const handleQuizAnswer = (quizIndex, value) => {
    if (userRole !== "admin") {
      setQuizAnswers({
        ...quizAnswers,
        [quizIndex]: value,
      });
    }
  };

  const handleSubmitQuiz = async () => {
    const results = {};
    let score = 0;
    
    module.quizzes.forEach((quiz, index) => {
      let isCorrect = false;
      const userAnswer = quizAnswers[index];
      
      if (quiz.type === "MCQ") {
        isCorrect = Number(userAnswer) === Number(quiz.correctAnswer);
      } 
      else if (quiz.type === "TF") {
        const userAnswerStr = userAnswer === 0 ? "true" : "false";
        isCorrect = userAnswerStr === String(quiz.correctAnswer).toLowerCase();
      } 
      else if (quiz.type === "SHORT") {
        isCorrect = String(userAnswer).trim().toLowerCase() === String(quiz.correctAnswer).trim().toLowerCase();
      }
      
      results[index] = {
        isCorrect,
        correctAnswer: quiz.correctAnswer,
        userAnswer: userAnswer
      };
      
      if (isCorrect) score++;
    });
    
    setQuizResults(results);
    setQuizSubmitted(true);
    
    // Save quiz results to the server
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/progress/quiz-results",
        { 
          moduleId: id, 
          score, 
          totalQuestions: module.quizzes.length,
          answers: results 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Error saving quiz results:", error);
    }
  };

  const handleRetakeQuiz = async () => {
    try {
      const token = localStorage.getItem("token");
      // Reset quiz results on the server
      const response = await axios.post(
        `http://localhost:5000/progress/reset-quiz/${id}`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // Reset local state
      setQuizSubmitted(false);
      setQuizResults({});
      
      // Reset answers
      const initialAnswers = {};
      module.quizzes.forEach((_, index) => {
        initialAnswers[index] = null;
      });
      setQuizAnswers(initialAnswers);
      if (response.data.progress) {
        setProgress(prev => ({
          ...prev,
          status: response.data.progress.status,
          quizResults: null
        }));
      }
    } catch (error) {
      console.error("Error resetting quiz:", error);
      alert("Failed to reset quiz. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (!module) {
    return <p>Module not found</p>;
  }

  return (
    <div className="module-viewer">
      {userRole !== "admin" && (
        <div className="progress-debug">
          <p>Status: {progress.status}</p>
          <p>Completed Slides: {progress.completedSlides.length} / {progress.totalSlides}</p>
          <p>Percent Complete: {progress.percentComplete}%</p>
        </div>
      )}
      <div className="module-header">
        <h1>{module.title}</h1>
        <p>{module.content}</p>
        {userRole !== "admin" && (
          <div className="module-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress.percentComplete}%` }}
              ></div>
            </div>
            <div className="progress-text">
              <span>Progress: {progress.percentComplete}%</span>
              <span>Status: {progress.status}</span>
              <span>Completed: {progress.completedSlides.length} of {progress.totalSlides} slides</span>
            </div>
          </div>
        )}
      </div>

      <div className="module-tabs">
        <button
          className={`tab-button ${activeTab === "slides" ? "active" : ""}`}
          onClick={() => setActiveTab("slides")}
        >
          Slides
        </button>
        {module.quizzes && module.quizzes.length > 0 && (
          <button
            className={`tab-button ${activeTab === "quizzes" ? "active" : ""}`}
            onClick={() => setActiveTab("quizzes")}
          >
            Quizzes
          </button>
        )}
      </div>

      {activeTab === "slides" && (
        <div className="slides-container">
          {module.slides && module.slides.length > 0 ? (
            <div className="slide-content">
              {/* Slide completion indicator */}
              {userRole !== "admin" && (
                <div className="slide-status">
                  <span className={
                    progress.completedSlides.includes(currentSlideIndex) 
                      ? "slide-completed" 
                      : "slide-incomplete"
                  }>
                    {progress.completedSlides.includes(currentSlideIndex) 
                      ? "✓ Slide completed" 
                      : "○ Slide not completed"}
                  </span>
                </div>
              )}
            
              {module.slides[currentSlideIndex]?.type === "text" && (
                <div className="slide-text">{module.slides[currentSlideIndex].text}</div>
              )}
              
              {module.slides[currentSlideIndex]?.type === "image" && (
                <div className="slide-image-container">
                  <img
                    src={module.slides[currentSlideIndex].url}
                    alt={module.slides[currentSlideIndex].description || "Slide"}
                    className="slide-image"
                    onError={(e) => {
                      console.error("Image failed to load:", module.slides[currentSlideIndex].url);
                      e.target.src = "https://via.placeholder.com/300?text=Image+Not+Found";
                    }}
                  />
                  {module.slides[currentSlideIndex].description && (
                    <div className="slide-description">
                      {module.slides[currentSlideIndex].description}
                    </div>
                  )}
                </div>
              )}

              {module.slides[currentSlideIndex]?.type === "video" && (
                <div className="slide-video-container">
                  <video 
                    src={module.slides[currentSlideIndex].url} 
                    controls
                    className="slide-video"
                    onError={(e) => {
                      console.error("Video failed to load:", module.slides[currentSlideIndex].url);
                      e.target.src = ""; // Clear source on error
                    }}
                  />
                  {module.slides[currentSlideIndex].description && (
                    <div className="slide-description">
                      {module.slides[currentSlideIndex].description}
                    </div>
                  )}
                </div>
              )}
              
              <div className="slide-navigation">
                <button
                  onClick={() => setCurrentSlideIndex((prev) => prev - 1)}
                  disabled={currentSlideIndex === 0}
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentSlideIndex((prev) => prev + 1)}
                  disabled={currentSlideIndex === module.slides.length - 1}
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <p>No slides available</p>
          )}
        </div>
      )}

      {activeTab === "quizzes" && (
        <div className="quizzes-container">
          {module.quizzes && module.quizzes.length > 0 ? (
            <div className="quiz-section">
              <h2>Module Quiz</h2>
              
              {module.quizzes.map((quiz, quizIndex) => (
                <div key={quizIndex} className="quiz-question">
                  <h3>Question {quizIndex + 1}: {quiz.question}</h3>

                  {quiz.type === "TF" ? (
                    <div className="quiz-options">
                      <div className="quiz-option">
                        <label>
                          <input
                            type="radio"
                            name={`quiz-${quizIndex}`}
                            value={0}
                            checked={quizAnswers[quizIndex] === 0}
                            onChange={() => handleQuizAnswer(quizIndex, 0)}
                            disabled={userRole === "admin" || quizSubmitted}
                          />
                          True
                        </label>
                      </div>
                      <div className="quiz-option">
                        <label>
                          <input
                            type="radio"
                            name={`quiz-${quizIndex}`}
                            value={1}
                            checked={quizAnswers[quizIndex] === 1}
                            onChange={() => handleQuizAnswer(quizIndex, 1)}
                            disabled={userRole === "admin" || quizSubmitted}
                          />
                          False
                        </label>
                      </div>
                    </div>
                  ) : quiz.type === "MCQ" ? (
                    <div className="quiz-options">
                      {quiz.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="quiz-option">
                          <label>
                            <input
                              type="radio"
                              name={`quiz-${quizIndex}`}
                              value={optionIndex}
                              checked={quizAnswers[quizIndex] === optionIndex}
                              onChange={() => handleQuizAnswer(quizIndex, optionIndex)}
                              disabled={userRole === "admin" || quizSubmitted}
                            />
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : quiz.type === "SHORT" && (
                    <div className="quiz-options">
                      <div className="quiz-short-answer">
                        <input
                          type="text"
                          placeholder="Type your answer here"
                          value={quizAnswers[quizIndex] || ""}
                          onChange={(e) => handleQuizAnswer(quizIndex, e.target.value)}
                          disabled={userRole === "admin" || quizSubmitted}
                          className="form-control w-full p-2 border rounded"
                        />
                      </div>
                    </div>
                  )}

                  {quizSubmitted && quizResults[quizIndex] && (
                    <p className={`quiz-feedback ${quizResults[quizIndex].isCorrect ? "correct" : "incorrect"}`}>
                      {quizResults[quizIndex].isCorrect 
                        ? "Correct!" 
                        : quiz.type === "TF"
                          ? `Incorrect! Correct answer: ${String(quiz.correctAnswer).toLowerCase() === "true" ? "True" : "False"}`
                          : quiz.type === "MCQ"
                            ? `Incorrect! Correct answer: ${quiz.options[Number(quiz.correctAnswer)]}`
                            : `Incorrect! Correct answer: ${quiz.correctAnswer}`
                      }
                    </p>
                  )}
                </div>
              ))}

              {userRole !== "admin" && !quizSubmitted && (
                <button onClick={handleSubmitQuiz} className="submit-quiz-button">
                  Submit Quiz
                </button>
              )}

              {quizSubmitted && (
                <div className="quiz-results">
                  <h3>Quiz Results</h3>
                  <p>
                    Score:{" "}
                    {Object.values(quizResults).filter((result) => result.isCorrect).length} /{" "}
                    {module.quizzes.length}
                  </p>
                  <button 
                    onClick={handleRetakeQuiz} 
                    className="retake-quiz-button"
                  >
                    Retake Quiz
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p>No quizzes available</p>
          )}
        </div>
      )}

      <button onClick={() => navigate("/admin")} className="back-button">
        Back to Dashboard
      </button>
    </div>
  );
};

export default ModuleViewer;