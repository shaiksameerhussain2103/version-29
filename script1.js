document.getElementById("downloadPDF").addEventListener("click", function () {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    doc.setFont("times", "normal");

    // Get input values from form
    let dept = document.querySelector("input[placeholder='Dept.']").value || "_________";
    let appNo = document.querySelector("input[placeholder='App.No']").value || "_________";
    let requestType = document.querySelector("input[placeholder='Request']").value || "_________";
    let year = document.querySelector("input[placeholder='YYYY']").value || "_________";
    let date = document.getElementById("date").value || "_________";
    let studentName = document.querySelector(".selfname").value || "_________";
    let parentName = document.querySelector(".parentname").value || "_________";
    let branch = document.querySelector(".branch").value || "_________";
    let yearOfStudy = document.querySelector(".Year").value || "_________";
    let sem = document.querySelector(".Sem").value || "_________";
    let rollNo = document.querySelector(".rollno").value || "_________";
    let certificatePurpose = document.querySelector(".certificate-purpose").value || "_________";
    let reason = document.querySelector(".reason").value || "_________";
    let otherCertificate = document.querySelector(".other-input").value || "_________";

    // Get selected checkboxes
    let selectedCertificates = [];
    document.querySelectorAll(".certificate-checkbox:checked").forEach((checkbox) => {
        selectedCertificates.push(checkbox.parentElement.textContent.trim());
    });

    // Get address lines
    let addressLines = [];
    document.querySelectorAll(".address-line").forEach((input) => {
        if (input.value.trim()) {
            addressLines.push(input.value);
        }
    });

    let signature = document.querySelector(".signature").value || "_________";
    let mobileNo = document.querySelector(".mobile").value || "_________";

    // Formatting PDF
    doc.setFontSize(16);
    doc.text("STUDENT REQUEST FORM", 75, 10);
    doc.setFontSize(12);

    // Header Table
    doc.setLineWidth(0.5);
    doc.rect(10, 15, 190, 10);
    doc.text("S", 12, 22);
    doc.line(20, 15, 20, 25);
    doc.text(`Dept.: ${dept}`, 25, 22);
    doc.line(65, 15, 65, 25);
    doc.text(`App. No: ${appNo}`, 70, 22);
    doc.line(115, 15, 115, 25);
    doc.text(`Request: ${requestType}`, 120, 22);
    doc.line(165, 15, 165, 25);
    doc.text(`YYYY: ${year}`, 170, 22);

    // Address Section
    doc.text("To,", 10, 35);
    doc.text("The Director,", 10, 40);
    doc.text("CMR Technical Campus,", 10, 45);
    doc.text("Kandlakoya (V), Medchal Road,", 10, 50);
    doc.text("Hyderabad – 501401.", 10, 55);

    doc.text(`Date: ${date}`, 160, 35);

    // Subject
    doc.text(`Sub: Request for issue of ${reason} - Reg.`, 10, 65);
    doc.text("******", 95, 70);

    // Student Information
    doc.text(`I, Mr./Ms. ${studentName} S/D/o ${parentName}`, 10, 80);
    doc.text(`Student of ${branch} Branch, Year: ${yearOfStudy}, Sem: ${sem}`, 10, 85);
    doc.text(`Bearing Roll No: ${rollNo}`, 10, 90);
    doc.text(`Requesting certificate for: ${certificatePurpose}`, 10, 100);

    // Certificate Selection
    let yOffset = 120;
    let certificates = [
        "Bonafide", "Custodian", "Transfer Certificate (TC)", "Medium of Instructions", "Internship Letter",
        "Project Permission Letter", "Letter of Recommendation (LOR)", "Name Correction on Memo’s/PC’s",
        "Course Completion", "Transcripts", "Grace Marks"
    ];

    certificates.forEach((cert, index) => {
        let checked = selectedCertificates.includes(cert) ? "✔" : " ";
        if (index % 2 === 0) {
            doc.text(`[${checked}] ${cert}`, 10, yOffset);
        } else {
            doc.text(`[${checked}] ${cert}`, 110, yOffset);
            yOffset += 5;
        }
    });

    // "Any other" field
    doc.text(`Any other: ${otherCertificate}`, 10, yOffset + 10);

    // Signature & Address Section
    doc.text("Yours Sincerely,", 10, yOffset + 25);
    doc.text("Residential Address:", 10, yOffset + 30);

    let addressY = yOffset + 35;
    addressLines.forEach((line) => {
        doc.text(line, 10, addressY);
        addressY += 5;
    });

    doc.text(`Sign: ${signature}`, 130, addressY + 10);
    doc.text(`Mobile No: ${mobileNo}`, 130, addressY + 15);

    // Office Use Section
    doc.setLineWidth(0.5);
    doc.line(10, addressY + 25, 200, addressY + 25);
    doc.text("For Office Use Only", 80, addressY + 30);
    doc.text("Clerk", 10, addressY + 40);
    doc.text("AO", 160, addressY + 40);
    
    // LoR/Transcripts/Internships
    doc.setLineWidth(0.5);
    doc.line(10, addressY + 45, 200, addressY + 45);
    doc.text("For LoR/Transcripts/Internships", 10, addressY + 50);

    // Higher Education Section
    doc.setLineWidth(0.5);
    doc.line(10, addressY + 55, 200, addressY + 55);
    doc.text("TPO", 10, addressY + 60);
    doc.text("Higher Education Cell", 80, addressY + 60);
    doc.text("CE", 160, addressY + 60);

    // Notes
    doc.setLineWidth(0.5);
    doc.line(10, addressY + 65, 200, addressY + 65);
    doc.text("Note: Submit the duly filled-in form after obtaining signatures from respective Authorities in:", 10, addressY + 70);
    doc.text("Admin Office (For 1-4), Concerned Department (For 5-7) & Examination Section (For 8-11)", 10, addressY + 75);

    // Save PDF
    doc.save("Student_Request_Form.pdf");
});
