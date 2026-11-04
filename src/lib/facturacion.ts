import { empresa } from "../datos/catalogos.ts";
import type { Cobro, Factura, MedioDeCobro } from "../datos/tipos.ts";
import { aCentavos } from "./contabilidad.ts";

// Facturación SIMULADA: tiene el aspecto de una factura en línea del SIAT
// (número, CUF, QR, leyendas), pero no se envía a Impuestos Nacionales ni tiene
// validez fiscal. Todo documento generado lo dice de forma visible.
// Importa con extensión .ts porque también lo ejecuta Node.

export const avisoSimulacion = "FACTURA SIMULADA PARA DEMOSTRACIÓN · SIN VALIDEZ FISCAL · NO FUE ENVIADA AL SIAT";

export const leyendaGeneral = "ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY";

export const leyendasLey453 = [
  "Ley N° 453: Tienes derecho a recibir información sobre las características y contenidos de los servicios que utilices.",
  "Ley N° 453: El proveedor de servicios debe habilitar medios e instrumentos para efectuar consultas y reclamaciones.",
  "Ley N° 453: Los servicios deben suministrarse en condiciones de inocuidad, calidad y seguridad.",
];

export const notaRepresentacionGrafica =
  "Este documento es la Representación Gráfica de un Documento Fiscal Digital emitido en una modalidad de facturación en línea.";

export const nombresMedioDeCobro: Record<MedioDeCobro, string> = {
  transferencia: "Transferencia bancaria",
  cheque: "Cheque",
  efectivo: "Efectivo",
};

// Una factura en efectivo entra a caja; las demás, al banco.
export function cuentaDelMedio(medio: MedioDeCobro): "banco" | "caja" {
  return medio === "efectivo" ? "caja" : "banco";
}

// Dígito verificador módulo 11, como el que lleva el CUF.
function modulo11(numero: string) {
  let suma = 0;
  let factor = 2;
  for (let indice = numero.length - 1; indice >= 0; indice--) {
    suma += Number(numero[indice]) * factor;
    factor = factor === 9 ? 2 : factor + 1;
  }
  const resto = suma % 11;
  return resto === 10 ? "1" : resto === 11 ? "0" : String(resto);
}

// CUF simulado: arma la misma cadena que el SIAT (NIT, fecha y hora, sucursal,
// modalidad, tipo de emisión y de factura, documento sector, número y punto de
// venta), le agrega el verificador y la pasa a hexadecimal. El tramo final, que
// en el SIAT viene del CUFD del día, aquí sale de un cálculo propio.
export function generarCuf(numero: number, fecha: string, hora: string) {
  const fechaHora = `${fecha.replaceAll("-", "")}${hora.replace(":", "")}00000`;
  const cadena = [
    empresa.nit.padStart(13, "0"),
    fechaHora,
    "0000", // sucursal: casa matriz
    "1", // modalidad: electrónica en línea
    "1", // tipo de emisión: en línea
    "1", // tipo de factura: con derecho a crédito fiscal
    "01", // documento sector: compra y venta
    String(numero).padStart(10, "0"),
    "0000", // punto de venta
  ].join("");
  const conVerificador = cadena + modulo11(cadena);
  let semilla = 0;
  for (const caracter of conVerificador) semilla = (semilla * 31 + Number(caracter)) % 2147483647;
  const tramoDelDia = semilla.toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
  return `${BigInt(conVerificador).toString(16).toUpperCase()}${tramoDelDia}`;
}

// El QR no apunta al SIAT: dice que es una simulación y resume la factura.
export function textoQr(factura: Pick<Factura, "numero" | "cuf" | "fecha" | "total">) {
  return [
    "FACTURA SIMULADA - DEMO ORDIA - SIN VALIDEZ FISCAL",
    `NIT emisor ${empresa.nit}`,
    `N° ${factura.numero}`,
    `Fecha ${factura.fecha}`,
    `Total Bs ${factura.total.toFixed(2)}`,
    `CUF ${factura.cuf}`,
  ].join(" | ");
}

export function leyendaDeFactura(numero: number) {
  return leyendasLey453[numero % leyendasLey453.length];
}

export type SituacionFactura = "anulada" | "cobrada" | "parcial" | "por_cobrar";

export const nombresSituacionFactura: Record<SituacionFactura, string> = {
  anulada: "Anulada",
  cobrada: "Cobrada",
  parcial: "Cobrada en parte",
  por_cobrar: "Por cobrar",
};

export function situacionDeFactura(factura: Factura, cobros: Cobro[]) {
  const cobradoCentavos = cobros.filter((cobro) => cobro.idFactura === factura.id).reduce((suma, cobro) => suma + aCentavos(cobro.monto), 0);
  const saldoCentavos = factura.estado === "anulada" ? 0 : aCentavos(factura.total) - cobradoCentavos;
  let situacion: SituacionFactura = "por_cobrar";
  if (factura.estado === "anulada") situacion = "anulada";
  else if (saldoCentavos <= 0) situacion = "cobrada";
  else if (cobradoCentavos > 0) situacion = "parcial";
  return { cobrado: cobradoCentavos / 100, saldo: Math.max(0, saldoCentavos) / 100, situacion };
}

export function totalDeLineas(lineas: { cantidad: number; precioUnitario: number }[]) {
  return lineas.reduce((suma, linea) => suma + aCentavos(linea.cantidad * linea.precioUnitario), 0) / 100;
}
