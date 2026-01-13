function logout() {
    if (typeof clearAuthSession === "function") {
        clearAuthSession();
    } else {
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
    }
    window.location.href = "../general/login.html";
}
