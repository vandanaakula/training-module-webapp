import React, { useEffect, useState } from "react";
import { fetchModules } from "../services/api";
import { Link } from "react-router-dom";

const ModulesList = () => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState("");

    useEffect(() => {
        // Check if user is logged in and get role
        const token = localStorage.getItem("token");
        const storedRole = localStorage.getItem("role");

        if (token) {
            setIsLoggedIn(true);
            setRole(storedRole);
        }

        const getModules = async () => {
            try {
                const response = await fetchModules();
                setModules(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching modules:", error);
                setError("Failed to load modules. Please try again later.");
                setLoading(false);
            }
        };

        getModules();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("role");
        setIsLoggedIn(false);
        setRole("");
        alert("Logged out successfully");
        window.location.reload(); // Refresh after logout
    };

    if (loading) return <p>Loading modules...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2>Training Modules</h2>
                <div>
                    {isLoggedIn ? (
                        <button
                            onClick={handleLogout}
                            style={{
                                marginLeft: "10px",
                                backgroundColor: "#f44336",
                                color: "white",
                                border: "none",
                                padding: "8px 16px",
                                cursor: "pointer",
                            }}
                        >
                            Logout
                        </button>
                    ) : (
                        <Link to="/login">
                            <button
                                style={{
                                    backgroundColor: "#4CAF50",
                                    color: "white",
                                    border: "none",
                                    padding: "8px 16px",
                                    cursor: "pointer",
                                }}
                            >
                                Login
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Button to Create New Module - Visible to Admins Only */}
            {isLoggedIn && role === "admin" && (
                <Link to="/create">
                    <button
                        style={{
                            marginBottom: "20px",
                            backgroundColor: "#2196F3",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            cursor: "pointer",
                        }}
                    >
                        Create New Module
                    </button>
                </Link>
            )}

            {modules.length > 0 ? (
                <div>
                    {modules.map((module) => (
                        <div
                            key={module._id}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                padding: "15px",
                                marginBottom: "15px",
                                backgroundColor: "#f9f9f9",
                            }}
                        >
                            <h3>{module.title}</h3>
                            <p>Created: {new Date(module.createdAt).toLocaleDateString()}</p>
                            <p style={{ marginTop: "10px" }}>{module.content.substring(0, 100)}...</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p
                    style={{
                        textAlign: "center",
                        padding: "30px",
                        backgroundColor: "#f9f9f9",
                    }}
                >
                    No modules found. {isLoggedIn ? "Create your first module!" : "Please login to create modules."}
                </p>
            )}
        </div>
    );
};

export default ModulesList;
