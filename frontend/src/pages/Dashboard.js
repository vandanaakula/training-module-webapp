import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

const Dashboard = () => {
  const [modules, setModules] = useState([]);
  const [moduleProgress, setModuleProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        // Fetch user information
        const userResponse = await axios.get("http://localhost:5000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserInfo(userResponse.data);

        // Fetch modules based on user role
        const modulesResponse = await axios.get("http://localhost:5000/modules", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setModules(modulesResponse.data);

        // Fetch progress data only for non-admin users
        if (userResponse.data.role !== "admin") {
          try {
            const progressResponse = await axios.get(
              "http://localhost:5000/progress/user",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            // Map progress by module ID for easier lookup
            const progressByModule = {};
            progressResponse.data.forEach((item) => {
              progressByModule[item._id] = item.progress;
            });

            setModuleProgress(progressByModule);
          } catch (err) {
            console.error("Error fetching progress data:", err);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getModuleProgress = (moduleId) => {
    return moduleProgress[moduleId] || {
      completedSlides: 0,
      totalSlides: 0,
      percentComplete: 0,
      status: "Not Started",
      hasTakenQuiz: false,
      quizResults: null,
    };
  };

  const handleResumeModule = (moduleId) => {
    navigate(`/module/${moduleId}`);
  };

  const handleRetakeQuiz = (moduleId) => {
    navigate(`/module/${moduleId}`);
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="brand">
          <h1>Training Portal</h1>
        </div>
        <div className="user-controls">
          {userInfo && (
            <span className="welcome-message">
              Welcome, {userInfo.name} ({userInfo.role})
            </span>
          )}
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="modules-header">
          <h2>Training Modules</h2>
          {userInfo && userInfo.role === "admin" && (
            <div className="admin-controls">
              <Link to="/admin" className="admin-button">
                Admin Panel
              </Link>
            </div>
          )}
        </section>

        {modules.length === 0 ? (
          <div className="no-modules">
            <p>No training modules available at this time.</p>
          </div>
        ) : (
          <div className="modules-grid">
            {modules.map((module) => {
              const progress = getModuleProgress(module._id);
              
              return (
                <div key={module._id} className="module-card">
                  <div className="module-header">
                    <h3>{module.title}</h3>
                    {userInfo && userInfo.role !== "admin" && (
                      <div
                        className={`module-status ${progress.status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {progress.status === "Completed" ? (
                          <span className="tick-mark">✔️</span>
                        ) : (
                          "⏳"
                        )}
                        {progress.status}
                      </div>
                    )}
                  </div>

                  <p className="module-date">
                    Created: {new Date(module.createdAt).toLocaleDateString()}
                  </p>

                  <p className="module-excerpt">
                    {module.content.substring(0, 100)}
                    {module.content.length > 100 ? "..." : ""}
                  </p>

                  {userInfo && userInfo.role !== "admin" && (
                    <div className="module-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress.percentComplete}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {progress.completedSlides} / {progress.totalSlides} slides completed
                      </div>

                      {progress.hasTakenQuiz && (
                        <div className="quiz-result">
                          <span>
                            Quiz Score:{" "}
                            {progress.quizResults?.latestScore || 0} /{" "}
                            {module.quizzes?.length || 0}
                          </span>
                          <span>
                            Attempts: {progress.quizResults?.attemptsCount || 0}
                          </span>
                          <button
                            onClick={() => handleRetakeQuiz(module._id)}
                            className="retake-button"
                          >
                            Retake Quiz
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {userInfo && userInfo.role !== "admin" && (
                    <div className="module-actions">
                      <button
                        onClick={() => handleResumeModule(module._id)}
                        className={
                          progress.status === "Completed" 
                            ? "review-button" 
                            : progress.status === "In Progress" 
                              ? "resume-button" 
                              : "start-button"
                        }
                      >
                        {progress.status === "Completed" 
                          ? "Review Module" 
                          : progress.status === "In Progress" 
                            ? "Resume Module" 
                            : "Start Module"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;