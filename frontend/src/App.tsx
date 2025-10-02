import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Homepage from "./pages/Homepage/Homepage";
import ProjectsPage from "./pages/Projects/ProjectsPage";
import CreateDefect from "./components/CreateDefect";
import Defects from "./pages/Defects/Defects"; // обычная домашняя страница

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
                <Route
                    path="/create-defect"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <CreateDefect />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/defects"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <Defects />
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </Router>
    );
}

export default App;
