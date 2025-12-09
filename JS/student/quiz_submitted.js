document.addEventListener("DOMContentLoaded", () => {

    const resultData = JSON.parse(localStorage.getItem("selectedResult"));

    if (!resultData) {
        document.getElementById("finalScore").textContent = "No data";
        return;
    }

    const { answers, questions } = resultData;

    /* -------------------------
       CALCULATE TOTAL SCORE
    -------------------------- */
    function calculateQuestionScore(student, correct, maxPoints) {

        // dacă nu a selectat nimic → 0 puncte
        if (!student || student.length === 0) return 0;

        // dacă elevul a bifat ceva greșit → 0
        if (student.some(s => !correct.includes(s))) return 0;

        // împărțim punctele întrebării la nr. de opțiuni corecte
        const perOption = maxPoints / correct.length;

        return student.length * perOption;
    }

    let totalScore = 0;

    questions.forEach((q, i) => {

        // reconstruim lista de răspunsuri corecte
        const correct = q.options
            .map((opt, idx) => opt.correct ? idx : null)
            .filter(v => v !== null);

        totalScore += calculateQuestionScore(answers[i], correct, q.points);
    });

    document.getElementById("finalScore").textContent = totalScore.toFixed(2);


    /* -------------------------
       BUILD BREAKDOWN LIST
    -------------------------- */

    const container = document.getElementById("answersContainer");

    questions.forEach((q, index) => {

        const div = document.createElement("div");
        div.className = "answer-item";

        const studentAns = answers[index] || [];

        const correctAns = q.options
            .map((opt, idx) => opt.correct ? idx : null)
            .filter(v => v !== null);

        const qScore = calculateQuestionScore(studentAns, correctAns, q.points);
        const scoreText = qScore.toFixed(2) + " pts";

        let badgeClass = "score-badge-zero";
        if (qScore === q.points) badgeClass = "score-badge-full";
        else if (qScore > 0) badgeClass = "score-badge-partial";

        const header = `
            <div class="question-header">
                <h3>Question ${index + 1}</h3>
                <span class="score-badge ${badgeClass}">${scoreText}</span>
            </div>
            <p class="question-text">${q.text}</p>
        `;

        div.innerHTML = header;

        const ul = document.createElement("ul");
        ul.className = "answer-list";

        q.options.forEach((opt, i) => {

            const li = document.createElement("li");

            const isCorrect = correctAns.includes(i);
            const chosen = studentAns.includes(i);

            if (isCorrect && chosen) li.className = "ans-correct-chosen";
            else if (isCorrect && !chosen) li.className = "ans-correct-missed";
            else if (!isCorrect && chosen) li.className = "ans-wrong-chosen";
            else li.className = "ans-neutral";

            li.innerHTML = `
                <span class="ans-icon">
                    ${ isCorrect ? "✔" : (chosen ? "✘" : "") }
                </span>
                ${opt.text}
            `;

            ul.appendChild(li);
        });

        div.appendChild(ul);
        container.appendChild(div);
    });

});
