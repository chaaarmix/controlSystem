import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Homepage from "./pages/Homepage/Homepage";
import ProjectsPage from "./pages/Projects/ProjectsPage"; // обычная домашняя страница

function App() {
    const isAuthenticated = Boolean(localStorage.getItem("token")); // пример авторизации

    return (
        <Router>
            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <Homepage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/projects"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <ProjectsPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
