document.addEventListener("DOMContentLoaded", () => {

    // ------------------ GET QUIZ ID ------------------
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");

    if (!quizId) {
        alert("Missing quiz ID!");
        window.location.href = "manage_quizzes.html";
        return;
    }

    let quizzes = JSON.parse(localStorage.getItem("quizzes") || "[]");
    let quiz = quizzes.find(q => q.id == quizId);

    if (!quiz) {
        alert("Quiz not found!");
        window.location.href = "manage_quizzes.html";
        return;
    }


    // ------------------ PREFILL QUIZ DETAILS ------------------
    document.getElementById("quizTitle").value = quiz.title;
    document.getElementById("quizSubject").value = quiz.subject;
    document.getElementById("quizDuration").value = quiz.duration;
    document.getElementById("quizOpenDate").value = quiz.openDate;
    document.getElementById("quizCloseDate").value = quiz.closeDate;
    document.getElementById("quizDescription").value = quiz.description;

    const questionsContainer = document.getElementById("questionsContainer");
    const backBtn = document.getElementById("backBtn");
    const archiveBtn = document.getElementById("archiveBtn");
    const saveDraftBtn = document.getElementById("saveDraftBtn");
    

    // ------------------ BACK BUTTON ------------------
    backBtn.addEventListener("click", () => {
        window.location.href = "manage_quizzes.html";
    });

    // ------------------ SAVE DRAFT ------------------
    saveDraftBtn.addEventListener("click", () => {

        // Actualizăm datele quizului
        quiz.title = document.getElementById("quizTitle").value.trim();
        quiz.subject = document.getElementById("quizSubject").value;
        quiz.duration = document.getElementById("quizDuration").value;
        quiz.openDate = document.getElementById("quizOpenDate").value;
        quiz.closeDate = document.getElementById("quizCloseDate").value;
        quiz.description = document.getElementById("quizDescription").value.trim();

        // Preluăm întrebările existente
        const cards = document.querySelectorAll(".question-card");

        quiz.questions = [...cards].map(card => ({
            id: card.dataset.id,
            text: card.querySelector(".q-text").value.trim(),
            points: Number(card.querySelector(".q-points").value),
            options: [...card.querySelectorAll(".option-row")].map(row => ({
                text: row.querySelector(".opt-text").value.trim(),
                correct: row.querySelector(".opt-correct").checked
            }))
        }));

        // Setăm status draft
        quiz.status = "draft";
        quiz.updatedAt = Date.now(); // important pentru ordonare

        // Salvăm în localStorage
        const updated = quizzes.map(q => q.id == quiz.id ? quiz : q);
        localStorage.setItem("quizzes", JSON.stringify(updated));

        alert("Draft saved!");
        window.location.href = "manage_quizzes.html";
    });

    // ------------------ ARCHIVE QUIZ ------------------
    archiveBtn.addEventListener("click", () => {

        if (!confirm("Are you sure you want to archive this quiz?")) return;

        quiz.status = "archived";
        quiz.updatedAt = Date.now();

        const updated = quizzes.map(q => q.id == quiz.id ? quiz : q);
        localStorage.setItem("quizzes", JSON.stringify(updated));

        alert("Quiz archived.");
        window.location.href = "manage_quizzes.html";
    });



    // ------------------ RENDER QUESTIONS ------------------
    quiz.questions.forEach(q => renderQuestionCard(q));


    // ------------------ ADD NEW QUESTION ------------------
    document.getElementById("addQuestionBtn").addEventListener("click", () => {
        renderQuestionCard({
            id: crypto.randomUUID(),
            text: "",
            points: "",
            options: []
        });
    });



    // ------------------ PUBLISH CHANGES BUTTON ------------------
    document.getElementById("saveQuizBtn").addEventListener("click", () => {
        
        // Update quiz object
        quiz.title = document.getElementById("quizTitle").value.trim();
        quiz.subject = document.getElementById("quizSubject").value;
        quiz.duration = document.getElementById("quizDuration").value;
        quiz.openDate = document.getElementById("quizOpenDate").value;
        quiz.closeDate = document.getElementById("quizCloseDate").value;
        quiz.description = document.getElementById("quizDescription").value.trim();

        // Update QUIZ QUESTIONS
        const cards = document.querySelectorAll(".question-card");

        quiz.questions = [...cards].map(card => ({
            id: card.dataset.id,
            text: card.querySelector(".q-text").value.trim(),
            points: Number(card.querySelector(".q-points").value),
            options: [...card.querySelectorAll(".option-row")].map(row => ({
                text: row.querySelector(".opt-text").value.trim(),
                correct: row.querySelector(".opt-correct").checked
            }))
        }));

        // ------------------ NEW: UPDATED AT ------------------
        quiz.updatedAt = Date.now(); 

        quiz.status = "published";

        // ------------------ SAVE BACK TO STORAGE ------------------
        const updated = quizzes.map(q => q.id == quiz.id ? quiz : q);
        localStorage.setItem("quizzes", JSON.stringify(updated));

        alert("Quiz updated successfully!");

        window.location.href = "manage_quizzes.html";
    });



    // ------------------ RENDER QUESTION CARD ------------------
    function renderQuestionCard(question) {

        const card = document.createElement("div");
        card.classList.add("question-card");
        card.dataset.id = question.id;

        card.innerHTML = `
            <div class="question-top-row">
                <textarea class="q-text">${question.text}</textarea>
                <input type="number" class="q-points" value="${question.points}">
            </div>

            <div class="options-title">Options</div>
            <div class="options-box"></div>

            <button class="btn add-opt-btn">+ Add Option</button>
            <button class="remove-question">Delete Question</button>
        `;

        questionsContainer.appendChild(card);

        // Render existing options
        question.options.forEach(opt => renderOption(card, opt));

        // Add default options if none exist
        if (question.options.length === 0) {
            renderOption(card, { text: "", correct: false });
            renderOption(card, { text: "", correct: false });
        }

        // Add new option
        card.querySelector(".add-opt-btn").addEventListener("click", () => {
            renderOption(card, { text: "", correct: false });
        });

        // Delete question
        card.querySelector(".remove-question").addEventListener("click", () => {
            card.remove();
        });
    }


    // ------------------ RENDER OPTION ------------------
    function renderOption(card, option) {
        
        const row = document.createElement("div");
        row.classList.add("option-row");

        row.innerHTML = `
            <input type="checkbox" class="opt-correct" ${option.correct ? "checked" : ""}>
            <input type="text" class="opt-text" value="${option.text}">
            <button class="remove-option">X</button>
        `;

        row.querySelector(".remove-option").addEventListener("click", () => row.remove());

        card.querySelector(".options-box").appendChild(row);
    }

});
