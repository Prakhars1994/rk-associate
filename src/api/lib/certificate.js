import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const RED = rgb(0.843, 0, 0.082); // #d70015
const INK = rgb(0.114, 0.114, 0.122);
const GREY = rgb(0.525, 0.525, 0.545);

/** A4 landscape certificate, white with Apple-red accents. Returns Uint8Array. */
export async function renderCertificate({ name, course, issuedAt, code, verifyUrl }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificate - ${course}`);
  pdf.setAuthor('RK Associates');
  const page = pdf.addPage([842, 595]);
  const { width, height } = page.getSize();
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const center = (text, y, font, size, color = INK) =>
    page.drawText(text, { x: (width - font.widthOfTextAtSize(text, size)) / 2, y, size, font, color });

  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: RED, borderWidth: 2 });
  page.drawRectangle({ x: 0, y: height - 10, width, height: 10, color: RED });
  center('RK ASSOCIATES', height - 90, sansBold, 16, RED);
  center('Certificate of Completion', height - 150, serif, 36);
  center('This certifies that', height - 200, sans, 13, GREY);
  center(name, height - 250, serif, 32);
  page.drawLine({ start: { x: width / 2 - 180, y: height - 262 }, end: { x: width / 2 + 180, y: height - 262 }, thickness: 1, color: RED });
  center('has successfully completed', height - 295, sans, 13, GREY);
  center(course, height - 335, sansBold, 20);
  center(`Issued ${new Date(issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, height - 380, sans, 12, GREY);
  center(`Verify: ${verifyUrl}  ·  Code ${code}`, 56, sans, 9, GREY);
  return pdf.save();
}
