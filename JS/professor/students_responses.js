document.addEventListener("DOMContentLoaded", () => {
    console.log("students_responses.js LOADED");

    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");

    if (!quizId) {
        alert("Quiz ID missing.");
        return;
    }

    const responsesList = document.getElementById("responsesList");

    async function loadResponses() {
        let submissions = [];
        let quiz = null;

        try {
            const [submissionsData, quizData] = await Promise.all([
                apiRequest(`/api/submissions/quiz/${quizId}`),
                apiRequest(`/api/quizzes/${quizId}`)
            ]);

            submissions = submissionsData.submissions || [];
            quiz = quizData.quiz;
        } catch (err) {
            alert(err.message || "Could not load responses.");
            return;
        }

        if (submissions.length === 0) {
            responsesList.innerHTML = `
                <p style="color:#555; font-size:18px; margin-top:20px;">
                    No responses yet.
                </p>
            `;
            return;
        }

        const totalPoints = (quiz.questions || []).reduce((sum, q) => sum + Number(q.points || 0), 0);

        function formatDate(isoString) {
            const d = new Date(isoString);

            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();

            const hours = String(d.getHours()).padStart(2, "0");
            const minutes = String(d.getMinutes()).padStart(2, "0");

            return `${day}.${month}.${year} ${hours}:${minutes}`;
        }

        submissions.forEach(res => {
            const card = document.createElement("div");
            card.classList.add("response-card");

            card.innerHTML = `
                <div class="name">${res.student_name || "Student"}</div>
                <div class="response-meta">Score: ${res.score} / ${totalPoints}</div>
                <div class="response-meta">Submitted: ${formatDate(res.submitted_at)}</div>
                <button class="view-submission-btn">View submission</button>
            `;

            card.querySelector(".view-submission-btn").addEventListener("click", () => {
                window.location.href = `view_submission.html?submission=${encodeURIComponent(res.id)}`;
            });

            responsesList.appendChild(card);
        });
    }

    loadResponses();
});
