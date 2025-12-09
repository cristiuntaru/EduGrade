document.addEventListener("DOMContentLoaded", () => {
    console.log("view_submission.js LOADED");

    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("quiz");
    const studentId = params.get("student");

    console.log("quizId =", quizId, "studentId =", studentId);

    // 1. Luăm toate răspunsurile studenților
    const students = JSON.parse(localStorage.getItem("students_responses") || "[]");
    console.log("students_responses =", students);

    const student = students.find(s => s.studentId === studentId);
    console.log("found student =", student);

    if (!student) {
        alert("Student not found in students_responses!");
        return;
    }

    console.log("students_responses =", students);

    // căutăm direct submission-ul
    const submission = students.find(s =>
        s.studentId === studentId && String(s.quizId) === String(quizId)
    );
    
    console.log("found submission =", submission);
    
    if (!submission) {
        alert("Submission not found for this quiz!");
        return;
    }

    // IMPORTANT: folosim exact structura ca la student: questions + answers
    const questions = submission.questions || [];
    const answers = submission.answers || [];

    if (!questions.length) {
        console.warn("Submission has no questions array!");
    }

    // 2. Header (titlu, meta, scor)
    document.getElementById("quizTitle").textContent = submission.quizTitle || "Quiz";

    const completedDate = submission.dateCompleted || submission.date || submission.submittedAt;
    const dateStr = completedDate ? new Date(completedDate).toLocaleString() : "unknown date";

   document.getElementById("quizMeta").textContent =
        `Submitted on ${new Date(submission.submittedAt).toLocaleString()}`;

    const score = Number(submission.score) || 0;
    document.getElementById("finalScore").textContent =
        Number.isInteger(score) ? score : score.toFixed(2);

    const container = document.getElementById("questionsContainer");
    container.innerHTML = "";

    // Funcțiile sunt COPIATE din quiz_details.js

    function getCorrectIndexes(q) {
        return (q.options || [])
            .map((opt, i) => opt.correct ? i : null)
            .filter(i => i !== null);
    }

    function calcQuestionScore(q, studentAns) {
        const correct = getCorrectIndexes(q);
        const pts = Number(q.points) || 0;

        if (!studentAns || studentAns.length === 0) return 0;
        if (studentAns.some(s => !correct.includes(s))) return 0;

        return pts * (studentAns.length / correct.length);
    }

    questions.forEach((q, i) => {
        const studentAns = answers[i] || [];
        const correct = getCorrectIndexes(q);

        const qScore = calcQuestionScore(q, studentAns);

        const shownScore = Number.isInteger(qScore) ? qScore : qScore.toFixed(2);
        const shownPoints = Number.isInteger(q.points)
            ? q.points
            : Number(q.points).toFixed(2);

        const card = document.createElement("div");
        card.className = "question-block";

        let html = `
            <h3>Question ${i + 1}</h3>
            <p>${q.text}</p>
            <p class="question-score">Score: <strong>${shownScore} / ${shownPoints}</strong></p>
        `;

        (q.options || []).forEach((opt, idx) => {
            const isCorrect = correct.includes(idx);
            const isChosen = studentAns.includes(idx);

            let cls = "neutral";
            let mark = "";

            if (isCorrect && isChosen) {
                cls = "correct";
                mark = "✔";
            } else if (!isCorrect && isChosen) {
                cls = "incorrect";
                mark = "✘";
            } else if (isCorrect && !isChosen) {
                cls = "missed";
                mark = "✔";
            }

            // opt poate fi string sau obiect { text, correct }
            const text = typeof opt === "string" ? opt : opt.text;

            html += `
                <div class="option ${cls}">
                    <span class="mark">${mark}</span> ${text}
                </div>
            `;
        });

        card.innerHTML = html;
        container.appendChild(card);
    });

    console.log("Rendered", questions.length, "questions for professor view.");
});
