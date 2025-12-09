document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // REGEX VALIDATIONS
    const emailRegex = /^[A-Za-z0-9._%+-]+@e-uvt\.ro$/;
    const passRegex = /^(?=.*\d).{4,}$/;

    if (!emailRegex.test(email)) {
        alert("Email invalid! Foloseste un email care se termina cu @e-uvt.ro");
        return;
    }

    if (!passRegex.test(password)) {
        alert("Parola trebuie sa aiba minim 4 caractere si cel putin un numar!");
        return;
    }

    // TEMPORARY FRONTEND LOGIN MOCK
    localStorage.setItem("currentUser", email);

    // Redirect to home (or dashboard)
    window.location.href = "../general/home.html";
});
