import { jsPDF } from "jspdf";
import fs from "node:fs/promises";
const dir = new URL("../samples/", import.meta.url);
for (const [file, title, lines] of [
  [
    "Sara_Morgan_CV.pdf",
    "Junior Full Stack Developer",
    [
      "Sara Morgan",
      "FICTIONAL CV FOR DEMONSTRATION",
      "BSc Computer Science, 2025.",
      "Built a job board with React, Next.js, and TypeScript.",
      "Developed REST APIs with Express.js.",
      "Collaborated with a designer to improve navigation.",
      "Built reusable components and wrote project documentation.",
    ],
  ],
  [
    "Sara_Morgan_Backend_CV.pdf",
    "Junior Backend Developer",
    [
      "Sara Morgan",
      "FICTIONAL ALTERNATIVE CV FOR DEMONSTRATION",
      "BSc Computer Science, 2025.",
      "Developed REST APIs with Express.js and Node.js.",
      "Implemented request validation and documented API endpoints.",
      "Built a job board with React, Next.js, and TypeScript.",
    ],
  ],
]) {
  const pdf = new jsPDF();
  pdf.setTextColor(75, 61, 105);
  pdf.setFontSize(23);
  pdf.text(lines[0], 20, 25);
  pdf.setFontSize(13);
  pdf.text(title, 20, 38);
  pdf.setTextColor(135, 114, 162);
  pdf.setFontSize(9);
  pdf.text(lines[1], 20, 49);
  pdf.setFontSize(12);
  pdf.setTextColor(70, 70, 85);
  let y = 73;
  for (const line of lines.slice(2)) {
    const wrap = pdf.splitTextToSize(line, 168);
    pdf.text(wrap, 20, y);
    y += wrap.length * 7 + 12;
  }
  await fs.writeFile(
    new URL(file, dir),
    Buffer.from(pdf.output("arraybuffer")),
  );
}
