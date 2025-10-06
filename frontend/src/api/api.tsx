import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

export const api = axios.create({
    baseURL: `${API_BASE}/api`,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers = config.headers || {};
        (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
});
