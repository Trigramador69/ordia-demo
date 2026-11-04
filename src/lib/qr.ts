import QRCode from "qrcode";

// Matriz de un código QR: qué módulos van oscuros. La usan la factura en
// pantalla (SVG) y en PDF (rectángulos).
export function matrizQr(texto: string) {
  const { modules } = QRCode.create(texto, { errorCorrectionLevel: "M" });
  return {
    tamanio: modules.size,
    oscuro: (fila: number, columna: number) => modules.data[fila * modules.size + columna] === 1,
  };
}
