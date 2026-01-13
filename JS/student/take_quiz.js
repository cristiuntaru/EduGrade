document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");

    if (!quizId) {
        alert("Quiz ID missing!");
        return;
    }

    const quizTitleEl = document.getElementById("quizTitle");
    const questionText = document.getElementById("questionText");
    const answerOptions = document.getElementById("answerOptions");
    const questionProgress = document.getElementById("questionProgress");
    const navContainer = document.getElementById("questionNav");

    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");
    const submitBtn = document.getElementById("submitBtn");

    let quiz = null;
    let questions = [];
    let currentIndex = 0;
    let answers = {};

    async function loadQuiz() {
        try {
            const data = await apiRequest(`/api/quizzes/${quizId}`);
            quiz = data.quiz;
        } catch (err) {
            alert(err.message || "Quiz not found.");
            return;
        }

        if (quizTitleEl) {
            quizTitleEl.textContent = quiz.title || "Untitled Quiz";
        }

        questions = (quiz.questions || []).sort((a, b) => a.order - b.order);
        if (questions.length === 0) {
            alert("This quiz has no questions.");
            return;
        }

        startTimer();
        buildBullets();
        loadQuestion(0);
    }

    function startTimer() {
        let timeLeft = Number(quiz.duration || 20) * 60;
        const timerDisplay = document.getElementById("timer");

        function updateTimer() {
            let min = Math.floor(timeLeft / 60);
            let sec = timeLeft % 60;

            if (timerDisplay) {
                timerDisplay.textContent = `${min}:${sec.toString().padStart(2, "0")}`;
            }

            if (timeLeft <= 0) {
                finishQuiz();
            } else {
                timeLeft--;
                setTimeout(updateTimer, 1000);
            }
        }

        updateTimer();
    }

    function loadQuestion(index) {
        const q = questions[index];

        if (questionText) {
            questionText.textContent = q.text || "";
        }
        if (questionProgress) {
            questionProgress.textContent = `Question ${index + 1} / ${questions.length}`;
        }

        answerOptions.innerHTML = "";

        (q.choices || []).forEach((choice) => {
            const optionDiv = document.createElement("div");
            optionDiv.className = "answer-option";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = choice.label;

            const selected = answers[q.id] || [];
            if (selected.includes(choice.label)) {
                checkbox.checked = true;
                optionDiv.classList.add("selected");
            }

            const labelSpan = document.createElement("span");
            labelSpan.textContent = `${choice.label}. ${choice.text}`;

            optionDiv.appendChild(checkbox);
            optionDiv.appendChild(labelSpan);

            optionDiv.addEventListener("click", (e) => {
                if (e.target.tagName !== "INPUT") {
                    checkbox.checked = !checkbox.checked;
                }

                if (!answers[q.id]) {
                    answers[q.id] = [];
                }

                if (checkbox.checked) {
                    if (!answers[q.id].includes(choice.label)) {
                        if (answers[q.id].length >= 3) {
                            checkbox.checked = false;
                            alert("You can select up to 3 answers.");
                            return;
                        }
                        answers[q.id].push(choice.label);
                    }
                    optionDiv.classList.add("selected");
                } else {
                    answers[q.id] = answers[q.id].filter(v => v !== choice.label);
                    optionDiv.classList.remove("selected");
                }

                updateBullets();
            });

            checkbox.addEventListener("click", (e) => e.stopPropagation());

            answerOptions.appendChild(optionDiv);
        });

        updateBullets();

        if (prevBtn) {
            prevBtn.disabled = index === 0;
        }
        if (nextBtn) {
            nextBtn.style.display = index === questions.length - 1 ? "none" : "inline-block";
        }
        if (submitBtn) {
            submitBtn.classList.toggle("hidden", index !== questions.length - 1);
        }
    }

    function buildBullets() {
        navContainer.innerHTML = "";

        for (let i = 0; i < questions.length; i++) {
            const b = document.createElement("div");
            b.className = "question-bullet";
            b.textContent = i + 1;

            b.addEventListener("click", () => {
                currentIndex = i;
                loadQuestion(currentIndex);
            });

            navContainer.appendChild(b);
        }
    }

    function updateBullets() {
        const bullets = navContainer.querySelectorAll(".question-bullet");

        bullets.forEach((b, i) => {
            b.classList.remove("active", "answered");

            if (i === currentIndex) b.classList.add("active");
            if (answers[questions[i].id] && answers[questions[i].id].length > 0) {
                b.classList.add("answered");
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (currentIndex < questions.length - 1) {
                currentIndex++;
                loadQuestion(currentIndex);
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentIndex > 0) {
                currentIndex--;
                loadQuestion(currentIndex);
            }
        });
    }

    async function finishQuiz() {
        const allAnswered = questions.every(q => answers[q.id] && answers[q.id].length > 0);
        if (!allAnswered) {
            alert("Please answer all questions before submitting.");
            return;
        }

        const payload = {
            quiz_id: Number(quizId),
            answers: questions.map(q => ({
                question_id: q.id,
                selected_label: (answers[q.id] || []).join(",")
            }))
        };

        try {
            const data = await apiRequest("/api/submissions", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            localStorage.setItem("selectedResult", JSON.stringify({
                quiz,
                submission: data.submission
            }));

            window.location.href = "quiz_submitted.html";
        } catch (err) {
            alert(err.message || "Could not submit quiz.");
        }
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            finishQuiz();
        });
    }

    loadQuiz();
});
