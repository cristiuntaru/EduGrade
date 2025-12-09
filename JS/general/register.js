document.getElementById("registerForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    // REGEX VALIDATIONS
    const emailRegex = /^[A-Za-z0-9._%+-]+@e-uvt\.ro$/;
    const passRegex = /^(?=.*\d).{4,}$/;

    if (fullName.length < 2) {
        alert("Numele trebuie sa contina minim 2 caractere!");
        return;
    }

    if (!emailRegex.test(email)) {
        alert("Email invalid! Foloseste un email care se termina cu @e-uvt.ro");
        return;
    }

    if (!passRegex.test(password)) {
        alert("Parola trebuie sa aiba minim 4 caractere si cel putin un numar!");
        return;
    }

    // TEMPORARY FRONTEND USER MOCK
    const user = {
        name: fullName,
        email,
        role
    };

    localStorage.setItem("currentUser", JSON.stringify(user));

    // Redirect to home or dashboard
    /*if (role === "professor") {
        window.location.href = "../professor/dashboard_professor.html";
    } else {
        window.location.href = "../student/dashboard_student.html";
    }*/
    window.location.href = "../../HTML/general/home.html";
});
