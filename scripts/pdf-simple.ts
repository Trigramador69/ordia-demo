// Generador mínimo de PDF de una página, solo con texto y líneas. En Tercia
// generaba los currículums de ejemplo; en Ordia es la base de las boletas de
// pago. Usa las fuentes estándar Helvetica y Helvetica-Bold con codificación
// WinAnsi, que cubre tildes, ñ y el punto medio.

export interface Color {
  r: number;
  g: number;
  b: number;
}

type Instruccion =
  | { tipo: "texto"; x: number; y: number; texto: string; tamanio: number; negrita: boolean; color: Color }
  | { tipo: "linea"; x1: number; y1: number; x2: number; y2: number; color: Color; grosor: number };

const negro: Color = { r: 0.12, g: 0.14, b: 0.16 };

export class PaginaPdf {
  readonly ancho = 595;
  readonly alto = 842;
  private instrucciones: Instruccion[] = [];

  texto(x: number, y: number, texto: string, opciones: { tamanio?: number; negrita?: boolean; color?: Color } = {}) {
    this.instrucciones.push({
      tipo: "texto",
      x,
      y,
      texto,
      tamanio: opciones.tamanio ?? 10,
      negrita: opciones.negrita ?? false,
      color: opciones.color ?? negro,
    });
  }

  linea(x1: number, y1: number, x2: number, y2: number, color: Color = negro, grosor = 0.6) {
    this.instrucciones.push({ tipo: "linea", x1, y1, x2, y2, color, grosor });
  }

  // Ancho aproximado de un texto en Helvetica, para cortar párrafos en líneas.
  static anchoAproximado(texto: string, tamanio: number) {
    return texto.length * tamanio * 0.5;
  }

  static cortarEnLineas(texto: string, anchoMaximo: number, tamanio: number) {
    const lineas: string[] = [];
    let actual = "";
    for (const palabra of texto.split(/\s+/)) {
      const candidata = actual ? `${actual} ${palabra}` : palabra;
      if (PaginaPdf.anchoAproximado(candidata, tamanio) > anchoMaximo && actual) {
        lineas.push(actual);
        actual = palabra;
      } else {
        actual = candidata;
      }
    }
    if (actual) lineas.push(actual);
    return lineas;
  }

  aBytes(titulo: string): Buffer {
    const contenido = this.instrucciones.map(instruccionAPdf).join("\n");
    const objetos = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.ancho} ${this.alto}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
      `<< /Length ${Buffer.byteLength(contenido, "latin1")} >>\nstream\n${contenido}\nendstream`,
      `<< /Title (${escaparTexto(titulo)}) /Producer (Ordia) >>`,
    ];

    let pdf = "%PDF-1.4\n";
    const posiciones: number[] = [];
    objetos.forEach((objeto, indice) => {
      posiciones.push(Buffer.byteLength(pdf, "latin1"));
      pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`;
    });
    const inicioTabla = Buffer.byteLength(pdf, "latin1");
    pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
    for (const posicion of posiciones) pdf += `${String(posicion).padStart(10, "0")} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R /Info ${objetos.length} 0 R >>\nstartxref\n${inicioTabla}\n%%EOF\n`;
    return Buffer.from(pdf, "latin1");
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
    if (caracter === "(" || caracter === ")" || caracter === String.fromCharCode(92)) {
      resultado += String.fromCharCode(92) + caracter;
    } else if (codigo < 128) {
      resultado += caracter;
    } else if (codigo < 256) {
      resultado += String.fromCharCode(codigo);
    } else {
      resultado += "?";
    }
  }
  return resultado;
}

function instruccionAPdf(instruccion: Instruccion) {
  if (instruccion.tipo === "linea") {
    const { x1, y1, x2, y2, color, grosor } = instruccion;
    return `${colorAPdf(color, "RG")} ${grosor} w ${x1} ${y1} m ${x2} ${y2} l S`;
  }
  const { x, y, texto, tamanio, negrita, color } = instruccion;
  return `BT ${colorAPdf(color, "rg")} /${negrita ? "F2" : "F1"} ${tamanio} Tf ${x} ${y} Td (${escaparTexto(texto)}) Tj ET`;
}
