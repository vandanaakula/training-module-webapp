import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import ModulesList from "./components/ModulesList";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import ModuleViewer from "./pages/ModuleViewer";
import Quiz from "./pages/Quiz";
import CreateModule from "./components/CreateModule";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute"; 
import EditModule from "./components/EditModule";// We'll create this
import QuizCreation from "./components/QuizCreation"; // Correct path based on your structure

function App() {
    return (
        <Router>
            <div className="container">
                <Routes>
                    {/* Make Login the default landing page */}
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    
                    {/* Public List of Modules */}
                    <Route path="/modules" element={<ModulesList />} />

                    {/* Protected Routes - Regular Users */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Admin Only Routes */}
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminPanel />
                            </AdminRoute>
                        }
                    />
                    <Route path="/edit/:id" element={<EditModule />} />
                    <Route
                        path="/create"
                        element={
                            <AdminRoute>
                                <CreateModule />
                            </AdminRoute>
                        }
                    />
                    
                    {/* Course Module Viewer - Available to all authenticated users */}
                    <Route
                        path="/module/:id"
                        element={
                            <ProtectedRoute>
                                <ModuleViewer />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                    path="/create-quiz"
                    element={
                        <AdminRoute>
                            <QuizCreation />
                        </AdminRoute>
                    }
                    />                  
                    {/* Quiz with real-time feedback */}
                    <Route
                        path="/quiz/:id"
                        element={
                            <ProtectedRoute>
                                <Quiz />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;