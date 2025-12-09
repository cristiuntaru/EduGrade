document.addEventListener("DOMContentLoaded", () => {

    const tips = [
        "Review scanned quizzes carefully before final submission.",
        "Simplify complex questions to minimize grading errors.",
        "Use Analytics to identify common student weaknesses.",
        "Create balanced quizzes: mix easy and hard questions.",
        "Encourage students to review AI feedback regularly.",
        "Consistency in question structure improves grading accuracy.",
        "Use the Scan & Upload feature to save time when grading.",
        "Analyze low-performing questions to refine teaching material."
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    const tipBox = document.getElementById("tipText");
    if (tipBox) {
        tipBox.textContent = randomTip;
    }
});
