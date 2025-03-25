import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CreateModule = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slides, setSlides] = useState([]);
  const [slideInput, setSlideInput] = useState({
    url: "",
    type: "text",
    description: ""
  });
  const navigate = useNavigate();

  // Get token from localStorage
  const token = localStorage.getItem("token");
  
  // Check if user is admin
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      alert("Only admins can create modules!");
      navigate("/dashboard");
    }
  }, [navigate]);

  const addSlide = () => {
    if (slideInput.url) {
      setSlides([...slides, { ...slideInput }]);
      setSlideInput({ url: "", type: "text", description: "" });
    }
  };

  const handleCreateModule = async () => {
    if (!token) {
      alert("Unauthorized! Please log in first.");
      navigate("/login");
      return;
    }

    if (!title || !content) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/modules/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, slides }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Module created successfully!");
        navigate("/"); // Redirect to modules list
      } else {
        alert(data.error || "Failed to create module.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while creating the module.");
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Create Training Module</h2>
      
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Title:</label>
        <input 
          type="text" 
          placeholder="Module Title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          required
        />
      </div>
      
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Content:</label>
        <textarea 
          placeholder="Module Content" 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", minHeight: "150px" }}
          required
        />
      </div>
      
      <div style={{ marginBottom: "15px" }}>
        <h3 style={{ marginBottom: "10px" }}>Add Slides</h3>
        
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input 
            type="text" 
            placeholder="Slide URL" 
            value={slideInput.url} 
            onChange={(e) => setSlideInput({...slideInput, url: e.target.value})} 
            style={{ flex: "2", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          />
          
          <select 
            value={slideInput.type} 
            onChange={(e) => setSlideInput({...slideInput, type: e.target.value})}
            style={{ flex: "1", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>
        
        <textarea 
          placeholder="Slide Description" 
          value={slideInput.description} 
          onChange={(e) => setSlideInput({...slideInput, description: e.target.value})}
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd", marginBottom: "10px" }}
        />
        
        <button 
          onClick={addSlide}
          style={{ padding: "8px 16px", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginBottom: "15px" }}
        >
          Add Slide
        </button>
        
        {slides.length > 0 && (
          <div style={{ marginBottom: "15px" }}>
            <h4>Added Slides ({slides.length}):</h4>
            <ul style={{ listStyleType: "none", padding: "0" }}>
              {slides.map((slide, index) => (
                <li key={index} style={{ padding: "10px", backgroundColor: "#f5f5f5", marginBottom: "5px", borderRadius: "4px" }}>
                  <strong>Type:</strong> {slide.type}, <strong>URL:</strong> {slide.url}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <button 
        onClick={handleCreateModule}
        style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
      >
        Create Module
      </button>
    </div>
  );
};

export default CreateModule;