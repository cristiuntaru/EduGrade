document.addEventListener("DOMContentLoaded", () => {

    // ----------------------------------------------------------
    // QUIZ OBJECT – creat O SINGURĂ DATĂ
    // ----------------------------------------------------------
    let currentQuiz = {
        id: Date.now(),          // id unic
        serverId: null,
        title: "",
        subject: "",
        duration: "",
        openDate: "",
        closeDate: "",
        description: "",
        status: "draft",
        questions: [],
        createdAt: new Date().toISOString()   // <--- ADAUGAT
    };

    // ----------------------------------------------------------
    // ELEMENTE
    // ----------------------------------------------------------
    const continueBtn        = document.getElementById("continueBtn");
    const questionsSection   = document.getElementById("questionsSection");
    const questionsContainer = document.getElementById("questionsContainer");
    const addQuestionBtn     = document.getElementById("addQuestionBtn");
    const publishBtn         = document.getElementById("publishQuizBtn");
    const saveDraftBtn       = document.getElementById("saveDraftBtn");
    const backBtn            = document.getElementById("backBtn");

    // ----------------------------------------------------------
    // 1. CITIREA INFORMAȚIILOR DE BAZĂ
    // ----------------------------------------------------------
    function readBasicInfo(strict = true) {

        const title       = document.getElementById("quizTitle").value.trim();
        const subject     = document.getElementById("quizSubject").value;
        const duration    = document.getElementById("quizDuration").value;
        const openDate    = document.getElementById("quizOpenDate").value;
        const closeDate   = document.getElementById("quizCloseDate").value;
        const description = document.getElementById("quizDescription").value.trim();

        if (strict) {
            if (!title || !subject || !duration) {
                alert("Please complete Title, Subject and Duration!");
                return null;
            }
        }

        // salvează în obiect
        currentQuiz.title       = title || "Untitled quiz";
        currentQuiz.subject     = subject;
        currentQuiz.duration    = duration;
        currentQuiz.openDate    = openDate;
        currentQuiz.closeDate   = closeDate;
        currentQuiz.description = description;

        return true;
    }

    // ----------------------------------------------------------
    // 2. CITIREA ÎNTREBĂRILOR
    // ----------------------------------------------------------
    function readQuestions(strictValidation) {

        const cards = document.querySelectorAll(".question-card");

        if (strictValidation && cards.length === 0) {
            alert("Add at least 1 question!");
            return null;
        }

        const questions = [];

        for (let card of cards) {

            const text   = card.querySelector(".q-text").value.trim();
            const points = Number(card.querySelector(".q-points").value);

            const options = [...card.querySelectorAll(".option-row")].map(row => ({
                text: row.querySelector(".opt-text").value.trim(),
                correct: row.querySelector(".opt-correct").checked
            }));

            if (strictValidation) {
                if (!text || points <= 0) {
                    alert("Each question needs text and positive points!");
                    return null;
                }
                if (!options.some(o => o.correct)) {
                    alert("Each question must have at least 1 correct answer!");
                    return null;
                }
            }

            questions.push({
                id: card.dataset.id || crypto.randomUUID(),
                text,
                points,
                options
            });
        }

        return questions;
    }

    function buildPayload(status, questions) {
        const title = document.getElementById("quizTitle").value.trim();
        const subject = document.getElementById("quizSubject").value;
        let duration = Number(document.getElementById("quizDuration").value);
        if (!Number.isFinite(duration) || duration <= 0) {
            duration = 1;
        }
        const openDate = document.getElementById("quizOpenDate").value;
        const closeDate = document.getElementById("quizCloseDate").value;
        const description = document.getElementById("quizDescription").value.trim();

        const mappedQuestions = (questions || []).map((q, index) => ({
            text: q.text,
            points: Number(q.points),
            order: index + 1,
            choices: (q.options || []).map((opt, optIndex) => ({
                label: String.fromCharCode(65 + optIndex),
                text: opt.text,
                is_correct: opt.correct === true
            }))
        }));

        return {
            title,
            subject: subject || null,
            duration,
            open_date: openDate || null,
            close_date: closeDate || null,
            description: description || null,
            status,
            questions: mappedQuestions
        };
    }

    // ----------------------------------------------------------
    // 3. CONTINUE → ARATĂ SECȚIUNEA DE ÎNTREBĂRI
    // ----------------------------------------------------------
    continueBtn.addEventListener("click", () => {

        const ok = readBasicInfo(true);
        if (!ok) return;

        questionsSection.classList.remove("hidden");
        continueBtn.disabled = true;
    });

    // ----------------------------------------------------------
    // 4. ADD QUESTION
    // ----------------------------------------------------------
    addQuestionBtn.addEventListener("click", () => {

        const id = crypto.randomUUID();

        const card = document.createElement("div");
        card.classList.add("question-card");
        card.dataset.id = id;

        card.innerHTML = `
            <div class="question-top-row">
                <textarea class="q-text" placeholder="Enter question"></textarea>
                <input type="number" class="q-points" min="1" placeholder="Points">
            </div>

            <div class="options-title">Options</div>
            <div class="options-box"></div>

            <button type="button" class="btn add-opt-btn">+ Add Option</button>
            <button type="button" class="remove-question">Delete Question</button>
        `;

        questionsContainer.appendChild(card);

        addOption(card);
        addOption(card);

        card.querySelector(".add-opt-btn").addEventListener("click", () => addOption(card));
        card.querySelector(".remove-question").addEventListener("click", () => card.remove());
    });

    // ----------------------------------------------------------
    // 5. ADD OPTION
    // ----------------------------------------------------------
    function addOption(card) {

        const row = document.createElement("div");
        row.classList.add("option-row");

        row.innerHTML = `
            <input type="checkbox" class="opt-correct">
            <input type="text" class="opt-text" placeholder="Option text">
            <button type="button" class="remove-option">X</button>
        `;

        row.querySelector(".remove-option").addEventListener("click", () => row.remove());

        card.querySelector(".options-box").appendChild(row);
    }

    // ----------------------------------------------------------
    // 6. PUBLISH QUIZ
    // ----------------------------------------------------------
    publishBtn.addEventListener("click", () => {

        const ok = readBasicInfo(true);
        if (!ok) return;

        const questions = readQuestions(true);
        if (!questions) return;

        const payload = buildPayload("published", questions);

        apiRequest("/api/quizzes", {
            method: "POST",
            body: JSON.stringify(payload)
        })
            .then(() => {
                alert("Quiz published!");
                window.location.href = "manage_quizzes.html";
            })
            .catch((err) => {
                alert(err.message || "Could not publish quiz.");
            });
    });

    // ----------------------------------------------------------
    // 7. SAVE DRAFT (fără validare strictă)
    // ----------------------------------------------------------
    saveDraftBtn.addEventListener("click", () => {

        const ok = readBasicInfo(false);
        if (!ok) return;

        const questions = readQuestions(false) || [];
        const payload = buildPayload("draft", questions);

        const request = currentQuiz.serverId
            ? apiRequest(`/api/quizzes/${currentQuiz.serverId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            })
            : apiRequest("/api/quizzes", {
                method: "POST",
                body: JSON.stringify(payload)
            });

        request
            .then((data) => {
                if (data && data.quiz && data.quiz.id) {
                    currentQuiz.serverId = data.quiz.id;
                }
                alert("Draft saved!");
                window.location.href = "manage_quizzes.html";
            })
            .catch((err) => {
                alert(err.message || "Could not save draft.");
            });
    });

    // ----------------------------------------------------------
    // 8. BACK BUTTON
    // ----------------------------------------------------------
    backBtn.addEventListener("click", () => {
        window.location.href = "manage_quizzes.html";
    });

});
