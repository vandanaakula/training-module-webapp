import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [shortAnswer, setShortAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [previousResult, setPreviousResult] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // First check if the user has already completed this quiz
    axios.get(`http://localhost:5000/quizzes/results/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        console.log("Previous quiz results found:", res.data);
        // If we get a result, the user has already taken this quiz
        setPreviousResult(res.data);
        // Continue to fetch the module data
        fetchModuleData(token);
      })
      .catch(err => {
        // If 404, user hasn't taken the quiz yet, which is fine
        if (err.response && err.response.status === 404) {
          // Continue to fetch the module data
          fetchModuleData(token);
        } else {
          console.error("Error checking quiz results:", err);
          setError("Failed to check previous quiz attempts");
          setLoading(false);
        }
      });
  }, [id]);

  const fetchModuleData = (token) => {
    // Fetch the module with quizzes
    axios.get(`http://localhost:5000/modules/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setModule(res.data);
        if (res.data.quizzes && res.data.quizzes.length > 0) {
          // Fixed: Properly format the quiz data
          const formattedQuizzes = res.data.quizzes.map(quiz => {
            // For MCQ questions, ensure correctAnswer is a number
            let correctedAnswer = quiz.correctAnswer;
            if (quiz.type === 'MCQ') {
              correctedAnswer = Number(quiz.correctAnswer);
            }
            return {
              ...quiz,
              correctAnswer: quiz.type === 'MCQ' ? Number(quiz.correctAnswer) : quiz.correctAnswer,
            };
          });
          setQuestions(formattedQuizzes);
        } else {
          setError("No quiz questions found for this module");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching quiz:", err);
        setError("Failed to load quiz data");
        setLoading(false);
      });
  };

  const handleMCQAnswer = (selectedIndex) => {
    const currentQ = questions[currentQuestion];
    
    // Fixed: Ensure we're comparing numbers for MCQ
    const correctAnswer = Number(currentQ.correctAnswer);
    const userAnswer = Number(selectedIndex);
    const isCorrect = selectedIndex === correctAnswer;
    
    // Save the user's answer
    const answerData = {
      questionId: currentQ._id || currentQuestion,
      userAnswer: selectedIndex,
      correctAnswer: correctAnswer,
      isCorrect
    };
    
    setUserAnswers([...userAnswers, answerData]);
    
    if (isCorrect) {
      setScore(score + 1);
      setFeedback({
        isCorrect: true,
        message: "Correct!"
      });
    } else {
      setFeedback({
        isCorrect: false,
        message: `Incorrect! Correct answer: ${currentQ.options[correctAnswer]}`
      });
    }
    // Move to next question after a delay
    setTimeout(() => {
      setCurrentQuestion(currentQuestion + 1);
      setFeedback(null);
    }, 1500);
  };

  const handleTrueFalseAnswer = (answer) => {
    const currentQ = questions[currentQuestion];
    // Fixed: Convert to string for comparison of true/false
    const userAnswerStr = String(answer).toLowerCase();
    const correctAnswerStr = String(currentQ.correctAnswer).toLowerCase();
    const isCorrect = userAnswerStr === correctAnswerStr;
    
    const answerData = {
      questionId: currentQ._id || currentQuestion,
      userAnswer: userAnswerStr,
      correctAnswer: correctAnswerStr,
      isCorrect
    };
    
    setUserAnswers([...userAnswers, answerData]);
    
    if (isCorrect) {
      setScore(score + 1);
      setFeedback({
        isCorrect: true,
        message: "Correct!"
      });
    } else {
      setFeedback({
        isCorrect: false,
        message: `Incorrect! Correct answer: ${correctAnswerStr === "true" ? "True" : "False"}`
      });
    }
    
    setTimeout(() => {
      setCurrentQuestion(currentQuestion + 1);
      setFeedback(null);
    }, 1500);
  };

  const handleShortAnswerSubmit = () => {
    const currentQ = questions[currentQuestion];
    // Fixed: Improved short answer comparison
    const userAnswerClean = shortAnswer.trim().toLowerCase();
    const correctAnswerClean = String(currentQ.correctAnswer).trim().toLowerCase();
    
    // Check if the answers match exactly (case-insensitive)
    const isCorrect = userAnswerClean === correctAnswerClean;
    
    const answerData = {
      questionId: currentQ._id || currentQuestion,
      userAnswer: shortAnswer,
      correctAnswer: currentQ.correctAnswer,
      isCorrect
    };
    
    setUserAnswers([...userAnswers, answerData]);
    
    if (isCorrect) {
      setScore(score + 1);
      setFeedback({
        isCorrect: true,
        message: "Correct!"
      });
    } else {
      setFeedback({
        isCorrect: false,
        message: `Incorrect! Correct answer: ${currentQ.correctAnswer}`
      });
    }
    
    // Clear the input for the next question
    setShortAnswer("");
    
    setTimeout(() => {
      setCurrentQuestion(currentQuestion + 1);
      setFeedback(null);
    }, 1500);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setUserAnswers([]);
    setShortAnswer("");
    setSubmitted(false);
    setFeedback(null);
    setPreviousResult(null);
  };

  const exitQuiz = () => {
    navigate(`/module/${id}`);
  };

  const saveQuizResults = () => {
    const token = localStorage.getItem("token");
    
    axios.post(`http://localhost:5000/quizzes/results`, {
      moduleId: id,
      score: score,
      totalQuestions: questions.length,
      answers: userAnswers
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        console.log("Quiz results saved successfully");
        // Update the previous result with the newly saved data
        setPreviousResult(res.data);
      })
      .catch(err => {
        console.error("Error saving quiz results:", err);
      });
  };

  // If we've finished all questions, save the results and show the results screen
  useEffect(() => {
    if (currentQuestion >= questions.length && questions.length > 0 && userAnswers.length > 0) {
      saveQuizResults();
    }
  }, [currentQuestion, questions.length]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p>{error}</p>
          <button 
            onClick={() => navigate(`/module/${id}`)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Module
          </button>
        </div>
      </div>
    );
  }

  // If the user has already completed this quiz and we're not currently in a new attempt
  if (previousResult && currentQuestion === 0 && userAnswers.length === 0) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-center mb-6">Previous Quiz Results</h1>
          
          <div className="text-center mb-6">
            <div className="text-5xl font-bold mb-2">
              {previousResult.score} / {previousResult.totalQuestions}
            </div>
            <div className="text-xl">
              {(previousResult.score / previousResult.totalQuestions * 100).toFixed(0)}% Score
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Attempts: {previousResult.attempts}
            </div>
            <div className="text-sm text-gray-600">
              Last attempted: {new Date(previousResult.attemptedAt).toLocaleDateString()}
            </div>
          </div>
          
          <div className="border-t border-b py-4 my-4">
            <h2 className="text-xl font-semibold mb-4">Previous Answers:</h2>
            {previousResult.answers.map((answer, index) => {
              return (
                <div key={index} className={`mb-4 p-3 rounded ${answer.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                  <div className="font-medium">{index + 1}. {questions[index]?.question || "Question"}</div>
                  <div className="flex justify-between mt-2 text-sm">
                    <div>
                      <span className="font-medium">Your answer:</span> {
                        questions[index]?.type === 'MCQ' && questions[index]?.options 
                          ? questions[index].options[Number(answer.userAnswer)]
                          : questions[index]?.type === 'TF'
                            ? answer.userAnswer === "true" ? "True" : "False"
                            : answer.userAnswer
                      }
                    </div>
                    {!answer.isCorrect && (
                      <div>
                        <span className="font-medium">Correct answer:</span> {
                          questions[index]?.type === 'MCQ' && questions[index]?.options 
                            ? questions[index].options[Number(answer.correctAnswer)]
                            : questions[index]?.type === 'TF'
                              ? answer.correctAnswer === "true" ? "True" : "False"
                              : answer.correctAnswer
                        }
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              onClick={restartQuiz}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retake Quiz
            </button>
            <button
              onClick={exitQuiz}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Return to Module
            </button>
          </div>
        </div>
      </div>
    );
  }
  // If we've finished all questions, show the results
  if (currentQuestion >= questions.length) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-center mb-6">Quiz Complete!</h1>
          
          <div className="text-center mb-6">
            <div className="text-5xl font-bold mb-2">
              {score} / {questions.length}
            </div>
            <div className="text-xl">
              {(score / questions.length * 100).toFixed(0)}% Score
            </div>
          </div>
          
          <div className="border-t border-b py-4 my-4">
            <h2 className="text-xl font-semibold mb-4">Question Summary:</h2>
            {userAnswers.map((answer, index) => {
              const question = questions[index];
              let userAnswerDisplay = answer.userAnswer;
              let correctAnswerDisplay = answer.correctAnswer;

              // Format the display of answers based on question type
              if (question.type === 'MCQ' && question.options) {
                userAnswerDisplay = question.options[answer.userAnswer];
                correctAnswerDisplay = question.options[answer.correctAnswer];
              } else if (question.type === 'TF') {
                userAnswerDisplay = answer.userAnswer === "true" ? "True" : "False";
                correctAnswerDisplay = answer.correctAnswer === "true" ? "True" : "False";
              }

              return (
                <div key={index} className={`mb-4 p-3 rounded ${answer.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                  <div className="font-medium">{index + 1}. {question.question}</div>
                  <div className="flex justify-between mt-2 text-sm">
                    <div>
                      <span className="font-medium">Your answer:</span> {userAnswerDisplay}
                    </div>
                    {!answer.isCorrect && (
                      <div>
                        <span className="font-medium">Correct answer:</span> {correctAnswerDisplay}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              onClick={restartQuiz}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Restart Quiz
            </button>
            <button
              onClick={exitQuiz}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Return to Module
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the current question
  const currentQ = questions[currentQuestion];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {module?.title} - Quiz
          </h1>
          <div className="text-sm">
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl mb-4">
            {currentQ.question}
          </h2>
          
          {currentQ.type === 'MCQ' && (
            <div className="grid gap-3">
              {currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMCQAnswer(idx)}
                  className="p-3 text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
          
          {currentQ.type === 'TF' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTrueFalseAnswer("true")}
                className="p-3 text-center bg-green-50 hover:bg-green-100 border border-green-200 rounded transition"
              >
                True
              </button>
              <button
                onClick={() => handleTrueFalseAnswer("false")}
                className="p-3 text-center bg-red-50 hover:bg-red-100 border border-red-200 rounded transition"
              >
                False
              </button>
            </div>
          )}
          
          {currentQ.type === 'SHORT' && (
            <div>
              <textarea
                value={shortAnswer}
                onChange={(e) => setShortAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-3 border rounded resize-none h-32"
              ></textarea>
              <button
                onClick={handleShortAnswerSubmit}
                disabled={!shortAnswer.trim()}
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </div>
          )}
          
          {feedback && (
            <div className={`mt-4 p-3 rounded text-center ${feedback.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {feedback.message}
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-10">
          <div className="text-sm text-gray-500">
            Score: {score} / {currentQuestion}
          </div>
          <button
            onClick={exitQuiz}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Exit Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;