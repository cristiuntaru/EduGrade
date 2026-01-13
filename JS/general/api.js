const API_BASE = "http://127.0.0.1:5000";

function getAuthToken() {
    return localStorage.getItem("authToken");
}

function getCurrentUser() {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
}

function setAuthSession(token, user) {
    localStorage.setItem("authToken", token);
    localStorage.setItem("currentUser", JSON.stringify(user));
}

function clearAuthSession() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
}

async function apiRequest(path, options = {}) {
    const headers = options.headers ? { ...options.headers } : {};
    if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const token = getAuthToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers
    });

    const text = await response.text();
    let payload = null;
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch (err) {
            payload = { raw: text };
        }
    }

    if (!response.ok) {
        const message = payload && payload.error ? payload.error : "Request failed";
        const error = new Error(message);
        error.status = response.status;
        error.payload = payload;
        throw error;
    }

    return payload;
}
