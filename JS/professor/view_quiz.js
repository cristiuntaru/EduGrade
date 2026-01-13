document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");

    if (!quizId) {
        alert("Missing quiz ID!");
        window.location.href = "manage_quizzes.html";
        return;
    }

    let quiz = null;

    try {
        const data = await apiRequest(`/api/quizzes/${quizId}`);
        quiz = data.quiz;
    } catch (err) {
        alert(err.message || "Quiz not found!");
        window.location.href = "manage_quizzes.html";
        return;
    }

    renderQuizInfo(quiz);
    renderQuestions((quiz.questions || []).sort((a, b) => a.order - b.order));
});

function renderQuizInfo(quiz) {
    const box = document.getElementById("quizInfoCard");

    const statusClass = quiz.status === "published" ? "status-published" : "status-draft";
    const statusText = quiz.status === "published" ? "Published" : "Draft";

    const openDate = quiz.open_date ? new Date(quiz.open_date).toLocaleString() : "N/A";
    const closeDate = quiz.close_date ? new Date(quiz.close_date).toLocaleString() : "N/A";

    box.innerHTML = `
        <div class="status-pill ${statusClass}">${statusText}</div>

        <div class="quiz-title">${quiz.title}</div>

        <div class="info-line"><strong>Subject:</strong> ${quiz.subject || "N/A"}</div>
        <div class="info-line"><strong>Duration:</strong> ${quiz.duration} min</div>
        <div class="info-line"><strong>Open:</strong> ${openDate}</div>
        <div class="info-line"><strong>Close:</strong> ${closeDate}</div>
        <div class="info-line"><strong>Description:</strong> ${quiz.description || "No description"}</div>
    `;
}

function renderQuestions(questions) {
    const list = document.getElementById("questionsList");
    list.innerHTML = "";

    if (!questions || questions.length === 0) {
        list.innerHTML = `
            <p class="no-questions-msg">
                This quiz has no questions yet.
            </p>
        `;
        return;
    }

    questions.forEach((q, index) => {
        const card = document.createElement("div");
        card.classList.add("question-card");

        card.innerHTML = `
            <div class="q-header">Q${index + 1}. ${q.text}</div>
            <div class="q-points">${q.points} points</div>
            <br>
        `;

        (q.choices || []).forEach(opt => {
            const row = document.createElement("div");
            row.classList.add("option-row");

            row.innerHTML = `
                <div class="opt-dot ${opt.is_correct ? "correct-dot" : "wrong-dot"}"></div>
                <div class="opt-text">${opt.label}. ${opt.text}</div>
            `;

            card.appendChild(row);
        });

        list.appendChild(card);
    });
}
