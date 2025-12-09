document.addEventListener("DOMContentLoaded", () => {

    /* -----------------------------------------------------
       1. QUIZ ID DIN URL
    ------------------------------------------------------ */
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");

    if (!quizId) {
        alert("Quiz ID missing!");
        return;
    }

    /* -----------------------------------------------------
       2. CITIM QUIZ-UL CREAT DE PROFESOR
    ------------------------------------------------------ */
    const quizzes = JSON.parse(localStorage.getItem("quizzes") || "[]");
    const quiz = quizzes.find(q => String(q.id) === String(quizId));

    if (!quiz) {
        alert("Quiz not found!");
        return;
    }

    // Titlul in pagina
    const quizTitleEl = document.getElementById("quizTitle");
    if (quizTitleEl) {
        quizTitleEl.textContent = quiz.title || "Untitled Quiz";
    }

    // Intrebarile reale (in ordinea salvata de profesor)
    const questions = quiz.questions || [];

    if (questions.length === 0) {
        alert("This quiz has no questions.");
        return;
    }

    /* -----------------------------------------------------
       3. STATE
    ------------------------------------------------------ */
    let currentIndex = 0;
    let answers = Array(questions.length).fill(null);

    const questionText     = document.getElementById("questionText");
    const answerOptions    = document.getElementById("answerOptions");
    const questionProgress = document.getElementById("questionProgress");
    const navContainer     = document.getElementById("questionNav");

    const nextBtn   = document.getElementById("nextBtn");
    const prevBtn   = document.getElementById("prevBtn");
    const submitBtn = document.getElementById("submitBtn");


    /* -----------------------------------------------------
       4. TIMER (folosim durata din quiz)
    ------------------------------------------------------ */
    let timeLeft = Number(quiz.duration || 20) * 60; // fallback 20 min
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


    /* -----------------------------------------------------
       5. AFISARE INTREBARE
    ------------------------------------------------------ */
    function loadQuestion(index) {
        const q = questions[index];

        if (questionText) {
            questionText.textContent = q.text || "";
        }
        if (questionProgress) {
            questionProgress.textContent = `Question ${index + 1} / ${questions.length}`;
        }

        answerOptions.innerHTML = "";

        (q.options || []).forEach((opt, i) => {

            const optionDiv = document.createElement("div");
            optionDiv.className = "answer-option";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = i;

            if (answers[index] && answers[index].includes(i)) {
                checkbox.checked = true;
                optionDiv.classList.add("selected");
            }

            const labelSpan = document.createElement("span");
            labelSpan.textContent = opt.text || "";

            optionDiv.appendChild(checkbox);
            optionDiv.appendChild(labelSpan);

            // click pe toata casuta
            optionDiv.addEventListener("click", (e) => {
                if (e.target.tagName !== "INPUT") {
                    checkbox.checked = !checkbox.checked;
                }

                if (!answers[index]) answers[index] = [];

                if (checkbox.checked) {
                    optionDiv.classList.add("selected");
                    if (!answers[index].includes(i)) answers[index].push(i);
                } else {
                    optionDiv.classList.remove("selected");
                    answers[index] = answers[index].filter(v => v !== i);
                }

                updateBullets();
            });

            // sa nu se dubleze toggle-ul
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


    /* -----------------------------------------------------
       6. BULLETE NAVIGARE
    ------------------------------------------------------ */
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
            if (answers[i] && answers[i].length > 0) b.classList.add("answered");
        });
    }


    /* -----------------------------------------------------
       7. BUTOANE NEXT / BACK
    ------------------------------------------------------ */
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


    /* -----------------------------------------------------
       8. CALCUL SCOR (ca in varianta veche)
    ------------------------------------------------------ */
    function calculateScore() {
        let totalPoints = 0;

        questions.forEach((q, i) => {
            const student = answers[i] || [];

            const correct = (q.options || [])
                .map((opt, idx) => opt.correct ? idx : null)
                .filter(v => v !== null);

            // daca studentul a bifat ceva in plus fata de corecte -> 0 pe intrebarea asta
            if (student.some(s => !correct.includes(s))) return;

            const fraction = correct.length === 0 ? 0 : (student.length / correct.length);
            totalPoints += fraction;
        });

        const raw = (totalPoints / questions.length) * 10;
        return Math.round(raw * 100) / 100; // 2 zecimale
    }


    /* -----------------------------------------------------
       9. FINALIZARE QUIZ
          - salveaza pentru student (gradesHistory + selectedResult)
          - salveaza pentru profesor (students_responses)
    ------------------------------------------------------ */
    function finishQuiz() {
        const finalScore = calculateScore();

        // --- pentru STUDENT (My Grades + Quiz Submitted + AI Feedback) ---
        const quizDataForStudent = {
            quizId: quizId,
            score: finalScore,
            answers: answers,
            questions: questions,
            quizTitle: quiz.title || "Untitled Quiz",
            quizAuthor: quiz.author || "Professor",
            quizSubject: quiz.subject || "",
            dateCompleted: new Date().toISOString()
        };

        const history = JSON.parse(localStorage.getItem("gradesHistory") || "[]");
        history.unshift(quizDataForStudent);
        localStorage.setItem("gradesHistory", JSON.stringify(history));

        localStorage.setItem("selectedResult", JSON.stringify(quizDataForStudent));

        // --- pentru PROFESOR (students_responses) ---
        const currentStudent = JSON.parse(localStorage.getItem("current_student") || "null") || {
            id: "std_" + Math.floor(Math.random() * 10000),
            name: "Student Test"
        };

        const professorResponse = {
            quizId: quizId,
            quizTitle: quiz.title || "Untitled Quiz",
            studentId: currentStudent.id,
            studentName: currentStudent.name,
            answers: answers,
            questions: questions,
            score: finalScore,
            totalPoints: questions.reduce((sum, q) => sum + Number(q.points || 1), 0),
            submittedAt: new Date().toISOString()
        };

        const allResponses = JSON.parse(localStorage.getItem("students_responses") || "[]");
        allResponses.push(professorResponse);
        localStorage.setItem("students_responses", JSON.stringify(allResponses));

        // --- redirect ---
        window.location.href = "quiz_submitted.html";
    }


    /* -----------------------------------------------------
       10. CLICK PE SUBMIT
    ------------------------------------------------------ */
    if (submitBtn) {
        submitBtn.addEventListener("click", () => {

            const allAnswered = answers.every(a => Array.isArray(a) && a.length > 0);

            if (!allAnswered) {
                alert("Please answer all questions before submitting.");
                return;
            }

            finishQuiz();
        });
    }


    /* -----------------------------------------------------
       INITIAL LOAD
    ------------------------------------------------------ */
    buildBullets();
    loadQuestion(0);
});
