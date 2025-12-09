// -----------------------------------------------------
// MAIN PAGE LOGIC
// -----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    console.log("students_responses.js LOADED");

    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");

    if (!quizId) {
        alert("Quiz ID missing.");
        return;
    }

    const responsesList = document.getElementById("responsesList");

    // ======================================================
    // CITIREA RĂSPUNSURILOR
    // ======================================================
    const allResponses = JSON.parse(localStorage.getItem("students_responses") || "[]");

    // sortăm descrescător după data trimiterii
    allResponses.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    const quizResponses = allResponses.filter(r => String(r.quizId) === String(quizId));

    if (quizResponses.length === 0) {
        responsesList.innerHTML = `
            <p style="color:#555; font-size:18px; margin-top:20px;">
                No responses yet.
            </p>
        `;
        return;
    }

    function formatDate(isoString) {
        const d = new Date(isoString);

        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();

        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");

        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }


    // ======================================================
    // AFIȘAREA RĂSPUNSURILOR
    // ======================================================
    quizResponses.forEach(res => {
        const card = document.createElement("div");
        card.classList.add("response-card");

        card.innerHTML = `
            <div class="name">${res.studentName}</div>
            <div class="response-meta">Score: ${res.score} / ${res.totalPoints}</div>
            <div class="response-meta">Submitted: ${formatDate(res.submittedAt)}</div>
            <button class="view-submission-btn">View submission</button>
        `;

        card.querySelector(".view-submission-btn").addEventListener("click", () => {
            window.location.href = `view_submission.html?quiz=${encodeURIComponent(quizId)}&student=${encodeURIComponent(res.studentId)}`;
        });

        responsesList.appendChild(card);
    });
});
