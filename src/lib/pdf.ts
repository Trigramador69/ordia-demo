// Generador mínimo de PDF de una página: texto, líneas y rectángulos. Viene del
// que usaba Tercia para los currículums; aquí arma las boletas de pago y, más
// adelante, las facturas. Funciona en el navegador y en Node (no usa Buffer).
// Usa las fuentes estándar Helvetica y Helvetica-Bold con codificación
// WinAnsi, que cubre tildes, ñ y el punto medio.

export interface Color {
  r: number;
  g: number;
  b: number;
}

type Instruccion =
  | { tipo: "texto"; x: number; y: number; texto: string; tamanio: number; negrita: boolean; color: Color }
  | { tipo: "linea"; x1: number; y1: number; x2: number; y2: number; color: Color; grosor: number }
  | { tipo: "rectangulo"; x: number; y: number; ancho: number; alto: number; color: Color };

export const negro: Color = { r: 0.12, g: 0.14, b: 0.16 };
export const gris: Color = { r: 0.42, g: 0.45, b: 0.5 };
export const grisClaro: Color = { r: 0.85, g: 0.87, b: 0.9 };

// Anchos aproximados de Helvetica, en milésimas del tamaño de la letra. Sirven
// para alinear montos a la derecha y cortar párrafos; no hace falta exactitud.
function anchoCaracter(caracter: string, negrita: boolean) {
  if (/[0-9]/.test(caracter)) return 556;
  if (caracter === " " || caracter === "." || caracter === "," || caracter === ":") return 278;
  if (/[A-ZÁÉÍÓÚÑ]/.test(caracter)) return negrita ? 722 : 667;
  if (/[il]/.test(caracter)) return 222;
  if (/[mw]/.test(caracter)) return 833;
  return negrita ? 556 : 520;
}

export class PaginaPdf {
  readonly ancho = 595;
  readonly alto = 842;
  private instrucciones: Instruccion[] = [];

  texto(
    x: number,
    y: number,
    texto: string,
    opciones: { tamanio?: number; negrita?: boolean; color?: Color; alinear?: "izquierda" | "derecha" | "centro" } = {},
  ) {
    const tamanio = opciones.tamanio ?? 10;
    const negrita = opciones.negrita ?? false;
    const ancho = PaginaPdf.anchoTexto(texto, tamanio, negrita);
    const desplazamiento = opciones.alinear === "derecha" ? ancho : opciones.alinear === "centro" ? ancho / 2 : 0;
    this.instrucciones.push({ tipo: "texto", x: x - desplazamiento, y, texto, tamanio, negrita, color: opciones.color ?? negro });
  }

  linea(x1: number, y1: number, x2: number, y2: number, color: Color = negro, grosor = 0.6) {
    this.instrucciones.push({ tipo: "linea", x1, y1, x2, y2, color, grosor });
  }

  // (x, y) es la esquina inferior izquierda, como en el resto del PDF.
  rectangulo(x: number, y: number, ancho: number, alto: number, color: Color) {
    this.instrucciones.push({ tipo: "rectangulo", x, y, ancho, alto, color });
  }

  static anchoTexto(texto: string, tamanio: number, negrita = false) {
    let total = 0;
    for (const caracter of texto) total += anchoCaracter(caracter, negrita);
    return (total * tamanio) / 1000;
  }

  static cortarEnLineas(texto: string, anchoMaximo: number, tamanio: number) {
    const lineas: string[] = [];
    let actual = "";
    for (const palabra of texto.split(/\s+/)) {
      const candidata = actual ? `${actual} ${palabra}` : palabra;
      if (PaginaPdf.anchoTexto(candidata, tamanio) > anchoMaximo && actual) {
        lineas.push(actual);
        actual = palabra;
      } else {
        actual = candidata;
      }
    }
    if (actual) lineas.push(actual);
    return lineas;
  }

  aBytes(titulo: string): Uint8Array {
    const contenido = this.instrucciones.map(instruccionAPdf).join("\n");
    const objetos = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.ancho} ${this.alto}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
      `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
      `<< /Title (${escaparTexto(titulo)}) /Producer (Ordia) >>`,
    ];

    // Todo el texto ya está en Latin-1 (un byte por carácter), así que la
    // longitud del string es la cantidad de bytes.
    let pdf = "%PDF-1.4\n";
    const posiciones: number[] = [];
    objetos.forEach((objeto, indice) => {
      posiciones.push(pdf.length);
      pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
    });
    const inicioTabla = pdf.length;
    pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
    for (const posicion of posiciones) pdf += `${String(posicion).padStart(10, "0")} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R /Info ${objetos.length} 0 R >>\nstartxref\n${inicioTabla}\n%%EOF\n`;

    const bytes = new Uint8Array(pdf.length);
    for (let indice = 0; indice < pdf.length; indice++) bytes[indice] = pdf.charCodeAt(indice) & 0xff;
    return bytes;
  }
}

function colorAPdf({ r, g, b }: Color, operador: "rg" | "RG") {
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} ${operador}`;
}

// Escapa un texto para un string de PDF y lo deja en Latin-1 (WinAnsi).
function escaparTexto(texto: string) {
  let resultado = "";
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0)!;
    if (caracter === "(" || caracter === ")" || caracter === "\\") resultado += `\\${caracter}`;
    else if (codigo < 256) resultado += caracter;
    else resultado += "?";
  }
  return resultado;
}

function instruccionAPdf(instruccion: Instruccion) {
  if (instruccion.tipo === "linea") {
    const { x1, y1, x2, y2, color, grosor } = instruccion;
    return `${colorAPdf(color, "RG")} ${grosor} w ${x1} ${y1} m ${x2} ${y2} l S`;
  }
  if (instruccion.tipo === "rectangulo") {
    const { x, y, ancho, alto, color } = instruccion;
    return `${colorAPdf(color, "rg")} ${x} ${y} ${ancho} ${alto} re f`;
  }
  const { x, y, texto, tamanio, negrita, color } = instruccion;
  return `BT ${colorAPdf(color, "rg")} /${negrita ? "F2" : "F1"} ${tamanio} Tf ${x.toFixed(2)} ${y} Td (${escaparTexto(texto)}) Tj ET`;
}

// Descarga el PDF en el navegador.
export function descargarPdf(bytes: Uint8Array, nombreArchivo: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombreArchivo;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
}
