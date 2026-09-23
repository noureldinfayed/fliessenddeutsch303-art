import QRCode from "qrcode";

export async function qrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 6,
    color: {
      dark: "#111111",
      light: "#FFFFFF",
    },
  });
}
