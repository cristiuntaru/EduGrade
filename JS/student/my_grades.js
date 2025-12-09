document.addEventListener("DOMContentLoaded", () => {
    const history = JSON.parse(localStorage.getItem("gradesHistory")) || [];
    const list = document.getElementById("gradesList");
    const emptyMessage = document.getElementById("noGradesMessage");

    list.innerHTML = "";

    if (history.length === 0) {
        // NU există quiz-uri, afișăm mesajul
        emptyMessage.style.display = "block";
        return;
    }

    // EXISTĂ quiz-uri, ascundem mesajul
    emptyMessage.style.display = "none";

    history.forEach((quiz, i) => {

        const dateStr = new Date(quiz.dateCompleted).toLocaleString();

        const div = document.createElement("div");
        div.className = "grade-item";

        div.innerHTML = `
            <div class="grade-info">
                <h3>${quiz.quizTitle}</h3>
                <p>${dateStr}</p>
                <p class="score-text">Score: <strong>${quiz.score}/10</strong></p>
            </div>

            <button class="btn view-btn" data-index="${i}">View Details</button>
        `;

        list.appendChild(div);
    });

    // VIEW DETAILS BUTTON
    document.querySelectorAll(".view-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            const quiz = history[index];

            localStorage.setItem("selectedResult", JSON.stringify(quiz));
            window.location.href = "quiz_details.html";
        });
    });
});
