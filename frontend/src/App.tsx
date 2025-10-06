import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Homepage from "./pages/Homepage/Homepage";
import ProjectsPage from "./pages/Projects/ProjectsPage";
import CreateDefect from "./components/CreateDefect";
import Defects from "./pages/Defects/Defects";
import TasksPage from "./pages/Tasks/TasksPage";
import ReportsPage from "./pages/ReportsPage/ReportsPage";
import EngineerRatingPage from "./pages/EngineerRatingPage/EngineerRatingPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage"; // обычная домашняя страница

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
                <Route
                    path="/tasks"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <TasksPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <ReportsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/rating"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <EngineerRatingPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Router>
    );
}

export default App;
