document.addEventListener("DOMContentLoaded", () => {

    const quizList = document.getElementById("quizList");

    let currentFilter = "all";

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {

            document.querySelectorAll(".filter-btn")
                .forEach(b => b.classList.remove("active"));

            btn.classList.add("active");
            currentFilter = btn.dataset.filter;

            loadQuizzes(); // reîncarcă lista filtrată
        });
    });


    function loadQuizzes() {
        let quizzes = JSON.parse(localStorage.getItem("quizzes") || "[]");

        quizzes.sort((a, b) => {
            return (b.updatedAt || b.id) - (a.updatedAt || a.id);
        });

            // ---------------- APPLY FILTER ----------------
        if (currentFilter !== "all") {
            quizzes = quizzes.filter(q => q.status === currentFilter);
        }
    

        if (quizzes.length === 0) {
            quizList.innerHTML = `<p style="color:#666; font-size:18px;">No quizzes created yet.</p>`;
            return;
        }

        quizList.innerHTML = "";

        function formatDate(dateString) {
            if (!dateString) return "N/A";
                
            const [datePart, timePart] = dateString.split("T");
            const [year, month, day] = datePart.split("-");
                
            return `${day}.${month}.${year} ${timePart}`;
        }


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

                <div class="quiz-meta">📘 Subject: <strong>${quiz.subject}</strong></div>
                <div class="quiz-meta">❓ Questions: ${quiz.questions.length}</div>
                <div class="quiz-meta">⏱ Duration: ${quiz.duration} min</div>

                <div class="quiz-meta">🟢 Open: ${formatDate(quiz.openDate)}</div>
                <div class="quiz-meta">🔴 Close: ${formatDate(quiz.closeDate)}</div>


                <div class="quiz-actions">
                    <button class="btn-small view-btn">View</button>
                    <button class="btn-small edit-btn">Edit</button>

                    ${quiz.status === "published" ? `
                        <button class="btn-small responses-btn">Responses</button>
                    ` : ""}
                    
                    <button class="btn-small delete-btn">Delete</button>
                </div>
            `;

            // ---------------- RESPONSES ----------------
            if (quiz.status === "published") {
                const responsesBtn = card.querySelector(".responses-btn");
                responsesBtn.addEventListener("click", () => {
                    window.location.href = `students_responses.html?id=${quiz.id}`;
                });
            }

            // ---------------- VIEW (în viitor) ----------------
            card.querySelector(".view-btn").addEventListener("click", () => {
                window.location.href = `view_quiz.html?id=${quiz.id}`;
            });

            // ---------------- EDIT (în viitor) ----------------
            card.querySelector(".edit-btn").addEventListener("click", () => {
                window.location.href = `edit_quiz.html?id=${quiz.id}`;
            });

            // ---------------- DELETE QUIZ ----------------
            card.querySelector(".delete-btn").addEventListener("click", () => {
                if (!confirm(`Delete quiz "${quiz.title}"?`)) return;

                const updated = quizzes.filter(q => q.id !== quiz.id);
                localStorage.setItem("quizzes", JSON.stringify(updated));
                loadQuizzes();
            });

            quizList.appendChild(card);
        });
    }

    loadQuizzes();
});
