document.addEventListener("DOMContentLoaded", () => {
    // Input elements
    const nameInput = document.getElementById("name");
    const dateInput = document.getElementById("date");
    const venueInput = document.getElementById("venue");
    const certIdInput = document.getElementById("certId");
    const trainerSignInput = document.getElementById("trainerSign");
    const coordinatorSignInput = document.getElementById("coordinatorSign");
    const downloadBtn = document.getElementById("downloadBtn");

    // Preview elements
    const previewName = document.getElementById("previewName");
    const previewDate = document.getElementById("previewDate");
    const previewVenue = document.getElementById("previewVenue");
    const previewCertId = document.getElementById("previewCertId");
    const previewTrainerSign = document.getElementById("previewTrainerSign");
    const previewCoordinatorSign = document.getElementById("previewCoordinatorSign");
    
    // QR Code container
    const qrcodeContainer = document.getElementById("qrcode");
    let qrcode = null;

    // Initialize QR Code
    function generateQRCode(text) {
        qrcodeContainer.innerHTML = "";
        qrcode = new QRCode(qrcodeContainer, {
            text: text || "CPR-CERT",
            width: 80,
            height: 80,
            colorDark : "#0f172a",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }

    // Format date nicely
    function formatDate(dateString) {
        if (!dateString) return "Date";
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        // We use UTC date to avoid timezone issues when selecting the date
        const dateParts = dateString.split('-');
        const date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
        return date.toLocaleDateString(undefined, options);
    }

    // Set defaults
    generateQRCode("CPR-YYYY-000");
    previewDate.innerText = formatDate(dateInput.value);
    previewVenue.innerText = venueInput.value || "Venue";

    // Live binding events
    nameInput.addEventListener("input", (e) => {
        previewName.innerText = e.target.value || "Participant Name";
    });

    dateInput.addEventListener("input", (e) => {
        previewDate.innerText = formatDate(e.target.value);
    });

    venueInput.addEventListener("input", (e) => {
        previewVenue.innerText = e.target.value || "Venue";
    });

    certIdInput.addEventListener("input", (e) => {
        const val = e.target.value || "CPR-YYYY-000";
        previewCertId.innerText = val;
        generateQRCode(val);
    });

    // Handle signature uploads (using Blob URLs to preview locally without backend)
    function handleImageUpload(fileInput, imgElement) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                imgElement.src = url;
                imgElement.style.display = "block";
                
                // Allow the image to load before we can potentially revoke it if needed.
                // Note: html2canvas needs the image to be loaded, so we won't revoke it immediately.
                imgElement.onload = () => {
                    // Object URL is ready
                };
            } else {
                imgElement.style.display = "none";
                imgElement.src = "";
            }
        });
    }

    handleImageUpload(trainerSignInput, previewTrainerSign);
    handleImageUpload(coordinatorSignInput, previewCoordinatorSign);

    // Scale preview to fit screen nicely while maintaining A4 aspect ratio
    function resizePreview() {
        const wrapper = document.querySelector(".preview-wrapper");
        const cert = document.getElementById("certificate");
        
        // Target dimensions for A4 Landscape
        const certWidth = 1122;
        const certHeight = 793;
        
        // Available space
        const availWidth = wrapper.clientWidth - 40; // 40px padding
        const availHeight = wrapper.clientHeight - 40;
        
        const scale = Math.min(
            availWidth / certWidth,
            availHeight / certHeight
        );
        
        cert.style.transform = `scale(${scale})`;
    }

    window.addEventListener("resize", resizePreview);
    // Initial delay to ensure styles and fonts are applied
    setTimeout(resizePreview, 100);
    // In case fonts load later
    document.fonts.ready.then(resizePreview);

    // Download PDF logic
    downloadBtn.addEventListener("click", () => {
        const certificate = document.getElementById("certificate");
        
        // Temporarily remove scaling for high-quality, pixel-perfect export
        const originalTransform = certificate.style.transform;
        certificate.style.transform = "scale(1)";
        
        // Change button state
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = "Generating PDF...";
        downloadBtn.disabled = true;

        // Give the DOM a tiny bit of time to apply the transform before capturing
        setTimeout(() => {
            html2canvas(certificate, {
                scale: 2, // High resolution (retina display quality)
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 1122,
                windowHeight: 793
            }).then(canvas => {
                const imgData = canvas.toDataURL("image/jpeg", 1.0);
                
                // A4 landscape in mm
                const pdf = new jspdf.jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4'
                });

                pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
                
                const filename = certIdInput.value ? `${certIdInput.value}.pdf` : 'certificate.pdf';
                pdf.save(filename);
            }).catch(err => {
                console.error("Error generating PDF", err);
                alert("An error occurred while generating the PDF.");
            }).finally(() => {
                // Restore scaling and button state
                certificate.style.transform = originalTransform;
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            });
        }, 100);
    });
});
