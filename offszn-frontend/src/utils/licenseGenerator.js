import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateLicensePDF(purchaseData) {
  try {
    console.log('🔄 Generando licencia dinámica...', purchaseData);

    const {
      productName,
      producerName,
      amount,
      buyerName,
      buyerEmail,
      purchaseDate,
      orderId,
      licenseSettings,
      productType,
      licenseType: rawLicenseType
    } = purchaseData;

    const isDrumKit = ['drumkit', 'loopkit', 'preset'].includes(productType);
    const licenseType = (rawLicenseType || 'basic').toLowerCase();
    
    // Determinar nombre de la licencia
    let licenseNameDisplay = getLicenseName(licenseType);
    if (isDrumKit) {
        if (productType === 'loopkit') licenseNameDisplay = 'Standard Loop Kit License';
        else if (productType === 'preset') licenseNameDisplay = 'Standard Preset License';
        else licenseNameDisplay = 'Standard Kit License';
    }

    const price = `$${parseFloat(amount).toFixed(2)} USD`;

    // --- CONFIGURACIÓN DE LÍMITES (Igual que tu script original) ---
    const DEFAULT_CONFIGS = {
      basic: { streams: "50,000", sales: "5,000", radio: "2 Estaciones", files: { wav: false, stems: false }, video: "one (1) audiovisual project" },
      premium: { streams: "500,000", sales: "10,000", radio: "5 Estaciones", files: { wav: true, stems: false }, video: "five (5) audiovisual projects" },
      unlimited: { streams: "UNLIMITED", sales: "UNLIMITED", radio: "UNLIMITED", files: { wav: true, stems: true }, video: "UNLIMITED audiovisual projects" }
    };

    const settings = licenseSettings || {};
    // Buscar configuración específica o usar defaults
    let config = settings[licenseType] || Object.values(settings).find(s => s.name?.toLowerCase().includes(licenseType)) || {};
    const defaults = DEFAULT_CONFIGS[licenseType.includes('premium') ? 'premium' : (licenseType.includes('unlimited') ? 'unlimited' : 'basic')];

    // Lógica de Archivos
    const files = config.files || defaults.files;
    let filesDelivered = "a high-quality MP3 file";
    if (files.stems) filesDelivered = "high-quality WAV, MP3, and individual trackout stem files";
    else if (files.wav) filesDelivered = "high-quality MP3 and WAV files";

    // Helpers de formato
    const getLimit = (obj, key) => obj[key] || obj.usage?.[key] || defaults[key];
    const formatLimit = (val) => (!val || val.toString().toLowerCase().includes('unlimited') || val.toString().toLowerCase().includes('ilimitado')) ? "UNLIMITED" : val.toString();

    const salesLimit = formatLimit(getLimit(config, 'sales'));
    const streamsLimit = formatLimit(getLimit(config, 'streams'));
    
    // Lógica Radio
    const rawRadio = getLimit(config, 'radio');
    let radioLimit = "UNLIMITED";
    if (rawRadio && !rawRadio.toString().toLowerCase().match(/unlimited|ilimitado/)) {
        radioLimit = rawRadio.toString().toLowerCase().includes('no permitido') ? "Not permitted" : `up to ${rawRadio}`;
    }

    // Lógica Video
    let videoProjects = defaults.video;
    if (config.video || config.usage?.video) {
        const val = config.video || config.usage.video;
        videoProjects = formatLimit(val);
        if (videoProjects !== "UNLIMITED") videoProjects = `up to ${videoProjects} projects`;
    }

    // --- TEMPLATE DEL CONTRATO ---
    const template = `Non-Exclusive ${licenseNameDisplay} Agreement

1. Agreement Overview and License Grant
a. This Non-Exclusive ${licenseNameDisplay} Agreement ("Agreement") is entered into by and between the individual or entity purchasing this license (the "Licensee") and the producer of the instrumental music (the "Producer"). This Agreement sets forth the terms and conditions of the Licensee’s use of the instrumental music file covered by this license (referred to herein as "the Beat"), in consideration for the Licensee’s payment of ${price} for a ${licenseNameDisplay}.
b. By purchasing this license, the Licensee acknowledges and agrees to the terms stated herein. This Agreement is issued solely in connection with the Licensee’s use of the Beat. The Licensee shall make full payment of the License Fee to the Producer at the time of purchase. All rights granted under this Agreement are strictly conditional upon timely payment.

2. Delivery of the Beat:
a. The Producer agrees to deliver the Beat as ${filesDelivered}, in accordance with industry standards.
b. The Producer shall use commercially reasonable efforts to deliver the Beat immediately after the License Fee has been paid via email.

3. Term:
This License shall remain valid for a period of ten (10) years from the date of purchase. Upon the tenth (10th) anniversary, this License shall automatically expire.

4. Use of the Beat:
In consideration of the License Fee, the Licensee is granted a limited, non-exclusive, non-transferable license to use the Beat for the creation of one (1) new song or instrumental work ("New Song").
a. Permitted Uses:
The License grants the Licensee a worldwide, non-exclusive license to use the Beat as incorporated in the New Song.
b. The Licensee is permitted to:
• Use the New Song for promotional purposes and non-monetized streaming.
• Perform the New Song publicly (Unlimited non-profit; For-profit concerts/festivals).
• Broadcasting rights for ${radioLimit} terrestrial or satellite stations.
• Synchronize the New Song with ${videoProjects} not exceeding five (5) minutes in length.
• Sell up to ${salesLimit} physical and/or digital units.
• The Licensee is allowed up to ${streamsLimit} monetized audio streams.

For clarity, this License does not permit the sale, distribution, or exploitation of the Beat in its original, unmodified form. Any unauthorized sale constitutes a material breach.

i. Royalties: Licensee shall not be required to account for or pay any royalties to the Producer derived from the exploitation of the New Song, with the exception of mechanical royalties.

Restrictions on the Use of the Beat:
I. Rights are NON-TRANSFERABLE.
II. No synchronization with audiovisual works except as expressly permitted above.
III. No right to license or sublicense "samples" of the Beat.
IV. No unlawful copying, streaming, or distribution of the Beat file itself.
V. CONTENT ID PROHIBITION: The Licensee is EXPRESSLY PROHIBITED from registering the Beat/New Song with any Content Identification System (e.g., TuneCore, CDBaby, YouTube Content ID). The Beat has already been tagged by Producer. Violation of this results in immediate revocation.
VI. The New Song is a "derivative work".

5. Ownership
The Producer remains the sole owner of the Beat.
a. Licensee does not own the master or sound recording rights in the New Song (only the lyrics/melody they added).
b. Publishing Splits:
- Licensee owns 50% of the Writer’s Share.
- Producer owns 50% of the Writer’s Share.
• The Producer shall own and administer 50% of the Publisher’s Share.
• Licensee must register these shares with their PRO (ASCAP/BMI/etc) identifying the Producer as a 50% owner.
c. Acceptance: Licensee accepts these terms by paying the License Fee.
d. Submission of Final Song: Licensee agrees to deliver the final mixed version of the New Song to Producer for approval solely to ensure accurate crediting.

6. Mechanical License
Producer agrees to issue a mechanical license for any "Controlled Composition".
• US/Canada: 100% of minimum statutory rate.
• International: Industry-wide prevailing rate.

7. Credit
a. Licensee shall credit Producer as "Produced by ${producerName}" (or Producer's Brand Name) on all releases.
b. Licensee shall check all proofs for accuracy.
c. Failure to credit: Licensee must use reasonable efforts to cure any mistakes immediately.

8. Licensor’s Option
a. Licensor may terminate this License within three (3) years by refunding 200% of the License Fee.
b. Upon exercise of this option, Licensee must immediately remove the New Song from all distribution channels and cease public access.

9. Breach by Licensee
a. Licensee has five (5) business days to cure any breach after notice.
b. Unauthorized use results in liability for monetary damages.
c. Producer may seek injunctive relief and legal costs.

10. Miscellaneous
a. Entire Agreement.
b. Severability.
c. Governing Law: Laws of Lima, Peru. Exclusive jurisdiction: Courts of Lima, Peru.
d. INDEPENDENT ATTORNEY: YOU ACKNOWLEDGE YOU HAVE BEEN ADVISED TO RETAIN AN INDEPENDENT ATTORNEY TO REVIEW THIS AGREEMENT.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date of purchase.`;

    // --- GENERACIÓN PDF ---
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // PAGINA 1: CERTIFICADO
    const page1 = pdfDoc.addPage([595, 842]);
    const { width, height } = page1.getSize();

    // Fondo Negro
    page1.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0, 0, 0) });

    // Cabecera
    page1.drawText('OFFSZN', { x: 50, y: height - 80, size: 48, font: boldFont, color: rgb(0.45, 0.04, 0.72) });
    page1.drawText(isDrumKit ? 'PURCHASE INVOICE' : 'LICENSE CERTIFICATE', { x: 50, y: height - 120, size: 18, font: font, color: rgb(0.8, 0.8, 0.8) });
    page1.drawLine({ start: { x: 50, y: height - 140 }, end: { x: width - 50, y: height - 140 }, thickness: 2, color: rgb(0.45, 0.04, 0.72) });

    // Info Compra
    let yPos = height - 200;
    page1.drawText('PURCHASE INFORMATION', { x: 50, y: yPos, size: 12, font: boldFont, color: rgb(0.5, 0.5, 0.5) });
    yPos -= 40;

    const info = [
      [isDrumKit ? 'Kit Name:' : 'Beat Name:', productName],
      ['Producer:', producerName],
      ['License Type:', licenseNameDisplay],
      ['Price Paid:', price]
    ];

    info.forEach(([label, value]) => {
      page1.drawText(label, { x: 50, y: yPos, size: 10, font, color: rgb(0.6, 0.6, 0.6) });
      page1.drawText(value, { x: 180, y: yPos, size: 10, font: boldFont, color: rgb(1, 1, 1) });
      yPos -= 25;
    });

    // Info Comprador
    yPos -= 20;
    page1.drawLine({ start: { x: 50, y: yPos }, end: { x: width - 50, y: yPos }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
    yPos -= 40;
    page1.drawText('LICENSEE (BUYER)', { x: 50, y: yPos, size: 12, font: boldFont, color: rgb(0.5, 0.5, 0.5) });
    yPos -= 40;

    const buyerInfo = [
      ['Buyer Name:', buyerName],
      ['Buyer Email:', buyerEmail],
      ['Purchase Date:', new Date(purchaseDate).toLocaleDateString('en-US')],
      ['Order ID:', orderId]
    ];

    buyerInfo.forEach(([label, value]) => {
      page1.drawText(label, { x: 50, y: yPos, size: 10, font, color: rgb(0.6, 0.6, 0.6) });
      page1.drawText(value.toString(), { x: 180, y: yPos, size: 10, font: boldFont, color: rgb(1, 1, 1) });
      yPos -= 25;
    });

    if (isDrumKit) {
        // Texto para Drum Kits
        yPos -= 80;
        page1.drawText('IMPORTANT NOTICE:', { x: 50, y: yPos, size: 12, font: boldFont, color: rgb(0.45, 0.04, 0.72) });
        yPos -= 25;
        page1.drawText('This document serves as proof of purchase and grants the user the right', { x: 50, y: yPos, size: 10, font, color: rgb(0.8, 0.8, 0.8) });
        yPos -= 15;
        page1.drawText(`to use the ${productType === 'preset' ? 'presets' : 'sounds'} contained in this pack for music production.`, { x: 50, y: yPos, size: 10, font, color: rgb(0.8, 0.8, 0.8) });
        yPos -= 15;
        page1.drawText('Resale or redistribution of the raw files is strictly prohibited.', { x: 50, y: yPos, size: 10, font, color: rgb(0.8, 0.8, 0.8) });
    }

    // PAGINA 2: CONTRATO (Solo si no es Drum Kit)
    if (!isDrumKit) {
      let contractPage = pdfDoc.addPage([595, 842]);
      let currentY = 780;
      const margin = 50;
      const maxWidth = 500;
      const fontSize = 10;
      const lineHeight = 14;

      const lines = template.split('\n');

      for (const paragraph of lines) {
        if (paragraph.trim() === '') { currentY -= 10; continue; }
        
        const words = paragraph.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth < maxWidth) {
            currentLine = testLine;
          } else {
            if (currentY < 60) { contractPage = pdfDoc.addPage([595, 842]); currentY = 780; }
            contractPage.drawText(currentLine, { x: margin, y: currentY, size: fontSize, font });
            currentY -= lineHeight;
            currentLine = word;
          }
        }
        if (currentLine) {
           if (currentY < 60) { contractPage = pdfDoc.addPage([595, 842]); currentY = 780; }
           contractPage.drawText(currentLine, { x: margin, y: currentY, size: fontSize, font });
           currentY -= lineHeight;
        }
        currentY -= 5; 
      }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw error;
  }
}

function getLicenseName(id) {
  const names = {
    'basic': 'Non-Exclusive Basic License',
    'premium': 'Non-Exclusive Premium License',
    'stems': 'Non-Exclusive Trackout License',
    'unlimited': 'Non-Exclusive Unlimited License',
    'exclusive': 'Exclusive Rights License'
  };
  return names[id.toLowerCase()] || id.toUpperCase();
}