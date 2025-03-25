import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./EditModule.css";

const EditModule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slides, setSlides] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState("slides");
  
  // Slide input state
  const [slideInput, setSlideInput] = useState({
    url: "",
    type: "text",
    description: "",
    text: ""
  });
  
  // Quiz input state
  const [quizInput, setQuizInput] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0
  });

  // Upload state
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      navigate("/login");
      return;
    }

    // Fetch module data
    const fetchModule = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/modules/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Set module data
        const moduleData = response.data;
        setTitle(moduleData.title);
        setContent(moduleData.content);
        
        // Ensure slides have unique IDs
        const slidesWithIds = moduleData.slides.map(slide => ({
          ...slide,
          id: slide._id || Date.now() + Math.random() // fallback ID if _id is not present
        }));
        setSlides(slidesWithIds);
        
        // Ensure quizzes have unique IDs
        const quizzesWithIds = moduleData.quizzes ? moduleData.quizzes.map(quiz => ({
          ...quiz,
          id: quiz._id || Date.now() + Math.random() // fallback ID if _id is not present
        })) : [];
        setQuizzes(quizzesWithIds);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching module:", error);
        alert("Failed to load module data. Please try again.");
        navigate("/admin");
      }
    };

    fetchModule();
  }, [id, navigate]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please select an image smaller than 5MB.");
      return;
    }

    setImageUploading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        "http://localhost:5000/modules/upload-image",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      // Use the returned URL
      setSlideInput({ ...slideInput, url: response.data.imageUrl });
      setImageUploading(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
      setImageUploading(false);
    }
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("Video is too large. Please select a video smaller than 50MB.");
      return;
    }

    setVideoUploading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("video", file);

      const response = await axios.post(
        "http://localhost:5000/modules/upload-video",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      // Use the returned URL
      setSlideInput({ ...slideInput, url: response.data.videoUrl });
      setVideoUploading(false);
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Failed to upload video. Please try again.");
      setVideoUploading(false);
    }
  };

  const addSlide = () => {
    let slideToAdd = { ...slideInput, id: Date.now() };

    if (slideInput.type === "image" && !slideInput.url) {
      alert("Please upload an image for the image slide.");
      return;
    }

    if (slideInput.type === "video" && !slideInput.url) {
      alert("Please upload a video for the video slide.");
      return;
    }

    if (slideInput.type !== "image" && slideInput.type !== "video" && !slideInput.url && !slideInput.text) {
      alert("Please provide either a URL or text content for the slide");
      return;
    }

    setSlides([...slides, slideToAdd]);
    setSlideInput({ url: "", type: "text", description: "", text: "" });
  };

  const removeSlide = (id) => {
    setSlides(slides.filter(slide => slide.id !== id));
  };

  const moveSlide = (id, direction) => {
    const currentIndex = slides.findIndex(slide => slide.id === id);
    if (
      (direction === "up" && currentIndex > 0) || 
      (direction === "down" && currentIndex < slides.length - 1)
    ) {
      const newSlides = [...slides];
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      
      // Swap the slides
      [newSlides[currentIndex], newSlides[targetIndex]] = 
      [newSlides[targetIndex], newSlides[currentIndex]];
      
      setSlides(newSlides);
    }
  };

  const addQuiz = () => {
    if (quizInput.question && quizInput.options.filter(option => option.trim() !== "").length >= 2) {
      setQuizzes([...quizzes, { ...quizInput, id: Date.now() }]);
      setQuizInput({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0
      });
    } else {
      alert("Please provide a question and at least two options");
    }
  };

  const removeQuiz = (id) => {
    setQuizzes(quizzes.filter(quiz => quiz.id !== id));
  };

  const handleQuizOptionChange = (index, value) => {
    const newOptions = [...quizInput.options];
    newOptions[index] = value;
    setQuizInput({ ...quizInput, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (slides.length === 0) {
      alert("Please add at least one slide to the module");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      
      // Prepare data for API
      const moduleData = {
        title,
        content,
        slides: slides.map(({ id, _id, ...rest }) => rest), // Remove temporary IDs
        quizzes: quizzes.map(({ id, _id, ...rest }) => rest) // Remove temporary IDs
      };
      
      await axios.put(`http://localhost:5000/modules/${id}`, moduleData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      alert("Module updated successfully!");
      navigate("/admin");
    } catch (error) {
      console.error("Error updating module:", error);
      alert("Failed to update module. Please try again.");
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );

  return (
    <div className="admin-container">
      <h1 className="admin-title">Edit Module</h1>
      
      <div className="module-creation-section">
        <h2>Edit Module: {title}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Content:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="form-control"
              rows="5"
              required
            />
          </div>
          
          <div className="tabs">
            <button 
              type="button" 
              className={`tab-button ${activeTab === 'slides' ? 'active' : ''}`}
              onClick={() => setActiveTab('slides')}
            >
              Slides ({slides.length})
            </button>
            <button 
              type="button" 
              className={`tab-button ${activeTab === 'quizzes' ? 'active' : ''}`}
              onClick={() => setActiveTab('quizzes')}
            >
              Quizzes ({quizzes.length})
            </button>
          </div>
          
          {activeTab === 'slides' && (
            <div className="slides-section">
              <h3>Add Slides</h3>
              
              <div className="slide-input-group">
                <div className="slide-type-select">
                  <label>Type:</label>
                  <select
                    value={slideInput.type}
                    onChange={(e) => setSlideInput({...slideInput, type: e.target.value})}
                    className="form-control"
                  >
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="image-text">Image with Text</option>
                  </select>
                </div>
                
                {(slideInput.type === "image" || slideInput.type === "video") ? (
                  <div className="slide-url-input">
                    <label>{slideInput.type === "image" ? "Image" : "Video"} Upload (Required)</label>
                    <input
                      type="file"
                      accept={slideInput.type === "image" ? "image/*" : "video/*"}
                      onChange={slideInput.type === "image" ? handleImageUpload : handleVideoUpload}
                      className="form-control"
                      disabled={imageUploading || videoUploading}
                      required
                    />
                    {(imageUploading || videoUploading) && 
                      <div className="upload-status">Uploading {slideInput.type}...</div>}
                    {slideInput.url && !(imageUploading || videoUploading) && (
                      <div className="upload-success">{slideInput.type} uploaded successfully!</div>
                    )}
                  </div>
                ) : (
                  <div className="slide-url-input">
                    <label>
                      URL {slideInput.type !== "text" ? "(Required)" : "(Optional)"}
                    </label>
                    <input
                      type="text"
                      placeholder={`${
                        slideInput.type === "image-text" ? "Image" : "Content"
                      } URL`}
                      value={slideInput.url}
                      onChange={(e) =>
                        setSlideInput({ ...slideInput, url: e.target.value })
                      }
                      className="form-control"
                      required={slideInput.type !== "text"}
                    />
                  </div>
                )}
              </div>
              
              {(slideInput.type === "text" || slideInput.type === "image-text") && (
                <div className="slide-text-input">
                  <label>Text Content:</label>
                  <textarea
                    placeholder="Enter text content for this slide"
                    value={slideInput.text}
                    onChange={(e) => setSlideInput({...slideInput, text: e.target.value})}
                    className="form-control"
                    rows="3"
                    required={slideInput.type === "text"}
                  />
                </div>
              )}
              
              <div className="slide-description-input">
                <label>Description:</label>
                <textarea
                  placeholder="Slide Description"
                  value={slideInput.description}
                  onChange={(e) => setSlideInput({...slideInput, description: e.target.value})}
                  className="form-control"
                  rows="2"
                />
              </div>
              
              <button
                type="button"
                onClick={addSlide}
                className="btn btn-primary"
              >
                Add Slide
              </button>
              
              {slides.length > 0 && (
                <div className="slides-preview">
                  <h4>Slides ({slides.length})</h4>
                  <div className="slides-list">
                    {slides.map((slide, index) => (
                      <div key={slide.id} className="slide-item">
                        <div className="slide-header">
                          <span className="slide-number">#{index + 1}</span>
                          <span className="slide-type">{slide.type}</span>
                          <div className="slide-controls">
                            <button 
                              type="button" 
                              onClick={() => moveSlide(slide.id, "up")}
                              disabled={index === 0}
                              className="btn btn-sm btn-outline"
                            >
                              ↑
                            </button>
                            <button 
                              type="button" 
                              onClick={() => moveSlide(slide.id, "down")}
                              disabled={index === slides.length - 1}
                              className="btn btn-sm btn-outline"
                            >
                              ↓
                            </button>
                            <button 
                              type="button" 
                              onClick={() => removeSlide(slide.id)}
                              className="btn btn-sm btn-danger"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                        <div className="slide-content">
                          {slide.type === "image" && slide.url && (
                            <div className="slide-image-preview">
                              <img 
                                src={slide.url} 
                                alt="Preview" 
                                onError={(e) => {
                                  console.error("Image failed to load:", slide.url);
                                  e.target.src = "https://via.placeholder.com/150?text=Image+Error";
                                }}
                              />
                            </div>
                          )}
                          {slide.type === "video" && slide.url && (
                            <div className="slide-video-preview">
                              <video 
                                src={slide.url} 
                                controls 
                                width="200"
                                onError={(e) => {
                                  console.error("Video failed to load:", slide.url);
                                  e.target.src = "";
                                }}
                              ></video>
                            </div>
                          )}
                          {(slide.type === "text" || slide.type === "image-text") && slide.text && (
                            <div className="slide-text-preview">{slide.text.substring(0, 100)}...</div>
                          )}
                          {slide.description && (
                            <div className="slide-description-preview">
                              <strong>Description:</strong> {slide.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'quizzes' && (
            <div className="quizzes-section">
              <h3>Add Quizzes</h3>
              
              <div className="quiz-input-group">
                <div className="quiz-question-input">
                  <label>Question:</label>
                  <input
                    type="text"
                    placeholder="Enter quiz question"
                    value={quizInput.question}
                    onChange={(e) => setQuizInput({...quizInput, question: e.target.value})}
                    className="form-control"
                  />
                </div>
                
                <div className="quiz-options-input">
                  <label>Options:</label>
                  {quizInput.options.map((option, index) => (
                    <div key={index} className="quiz-option-row">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={quizInput.correctAnswer === index}
                        onChange={() => setQuizInput({...quizInput, correctAnswer: index})}
                        className="quiz-option-radio"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleQuizOptionChange(index, e.target.value)}
                        className="form-control"
                      />
                    </div>
                  ))}
                  <small className="form-text text-muted">
                    Select the radio button next to the correct answer.
                  </small>
                </div>
                
                <button
                  type="button"
                  onClick={addQuiz}
                  className="btn btn-primary"
                >
                  Add Quiz
                </button>
              </div> 
              {quizzes.length > 0 && (
                <div className="quizzes-preview">
                  <h4>Quizzes ({quizzes.length})</h4>
                  <div className="quizzes-list">
                    {quizzes.map((quiz, index) => (
                      <div key={quiz.id} className="quiz-item">
                        <div className="quiz-header">
                          <span className="quiz-number">Quiz #{index + 1}</span>
                          <button 
                            type="button" 
                            onClick={() => removeQuiz(quiz.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="quiz-content">
                          <div className="quiz-question">{quiz.question}</div>
                          <div className="quiz-options">
                            {quiz.options.filter(option => option.trim() !== "").map((option, optIndex) => (
                              <div key={optIndex} className={`quiz-option ${quiz.correctAnswer === optIndex ? 'correct' : ''}`}>
                                {option} {quiz.correctAnswer === optIndex && <span className="correct-marker">✓</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-success"
            >
              Update Module
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModule;