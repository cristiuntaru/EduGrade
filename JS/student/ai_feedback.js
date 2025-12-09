document.addEventListener("DOMContentLoaded", () => {

    const history = JSON.parse(localStorage.getItem("gradesHistory")) || [];

    const emptyState = document.getElementById("aiEmptyState");
    const content = document.getElementById("aiContent");

    if (!history.length) {
        emptyState.classList.remove("hidden");
        content.classList.add("hidden");
        return;
    } else {
        emptyState.classList.add("hidden");
        content.classList.remove("hidden");
    }

    /* -------------------------------------------------
       1. SORTĂM ISTORICUL (cel mai nou primul)
    -------------------------------------------------- */
    history.sort((a, b) => new Date(b.dateCompleted) - new Date(a.dateCompleted));

    const lastQuiz = history[0];
    const lastQuestions = lastQuiz.questions || [];
    const lastAnswers = lastQuiz.answers || [];

    /* -------------------------------------------------
       2. CALCULĂM STATISTICILE DE BAZĂ (PE TOT ISTORICUL)
    -------------------------------------------------- */
    const totalQuizzes = history.length;

    let sumScore = 0;
    let bestScore = -Infinity;
    let worstScore = Infinity;

    history.forEach(q => {
        const s = Number(q.score) || 0;
        sumScore += s;
        if (s > bestScore) bestScore = s;
        if (s < worstScore) worstScore = s;
    });

    const avgScore = sumScore / totalQuizzes;
    const lastScore = Number(lastQuiz.score) || 0;

    let trendText = "Trend: stable";
    if (totalQuizzes > 1) {
        const prevSum = sumScore - lastScore;
        const prevAvg = prevSum / (totalQuizzes - 1);

        if (lastScore > prevAvg + 0.25) trendText = "Trend: improving";
        else if (lastScore < prevAvg - 0.25) trendText = "Trend: decreasing";
    }

    document.getElementById("avgScore").textContent = avgScore.toFixed(2);
    document.getElementById("lastScore").textContent = lastScore.toFixed(2);
    document.getElementById("bestScore").textContent = bestScore.toFixed(2);
    document.getElementById("totalQuizzes").textContent = totalQuizzes;
    document.getElementById("trendLabel").textContent = trendText;

    /* -------------------------------------------------
       2.1 BADGE LEVEL SYSTEM (PE MEDIA GENERALĂ)
    -------------------------------------------------- */
    const badgeEl = document.getElementById("avgBadge");
    
    let badgeText = "";
    let badgeClass = "";
    
    if (avgScore < 4) {
        badgeText = "⭐ Beginner";
        badgeClass = "badge-beginner";
    }
    else if (avgScore < 7) {
        badgeText = "⭐⭐ Intermediate";
        badgeClass = "badge-intermediate";
    }
    else if (avgScore < 9) {
        badgeText = "⭐⭐⭐ Advanced";
        badgeClass = "badge-advanced";
    }
    else {
        badgeText = "⭐⭐⭐⭐ Expert";
        badgeClass = "badge-expert";
    }
    
    badgeEl.textContent = badgeText;
    badgeEl.className = "badge-level " + badgeClass;


    /* -------------------------------------------------
       3. FUNCȚII UTILITARE PENTRU SCOR PE ÎNTREBARE
    -------------------------------------------------- */
    function getCorrectIndexes(question) {
        return (question.options || [])
            .map((opt, idx) => opt.correct ? idx : null)
            .filter(idx => idx !== null);
    }

    // scor pe întrebare raportat la punctajul ei setat
    function calcQuestionScore(question, studentAns) {
        const correct = getCorrectIndexes(question);

        if (!studentAns || studentAns.length === 0) return 0;
        if (studentAns.some(s => !correct.includes(s))) return 0;

        const points = Number(question.points) || 0;
        if (!points || correct.length === 0) return 0;

        const perOption = points / correct.length;
        return studentAns.length * perOption;
    }


    /* -------------------------------------------------
       4. CHALLENGING QUESTIONS – DOAR ULTIMUL QUIZ
    -------------------------------------------------- */
    const weakList = document.getElementById("weakList");
    weakList.innerHTML = "";

    const perQuestionResults = [];
    let hadMultiSelectMistake = false;

    lastQuestions.forEach((q, index) => {
        const studentAns = lastAnswers[index] || [];
        const score = calcQuestionScore(q, studentAns);
        const points = Number(q.points) || 0;
        const mastery = points > 0 ? score / points : 0;
        const masteryPercent = Math.round(mastery * 100);

        perQuestionResults.push({
            question: q,
            mastery,
            masteryPercent
        });

        const correct = getCorrectIndexes(q);
        if (correct.length > 1 && score < points) {
            hadMultiSelectMistake = true;
        }
    });

    // întrebări unde nu s-a luat punctaj maxim
    let weakQuestions = perQuestionResults.filter(entry => entry.mastery < 1);
    weakQuestions.sort((a, b) => a.mastery - b.mastery);

    if (!weakQuestions.length) {
        const li = document.createElement("li");
        li.className = "weak-item";
        li.textContent = "No challenging questions for your last quiz — perfect score!";
        weakList.appendChild(li);
    } else {
        weakQuestions.slice(0, 3).forEach(entry => {
            const li = document.createElement("li");
            li.className = "weak-item";

            const masteryPercent = entry.masteryPercent;

            let badgeClass = "weak-score-ok";
            if (entry.mastery < 0.5) badgeClass = "weak-score-low";
            else if (entry.mastery < 0.75) badgeClass = "weak-score-medium";

            const text = entry.question.text.length > 120
                ? entry.question.text.slice(0, 117) + "..."
                : entry.question.text;

            li.innerHTML = `
                <div>
                    <div class="weak-text">${text}</div>
                    <div class="weak-meta">
                        Attempts: 1 · Mastery: ${masteryPercent}%
                    </div>
                </div>
                <div class="weak-score-badge ${badgeClass}">
                    ${masteryPercent}%
                </div>
            `;
            weakList.appendChild(li);
        });
    }


    /* -------------------------------------------------
       5. SUBJECT PERFORMANCE – PE TOT ISTORICUL
    -------------------------------------------------- */
    const subjects = {};

    history.forEach(q => {
        const subj = q.quizSubject || "General";

        if (!subjects[subj]) subjects[subj] = [];
        subjects[subj].push(q);
    });

    const subjectStats = {};

    Object.keys(subjects).forEach(subj => {
        const list = subjects[subj];

        let sum = 0, best = -Infinity;

        list.forEach(q => {
            const s = Number(q.score) || 0;
            sum += s;
            if (s > best) best = s;
        });

        subjectStats[subj] = {
            attempts: list.length,
            average: sum / list.length,
            best: best
        };
    });

    const subjList = document.getElementById("subjectList");
    subjList.innerHTML = "";

    Object.keys(subjectStats).forEach(subj => {
        const stat = subjectStats[subj];

        const div = document.createElement("div");
        div.className = "subject-item";

        div.innerHTML = `
            <div class="subject-header">${subj}</div>
            <div class="subject-stat">Average: <strong>${stat.average.toFixed(2)}</strong></div>
            <div class="subject-stat">Best: <strong>${stat.best.toFixed(2)}</strong></div>
            <div class="subject-stat">Completed tests: <strong>${stat.attempts}</strong></div>
        `;

        subjList.appendChild(div);
    });


    /* -------------------------------------------------
       6. AI RECOMMENDATIONS
          – DOAR PE BAZA ULTIMULUI QUIZ
          – MAXIM 5 RECOMANDĂRI, FĂRĂ CONTRADICȚII
    -------------------------------------------------- */
    const recList = document.getElementById("aiRecommendations");
    recList.innerHTML = "";

    const recommendations = [];

    function addRec(text) {
        if (recommendations.length >= 5) return;
        if (recommendations.includes(text)) return;
        recommendations.push(text);
    }

    // 6.1 – Recomandare generală pe ultimul scor
    if (lastScore >= 9) {
        addRec("Excellent performance on your last quiz — keep it up!");
    } else if (lastScore >= 7) {
        addRec("Good score on your last quiz — you are on the right track, keep improving.");
    } else if (lastScore >= 5) {
        addRec("Your last quiz result is decent, but review the questions you missed to strengthen your knowledge.");
    } else {
        addRec("Your last quiz score was low — consider reviewing the theory before attempting another quiz.");
    }

    // 6.2 – Recomandare pe materie (ultimul quiz)
    const lastSubject = lastQuiz.quizSubject || "General";
    if (lastScore < 7) {
        addRec(`Focus more on **${lastSubject}** — your latest quiz shows room for improvement in this subject.`);
    } else {
        addRec(`Strong performance in **${lastSubject}** based on your last quiz — great job!`);
    }

    // 6.3 – Recomandări pe întrebările slabe (max 2)
    weakQuestions.slice(0, 2).forEach(entry => {
        addRec(`Review the topic related to: "${entry.question.text}".`);
    });

    // 6.4 – Recomandare specială pentru întrebări multi-select
    if (hadMultiSelectMistake) {
        addRec("Pay extra attention to multi-select questions — all correct options must be selected to receive full points.");
    }

    // 6.5 – fallback dacă sunt prea puține recomandări
    if (recommendations.length === 0) {
        addRec("Keep practicing with new quizzes to receive more detailed feedback.");
    }

    // Render în UI
    recommendations.forEach(text => {
        const li = document.createElement("li");
        li.textContent = text;
        recList.appendChild(li);
    });
});
