document.addEventListener("DOMContentLoaded", async () => {
    const quizSelect = document.getElementById("quizSelect");
    const avgScore = document.getElementById("avgScore");
    const highScore = document.getElementById("highScore");
    const lowScore = document.getElementById("lowScore");
    const subCount = document.getElementById("subCount");
    const subTable = document.getElementById("subTable");
    const insightText = document.getElementById("insightText");

    let scoreChart;
    let difficultyChart;

    const currentUser = getCurrentUser();
    if (!currentUser || !getAuthToken()) {
        alert("Please log in again.");
        window.location.href = "../general/login.html";
        return;
    }

    let quizzes = [];

    try {
        const data = await apiRequest("/api/quizzes");
        quizzes = (data.quizzes || []).filter(
            (q) => String(q.owner_professor_id) === String(currentUser.id)
        );
    } catch (err) {
        alert(err.message || "Could not load quizzes.");
        return;
    }

    quizSelect.innerHTML = `<option value="">Select a quiz</option>`;
    quizzes.forEach((q) => {
        const opt = document.createElement("option");
        opt.value = q.id;
        opt.textContent = q.title;
        quizSelect.appendChild(opt);
    });

    quizSelect.addEventListener("change", () => {
        if (!quizSelect.value) {
            clearDashboard();
            return;
        }
        updateDashboard(quizSelect.value);
    });

    window.addEventListener("resize", () => {
        if (scoreChart) scoreChart.resize();
        if (difficultyChart) difficultyChart.resize();
    });

    function clearDashboard() {
        avgScore.textContent = "-";
        highScore.textContent = "-";
        lowScore.textContent = "-";
        subCount.textContent = "0";

        if (scoreChart) {
            scoreChart.destroy();
            scoreChart = null;
        }
        if (difficultyChart) {
            difficultyChart.destroy();
            difficultyChart = null;
        }

        subTable.innerHTML =
            `<tr><td colspan="4" style="text-align:center; padding:15px;">No submissions found.</td></tr>`;
        insightText.textContent = "Select a quiz to generate insights...";
    }

    async function updateDashboard(quizId) {
        const quiz = quizzes.find((q) => String(q.id) === String(quizId));
        if (!quiz) {
            clearDashboard();
            return;
        }

        let submissions = [];
        try {
            const data = await apiRequest(`/api/submissions/quiz/${quizId}`);
            submissions = data.submissions || [];
        } catch (err) {
            clearDashboard();
            alert(err.message || "Could not load submissions.");
            return;
        }

        if (submissions.length === 0) {
            clearDashboard();
            return;
        }

        const scores = submissions.map((s) => Number(s.score || 0));
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const max = Math.max(...scores);
        const min = Math.min(...scores);

        avgScore.textContent = avg.toFixed(2);
        highScore.textContent = max;
        lowScore.textContent = min;
        subCount.textContent = scores.length;

        const buckets = [0, 0, 0, 0, 0];
        scores.forEach((s) => {
            if (s < 2) buckets[0]++;
            else if (s < 4) buckets[1]++;
            else if (s < 6) buckets[2]++;
            else if (s < 8) buckets[3]++;
            else buckets[4]++;
        });

        if (scoreChart) scoreChart.destroy();
        scoreChart = new Chart(document.getElementById("scoreChart"), {
            type: "bar",
            data: {
                labels: ["0-2", "2-4", "4-6", "6-8", "8-10"],
                datasets: [
                    {
                        label: "Students",
                        data: buckets,
                        backgroundColor: "#4b7cff",
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "bottom"
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        const questions = (quiz.questions || []).slice().sort((a, b) => a.order - b.order);
        const correctByQuestion = {};
        questions.forEach((q) => {
            correctByQuestion[q.id] = (q.choices || [])
                .filter((c) => c.is_correct)
                .map((c) => c.label);
        });

        const questionCorrectCount = Array(questions.length).fill(0);
        submissions.forEach((submission) => {
            const answersByQuestion = {};
            (submission.answers || []).forEach((ans) => {
                const selected = ans.selected_label
                    ? ans.selected_label.split(",").map((v) => v.trim()).filter(Boolean)
                    : [];
                answersByQuestion[ans.question_id] = selected;
            });

            questions.forEach((q, idx) => {
                const selected = answersByQuestion[q.id] || [];
                const correct = correctByQuestion[q.id] || [];
                const selectedSet = new Set(selected);
                const correctSet = new Set(correct);
                const isCorrect =
                    selectedSet.size === correctSet.size &&
                    [...selectedSet].every((v) => correctSet.has(v));
                if (isCorrect) {
                    questionCorrectCount[idx] += 1;
                }
            });
        });

        const difficulty = questionCorrectCount.map(
            (c) => (c / submissions.length) * 100
        );

        if (difficultyChart) difficultyChart.destroy();
        difficultyChart = new Chart(document.getElementById("difficultyChart"), {
            type: "bar",
            data: {
                labels: questions.map((_, i) => `Q${i + 1}`),
                datasets: [
                    {
                        label: "% Correct",
                        data: difficulty,
                        backgroundColor: "#ffa726",
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "bottom"
                    }
                },
                scales: {
                    y: {
                        max: 100,
                        beginAtZero: true,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        });

        subTable.innerHTML = "";
        submissions.forEach((s) => {
            const tr = document.createElement("tr");
            const submittedAt = s.submitted_at
                ? new Date(s.submitted_at).toLocaleString()
                : "";

            tr.innerHTML = `
                <td>${s.student_name || "Student"}</td>
                <td>${s.score}</td>
                <td>${submittedAt}</td>
                <td>
                    <button class="view-btn"
                        onclick="location.href='view_submission.html?submission=${s.id}'">
                        View
                    </button>
                </td>
            `;
            subTable.appendChild(tr);
        });

        const hardestIdx = difficulty.indexOf(Math.min(...difficulty));
        const easiestIdx = difficulty.indexOf(Math.max(...difficulty));

        insightText.textContent = `Hardest question: Q${hardestIdx + 1} (${difficulty[
            hardestIdx
        ].toFixed(1)}% correct). Easiest question: Q${easiestIdx + 1} (${difficulty[
            easiestIdx
        ].toFixed(1)}% correct). Average performance suggests quiz difficulty is ${
            avg < 5 ? "high" : avg < 7 ? "moderate" : "low"
        }.`;
    }

    clearDashboard();
});
