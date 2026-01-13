document.addEventListener("DOMContentLoaded", () => {

    const data = JSON.parse(localStorage.getItem("selectedResult"));
    if (!data || !data.quiz || !data.submission) {
        alert("No quiz selected!");
        window.location.href = "my_grades.html";
        return;
    }

    const quiz = data.quiz;
    const submission = data.submission;

    document.getElementById("quizTitle").textContent = quiz.title || "Quiz";
    document.getElementById("quizMeta").textContent =
        `${quiz.subject || "N/A"} ? Professor ${quiz.owner_professor_id || ""} ? Completed on ${new Date(submission.submitted_at).toLocaleString()}`;

    document.getElementById("finalScore").textContent = submission.score;

    const container = document.getElementById("questionsContainer");
    container.innerHTML = "";

    const answersByQuestion = {};
    (submission.answers || []).forEach((ans) => {
        answersByQuestion[ans.question_id] = ans;
    });

    const questions = (quiz.questions || []).sort((a, b) => a.order - b.order);

    questions.forEach((q, i) => {
        const ans = answersByQuestion[q.id];
        const qScore = ans ? ans.points_awarded : 0;

        const card = document.createElement("div");
        card.className = "question-block";

        const shownScore = Number.isInteger(qScore) ? qScore : qScore.toFixed(2);
        const shownPoints = Number.isInteger(q.points) ? q.points : Number(q.points).toFixed(2);

        let html = `
            <h3>Question ${i + 1}</h3>
            <p>${q.text}</p>
            <p class="question-score">Score: <strong>${shownScore} / ${shownPoints}</strong></p>
        `;

        (q.choices || []).forEach((choice) => {
            const isCorrect = choice.is_correct === true;
            const selected = ans && ans.selected_label
                ? ans.selected_label.split(",").map(v => v.trim()).filter(Boolean)
                : [];
            const isChosen = selected.includes(choice.label);

            let cls = "neutral";
            let mark = "";

            if (isCorrect && isChosen) {
                cls = "correct";
                mark = "?";
            } else if (!isCorrect && isChosen) {
                cls = "incorrect";
                mark = "?";
            } else if (isCorrect && !isChosen) {
                cls = "missed";
                mark = "?";
            }

            html += `
                <div class="option ${cls}">
                    <span class="mark">${mark}</span> ${choice.label}. ${choice.text}
                </div>
            `;
        });

        card.innerHTML = html;
        container.appendChild(card);
    });

});
