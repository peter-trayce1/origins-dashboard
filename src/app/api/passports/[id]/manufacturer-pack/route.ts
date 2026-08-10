export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import sharp from "sharp";
import JSZip from "jszip";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileSlug(name: string): string {
  return (name || "passport")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "passport";
}

function xe(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function psEscape(s: string): string {
  return s.replace(/[()\\]/g, "\\$&");
}

function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ── Labeled SVG (for .svg file and PNG conversion) ────────────────────────────
// Layout: product name + subtitle at top, QR code, passport ID + URL below.

function buildLabeledSvg(
  qrSvg: string,
  productName: string,
  passportCode: string,
  targetUrl: string,
  canvasW = 500,
): string {
  const vbMatch = qrSvg.match(/viewBox="([^"]+)"/);
  const vb = vbMatch ? vbMatch[1] : "0 0 37 37";
  const innerPaths = [...qrSvg.matchAll(/<path\s[^>]*\/?>/g)].map((m) => m[0]).join("");

  const qrSize = canvasW - 80;
  const topPad = 70;
  const botPad = 60;
  const totalH = topPad + qrSize + botPad;
  const cx = canvasW / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${totalH}" viewBox="0 0 ${canvasW} ${totalH}">
  <rect width="${canvasW}" height="${totalH}" fill="#ffffff"/>
  <text x="${cx}" y="29" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#111111">${xe(trunc(productName, 40))}</text>
  <text x="${cx}" y="47" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#aaaaaa">${xe("DIGITAL PRODUCT PASSPORT")}</text>
  <line x1="40" y1="56" x2="${canvasW - 40}" y2="56" stroke="#eeeeee" stroke-width="1"/>
  <svg x="40" y="${topPad}" width="${qrSize}" height="${qrSize}" viewBox="${vb}">
    ${innerPaths}
  </svg>
  <text x="${cx}" y="${topPad + qrSize + 22}" text-anchor="middle" font-family="monospace" font-size="13" font-weight="700" fill="#111111">${xe(passportCode)}</text>
  <text x="${cx}" y="${topPad + qrSize + 40}" text-anchor="middle" font-family="monospace" font-size="10" fill="#777777">${xe(trunc(targetUrl, 58))}</text>
</svg>`;
}

// ── EPS (vector PostScript — professional print) ──────────────────────────────
// Generates pure vector rectangles from the raw QR module matrix.

function buildEps(
  modules: { data: Uint8ClampedArray; size: number },
  productName: string,
  passportCode: string,
  targetUrl: string,
): string {
  const { data, size } = modules;
  const pageW = 510;
  const pageH = 600;
  const qrPts = 420;
  const mod = qrPts / size;
  const qrX = (pageW - qrPts) / 2;
  const qrBottom = 120;

  const lines: string[] = [
    "%!PS-Adobe-3.0 EPSF-3.0",
    `%%BoundingBox: 0 0 ${pageW} ${pageH}`,
    "%%LanguageLevel: 2",
    "%%Creator: Known Objects Digital Product Passport",
    `%%Title: ${psEscape(trunc(productName, 60))}`,
    "%%EndComments",
    "",
    "% White background",
    "1 setgray",
    `0 0 ${pageW} ${pageH} rectfill`,
    "",
    "% QR modules (vector rectangles)",
    "0 setgray",
  ];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (data[row * size + col]) {
        const x = (qrX + col * mod).toFixed(3);
        const y = (qrBottom + (size - 1 - row) * mod).toFixed(3);
        const m = mod.toFixed(3);
        lines.push(`${x} ${y} ${m} ${m} rectfill`);
      }
    }
  }

  const midX = (pageW / 2).toFixed(1);
  lines.push(
    "",
    "% Product name",
    "/Helvetica-Bold findfont 17 scalefont setfont",
    "0 setgray",
    `${midX} ${pageH - 42} moveto`,
    `(${psEscape(trunc(productName, 50))}) dup stringwidth pop -2 div 0 rmoveto show`,
    "",
    "% Subtitle",
    "/Helvetica findfont 9 scalefont setfont",
    "0.55 setgray",
    `${midX} ${pageH - 58} moveto`,
    "(DIGITAL PRODUCT PASSPORT) dup stringwidth pop -2 div 0 rmoveto show",
    "",
    "% Passport ID",
    "/Courier-Bold findfont 12 scalefont setfont",
    "0.13 setgray",
    `${midX} ${qrBottom - 24} moveto`,
    `(${psEscape(passportCode)}) dup stringwidth pop -2 div 0 rmoveto show`,
    "",
    "% URL",
    "/Courier findfont 9 scalefont setfont",
    "0.45 setgray",
    `${midX} ${qrBottom - 38} moveto`,
    `(${psEscape(trunc(targetUrl, 65))}) dup stringwidth pop -2 div 0 rmoveto show`,
    "",
    "showpage",
    "%%EOF",
  );

  return lines.join("\n");
}

// ── PDF sheet ─────────────────────────────────────────────────────────────────
// A4 branded sheet: Known Objects header, product name, large QR, IDs, print note.

async function buildPdfSheet(
  plainQrPng: Buffer,
  productName: string,
  passportCode: string,
  targetUrl: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontBold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg     = await doc.embedFont(StandardFonts.Helvetica);
  const fontMono    = await doc.embedFont(StandardFonts.Courier);
  const fontMonoBold = await doc.embedFont(StandardFonts.CourierBold);

  const BLACK  = rgb(0.07, 0.07, 0.07);
  const MUTED  = rgb(0.55, 0.55, 0.55);
  const LIGHT  = rgb(0.80, 0.80, 0.80);
  const BLUE   = rgb(0.05, 0.43, 0.92);
  const pad    = 52;

  // ── Known Objects wordmark ────────────────────────────────────────────────
  page.drawText("Known Objects", {
    x: pad, y: height - 48,
    font: fontBold, size: 20, color: BLACK,
  });
  page.drawText("Digital Product Passport", {
    x: pad, y: height - 64,
    font: fontReg, size: 9, color: MUTED,
  });

  // ── Divider ───────────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: pad, y: height - 76 },
    end:   { x: width - pad, y: height - 76 },
    thickness: 0.5, color: LIGHT,
  });

  // ── Section label ─────────────────────────────────────────────────────────
  page.drawText("MANUFACTURER PACK", {
    x: pad, y: height - 100,
    font: fontReg, size: 8, color: MUTED,
  });

  // ── Product name ──────────────────────────────────────────────────────────
  const nameDisplay = trunc(productName, 48);
  page.drawText(nameDisplay, {
    x: pad, y: height - 122,
    font: fontBold, size: 22, color: BLACK,
  });

  // ── QR code image (centered) ──────────────────────────────────────────────
  const qrPng = await doc.embedPng(plainQrPng);
  const qrW = 350;
  const qrH = (qrPng.height / qrPng.width) * qrW;
  const qrX = (width - qrW) / 2;
  const qrY = height - 145 - qrH;

  page.drawImage(qrPng, { x: qrX, y: qrY, width: qrW, height: qrH });

  // ── Divider below QR ─────────────────────────────────────────────────────
  page.drawLine({
    start: { x: pad, y: qrY - 20 },
    end:   { x: width - pad, y: qrY - 20 },
    thickness: 0.5, color: rgb(0.92, 0.92, 0.92),
  });

  // ── Passport ID ───────────────────────────────────────────────────────────
  page.drawText("PASSPORT ID", {
    x: pad, y: qrY - 38,
    font: fontReg, size: 7.5, color: MUTED,
  });
  page.drawText(passportCode, {
    x: pad, y: qrY - 54,
    font: fontMonoBold, size: 13, color: BLACK,
  });

  // ── Passport URL ──────────────────────────────────────────────────────────
  page.drawText("PASSPORT URL", {
    x: pad, y: qrY - 78,
    font: fontReg, size: 7.5, color: MUTED,
  });
  const urlDisplay = trunc(targetUrl, 72);
  page.drawText(urlDisplay, {
    x: pad, y: qrY - 94,
    font: fontMono, size: 9.5, color: BLUE,
  });

  // ── Divider ───────────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: pad, y: qrY - 115 },
    end:   { x: width - pad, y: qrY - 115 },
    thickness: 0.5, color: rgb(0.92, 0.92, 0.92),
  });

  // ── Print guidance ────────────────────────────────────────────────────────
  page.drawText("Recommended minimum print size: 25 × 25 mm  ·  Error correction: High (30%)", {
    x: pad, y: qrY - 132,
    font: fontReg, size: 8, color: MUTED,
  });
  page.drawText("Use this QR code on garment labels, packaging, hangtags, or product documentation.", {
    x: pad, y: qrY - 146,
    font: fontReg, size: 8, color: MUTED,
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  page.drawText("Generated by Known Objects · knownobjects.io", {
    x: pad, y: 28,
    font: fontReg, size: 7.5, color: rgb(0.72, 0.72, 0.72),
  });

  return doc.save();
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: passport, error } = await supabase
    .from("passports")
    .select(`
      id, product_name, passport_code, slug, status,
      qr_codes(id, target_url, is_active)
    `)
    .eq("id", id)
    .single();

  if (error || !passport) {
    return NextResponse.json({ error: "Passport not found" }, { status: 404 });
  }

  const productName = passport.product_name || "Untitled";
  const passportCode = passport.passport_code ?? "—";

  // Prefer the active QR code; fall back to any QR; fall back to slug-based URL
  const qrCodes = (passport.qr_codes as unknown as { id: string; target_url: string; is_active: boolean }[]) ?? [];
  const activeQr = qrCodes.find((q) => q.is_active) ?? qrCodes[0];
  const targetUrl = activeQr?.target_url
    ?? (passport.slug ? `${process.env.NEXT_PUBLIC_PUBLIC_PASSPORT_URL ?? "https://passport.knownobjects.io"}/${passport.slug}` : "");

  if (!targetUrl) {
    return NextResponse.json({ error: "No QR target URL available" }, { status: 400 });
  }

  const slug = fileSlug(productName);

  // ── Generate QR assets ──────────────────────────────────────────────────────

  // 1. Plain QR SVG (for embedding in labeled SVG and PDF)
  const plainQrSvg = await QRCode.toString(targetUrl, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });

  // 2. Labeled SVG (export file)
  const labeledSvg = buildLabeledSvg(plainQrSvg, productName, passportCode, targetUrl, 500);

  // 3. Labeled PNG — 1200px wide for web/print use
  const labeledPng = await sharp(Buffer.from(
    buildLabeledSvg(plainQrSvg, productName, passportCode, targetUrl, 1200)
  )).png({ quality: 100 }).toBuffer();

  // 4. Plain QR PNG — clean, for embedding in the PDF sheet
  const plainQrPng = await sharp(Buffer.from(plainQrSvg)).resize(700, 700).png().toBuffer();

  // 5. EPS — vector PostScript from raw QR matrix
  const QRCodeInt = QRCode as unknown as {
    create(text: string, opts: object): { modules: { data: Uint8ClampedArray; size: number } };
  };
  const qrCreated = QRCodeInt.create(targetUrl, { errorCorrectionLevel: "H" });
  const eps = buildEps(qrCreated.modules, productName, passportCode, targetUrl);

  // 6. PDF sheet
  const pdf = await buildPdfSheet(plainQrPng, productName, passportCode, targetUrl);

  // ── Bundle into ZIP ─────────────────────────────────────────────────────────

  const zip = new JSZip();
  zip.file(`${slug}-QR.png`,            labeledPng);
  zip.file(`${slug}-QR.svg`,            labeledSvg);
  zip.file(`${slug}-QR.eps`,            eps);
  zip.file(`${slug}-QR-Sheet.pdf`,      pdf);
  zip.file(`${slug}-Passport-URL.txt`,  targetUrl);
  zip.file(`${slug}-Passport-ID.txt`,   passportCode);

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}-Manufacturer-Pack.zip"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
