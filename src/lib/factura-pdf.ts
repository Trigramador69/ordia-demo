import { empresa } from "../datos/catalogos.ts";
import type { Factura } from "../datos/tipos.ts";
import { avisoSimulacion, leyendaDeFactura, leyendaGeneral, notaRepresentacionGrafica, textoQr } from "./facturacion.ts";
import { montoALetras } from "./numero-a-letras.ts";
import { PaginaPdf, gris, grisClaro, negro, type Color } from "./pdf.ts";
import { matrizQr } from "./qr.ts";

// Representación gráfica de la factura simulada, en PDF A4.

const fondoAviso: Color = { r: 1, g: 0.95, b: 0.82 };
const textoAviso: Color = { r: 0.6, g: 0.35, b: 0.02 };
const rojo: Color = { r: 0.8, g: 0.15, b: 0.15 };
const fondoEncabezado: Color = { r: 0.93, g: 0.94, b: 0.96 };

const importe = (monto: number) => monto.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fechaCorta(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function crearPdfFactura(factura: Factura, codigoCliente: string) {
  const pagina = new PaginaPdf();
  const izquierda = 40;
  const derecha = pagina.ancho - 40;
  let y = pagina.alto - 40;

  // Aviso de simulación, arriba y bien visible.
  pagina.rectangulo(izquierda, y - 8, derecha - izquierda, 20, fondoAviso);
  pagina.texto(pagina.ancho / 2, y - 1, avisoSimulacion, { tamanio: 8, negrita: true, color: textoAviso, alinear: "centro" });
  y -= 36;

  // Emisor a la izquierda; NIT, número y CUF a la derecha.
  pagina.texto(izquierda, y, empresa.razonSocial.toUpperCase(), { tamanio: 11, negrita: true });
  for (const [indice, linea] of ["CASA MATRIZ", "No. Punto de Venta 0", empresa.direccion, `Teléfono: ${empresa.telefono}`, empresa.ciudad.toUpperCase()].entries()) {
    pagina.texto(izquierda, y - 13 - indice * 11, linea, { tamanio: 8, color: gris });
  }
  const columnaDatos = 360;
  const filasEmisor: [string, string][] = [
    ["NIT", empresa.nit],
    ["FACTURA N°", String(factura.numero)],
  ];
  filasEmisor.forEach(([etiqueta, valor], indice) => {
    pagina.texto(columnaDatos, y - indice * 13, etiqueta, { tamanio: 8, negrita: true });
    pagina.texto(columnaDatos + 70, y - indice * 13, valor, { tamanio: 9 });
  });
  pagina.texto(columnaDatos, y - 26, "CÓD. AUTORIZACIÓN", { tamanio: 8, negrita: true });
  const mitad = Math.ceil(factura.cuf.length / 2);
  pagina.texto(columnaDatos, y - 37, factura.cuf.slice(0, mitad), { tamanio: 7.5 });
  pagina.texto(columnaDatos, y - 47, factura.cuf.slice(mitad), { tamanio: 7.5 });
  y -= 80;

  pagina.texto(pagina.ancho / 2, y, "FACTURA", { tamanio: 14, negrita: true, alinear: "centro" });
  pagina.texto(pagina.ancho / 2, y - 13, "(Con Derecho a Crédito Fiscal)", { tamanio: 8, alinear: "centro" });
  y -= 34;

  // Datos del cliente.
  const datosCliente: [string, string, string, string][] = [
    ["Fecha:", `${fechaCorta(factura.fecha)} ${factura.hora}`, "NIT/CI/CEX:", factura.documentoCliente],
    ["Nombre/Razón Social:", factura.razonSocialCliente, "Cod. Cliente:", codigoCliente],
  ];
  datosCliente.forEach(([etiquetaA, valorA, etiquetaB, valorB], indice) => {
    const altura = y - indice * 14;
    pagina.texto(izquierda, altura, etiquetaA, { tamanio: 8.5, negrita: true });
    pagina.texto(izquierda + 100, altura, valorA, { tamanio: 8.5 });
    pagina.texto(columnaDatos + 20, altura, etiquetaB, { tamanio: 8.5, negrita: true });
    pagina.texto(columnaDatos + 85, altura, valorB, { tamanio: 8.5 });
  });
  y -= 36;

  // Detalle.
  const columnas = [
    { titulo: "CÓDIGO", x: izquierda + 4, ancho: 50 },
    { titulo: "CANTIDAD", x: izquierda + 56, ancho: 44, derecha: true },
    { titulo: "UNIDAD", x: izquierda + 106, ancho: 40 },
    { titulo: "DESCRIPCIÓN", x: izquierda + 150, ancho: 180 },
    { titulo: "P. UNITARIO", x: izquierda + 395, ancho: 0, derecha: true },
    { titulo: "DESCUENTO", x: izquierda + 455, ancho: 0, derecha: true },
    { titulo: "SUBTOTAL", x: derecha - 4, ancho: 0, derecha: true },
  ];
  pagina.rectangulo(izquierda, y - 6, derecha - izquierda, 18, fondoEncabezado);
  for (const columna of columnas) {
    pagina.texto(columna.derecha ? columna.x + columna.ancho : columna.x, y, columna.titulo, { tamanio: 7, negrita: true, alinear: columna.derecha ? "derecha" : "izquierda" });
  }
  y -= 22;
  factura.lineas.forEach((linea, indice) => {
    const descripcion = PaginaPdf.cortarEnLineas(linea.descripcion, 180, 8.5);
    pagina.texto(columnas[0].x, y, `SRV-${String(indice + 1).padStart(3, "0")}`, { tamanio: 8.5 });
    pagina.texto(columnas[1].x + columnas[1].ancho, y, linea.cantidad.toLocaleString("es-BO"), { tamanio: 8.5, alinear: "derecha" });
    pagina.texto(columnas[2].x, y, "Servicio", { tamanio: 8.5 });
    descripcion.forEach((texto, numeroLinea) => pagina.texto(columnas[3].x, y - numeroLinea * 11, texto, { tamanio: 8.5 }));
    pagina.texto(columnas[4].x, y, importe(linea.precioUnitario), { tamanio: 8.5, alinear: "derecha" });
    pagina.texto(columnas[5].x, y, "0,00", { tamanio: 8.5, alinear: "derecha" });
    pagina.texto(columnas[6].x, y, importe(linea.subtotal), { tamanio: 8.5, alinear: "derecha" });
    y -= Math.max(1, descripcion.length) * 11 + 6;
    pagina.linea(izquierda, y + 4, derecha, y + 4, grisClaro, 0.5);
  });
  y -= 8;

  // Totales.
  const totales: [string, number, boolean][] = [
    ["SUBTOTAL Bs", factura.total, false],
    ["DESCUENTO Bs", 0, false],
    ["TOTAL Bs", factura.total, true],
    ["MONTO GIFT CARD Bs", 0, false],
    ["MONTO A PAGAR Bs", factura.total, true],
    ["IMPORTE BASE CRÉDITO FISCAL Bs", factura.total, true],
  ];
  totales.forEach(([etiqueta, monto, negrita], indice) => {
    const altura = y - indice * 13;
    pagina.texto(derecha - 90, altura, etiqueta, { tamanio: 8, negrita, alinear: "derecha" });
    pagina.texto(derecha - 4, altura, importe(monto), { tamanio: 8.5, negrita, alinear: "derecha" });
  });
  y -= totales.length * 13 + 8;
  pagina.texto(izquierda, y, `Son: ${montoALetras(factura.total)}`, { tamanio: 8.5 });
  y -= 30;

  // Leyendas a la izquierda y QR a la derecha.
  const ladoQr = 96;
  const leyendas = [leyendaGeneral, leyendaDeFactura(factura.numero), notaRepresentacionGrafica];
  let alturaLeyenda = y;
  for (const [indice, leyenda] of leyendas.entries()) {
    for (const linea of PaginaPdf.cortarEnLineas(leyenda, derecha - izquierda - ladoQr - 30, 7.5)) {
      pagina.texto(izquierda, alturaLeyenda, linea, { tamanio: 7.5, negrita: indice === 0, color: indice === 0 ? negro : gris });
      alturaLeyenda -= 10;
    }
    alturaLeyenda -= 6;
  }
  dibujarQr(pagina, textoQr(factura), derecha - ladoQr, y + 8 - ladoQr, ladoQr);

  if (factura.estado === "anulada") {
    pagina.texto(pagina.ancho / 2, pagina.alto / 2 - 150, "ANULADA", { tamanio: 60, negrita: true, color: rojo, alinear: "centro" });
    pagina.texto(pagina.ancho / 2, pagina.alto / 2 - 172, `Anulada el ${fechaCorta(factura.fechaAnulacion ?? factura.fecha)}: ${factura.motivoAnulacion ?? ""}`, {
      tamanio: 9,
      color: rojo,
      alinear: "centro",
    });
  }

  pagina.texto(izquierda, 30, "Generada con Ordia, demo con datos de ejemplo. Documento simulado, sin validez fiscal.", { tamanio: 7, color: gris });
  return pagina.aBytes(`Factura ${factura.numero} ${factura.razonSocialCliente}`);
}

// Dibuja el QR con la esquina inferior izquierda en (x, y). Los módulos oscuros
// seguidos de una fila van en un solo rectángulo, para que el PDF pese menos.
function dibujarQr(pagina: PaginaPdf, texto: string, x: number, y: number, lado: number) {
  const qr = matrizQr(texto);
  const modulo = lado / qr.tamanio;
  for (let fila = 0; fila < qr.tamanio; fila++) {
    let columna = 0;
    while (columna < qr.tamanio) {
      if (!qr.oscuro(fila, columna)) {
        columna++;
        continue;
      }
      const inicio = columna;
      while (columna < qr.tamanio && qr.oscuro(fila, columna)) columna++;
      pagina.rectangulo(x + inicio * modulo, y + (qr.tamanio - 1 - fila) * modulo, (columna - inicio) * modulo + 0.05, modulo + 0.05, negro);
    }
  }
}

export function nombreArchivoFactura(factura: Factura) {
  return `factura-${factura.numero}.pdf`;
}
