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

    document.getElementById("quizTitle").textContent = quiz.title || "Quiz";
    document.getElementById("quizId").textContent = quiz.id;

    const warning = document.getElementById("printWarning");
    const invalidQuestions = (quiz.questions || []).length !== 10;
    const invalidChoices = (quiz.questions || []).some(q => (q.choices || []).length !== 4);
    if (invalidQuestions || invalidChoices) {
        warning.textContent = "Warning: OCR grading requires exactly 10 questions with 4 choices each.";
        warning.style.display = "block";
    }

    const questionList = document.getElementById("questionList");
    questionList.innerHTML = "";

    const questions = (quiz.questions || []).sort((a, b) => a.order - b.order);
    questions.forEach((q, index) => {
        const block = document.createElement("div");
        block.className = "question-block";

        let optionsHtml = "";
        (q.choices || [])
            .slice()
            .sort((a, b) => a.label.localeCompare(b.label))
            .forEach((choice) => {
            optionsHtml += `<div>${choice.label}. ${choice.text}</div>`;
        });

        block.innerHTML = `
            <h3>Q${index + 1}. ${q.text}</h3>
            <div class="question-options">${optionsHtml}</div>
        `;

        questionList.appendChild(block);
    });

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

    const container = document.querySelector(".answer-grid");
    const rect = grid.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = rect.left - containerRect.left;
    const top = rect.top - containerRect.top;
    const right = rect.right - containerRect.left;
    const bottom = rect.bottom - containerRect.top;
    const markerSize = 16;

    const markers = [
        { x: left - markerSize - 4, y: top - markerSize - 4 },
        { x: right + 4, y: top - markerSize - 4 },
        { x: left - markerSize - 4, y: bottom + 4 },
        { x: right + 4, y: bottom + 4 }
    ];

    markers.forEach((pos) => {
        const marker = document.createElement("div");
        marker.className = "grid-marker";
        marker.style.left = `${pos.x}px`;
        marker.style.top = `${pos.y}px`;
        container.appendChild(marker);
    });
});
