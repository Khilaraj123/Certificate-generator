document.addEventListener("DOMContentLoaded", () => {
    // Input elements
    const nameInput = document.getElementById("name");
    const dateInput = document.getElementById("date");
    const venueInput = document.getElementById("venue");
    const trainerSignInput = document.getElementById("trainerSign");
    const coordinatorSignInput = document.getElementById("coordinatorSign");
    const sponsorLogosInput = document.getElementById("sponsorLogos");
    const downloadBtn = document.getElementById("downloadBtn");

    // Preview elements
    const previewName = document.getElementById("previewName");
    const previewDate = document.getElementById("previewDate");
    const previewVenue = document.getElementById("previewVenue");
    const previewTrainerSign = document.getElementById("previewTrainerSign");
    const previewCoordinatorSign = document.getElementById("previewCoordinatorSign");

    // Helper to add ordinal suffix to date (e.g., 1st, 2nd, 3rd, 4th)
    function getOrdinalSuffix(i) {
        const j = i % 10,
              k = i % 100;
        if (j == 1 && k != 11) {
            return i + "st";
        }
        if (j == 2 && k != 12) {
            return i + "nd";
        }
        if (j == 3 && k != 13) {
            return i + "rd";
        }
        return i + "th";
    }

    // Format date nicely: "14th August, 2026"
    function formatDate(dateString) {
        if (!dateString) return "Date";
        const dateParts = dateString.split('-');
        const date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
        
        const day = date.getUTCDate();
        const month = date.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
        const year = date.getUTCFullYear();

        return `${getOrdinalSuffix(day)} ${month}, ${year}`;
    }

    // Set defaults
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

    // Handle signature uploads and hide placeholder text
    function handleImageUpload(fileInput, imgElement) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            const placeholder = imgElement.nextElementSibling;
            if (file) {
                const url = URL.createObjectURL(file);
                imgElement.src = url;
                imgElement.style.display = "block";
                if (placeholder && placeholder.classList.contains("sig-placeholder-text")) {
                    placeholder.style.display = "none";
                }
            } else {
                imgElement.style.display = "none";
                imgElement.src = "";
                if (placeholder && placeholder.classList.contains("sig-placeholder-text")) {
                    placeholder.style.display = "block";
                }
            }
        });
    }

    handleImageUpload(trainerSignInput, previewTrainerSign);
    handleImageUpload(coordinatorSignInput, previewCoordinatorSign);

    // Handle Sponsor Logos Upload
    if (sponsorLogosInput) {
        sponsorLogosInput.addEventListener("change", (e) => {
            const files = Array.from(e.target.files).slice(0, 5); // Max 5 logos
            const logoContainers = document.querySelectorAll(".footer-logo .logo-circle");
            
            // Clear existing uploaded logos first (restore to default circle)
            logoContainers.forEach(container => {
                container.innerHTML = "";
                container.style.border = "1px dashed #ccc";
                container.style.background = "#f8f9fa";
            });

            // Add new logos
            files.forEach((file, index) => {
                if (index < logoContainers.length) {
                    const url = URL.createObjectURL(file);
                    const img = document.createElement("img");
                    img.src = url;
                    img.style.width = "100%";
                    img.style.height = "100%";
                    img.style.objectFit = "contain";
                    img.style.borderRadius = "50%"; // optional depending on if they want square logos
                    
                    const container = logoContainers[index];
                    container.style.border = "none";
                    container.style.background = "transparent";
                    container.appendChild(img);
                }
            });
        });
    }

    // Scale preview to fit screen nicely while maintaining A4 aspect ratio
    function resizePreview() {
        const wrapper = document.querySelector(".preview-wrapper");
        const cert = document.getElementById("certificate");
        
        // Target dimensions for A4 Landscape
        const certWidth = 1122;
        const certHeight = 793;
        
        // Available space
        const availWidth = wrapper.clientWidth - 40; 
        const availHeight = wrapper.clientHeight - 40;
        
        const scale = Math.min(
            availWidth / certWidth,
            availHeight / certHeight
        );
        
        cert.style.transform = `scale(${scale})`;
    }

    window.addEventListener("resize", resizePreview);
    setTimeout(resizePreview, 100);
    document.fonts.ready.then(resizePreview);

    // Download PDF logic
    downloadBtn.addEventListener("click", () => {
        const certificate = document.getElementById("certificate");
        
        const originalTransform = certificate.style.transform;
        certificate.style.transform = "scale(1)";
        
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = "Generating PDF...";
        downloadBtn.disabled = true;

        setTimeout(() => {
            html2canvas(certificate, {
                scale: 2, 
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 1122,
                windowHeight: 793
            }).then(canvas => {
                const imgData = canvas.toDataURL("image/jpeg", 1.0);
                
                const pdf = new jspdf.jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4'
                });

                pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
                
                const filename = nameInput.value ? `${nameInput.value.replace(/\s+/g, '_')}_Certificate.pdf` : 'certificate.pdf';
                pdf.save(filename);
            }).catch(err => {
                console.error("Error generating PDF", err);
                alert("An error occurred while generating the PDF.");
            }).finally(() => {
                certificate.style.transform = originalTransform;
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            });
        }, 100);
    });
});
