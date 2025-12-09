document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");

    if (!quizId) {
        alert("Missing quiz ID!");
        window.location.href = "manage_quizzes.html";
        return;
    }

    const quizzes = JSON.parse(localStorage.getItem("quizzes") || "[]");
    const quiz = quizzes.find(q => q.id == quizId);

    if (!quiz) {
        alert("Quiz not found!");
        window.location.href = "manage_quizzes.html";
        return;
    }

    renderQuizInfo(quiz);
    renderQuestions(quiz.questions);
});


function renderQuizInfo(quiz) {
    const box = document.getElementById("quizInfoCard");

    const statusClass = quiz.status === "published" ? "status-published" : "status-draft";
    const statusText = quiz.status === "published" ? "Published" : "Draft";

    box.innerHTML = `
        <div class="status-pill ${statusClass}">${statusText}</div>

        <div class="quiz-title">${quiz.title}</div>

        <div class="info-line"><strong>Subject:</strong> ${quiz.subject}</div>
        <div class="info-line"><strong>Duration:</strong> ${quiz.duration} min</div>
        <div class="info-line"><strong>Open:</strong> ${quiz.openDate || "—"}</div>
        <div class="info-line"><strong>Close:</strong> ${quiz.closeDate || "—"}</div>
        <div class="info-line"><strong>Description:</strong> ${quiz.description || "No description"}</div>
    `;
}


function renderQuestions(questions) {
    const list = document.getElementById("questionsList");
    list.innerHTML = "";

    // Dacă nu există întrebări, afișăm mesaj sugestiv
    if (!questions || questions.length === 0) {
        list.innerHTML = `
            <p class="no-questions-msg">
                This quiz has no questions yet.
            </p>
        `;
        return;
    }

    // Dacă există întrebări, le afișăm normal
    questions.forEach((q, index) => {
        const card = document.createElement("div");
        card.classList.add("question-card");

        card.innerHTML = `
            <div class="q-header">Q${index + 1}. ${q.text}</div>
            <div class="q-points">${q.points} points</div>
            <br>
        `;

        q.options.forEach(opt => {
            const row = document.createElement("div");
            row.classList.add("option-row");

            row.innerHTML = `
                <div class="opt-dot ${opt.correct ? "correct-dot" : "wrong-dot"}"></div>
                <div class="opt-text">${opt.text}</div>
            `;

            card.appendChild(row);
        });

        list.appendChild(card);
    });
}
