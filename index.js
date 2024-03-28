const userName = document.getElementById("name");
const userEmail = document.getElementById("email");
const userTelepon = document.getElementById("telepon");
const submitBtn = document.getElementById("submitBtn");
const overlay = document.getElementById("close");
const popup = document.getElementById("popup");
overlay.onclick = function () {
  popup.style.display = 'none';
};
const { PDFDocument, rgb, degrees } = PDFLib;

submitBtn.addEventListener("click", async () => {
  const nameValue = userName.value;
  const emailValue = userEmail.value;
  const teleponValue = userTelepon.value;
  if (nameValue.trim() !== "" && userName.checkValidity()) {
    console.log(nameValue);
    try {
      const nextCertificateNumber = await getNextCertificateNumber();
      const pdfDataUri = await generatePDF(nameValue, nextCertificateNumber);
      document.getElementById("form-display").style.display = "none";
      document.getElementById("loading-animation").style.display = "flex";
      await sendToServer(
        nameValue,
        emailValue,
        teleponValue,
        nextCertificateNumber,
        pdfDataUri
      );
      document.getElementById("form-display").style.display = "block";
      userName.value = "";
      userEmail.value = "";
      document.getElementById("popup").style.display = "flex";
    } catch (error) {
      console.log("Error Occured", error);
    }
  } else {
    userName.reportValidity();
  }
});
const generatePDF = async (name, certificateNumber) => {
  const existingPdfBytes = await fetch("CertificateFiks2.pdf").then((res) =>
    res.arrayBuffer()
  );

  // Memuat dokumen
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await fetch("AvenirNextLTPro-Regular.otf").then((res) =>
    res.arrayBuffer()
  );
  // Memasukkan font ke dokumen
  const SanChezFont = await pdfDoc.embedFont(fontBytes);
  // Halaman pertama dokumen
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  const currentDate = new Date();
  const lastTwoDigitsOfYear = String(currentDate.getFullYear()).slice(-2);
  const formattedDate = `${lastTwoDigitsOfYear}/${
    currentDate.getMonth() + 1
  }/${currentDate.getDate()}`;
  firstPage.drawText(name, {
    x: 65,
    y: 450,
    size: 24,
    font: SanChezFont,
    color: rgb(1, 1, 1),
  });

  firstPage.drawText(`${formattedDate}-00${certificateNumber}`, {
    x: 85,
    y: 600,
    size: 14,
    font: SanChezFont,
    color: rgb(1, 1, 1),
  });

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
  saveAs(pdfDataUri, "Certificate-TanamPohon.pdf");
  return pdfDataUri;
};

const getNextCertificateNumber = async () => {
  try {
    const response = await fetch(
      "https://certificatehitanampohon.vercel.app/api/getNextCertificateNumber"
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch next certificate number. Server response: ${response.statusText}`
      );
    }
    const data = await response.json();

    if (data && data.nextCertificateNumber !== undefined) {
      return data.nextCertificateNumber;
    } else {
      throw new Error("Invalid response format from the server");
    }
  } catch (error) {
    console.error("Error getting next certificate number:", error.message);
    throw error;
  }
};

const sendToServer = async (name, email, telepon, certificateNumber, pdfDataUri) => {
  try {
    document.getElementById("loading-animation").style.display = "block";
    const response = await fetch(
      "https://certificatehitanampohon.vercel.app/api/saveData",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          telepon: telepon,
          certificateNumber: certificateNumber,
          pdfDataUri: pdfDataUri,
        }), 
      }
    );

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(
        `Failed to send data to server. Server response: ${errorMessage}`
      );
    }

    console.log("Data berhasil dikirim ke server");

    await sendEmail(name, email, telepon, certificateNumber, pdfDataUri);
    alert(name);
    document.getElementById("loading-animation").style.display = "none";
  } catch (error) {
    console.error("Kesalahan mengirim data ke server:", error);
    document.getElementById("loading-animation").style.display = "none";
  }
};

const sendEmail = async (name, email, telepon, certificateNumber, pdfDataUri) => {
  try {
    const response = await fetch(
      "https://certificatehitanampohon.vercel.app/api/sendEmail",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          telepon: telepon,
          certificateNumber: certificateNumber,
          pdfDataUri: pdfDataUri,
        }),
      }
    );

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to send email. Server response: ${errorMessage}`);
    }

    console.log("Email berhasil dikirim");
  } catch (error) {
    console.error("Kesalahan mengirim email:", error);
  }
};
