document.addEventListener("DOMContentLoaded", () => {

    const quizList = document.getElementById("quizList");
    let currentFilter = "all";
    let cachedQuizzes = [];

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {

            document.querySelectorAll(".filter-btn")
                .forEach(b => b.classList.remove("active"));

            btn.classList.add("active");
            currentFilter = btn.dataset.filter;

            loadQuizzes();
        });
    });

    function formatDate(dateString) {
        if (!dateString) return "N/A";
        const d = new Date(dateString);
        if (Number.isNaN(d.getTime())) return "N/A";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    async function loadQuizzes() {
        let quizzes = [];
        try {
            const data = await apiRequest("/api/quizzes");
            quizzes = data.quizzes || [];
        } catch (err) {
            alert(err.message || "Could not load quizzes.");
            return;
        }

        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id) {
            quizzes = quizzes.filter(q => q.owner_professor_id === currentUser.id);
        }

        cachedQuizzes = quizzes;

        quizzes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        if (currentFilter !== "all") {
            quizzes = quizzes.filter(q => q.status === currentFilter);
        }

        if (quizzes.length === 0) {
            quizList.innerHTML = '<p style="color:#666; font-size:18px;">No quizzes created yet.</p>';
            return;
        }

        quizList.innerHTML = "";

        quizzes.forEach(quiz => {
            const card = document.createElement("div");
            card.classList.add("quiz-card");

            card.innerHTML = `
                <div class="status-badge 
                    ${quiz.status === "published" ? "status-published" :
                      quiz.status === "archived" ? "status-archived" :
                      "status-draft"}">
                    
                    ${quiz.status === "published" ? "Published" :
                      quiz.status === "archived" ? "Archived" :
                      "Draft"}
                </div>

                <div class="quiz-title">${quiz.title}</div>

                <div class="quiz-meta">Quiz ID: <strong>${quiz.id}</strong></div>
                <div class="quiz-meta">Subject: <strong>${quiz.subject || "N/A"}</strong></div>
                <div class="quiz-meta">Questions: ${quiz.questions.length}</div>
                <div class="quiz-meta">Duration: ${quiz.duration} min</div>

                <div class="quiz-meta">Open: ${formatDate(quiz.open_date)}</div>
                <div class="quiz-meta">Close: ${formatDate(quiz.close_date)}</div>

                <div class="quiz-actions">
                    <button class="btn-small view-btn">View</button>
                    <button class="btn-small edit-btn">Edit</button>
                    <button class="btn-small print-full-btn">Print Quiz</button>

                    ${quiz.status === "published" ? `
                        <button class="btn-small responses-btn">Responses</button>
                    ` : ""}
                    
                    <button class="btn-small delete-btn">Delete</button>
                </div>
            `;

            if (quiz.status === "published") {
                const responsesBtn = card.querySelector(".responses-btn");
                responsesBtn.addEventListener("click", () => {
                    window.location.href = `students_responses.html?id=${quiz.id}`;
                });
            }

            card.querySelector(".view-btn").addEventListener("click", () => {
                window.location.href = `view_quiz.html?id=${quiz.id}`;
            });

            card.querySelector(".edit-btn").addEventListener("click", () => {
                window.location.href = `edit_quiz.html?id=${quiz.id}`;
            });

            card.querySelector(".print-full-btn").addEventListener("click", () => {
                window.location.href = `print_full_quiz.html?id=${quiz.id}`;
            });

            card.querySelector(".delete-btn").addEventListener("click", async () => {
                if (!confirm(`Delete quiz "${quiz.title}"?`)) return;
                try {
                    await apiRequest(`/api/quizzes/${quiz.id}`, { method: "DELETE" });
                    loadQuizzes();
                } catch (err) {
                    alert(err.message || "Could not delete quiz.");
                }
            });

            quizList.appendChild(card);
        });
    }

    loadQuizzes();
});
