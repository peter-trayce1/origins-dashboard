import QRCode from "qrcode";

export interface QRGenerateOptions {
  url: string;
  size?: number; // px, default 400
  margin?: number; // modules, default 2
  foreground?: string; // hex, default #000000
  background?: string; // hex, default #ffffff
}

export interface QROutput {
  svg: string;
  pngBuffer: Buffer;
}

export async function generateQR(options: QRGenerateOptions): Promise<QROutput> {
  const { url, size = 400, margin = 2, foreground = "#000000", background = "#ffffff" } = options;

  const svg = await QRCode.toString(url, {
    type: "svg",
    margin,
    color: { dark: foreground, light: background },
    errorCorrectionLevel: "H",
  });

  // Use sharp only if available (Node runtime)
  const sharp = (await import("sharp")).default;
  const pngBuffer = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();

  return { svg, pngBuffer };
}

export async function generateQRSvg(url: string, size = 400): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 2,
    width: size,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#ffffff" },
  });
}
