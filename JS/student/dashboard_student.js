document.addEventListener("DOMContentLoaded", () => {

    const tips = [
        "Review your wrong answers. These help you improve faster than correct ones!",
        "Practice a little every day. Consistency beats intensity.",
        "Don't rush quizzes. Read each question carefully.",
        "Use AI Feedback to identify areas where you can improve.",
        "Focus on understanding concepts, not memorizing answers.",
        "Try explaining a topic to someone else. It's the best way to learn.",
        "Stay hydrated and take breaks. Your brain needs rest to retain information.",
        "Keep a notebook for tricky questions and review it weekly."
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    document.getElementById("tipText").textContent = randomTip;
});
