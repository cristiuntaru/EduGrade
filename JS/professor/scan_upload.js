document.addEventListener("DOMContentLoaded", () => {

    const uploadBtn = document.getElementById("uploadBtn");
    const fileInput = document.getElementById("fileInput");
    const scanCameraBtn = document.getElementById("scanCameraBtn");

    console.log("SCAN PAGE LOADED");

    // === UPLOAD FILE FROM DEVICE ===
    uploadBtn.addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (!file) return;

        console.log("Selected file:", file);

        localStorage.setItem("scanned_file_name", file.name);

        window.location.href = "scanned_preview.html";
    });

    // === SCAN USING CAMERA ===
    scanCameraBtn.addEventListener("click", () => {

        //  Detectăm dacă userul e pe mobil
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

            console.log("Camera capture:", file);

            localStorage.setItem("scanned_file_name", file.name);

            window.location.href = "scanned_preview.html";
        });

        camInput.click();
    });

});
