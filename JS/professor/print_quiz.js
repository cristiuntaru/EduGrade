document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");

    if (!quizId) {
        alert("Missing quiz ID!");
        return;
    }

    let quiz = null;
    try {
        const data = await apiRequest(`/api/quizzes/${quizId}`);
        quiz = data.quiz;
    } catch (err) {
        alert(err.message || "Quiz not found.");
        return;
    }

    document.getElementById("quizTitle").textContent = quiz.title || "Quiz Answer Sheet";
    document.getElementById("quizId").textContent = quiz.id;
    const warning = document.getElementById("printWarning");
    const invalidQuestions = (quiz.questions || []).length !== 10;
    const invalidChoices = (quiz.questions || []).some(q => (q.choices || []).length !== 4);
    if (invalidQuestions || invalidChoices) {
        warning.textContent = "Warning: OCR grading requires exactly 10 questions with 4 choices each.";
        warning.style.display = "block";
    }

    const grid = document.getElementById("answerGrid");
    grid.innerHTML = "";

    const headers = ["", "A", "B", "C", "D"];
    headers.forEach(text => {
        const cell = document.createElement("div");
        cell.className = "grid-header";
        cell.textContent = text;
        grid.appendChild(cell);
    });

    for (let i = 1; i <= 10; i++) {
        const numberCell = document.createElement("div");
        numberCell.className = "q-number";
        numberCell.textContent = i;
        grid.appendChild(numberCell);

        ["A", "B", "C", "D"].forEach(() => {
            const bubble = document.createElement("div");
            bubble.className = "bubble";
            grid.appendChild(bubble);
        });
    }

    document.getElementById("printBtn").addEventListener("click", () => {
        window.print();
    });
});
