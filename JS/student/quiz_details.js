document.addEventListener("DOMContentLoaded", () => {

    const data = JSON.parse(localStorage.getItem("selectedResult"));
    if (!data) {
        alert("No quiz selected!");
        window.location.href = "my_grades.html";
        return;
    }

    // Titel + Meta
    document.getElementById("quizTitle").textContent = data.quizTitle;
    document.getElementById("quizMeta").textContent =
        `${data.quizSubject} • ${data.quizAuthor} • Completed on ${new Date(data.dateCompleted).toLocaleString()}`;

    // Afișăm scorul final fără zecimale dacă este număr întreg
    document.getElementById("finalScore").textContent =
        Number.isInteger(data.score) ? data.score : data.score.toFixed(2);

    const container = document.getElementById("questionsContainer");
    container.innerHTML = "";

    const questions = data.questions || [];
    const answers = data.answers || [];

    // extrage indexurile corecte
    function getCorrectIndexes(q) {
        return (q.options || [])
            .map((opt, i) => opt.correct ? i : null)
            .filter(i => i !== null);
    }

    // calculează scorul unei întrebări
    function calcQuestionScore(q, studentAns) {
        const correct = getCorrectIndexes(q);
        const pts = Number(q.points) || 0;

        if (!studentAns || studentAns.length === 0) return 0;
        if (studentAns.some(s => !correct.includes(s))) return 0;

        return pts * (studentAns.length / correct.length);
    }

    // Generăm întrebările
    questions.forEach((q, i) => {
        const studentAns = answers[i] || [];
        const correct = getCorrectIndexes(q);

        const qScore = calcQuestionScore(q, studentAns);

        const card = document.createElement("div");
        card.className = "question-block";

        // Score frumos fără zecimale dacă e număr întreg
        const shownScore = Number.isInteger(qScore) ? qScore : qScore.toFixed(2);
        const shownPoints = Number.isInteger(q.points) ? q.points : Number(q.points).toFixed(2);

        let html = `
            <h3>Question ${i + 1}</h3>
            <p>${q.text}</p>
            <p class="question-score">Score: <strong>${shownScore} / ${shownPoints}</strong></p>
        `;

        // fiecare opțiune
        q.options.forEach((opt, idx) => {
            const isCorrect = correct.includes(idx);
            const isChosen = studentAns.includes(idx);

            let cls = "neutral";
            let mark = "";  // ✔ sau ✘

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

            html += `
                <div class="option ${cls}">
                    <span class="mark">${mark}</span> ${opt.text}
                </div>
            `;
        });

        card.innerHTML = html;
        container.appendChild(card);
    });

});
