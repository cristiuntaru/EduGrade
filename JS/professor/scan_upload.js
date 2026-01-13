document.addEventListener("DOMContentLoaded", () => {

    const uploadBtn = document.getElementById("uploadBtn");
    const fileInput = document.getElementById("fileInput");
    const scanCameraBtn = document.getElementById("scanCameraBtn");
    const quizIdInput = document.getElementById("ocrQuizId");
    const studentNameInput = document.getElementById("ocrStudentName");
    const statusEl = document.getElementById("ocrStatus");
    const debugImage = document.getElementById("ocrDebugImage");
    const debugData = document.getElementById("ocrDebugData");
    const debugLink = document.getElementById("ocrDebugLink");

    function setStatus(message, isError = false) {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.dataset.state = isError ? "error" : "ok";
    }

    function setDebug(data) {
        if (debugImage) {
            if (data && data.debug_url) {
                const url = `${API_BASE}${data.debug_url}`;
                debugImage.src = url;
                debugImage.style.display = "block";
                if (debugLink) {
                    debugLink.href = url;
                    debugLink.style.display = "inline-block";
                }
            } else {
                debugImage.style.display = "none";
                if (debugLink) {
                    debugLink.style.display = "none";
                }
            }
        }
        if (debugData) {
            debugData.textContent = data && data.marked
                ? JSON.stringify(data.marked)
                : "";
        }
    }

    function uploadFile(file) {
        const quizId = quizIdInput.value.trim();
        const studentName = studentNameInput.value.trim();

        if (!quizId) {
            setStatus("Quiz ID is required.", true);
            return;
        }
        if (!studentName) {
            setStatus("Student name is required.", true);
            return;
        }
        if (!getAuthToken()) {
            setStatus("You must be logged in to upload scans.", true);
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("quiz_id", quizId);
        formData.append("student_name", studentName);

        setStatus(`Uploading ${file.name}...`);

        apiRequest("/api/ocr/grade", {
            method: "POST",
            body: formData
        })
            .then((data) => {
                setStatus(`Scan graded. Score: ${data.score}`);
                setDebug(data);
                if (data && data.debug_url) {
                    window.open(`${API_BASE}${data.debug_url}`, "_blank");
                }
            })
            .catch((err) => {
                console.error(err);
                setStatus(err.message || "Upload failed.", true);
                setDebug(null);
            });
    }

    uploadBtn.addEventListener("click", () => {
        setStatus("Select a scan image to upload.");
        fileInput.value = "";
        fileInput.click();
    });

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) {
            setStatus("No file selected.", true);
            return;
        }
        setStatus(`Selected file: ${file.name}`);
        uploadFile(file);
    });

    scanCameraBtn.addEventListener("click", () => {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (!isMobile) {
            alert("Camera scanning works only on mobile devices.\nPlease use your phone!");
            return;
        }

        const camInput = document.createElement("input");
        camInput.type = "file";
        camInput.accept = "image/*";
        camInput.capture = "environment";

        camInput.addEventListener("change", () => {
            const file = camInput.files[0];
            if (!file) return;
            uploadFile(file);
        });

        camInput.click();
    });

});
