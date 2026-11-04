import { empresa } from "../datos/catalogos.ts";
import { formatearNombreMesYAnio } from "../datos/meses.ts";
import { parametrosPlanilla } from "../datos/parametros.ts";
import type { FilaPlanilla } from "../datos/tipos.ts";
import { montoALetras } from "./numero-a-letras.ts";
import { PaginaPdf, gris, grisClaro, negro, type Color } from "./pdf.ts";

// Boleta de pago de una persona en un mes, en PDF de una página A4.

const marca: Color = { r: 0.19, g: 0.31, b: 0.71 };
const fondoMarca: Color = { r: 0.93, g: 0.95, b: 1 };

const importe = (monto: number) =>
  monto.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fechaCorta(fecha: string) {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

const porcentaje = (valor: number) => `${(valor * 100).toLocaleString("es-BO", { maximumFractionDigits: 2 })}%`;

export function crearPdfBoleta(fila: FilaPlanilla, mes: string, opciones: { vistaPrevia: boolean }) {
  const pagina = new PaginaPdf();
  const izquierda = 50;
  const derecha = pagina.ancho - 50;
  let y = pagina.alto - 60;

  // Encabezado: empresa a la izquierda, título a la derecha.
  pagina.texto(izquierda, y, empresa.razonSocial, { tamanio: 13, negrita: true });
  pagina.texto(derecha, y, "BOLETA DE PAGO", { tamanio: 15, negrita: true, color: marca, alinear: "derecha" });
  y -= 15;
  pagina.texto(izquierda, y, `NIT ${empresa.nit}`, { tamanio: 9, color: gris });
  const nombreMes = formatearNombreMesYAnio(mes);
  pagina.texto(derecha, y, nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1), { tamanio: 10, alinear: "derecha" });
  y -= 12;
  pagina.texto(izquierda, y, empresa.direccion, { tamanio: 9, color: gris });
  if (opciones.vistaPrevia) {
    pagina.texto(derecha, y, "VISTA PREVIA: PLANILLA SIN CERRAR", { tamanio: 8, negrita: true, color: { r: 0.75, g: 0.45, b: 0.05 }, alinear: "derecha" });
  }
  y -= 16;
  pagina.linea(izquierda, y, derecha, y, grisClaro, 1);

  // Datos de la persona, en dos columnas.
  y -= 22;
  const datos: [string, string][] = [
    ["Nombre", fila.nombreCompleto],
    ["Carnet de identidad", fila.carnetIdentidad],
    ["Cargo", fila.cargo],
    ["Fecha de ingreso", fechaCorta(fila.fechaIngreso)],
    ["Años de servicio", String(fila.aniosServicio)],
    ["Días pagados", `${fila.diasPagados} de ${parametrosPlanilla.diasDelMesComercial}`],
  ];
  datos.forEach(([etiqueta, valor], indice) => {
    const columna = indice % 2 === 0 ? izquierda : izquierda + 260;
    const altura = y - Math.floor(indice / 2) * 30;
    pagina.texto(columna, altura, etiqueta.toUpperCase(), { tamanio: 7, color: gris });
    pagina.texto(columna, altura - 12, valor, { tamanio: 10, negrita: indice === 0 });
  });
  y -= 30 * Math.ceil(datos.length / 2) + 18;

  // Ingresos y descuentos, lado a lado.
  const anchoColumna = (derecha - izquierda - 20) / 2;
  const columnaDescuentos = izquierda + anchoColumna + 20;
  const ingresos: [string, number][] = [["Haber básico", fila.haberBasico]];
  if (fila.descuentoDiasNoPagados > 0) {
    const detalle = [
      fila.diasSinGoce ? `${fila.diasSinGoce} sin goce` : "",
      fila.diasAntesDelIngreso ? `${fila.diasAntesDelIngreso} antes del ingreso` : "",
    ]
      .filter(Boolean)
      .join(", ");
    ingresos.push([`Días no pagados (${detalle})`, -fila.descuentoDiasNoPagados]);
  }
  ingresos.push([`Bono de antigüedad (${fila.porcentajeBono}%)`, fila.bonoAntiguedad]);

  const descuentos: [string, number][] = [[`Aporte laboral a la Gestora (${porcentaje(parametrosPlanilla.aporteLaboralAfp)})`, fila.aporteLaboral]];
  if (fila.aporteNacionalSolidario > 0) descuentos.push(["Aporte nacional solidario", fila.aporteNacionalSolidario]);
  descuentos.push(["RC-IVA", fila.rcIva]);

  function bloque(x: number, titulo: string, filas: [string, number][], total: [string, number]) {
    let posicion = y;
    pagina.rectangulo(x, posicion - 6, anchoColumna, 20, fondoMarca);
    pagina.texto(x + 8, posicion, titulo, { tamanio: 9, negrita: true, color: marca });
    pagina.texto(x + anchoColumna - 8, posicion, "Bs", { tamanio: 9, negrita: true, color: marca, alinear: "derecha" });
    posicion -= 24;
    for (const [concepto, monto] of filas) {
      pagina.texto(x + 8, posicion, concepto, { tamanio: 9 });
      pagina.texto(x + anchoColumna - 8, posicion, monto < 0 ? `-${importe(-monto)}` : importe(monto), { tamanio: 9, alinear: "derecha" });
      posicion -= 16;
    }
    return { posicion, total, x };
  }
  const bloqueIngresos = bloque(izquierda, "INGRESOS", ingresos, ["Total ganado", fila.totalGanado]);
  const bloqueDescuentos = bloque(columnaDescuentos, "DESCUENTOS", descuentos, ["Total descuentos", fila.totalDescuentos]);
  // Los totales van a la misma altura en las dos columnas.
  const alturaTotales = Math.min(bloqueIngresos.posicion, bloqueDescuentos.posicion) - 6;
  for (const { total, x } of [bloqueIngresos, bloqueDescuentos]) {
    pagina.linea(x + 8, alturaTotales + 12, x + anchoColumna - 8, alturaTotales + 12, grisClaro, 0.8);
    pagina.texto(x + 8, alturaTotales, total[0], { tamanio: 9, negrita: true });
    pagina.texto(x + anchoColumna - 8, alturaTotales, importe(total[1]), { tamanio: 9, negrita: true, alinear: "derecha" });
  }
  y = alturaTotales - 34;

  // Líquido pagable.
  pagina.rectangulo(izquierda, y - 30, derecha - izquierda, 44, fondoMarca);
  pagina.texto(izquierda + 12, y - 4, "LÍQUIDO PAGABLE", { tamanio: 11, negrita: true, color: marca });
  pagina.texto(derecha - 12, y - 4, `Bs ${importe(fila.liquidoPagable)}`, { tamanio: 15, negrita: true, color: marca, alinear: "derecha" });
  pagina.texto(izquierda + 12, y - 21, `Son: ${montoALetras(fila.liquidoPagable)}`, { tamanio: 8, color: negro });
  y -= 52;
  pagina.texto(izquierda, y, `Depósito en la cuenta ${fila.cuentaBancaria}`, { tamanio: 8, color: gris });

  // Firmas.
  y -= 90;
  for (const [x, etiqueta] of [
    [izquierda + 20, `Por ${empresa.razonSocial}`],
    [derecha - 200, "Recibí conforme"],
  ] as const) {
    pagina.linea(x, y, x + 180, y, gris, 0.6);
    pagina.texto(x + 90, y - 12, etiqueta, { tamanio: 8, color: gris, alinear: "centro" });
  }

  pagina.texto(izquierda, 40, "Boleta generada con Ordia. Demo con datos de ejemplo.", { tamanio: 7, color: gris });
  return pagina.aBytes(`Boleta de pago ${fila.nombreCompleto} ${nombreMes}`);
}

export function nombreArchivoBoleta(fila: FilaPlanilla, mes: string) {
  const nombre = fila.nombreCompleto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `boleta-${mes}-${nombre}.pdf`;
}
