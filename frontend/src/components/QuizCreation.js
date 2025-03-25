// src/components/QuizCreation.js
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./QuizCreation.css";

const QuizCreation = ({ quizzes, setQuizzes }) => {
  const [quizInput, setQuizInput] = useState({
    id: uuidv4(),
    question: "",
    type: "MCQ",
    options: ["", "", "", ""], // Default 4 options for MCQ
    correctAnswer: "0" // Default to first option
  });
  
  // Handle question type change
  const handleTypeChange = (e) => {
    const type = e.target.value;
    
    // Reset options and correct answer based on type
    let options = [];
    let correctAnswer = "";
    
    if (type === "MCQ") {
      options = ["", "", "", ""];
      correctAnswer = "0";
    } else if (type === "TF") {
      options = ["True", "False"];
      correctAnswer = "true";
    } else if (type === "SHORT") {
      options = [];
      correctAnswer = "";
    }
    
    setQuizInput({
      ...quizInput,
      type,
      options,
      correctAnswer
    });
  };
  
  // Handle option change for MCQ
  const handleOptionChange = (index, value) => {
    const newOptions = [...quizInput.options];
    newOptions[index] = value;
    setQuizInput({
      ...quizInput,
      options: newOptions
    });
  };
  
  // Handle correct answer change
  const handleCorrectAnswerChange = (value) => {
    setQuizInput({
      ...quizInput,
      correctAnswer: value
    });
  };
  
  // Add a new quiz
  const addQuiz = () => {
    // Validate based on type
    if (!quizInput.question.trim()) {
      alert("Please enter a question");
      return;
    }
    
    if (quizInput.type === "MCQ") {
      // Ensure at least 2 options are filled
      const filledOptions = quizInput.options.filter(opt => opt.trim() !== "");
      if (filledOptions.length < 2) {
        alert("Please provide at least 2 options for multiple choice");
        return;
      }
      
      // Remove empty options
      const cleanOptions = quizInput.options.filter(opt => opt.trim() !== "");
      
      // Add the quiz with clean options
      setQuizzes([
        ...quizzes,
        {
          ...quizInput,
          options: cleanOptions,
          // Ensure correctAnswer is valid if options were removed
          correctAnswer: parseInt(quizInput.correctAnswer) >= cleanOptions.length 
            ? "0" 
            : quizInput.correctAnswer
        }
      ]);
    } else if (quizInput.type === "TF") {
      // Ensure correctAnswer is "true" or "false"
      if (quizInput.correctAnswer !== "true" && quizInput.correctAnswer !== "false") {
        alert("Please select either True or False as the correct answer");
        return;
      }
      
      setQuizzes([
        ...quizzes,
        {
          ...quizInput,
          options: ["True", "False"]
        }
      ]);
    } else if (quizInput.type === "SHORT") {
      // Ensure a correct answer is provided
      if (!quizInput.correctAnswer.trim()) {
        alert("Please provide the expected answer for the short answer question");
        return;
      }
      
      setQuizzes([
        ...quizzes,
        {
          ...quizInput,
          options: []
        }
      ]);
    }
    
    // Reset the form with a new ID for the next quiz
    setQuizInput({
      id: uuidv4(),
      question: "",
      type: "MCQ",
      options: ["", "", "", ""],
      correctAnswer: "0"
    });
  };
  
  // Remove a quiz
  const removeQuiz = (id) => {
    setQuizzes(quizzes.filter(quiz => quiz.id !== id));
  };
  
  return (
    <div className="quizzes-section">
      <h3>Add Quizzes</h3>
      
      <div className="quiz-input-group">
        <div className="quiz-type-select mb-4">
          <label className="block mb-2">Question Type:</label>
          <select
            value={quizInput.type}
            onChange={handleTypeChange}
            className="form-control"
          >
            <option value="MCQ">Multiple Choice</option>
            <option value="TF">True/False</option>
            <option value="SHORT">Short Answer</option>
          </select>
        </div>
        
        <div className="quiz-question-input mb-4">
          <label className="block mb-2">Question:</label>
          <input
            type="text"
            placeholder="Enter quiz question"
            value={quizInput.question}
            onChange={(e) => setQuizInput({...quizInput, question: e.target.value})}
            className="form-control w-full"
          />
        </div>
        
        {quizInput.type === "MCQ" && (
          <div className="quiz-options-input mb-4">
            <label className="block mb-2">Options:</label>
            {quizInput.options.map((option, index) => (
              <div key={index} className="quiz-option-row flex items-center mb-2">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={parseInt(quizInput.correctAnswer) === index}
                  onChange={() => handleCorrectAnswerChange(index.toString())}
                  className="quiz-option-radio mr-2"
                />
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="form-control flex-grow"
                />
              </div>
            ))}
            <small className="form-text text-muted block mt-1">
              Select the radio button next to the correct answer.
            </small>
          </div>
        )}
        
        {quizInput.type === "TF" && (
          <div className="quiz-tf-input mb-4">
            <label className="block mb-2">Correct Answer:</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tfCorrectAnswer"
                  checked={quizInput.correctAnswer === "true"}
                  onChange={() => handleCorrectAnswerChange("true")}
                  className="mr-2"
                />
                True
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tfCorrectAnswer"
                  checked={quizInput.correctAnswer === "false"}
                  onChange={() => handleCorrectAnswerChange("false")}
                  className="mr-2"
                />
                False
              </label>
            </div>
          </div>
        )}
        
        {quizInput.type === "SHORT" && (
          <div className="quiz-short-answer-input mb-4">
            <label className="block mb-2">Correct Answer:</label>
            <input
              type="text"
              placeholder="Enter the expected answer"
              value={quizInput.correctAnswer}
              onChange={(e) => handleCorrectAnswerChange(e.target.value)}
              className="form-control w-full"
            />
            <small className="form-text text-muted block mt-1">
              The answer will be matched exactly (case-insensitive).
            </small>
          </div>
        )}
        
        <button
          type="button"
          onClick={addQuiz}
          className="btn btn-primary"
        >
          Add Quiz
        </button>
      </div>
      
      {quizzes.length > 0 && (
        <div className="quizzes-preview mt-6">
          <h4>Added Quizzes ({quizzes.length})</h4>
          <div className="quizzes-list">
            {quizzes.map((quiz, index) => (
              <div key={quiz.id} className="quiz-item border rounded p-4 mb-3">
                <div className="quiz-header flex justify-between mb-2">
                  <span className="quiz-number font-semibold">Quiz #{index + 1} ({quiz.type})</span>
                  <button 
                    type="button" 
                    onClick={() => removeQuiz(quiz.id)}
                    className="btn btn-sm btn-danger"
                  >
                    Remove
                  </button>
                </div>
                <div className="quiz-content">
                  <div className="quiz-question mb-2">{quiz.question}</div>
                  
                  {quiz.type === "MCQ" && (
                    <div className="quiz-options">
                      {quiz.options.map((option, optIndex) => (
                        <div 
                          key={optIndex} 
                          className={`quiz-option p-1 ${parseInt(quiz.correctAnswer) === optIndex ? 'font-semibold' : ''}`}
                        >
                          {option} {parseInt(quiz.correctAnswer) === optIndex && 
                            <span className="correct-marker text-green-600 ml-1">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {quiz.type === "TF" && (
                    <div className="quiz-tf-answer">
                      Correct answer: <span className="font-semibold">{quiz.correctAnswer === "true" ? "True" : "False"}</span>
                    </div>
                  )}
                  
                  {quiz.type === "SHORT" && (
                    <div className="quiz-short-answer">
                      Expected answer: <span className="font-semibold">{quiz.correctAnswer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizCreation;