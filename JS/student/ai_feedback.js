document.addEventListener("DOMContentLoaded", async () => {
    const emptyState = document.getElementById("aiEmptyState");
    const content = document.getElementById("aiContent");

    const avgScoreEl = document.getElementById("avgScore");
    const lastScoreEl = document.getElementById("lastScore");
    const bestScoreEl = document.getElementById("bestScore");
    const totalQuizzesEl = document.getElementById("totalQuizzes");
    const trendLabelEl = document.getElementById("trendLabel");
    const badgeEl = document.getElementById("avgBadge");

    const subjectList = document.getElementById("subjectList");
    const weakList = document.getElementById("weakList");
    const recList = document.getElementById("aiRecommendations");

    const currentUser = getCurrentUser();
    if (!currentUser || !getAuthToken()) {
        window.location.href = "../general/login.html";
        return;
    }

    let submissions = [];
    let quizzes = [];

    try {
        const [submissionsData, quizzesData] = await Promise.all([
            apiRequest("/api/submissions/me"),
            apiRequest("/api/quizzes")
        ]);
        submissions = submissionsData.submissions || [];
        quizzes = quizzesData.quizzes || [];
    } catch (err) {
        alert(err.message || "Could not load feedback data.");
        return;
    }

    if (!submissions.length) {
        emptyState.classList.remove("hidden");
        content.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    content.classList.remove("hidden");

    const quizById = {};
    quizzes.forEach((q) => {
        quizById[q.id] = q;
    });

    const history = submissions
        .map((submission) => {
            const quiz = quizById[submission.quiz_id];
            if (!quiz) return null;
            const totalPoints = (quiz.questions || [])
                .reduce((sum, q) => sum + Number(q.points || 0), 0);
            const normalizedScore = totalPoints > 0
                ? (Number(submission.score || 0) / totalPoints) * 10
                : 0;

            return {
                submission,
                quiz,
                totalPoints,
                normalizedScore,
                subject: quiz.subject || "General"
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            const aDate = a.submission.submitted_at || "";
            const bDate = b.submission.submitted_at || "";
            return new Date(bDate) - new Date(aDate);
        });

    if (!history.length) {
        emptyState.classList.remove("hidden");
        content.classList.add("hidden");
        return;
    }

    const lastEntry = history[0];
    const lastScore = lastEntry.normalizedScore;

    const totalQuizzes = history.length;
    const sumScore = history.reduce((sum, h) => sum + h.normalizedScore, 0);
    const avgScore = sumScore / totalQuizzes;
    const bestScore = Math.max(...history.map((h) => h.normalizedScore));

    let trendText = "Trend: stable";
    if (totalQuizzes > 1) {
        const prevAvg = (sumScore - lastScore) / (totalQuizzes - 1);
        if (lastScore > prevAvg + 0.25) trendText = "Trend: improving";
        else if (lastScore < prevAvg - 0.25) trendText = "Trend: decreasing";
    }

    avgScoreEl.textContent = avgScore.toFixed(2);
    lastScoreEl.textContent = lastScore.toFixed(2);
    bestScoreEl.textContent = bestScore.toFixed(2);
    totalQuizzesEl.textContent = totalQuizzes;
    trendLabelEl.textContent = trendText;

    let badgeText = "";
    let badgeClass = "";

    if (avgScore < 4) {
        badgeText = "Beginner";
        badgeClass = "badge-beginner";
    } else if (avgScore < 7) {
        badgeText = "Intermediate";
        badgeClass = "badge-intermediate";
    } else if (avgScore < 9) {
        badgeText = "Advanced";
        badgeClass = "badge-advanced";
    } else {
        badgeText = "Expert";
        badgeClass = "badge-expert";
    }

    badgeEl.textContent = badgeText;
    badgeEl.className = `badge-level ${badgeClass}`;

    // Subject performance
    const subjectBuckets = {};
    history.forEach((entry) => {
        if (!subjectBuckets[entry.subject]) subjectBuckets[entry.subject] = [];
        subjectBuckets[entry.subject].push(entry);
    });

    subjectList.innerHTML = "";
    Object.keys(subjectBuckets).forEach((subject) => {
        const items = subjectBuckets[subject];
        const subjectAvg =
            items.reduce((sum, i) => sum + i.normalizedScore, 0) / items.length;
        const subjectBest = Math.max(...items.map((i) => i.normalizedScore));

        const div = document.createElement("div");
        div.className = "subject-item";
        div.innerHTML = `
            <div class="subject-header">${subject}</div>
            <div class="subject-stat">Average: <strong>${subjectAvg.toFixed(2)}</strong></div>
            <div class="subject-stat">Best: <strong>${subjectBest.toFixed(2)}</strong></div>
            <div class="subject-stat">Completed tests: <strong>${items.length}</strong></div>
        `;
        subjectList.appendChild(div);
    });

    // Challenging questions based on last quiz
    weakList.innerHTML = "";
    const questionResults = [];
    let hadMultiSelectMistake = false;

    const lastQuiz = lastEntry.quiz;
    const lastQuestions = (lastQuiz.questions || []).slice().sort((a, b) => a.order - b.order);
    const answersByQuestion = {};

    (lastEntry.submission.answers || []).forEach((ans) => {
        answersByQuestion[ans.question_id] = ans;
    });

    lastQuestions.forEach((q) => {
        const ans = answersByQuestion[q.id];
        const points = Number(q.points || 0);
        const pointsAwarded = ans ? Number(ans.points_awarded || 0) : 0;
        const mastery = points > 0 ? pointsAwarded / points : 0;
        const masteryPercent = Math.round(mastery * 100);

        questionResults.push({
            question: q,
            mastery,
            masteryPercent
        });

        const correctLabels = (q.choices || []).filter((c) => c.is_correct).map((c) => c.label);
        if (correctLabels.length > 1 && pointsAwarded < points) {
            hadMultiSelectMistake = true;
        }
    });

    const weakQuestions = questionResults.filter((entry) => entry.mastery < 1);
    weakQuestions.sort((a, b) => a.mastery - b.mastery);

    if (!weakQuestions.length) {
        const li = document.createElement("li");
        li.className = "weak-item";
        li.textContent = "No challenging questions for your last quiz - perfect score!";
        weakList.appendChild(li);
    } else {
        weakQuestions.slice(0, 3).forEach((entry) => {
            const li = document.createElement("li");
            li.className = "weak-item";

            let badgeClass = "weak-score-ok";
            if (entry.mastery < 0.5) badgeClass = "weak-score-low";
            else if (entry.mastery < 0.75) badgeClass = "weak-score-medium";

            const text = entry.question.text.length > 120
                ? entry.question.text.slice(0, 117) + "..."
                : entry.question.text;

            li.innerHTML = `
                <div>
                    <div class="weak-text">${text}</div>
                    <div class="weak-meta">Attempts: 1 - Mastery: ${entry.masteryPercent}%</div>
                </div>
                <div class="weak-score-badge ${badgeClass}">
                    ${entry.masteryPercent}%
                </div>
            `;
            weakList.appendChild(li);
        });
    }

    // AI Recommendations
    recList.innerHTML = "";
    const recommendations = [];

    function addRec(text) {
        if (recommendations.length >= 5) return;
        if (recommendations.includes(text)) return;
        recommendations.push(text);
    }

    if (lastScore >= 9) {
        addRec("Excellent performance on your last quiz - keep it up!");
    } else if (lastScore >= 7) {
        addRec("Good score on your last quiz - you are on the right track, keep improving.");
    } else if (lastScore >= 5) {
        addRec("Your last quiz result is decent, but review the questions you missed to strengthen your knowledge.");
    } else {
        addRec("Your last quiz score was low - consider reviewing the theory before attempting another quiz.");
    }

    const lastSubject = lastEntry.subject || "General";
    if (lastScore < 7) {
        addRec(`Focus more on ${lastSubject} - your latest quiz shows room for improvement in this subject.`);
    } else {
        addRec(`Strong performance in ${lastSubject} based on your last quiz - great job!`);
    }

    weakQuestions.slice(0, 2).forEach((entry) => {
        addRec(`Review the topic related to: "${entry.question.text}".`);
    });

    if (hadMultiSelectMistake) {
        addRec("Pay extra attention to multi-select questions - all correct options must be selected to receive full points.");
    }

    if (recommendations.length === 0) {
        addRec("Keep practicing with new quizzes to receive more detailed feedback.");
    }

    recommendations.forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        recList.appendChild(li);
    });
});
