document.addEventListener("DOMContentLoaded", () => {

    const quizSelect = document.getElementById("quizSelect");

    const avgScore = document.getElementById("avgScore");
    const highScore = document.getElementById("highScore");
    const lowScore = document.getElementById("lowScore");
    const subCount = document.getElementById("subCount");

    const subTable = document.getElementById("subTable");
    const insightText = document.getElementById("insightText");

    let scoreChart, difficultyChart;
    let chartContainer1Height = 400;
    let chartContainer2Height = 400;

    // Load quizzes
    const quizzes = JSON.parse(localStorage.getItem("quizzes") || "[]");
    const responses = JSON.parse(localStorage.getItem("students_responses") || "[]");

    // Populate dropdown
    quizzes.forEach(q => {
        const opt = document.createElement("option");
        opt.value = q.id;
        opt.textContent = q.title;
        quizSelect.appendChild(opt);
    });

    quizSelect.addEventListener("change", () => {
        if (!quizSelect.value) return;
        const quizId = quizSelect.value;

        updateDashboard(quizId);
    });

    // Handle responsive chart sizing
    window.addEventListener('resize', () => {
        if (scoreChart) scoreChart.resize();
        if (difficultyChart) difficultyChart.resize();
    });

    function updateDashboard(quizId) {

        const quiz = quizzes.find(q => q.id == quizId);
        const quizRes = responses.filter(r => r.quizId == quizId);

        if (quizRes.length === 0) {
                
            // Clear KPI values
            avgScore.textContent = "–";
            highScore.textContent = "–";
            lowScore.textContent = "–";
            subCount.textContent = "0";
                
            // Delete previous charts if they exist
            if (scoreChart) {
                scoreChart.destroy();
                scoreChart = null;
            }
            if (difficultyChart) {
                difficultyChart.destroy();
                difficultyChart = null;
            }
        
            // Clear table
            subTable.innerHTML = `
                <tr><td colspan="4" style="text-align:center; padding:15px;">No submissions found.</td></tr>
            `;
        
            // Clear insights
            insightText.textContent = "There is no data available for this quiz.";
        
            return;
        }
        

        // ---------- KPI ----------
        const scores = quizRes.map(r => r.score);

        const avg = scores.reduce((a,b)=>a+b,0) / scores.length;
        const max = Math.max(...scores);
        const min = Math.min(...scores);

        avgScore.textContent = avg.toFixed(2);
        highScore.textContent = max;
        lowScore.textContent = min;
        subCount.textContent = scores.length;


        // ---------- Score Distribution ----------
        const buckets = [0,0,0,0,0];  // 0-2, 2-4, 4-6, 6-8, 8-10

        scores.forEach(s => {
            if (s < 2) buckets[0]++;
            else if (s < 4) buckets[1]++;
            else if (s < 6) buckets[2]++;
            else if (s < 8) buckets[3]++;
            else buckets[4]++;
        });

        if (scoreChart) scoreChart.destroy();
        
        const scoreCtx = document.getElementById("scoreChart");
        scoreChart = new Chart(scoreCtx, {
            type: "bar",
            data: {
                labels: ["0–2","2–4","4–6","6–8","8–10"],
                datasets: [{
                    label: "Students",
                    data: buckets,
                    backgroundColor: "#4b7cff",
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
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


        // ---------- Question Difficulty ----------
        const questionCorrectCount = Array(quiz.questions.length).fill(0);

        quizRes.forEach(res => {
            res.answers.forEach((ans, i) => {
                const correctIdx = quiz.questions[i].options
                    .map((o, idx) => o.correct ? idx : null)
                    .filter(x => x !== null);

                const allCorrect = ans.length === correctIdx.length &&
                                   ans.every(a => correctIdx.includes(a));

                if (allCorrect) questionCorrectCount[i]++;
            });
        });

        const difficulty = questionCorrectCount.map(c => (c / quizRes.length) * 100);

        if (difficultyChart) difficultyChart.destroy();
        
        const diffCtx = document.getElementById("difficultyChart");
        difficultyChart = new Chart(diffCtx, {
            type: "bar",
            data: {
                labels: quiz.questions.map((_, i) => "Q" + (i+1)),
                datasets: [{
                    label: "% Correct",
                    data: difficulty,
                    backgroundColor: "#ffa726",
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
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

        // ---------- TABLE ----------
        subTable.innerHTML = "";
        quizRes.forEach(r => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${r.studentName}</td>
                <td>${r.score}</td>
                <td>${new Date(r.submittedAt).toLocaleString()}</td>
                <td>
                    <button class="view-btn"
                        onclick="location.href='view_submission.html?quiz=${quizId}&student=${r.studentId}'">
                        View
                    </button>
                </td>
            `;

            subTable.appendChild(tr);
        });

        // ---------- INSIGHTS ----------
        const hardestIdx = difficulty.indexOf(Math.min(...difficulty));
        const easiestIdx = difficulty.indexOf(Math.max(...difficulty));

        insightText.textContent = `
            Hardest question: Q${hardestIdx+1} (${difficulty[hardestIdx].toFixed(1)}% correct).
            Easiest question: Q${easiestIdx+1} (${difficulty[easiestIdx].toFixed(1)}% correct).
            Average performance suggests quiz difficulty is ${
                avg < 5 ? "high" : avg < 7 ? "moderate" : "low"
            }.
        `;
    }

});