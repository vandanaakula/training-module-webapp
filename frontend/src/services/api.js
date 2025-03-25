import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000", // Change if backend is running on a different port
});

// Add an interceptor to automatically add the token to every request
API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export const fetchModules = () => API.get("/modules");
export const createModule = (moduleData) => API.post("/modules/create", moduleData);