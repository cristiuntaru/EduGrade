function logout() {
    localStorage.removeItem("currentUser");
    window.location.href = "../general/login.html";
}