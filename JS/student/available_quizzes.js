document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("quizList");
    const subjectFilter = document.getElementById("filterSubject");
    const statusFilter = document.getElementById("filterStatus");

    let quizzes = [];

    function getQuizStatus(q) {
        const now = new Date();
        const open = q.open_date ? new Date(q.open_date) : null;
        const close = q.close_date ? new Date(q.close_date) : null;

        if (!open || !close) return "Active";
        if (now < open) return "Upcoming";
        if (now > close) return "Expired";
        return "Active";
    }

    async function loadQuizzes() {
        try {
            const data = await apiRequest("/api/quizzes");
            quizzes = (data.quizzes || []).filter(q => q.status === "published");
        } catch (err) {
            alert(err.message || "Could not load quizzes.");
            return;
        }

        quizzes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        quizzes.forEach(q => q._status = getQuizStatus(q));
        renderQuizzes();
    }

    function renderQuizzes() {
        container.innerHTML = "";

        let filtered = quizzes;

        if (subjectFilter.value !== "All") {
            filtered = filtered.filter(q => q.subject === subjectFilter.value);
        }

        if (statusFilter.value !== "Any") {
            filtered = filtered.filter(q => q._status === statusFilter.value);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <p class="empty-state">
                    No quizzes match your filters.
                </p>`;
            return;
        }

        filtered.forEach(q => {
            const card = document.createElement("article");
            card.classList.add("quiz-card", q._status.toLowerCase());

            const open = q.open_date ? new Date(q.open_date).toLocaleString() : null;
            const close = q.close_date ? new Date(q.close_date).toLocaleString() : null;

            const dateText = (open && close)
                ? `Available: <strong>${open}</strong> - <strong>${close}</strong>`
                : `<em>No date range set</em>`;

            card.innerHTML = `
                <div class="quiz-main">
                    <h2 class="quiz-title">${q.title}</h2>

                    <p class="quiz-meta">
                        <span>Subject: ${q.subject || "N/A"}</span>
                    </p>

                    <p class="quiz-info">
                        Duration: <strong>${q.duration} min</strong>
                    </p>

                    <p class="quiz-dates">${dateText}</p>
                </div>

                <div class="quiz-actions">
                    <button class="btn quiz-btn" ${q._status !== "Active" ? "disabled" : ""}>
                        ${q._status === "Active" ? "Start Quiz" : q._status}
                    </button>
                </div>
            `;

            if (q._status === "Active") {
                card.querySelector(".quiz-btn").addEventListener("click", () => {
                    window.location.href = `take_quiz.html?id=${q.id}`;
                });
            }

            container.appendChild(card);
        });
    }

    subjectFilter.addEventListener("change", renderQuizzes);
    statusFilter.addEventListener("change", renderQuizzes);

    loadQuizzes();
});
