document.addEventListener("DOMContentLoaded", () => {

    const resultData = JSON.parse(localStorage.getItem("selectedResult"));

    if (!resultData || !resultData.quiz || !resultData.submission) {
        document.getElementById("finalScore").textContent = "No data";
        return;
    }

    const quiz = resultData.quiz;
    const submission = resultData.submission;
    const answersByQuestion = {};

    (submission.answers || []).forEach((ans) => {
        answersByQuestion[ans.question_id] = ans;
    });

    document.getElementById("finalScore").textContent = submission.score;

    const container = document.getElementById("answersContainer");
    container.innerHTML = "";

    const questions = (quiz.questions || []).sort((a, b) => a.order - b.order);

    questions.forEach((q, index) => {
        const div = document.createElement("div");
        div.className = "answer-item";

        const ans = answersByQuestion[q.id];
        const qScore = ans ? ans.points_awarded : 0;
        const scoreText = `${qScore} pts`;

        let badgeClass = "score-badge-zero";
        if (qScore === q.points) badgeClass = "score-badge-full";
        else if (qScore > 0) badgeClass = "score-badge-partial";

        div.innerHTML = `
            <div class="question-header">
                <h3>Question ${index + 1}</h3>
                <span class="score-badge ${badgeClass}">${scoreText}</span>
            </div>
            <p class="question-text">${q.text}</p>
        `;

        const ul = document.createElement("ul");
        ul.className = "answer-list";

        (q.choices || []).forEach((choice) => {
            const li = document.createElement("li");

            const isCorrect = choice.is_correct === true;
            const selected = ans && ans.selected_label
                ? ans.selected_label.split(",").map(v => v.trim()).filter(Boolean)
                : [];
            const chosen = selected.includes(choice.label);

            if (isCorrect && chosen) li.className = "ans-correct-chosen";
            else if (isCorrect && !chosen) li.className = "ans-correct-missed";
            else if (!isCorrect && chosen) li.className = "ans-wrong-chosen";
            else li.className = "ans-neutral";

            li.innerHTML = `
                <span class="ans-icon">
                    ${isCorrect ? "?" : (chosen ? "?" : "")}
                </span>
                ${choice.label}. ${choice.text}
            `;

            ul.appendChild(li);
        });

        div.appendChild(ul);
        container.appendChild(div);
    });
});
