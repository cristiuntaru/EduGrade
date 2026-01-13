document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");

    if (!quizId) {
        alert("Missing quiz ID!");
        window.location.href = "manage_quizzes.html";
        return;
    }

    const titleInput = document.getElementById("quizTitle");
    const subjectInput = document.getElementById("quizSubject");
    const durationInput = document.getElementById("quizDuration");
    const openDateInput = document.getElementById("quizOpenDate");
    const closeDateInput = document.getElementById("quizCloseDate");
    const descriptionInput = document.getElementById("quizDescription");

    const questionsContainer = document.getElementById("questionsContainer");
    const backBtn = document.getElementById("backBtn");
    const archiveBtn = document.getElementById("archiveBtn");
    const saveDraftBtn = document.getElementById("saveDraftBtn");
    const saveQuizBtn = document.getElementById("saveQuizBtn");

    let quiz = null;

    backBtn.addEventListener("click", () => {
        window.location.href = "manage_quizzes.html";
    });

    function toInputDatetime(value) {
        if (!value) return "";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function buildPayload(statusOverride) {
        const duration = Number(durationInput.value);

        const cards = document.querySelectorAll(".question-card");
        const questions = [...cards].map((card, index) => ({
            text: card.querySelector(".q-text").value.trim(),
            points: Number(card.querySelector(".q-points").value),
            order: index + 1,
            choices: [...card.querySelectorAll(".option-row")].map((row, optIndex) => ({
                label: String.fromCharCode(65 + optIndex),
                text: row.querySelector(".opt-text").value.trim(),
                is_correct: row.querySelector(".opt-correct").checked
            }))
        }));

        return {
            title: titleInput.value.trim(),
            subject: subjectInput.value || null,
            duration: Number.isFinite(duration) && duration > 0 ? duration : 1,
            open_date: openDateInput.value || null,
            close_date: closeDateInput.value || null,
            description: descriptionInput.value.trim() || null,
            status: statusOverride || quiz.status || "draft",
            questions
        };
    }

    function renderOption(card, option) {
        const row = document.createElement("div");
        row.classList.add("option-row");

        row.innerHTML = `
            <input type="checkbox" class="opt-correct" ${option.is_correct ? "checked" : ""}>
            <input type="text" class="opt-text" value="${option.text || ""}">
            <button class="remove-option">X</button>
        `;

        row.querySelector(".remove-option").addEventListener("click", () => row.remove());
        card.querySelector(".options-box").appendChild(row);
    }

    function renderQuestionCard(question) {
        const card = document.createElement("div");
        card.classList.add("question-card");
        card.dataset.id = question.id || crypto.randomUUID();

        card.innerHTML = `
            <div class="question-top-row">
                <textarea class="q-text">${question.text || ""}</textarea>
                <input type="number" class="q-points" value="${question.points || ""}">
            </div>

            <div class="options-title">Options</div>
            <div class="options-box"></div>

            <button class="btn add-opt-btn">+ Add Option</button>
            <button class="remove-question">Delete Question</button>
        `;

        questionsContainer.appendChild(card);

        (question.choices || []).forEach(opt => renderOption(card, opt));

        if (!question.choices || question.choices.length === 0) {
            renderOption(card, { text: "", is_correct: false });
            renderOption(card, { text: "", is_correct: false });
        }

        card.querySelector(".add-opt-btn").addEventListener("click", () => {
            renderOption(card, { text: "", is_correct: false });
        });

        card.querySelector(".remove-question").addEventListener("click", () => {
            card.remove();
        });
    }

    document.getElementById("addQuestionBtn").addEventListener("click", () => {
        renderQuestionCard({ text: "", points: "", choices: [] });
    });

    async function loadQuiz() {
        try {
            const data = await apiRequest(`/api/quizzes/${quizId}`);
            quiz = data.quiz;
        } catch (err) {
            alert(err.message || "Quiz not found!");
            window.location.href = "manage_quizzes.html";
            return;
        }

        titleInput.value = quiz.title || "";
        subjectInput.value = quiz.subject || "";
        durationInput.value = quiz.duration || "";
        openDateInput.value = toInputDatetime(quiz.open_date);
        closeDateInput.value = toInputDatetime(quiz.close_date);
        descriptionInput.value = quiz.description || "";

        questionsContainer.innerHTML = "";
        (quiz.questions || []).sort((a, b) => a.order - b.order).forEach(renderQuestionCard);
    }

    saveDraftBtn.addEventListener("click", async () => {
        try {
            await apiRequest(`/api/quizzes/${quizId}`, {
                method: "PUT",
                body: JSON.stringify(buildPayload("draft"))
            });
            alert("Draft saved!");
            window.location.href = "manage_quizzes.html";
        } catch (err) {
            alert(err.message || "Could not save draft.");
        }
    });

    archiveBtn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to archive this quiz?")) return;
        try {
            await apiRequest(`/api/quizzes/${quizId}`, {
                method: "PUT",
                body: JSON.stringify(buildPayload("archived"))
            });
            alert("Quiz archived.");
            window.location.href = "manage_quizzes.html";
        } catch (err) {
            alert(err.message || "Could not archive quiz.");
        }
    });

    saveQuizBtn.addEventListener("click", async () => {
        try {
            await apiRequest(`/api/quizzes/${quizId}`, {
                method: "PUT",
                body: JSON.stringify(buildPayload("published"))
            });
            alert("Quiz updated successfully!");
            window.location.href = "manage_quizzes.html";
        } catch (err) {
            alert(err.message || "Could not update quiz.");
        }
    });

    loadQuiz();
});
