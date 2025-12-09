document.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("quizList");
    const subjectFilter = document.getElementById("filterSubject");
    const statusFilter = document.getElementById("filterStatus");

    // ============================================
    // 1 Load quizzes from localStorage
    // ============================================
    let quizzes = JSON.parse(localStorage.getItem("quizzes") || "[]");

    // Sort newest first
    quizzes.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(a.id);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(b.id);
        return dateB - dateA;
    });

    // ============================================
    // 2 Determine quiz status: Active / Upcoming / Expired
    // ============================================
    function getQuizStatus(q) {
        const now = new Date();
        const open = q.openDate ? new Date(q.openDate) : null;
        const close = q.closeDate ? new Date(q.closeDate) : null;

        if (!open || !close) return "Active"; // fallback

        if (now < open) return "Upcoming";
        if (now > close) return "Expired";
        return "Active";
    }

    // Pre-calc status for each quiz
    quizzes.forEach(q => q._status = getQuizStatus(q));

    // ============================================
    // 3 RENDER FUNCTION (filters + cards)
    // ============================================
    function renderQuizzes() {

        container.innerHTML = "";

        let filtered = quizzes.filter(q => q.status === "published");

        // --- Filter by Subject ---
        if (subjectFilter.value !== "All") {
            filtered = filtered.filter(q => q.subject === subjectFilter.value);
        }

        // --- Filter by Status ---
        if (statusFilter.value !== "Any") {
            filtered = filtered.filter(q => q._status === statusFilter.value);
        }

        // Empty state
        if (filtered.length === 0) {
            container.innerHTML = `
                <p class="empty-state">
                    No quizzes match your filters.
                </p>`;
            return;
        }

        // ============================================
        // 4 GENERATE CARDS
        // ============================================
        filtered.forEach(q => {

            const card = document.createElement("article");
            card.classList.add("quiz-card", q._status.toLowerCase());

            const open = q.openDate ? new Date(q.openDate).toLocaleString() : null;
            const close = q.closeDate ? new Date(q.closeDate).toLocaleString() : null;

            const dateText = (open && close)
                ? `Available: <strong>${open}</strong> → <strong>${close}</strong>`
                : `<em>No date range set</em>`;

            card.innerHTML = `
                <div class="quiz-main">
                    <h2 class="quiz-title">${q.title}</h2>

                    <p class="quiz-meta">
                        <span>Subject: ${q.subject}</span>
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

            // Only allow click when quiz is active
            if (q._status === "Active") {
                card.querySelector(".quiz-btn").addEventListener("click", () => {
                    window.location.href = `take_quiz.html?id=${q.id}`;
                });
            }

            container.appendChild(card);
        });
    }

    // ============================================
    // 5 Apply filters on change
    // ============================================
    subjectFilter.addEventListener("change", renderQuizzes);
    statusFilter.addEventListener("change", renderQuizzes);

    // Initial render
    renderQuizzes();
});
