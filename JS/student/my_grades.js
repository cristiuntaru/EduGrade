document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("gradesList");
    const emptyMessage = document.getElementById("noGradesMessage");

    async function loadGrades() {
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
            alert(err.message || "Could not load grades.");
            return;
        }

        const quizById = {};
        quizzes.forEach(q => {
            quizById[q.id] = q;
        });

        list.innerHTML = "";

        if (submissions.length === 0) {
            emptyMessage.style.display = "block";
            return;
        }

        emptyMessage.style.display = "none";

        submissions.forEach((submission, i) => {
            const quiz = quizById[submission.quiz_id];
            const dateStr = submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "";

            const div = document.createElement("div");
            div.className = "grade-item";

            div.innerHTML = `
                <div class="grade-info">
                    <h3>${quiz ? quiz.title : "Quiz"}</h3>
                    <p>${dateStr}</p>
                    <p class="score-text">Score: <strong>${submission.score}</strong></p>
                </div>

                <button class="btn view-btn" data-index="${i}">View Details</button>
            `;

            list.appendChild(div);
        });

        document.querySelectorAll(".view-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = e.target.dataset.index;
                const submission = submissions[index];
                const quiz = quizById[submission.quiz_id];

                if (!quiz) {
                    alert("Quiz details not available.");
                    return;
                }

                localStorage.setItem("selectedResult", JSON.stringify({
                    quiz,
                    submission
                }));

                window.location.href = "quiz_details.html";
            });
        });
    }

    loadGrades();
});
