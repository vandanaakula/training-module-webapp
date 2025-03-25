import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // We'll create this CSS file

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isAdmin, setIsAdmin] = useState(false); // To toggle between admin/user login
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Use different endpoints based on role selection
            const endpoint = isAdmin 
                ? "http://localhost:5000/auth/admin/login" 
                : "http://localhost:5000/auth/user/login";
                
            const response = await axios.post(endpoint, {
                email,
                password
            });

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("userId", response.data.userId);
            localStorage.setItem("role", response.data.role);
            
            // Redirect based on role
            if (response.data.role === "admin") {
                navigate("/dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Login error:", error.response?.data || error.message);
            setError("Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Training Module System</h2>
                    <p>Please login to continue</p>
                </div>
                
                <div className="login-tabs">
                    <button 
                        className={!isAdmin ? "active" : ""} 
                        onClick={() => setIsAdmin(false)}
                    >
                        User Login
                    </button>
                    <button 
                        className={isAdmin ? "active" : ""} 
                        onClick={() => setIsAdmin(true)}
                    >
                        Admin Login
                    </button>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    
                    <button type="submit" className="login-button">
                        {isAdmin ? "Admin Login" : "User Login"}
                    </button>
                </form>
                
                <div className="login-footer">
                    <p>Don't have an account? Contact administrator</p>
                </div>
            </div>
        </div>
    );
};

export default Login;