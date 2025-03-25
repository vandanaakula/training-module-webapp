import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminPanel.css";
import QuizCreation from "../components/QuizCreation";

const AdminPanel = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slides, setSlides] = useState([]);
  const [slideInput, setSlideInput] = useState({
    url: "",
    type: "text",
    description: "",
    text: "",
  });
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("slides");
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  // Quiz state
  const [quizzes, setQuizzes] = useState([]);
  const [quizInput, setQuizInput] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      navigate("/login");
      return;
    }

    // Fetch existing modules
    const fetchModules = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/modules", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setModules(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching modules:", error);
        setLoading(false);
      }
    };

    fetchModules();
  }, [navigate]);

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
      console.log("Image upload response:", response.data);
      // Use the returned URL instead of base64
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
      console.log("Video upload response:", response.data);
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
    setSlides(slides.filter((slide) => slide.id !== id));
  };

  const moveSlide = (id, direction) => {
    const currentIndex = slides.findIndex((slide) => slide.id === id);
    if (
      (direction === "up" && currentIndex > 0) ||
      (direction === "down" && currentIndex < slides.length - 1)
    ) {
      const newSlides = [...slides];
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      // Swap the slides
      [newSlides[currentIndex], newSlides[targetIndex]] = [
        newSlides[targetIndex],
        newSlides[currentIndex],
      ];

      setSlides(newSlides);
    }
  };

  const addQuiz = () => {
    if (
      quizInput.question &&
      quizInput.options.filter((option) => option.trim() !== "").length >= 2
    ) {
      setQuizzes([...quizzes, { ...quizInput, id: Date.now() }]);
      setQuizInput({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      });
    } else {
      alert("Please provide a question and at least two options");
    }
  };

  const removeQuiz = (id) => {
    setQuizzes(quizzes.filter((quiz) => quiz.id !== id));
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
      setLoading(true);
      const token = localStorage.getItem("token");
      // Prepare slides data - remove unnecessary client-side IDs
      const sanitizedSlides = slides.map(({ id, ...rest }) => rest);
      
      // Prepare quizzes data - remove unnecessary client-side IDs
      const sanitizedQuizzes = quizzes.map(({ id, ...rest }) => rest);
      await axios.post(
        "http://localhost:5000/modules/create",
        {
          title,
          content,
          slides: sanitizedSlides,
          quizzes: sanitizedQuizzes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setLoading(false);
      alert("Module created successfully!");
      navigate("/admin");
    } catch (error) {
      setLoading(false);
      console.error("Error creating module:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        alert(`Failed to create module: ${error.response.data.error || 'Server error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        alert("Failed to create module: No response from server. Check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        alert(`Failed to create module: ${error.message}`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token
    localStorage.removeItem("role"); // Remove role if stored
    alert("Logged out successfully!");
    navigate("/login"); // Navigate to login page
  };
  

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Panel</h1>

      <div className="module-creation-section">
        <h2>Create New Module</h2>
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
          <button
            onClick={() => handleLogout()}
            className="btn btn-danger logout-btn"
          >
            Logout
          </button>

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
              className={`tab-button ${activeTab === "slides" ? "active" : ""}`}
              onClick={() => setActiveTab("slides")}
            >
              Slides ({slides.length})
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === "quizzes" ? "active" : ""}`}
              onClick={() => setActiveTab("quizzes")}
            >
              Quizzes ({quizzes.length})
            </button>
          </div>

          {activeTab === "slides" && (
            <div className="slides-section">
              <h3>Add Slides</h3>

              <div className="slide-input-group">
                <div className="slide-type-select">
                  <label>Type:</label>
                  <select
                    value={slideInput.type}
                    onChange={(e) =>
                      setSlideInput({ ...slideInput, type: e.target.value })
                    }
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
                  <h4>Added Slides ({slides.length})</h4>
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
            <QuizCreation quizzes={quizzes} setQuizzes={setQuizzes} />
          )}
          
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-success"
            >
              Create Module
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
      
      <div className="existing-modules-section">
        <h2>Existing Modules</h2>
        {modules.length > 0 ? (
          <div className="modules-list">
            {modules.map((module) => (
              <div key={module._id} className="module-card">
                <div className="module-info">
                  <h3>{module.title}</h3>
                  <div className="module-meta">
                    <span>Created: {new Date(module.createdAt).toLocaleDateString()}</span>
                    <span>Slides: {module.slides?.length || 0}</span>
                    <span>Quizzes: {module.quizzes?.length || 0}</span>
                  </div>
                </div>
                <div className="module-actions">
                  <button
                    onClick={() => navigate(`/module/${module._id}`)}
                    className="btn btn-info"
                  >
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/edit/${module._id}`)}
                    className="btn btn-warning"
                  >
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this module?")) {
                        try {
                          const token = localStorage.getItem("token");
                          await axios.delete(`http://localhost:5000/modules/${module._id}`, {
                            headers: {
                              Authorization: `Bearer ${token}`
                            }
                          });
                          setModules(modules.filter(m => m._id !== module._id));
                          alert("Module deleted successfully");
                        } catch (error) {
                          console.error("Error deleting module:", error);
                          alert("Failed to delete module");
                        }
                      }
                    }}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-modules">No modules found</p>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;