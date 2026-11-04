import { parametrosImpuestos } from "../datos/parametros.ts";
import {
  buscarCuenta,
  cuentasDelSistema as cuentas,
  cuentasPorCategoriaDeActivo,
  esDeudora,
  type CategoriaActivo,
} from "../datos/plan-cuentas.ts";
import type { Asiento, LineaAsiento, OrigenAsiento } from "../datos/tipos.ts";

// Modelo de asiento contable. Todo asiento, manual o automático, pasa por
// crearAsiento, que valida que el debe sea igual al haber. Los asientos no se
// borran: una anulación genera el asiento inverso.
//
// Importa con extensión .ts porque también lo ejecuta Node desde scripts/.

export interface BorradorAsiento {
  fecha: string;
  glosa: string;
  origen: OrigenAsiento;
  idOrigen: string | null;
  lineas: LineaAsiento[];
}

// Los montos se comparan en centavos para no arrastrar errores de punto flotante.
export function aCentavos(monto: number) {
  return Math.round(monto * 100);
}

export function redondear(monto: number) {
  return aCentavos(monto) / 100;
}

export function totalesDeAsiento(lineas: LineaAsiento[]) {
  const debe = lineas.reduce((suma, linea) => suma + aCentavos(linea.debe), 0);
  const haber = lineas.reduce((suma, linea) => suma + aCentavos(linea.haber), 0);
  return { debe: debe / 100, haber: haber / 100 };
}

// Devuelve la lista de problemas; vacía si el asiento se puede registrar.
export function validarAsiento(borrador: Pick<BorradorAsiento, "fecha" | "glosa" | "lineas">): string[] {
  const errores: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(borrador.fecha)) errores.push("La fecha no es válida.");
  if (borrador.glosa.trim() === "") errores.push("Falta la glosa.");
  if (borrador.lineas.length < 2) errores.push("Un asiento necesita al menos dos líneas.");

  borrador.lineas.forEach((linea, indice) => {
    const numero = indice + 1;
    const cuenta = buscarCuenta(linea.codigoCuenta);
    if (!cuenta) errores.push(`Línea ${numero}: la cuenta ${linea.codigoCuenta || "(vacía)"} no existe.`);
    else if (!cuenta.imputable) errores.push(`Línea ${numero}: ${cuenta.nombre} agrupa cuentas y no recibe movimientos.`);
    if (linea.debe < 0 || linea.haber < 0) errores.push(`Línea ${numero}: los montos no pueden ser negativos.`);
    const conDebe = aCentavos(linea.debe) > 0;
    const conHaber = aCentavos(linea.haber) > 0;
    if (conDebe === conHaber) errores.push(`Línea ${numero}: va en el debe o en el haber, no en los dos ni en ninguno.`);
  });

  const { debe, haber } = totalesDeAsiento(borrador.lineas);
  if (aCentavos(debe) !== aCentavos(haber)) {
    errores.push(`El debe (${debe.toFixed(2)}) y el haber (${haber.toFixed(2)}) no son iguales.`);
  }
  return errores;
}

// Sin propiedades en el constructor: Node solo quita tipos, no los transforma.
export class AsientoInvalido extends Error {
  readonly errores: string[];

  constructor(errores: string[]) {
    super(`Asiento inválido: ${errores.join(" ")}`);
    this.errores = errores;
  }
}

// Numera el asiento a continuación de los existentes. Las líneas en cero se
// descartan (por ejemplo, el RC-IVA de una planilla en la que nadie lo paga).
export function crearAsiento(borrador: BorradorAsiento, existentes: Asiento[], fechaRegistro: string): Asiento {
  const lineas = borrador.lineas
    .map((linea) => ({ ...linea, debe: redondear(linea.debe), haber: redondear(linea.haber) }))
    .filter((linea) => aCentavos(linea.debe) > 0 || aCentavos(linea.haber) > 0);
  const errores = validarAsiento({ ...borrador, lineas });
  if (errores.length > 0) throw new AsientoInvalido(errores);
  const numero = existentes.reduce((maximo, asiento) => Math.max(maximo, asiento.numero), 0) + 1;
  return { ...borrador, lineas, id: `asi-${String(numero).padStart(4, "0")}`, numero, fechaRegistro };
}

function debe(codigoCuenta: string, monto: number, detalle?: string): LineaAsiento {
  return { codigoCuenta, debe: redondear(monto), haber: 0, ...(detalle ? { detalle } : {}) };
}

function haber(codigoCuenta: string, monto: number, detalle?: string): LineaAsiento {
  return { codigoCuenta, debe: 0, haber: redondear(monto), ...(detalle ? { detalle } : {}) };
}

// --- Saldos ---

export interface SaldoCuenta {
  codigo: string;
  debe: number;
  haber: number;
  // Positivo si la cuenta tiene saldo de su lado natural (deudor para activos
  // y gastos, acreedor para pasivos, patrimonio e ingresos).
  saldo: number;
}

export function saldosPorCuenta(asientos: Asiento[], filtro: { desde?: string; hasta?: string } = {}) {
  const centavos = new Map<string, { debe: number; haber: number }>();
  for (const asiento of asientos) {
    if (filtro.desde && asiento.fecha < filtro.desde) continue;
    if (filtro.hasta && asiento.fecha > filtro.hasta) continue;
    for (const linea of asiento.lineas) {
      const actual = centavos.get(linea.codigoCuenta) ?? { debe: 0, haber: 0 };
      actual.debe += aCentavos(linea.debe);
      actual.haber += aCentavos(linea.haber);
      centavos.set(linea.codigoCuenta, actual);
    }
  }
  const saldos = new Map<string, SaldoCuenta>();
  for (const [codigo, { debe: totalDebe, haber: totalHaber }] of centavos) {
    const cuenta = buscarCuenta(codigo);
    const deudora = cuenta ? esDeudora(cuenta) : true;
    saldos.set(codigo, {
      codigo,
      debe: totalDebe / 100,
      haber: totalHaber / 100,
      saldo: (deudora ? totalDebe - totalHaber : totalHaber - totalDebe) / 100,
    });
  }
  return saldos;
}

// --- Asientos automáticos ---

// Factura emitida: el total incluye el IVA. El impuesto a las transacciones es
// un gasto de la empresa que queda por pagar.
export function asientoDeFactura(datos: {
  idFactura: string;
  numeroFactura: number;
  razonSocial: string;
  fecha: string;
  total: number;
}): BorradorAsiento {
  const iva = redondear(datos.total * parametrosImpuestos.iva);
  const impuestoTransacciones = redondear(datos.total * parametrosImpuestos.impuestoTransacciones);
  return {
    fecha: datos.fecha,
    glosa: `Factura N° ${datos.numeroFactura} a ${datos.razonSocial}`,
    origen: "factura",
    idOrigen: datos.idFactura,
    lineas: [
      debe(cuentas.cuentasPorCobrar, datos.total),
      haber(cuentas.ingresosPorServicios, datos.total - iva),
      haber(cuentas.debitoFiscalIva, iva),
      debe(cuentas.impuestoTransaccionesGasto, impuestoTransacciones),
      haber(cuentas.impuestoTransaccionesPorPagar, impuestoTransacciones),
    ],
  };
}

// Revierte un asiento: mismas cuentas con el debe y el haber invertidos.
export function asientoDeAnulacion(
  original: Pick<BorradorAsiento, "lineas" | "idOrigen">,
  datos: { fecha: string; glosa: string; origen?: OrigenAsiento },
): BorradorAsiento {
  return {
    fecha: datos.fecha,
    glosa: datos.glosa,
    origen: datos.origen ?? "anulacion_factura",
    idOrigen: original.idOrigen,
    lineas: original.lineas.map((linea) => ({ ...linea, debe: linea.haber, haber: linea.debe })),
  };
}

export function asientoDeCobro(datos: {
  idCobro: string;
  numeroFactura: number;
  razonSocial: string;
  fecha: string;
  monto: number;
  medio: "banco" | "caja";
}): BorradorAsiento {
  return {
    fecha: datos.fecha,
    glosa: `Cobro de la factura N° ${datos.numeroFactura} de ${datos.razonSocial}`,
    origen: "cobro",
    idOrigen: datos.idCobro,
    lineas: [
      debe(datos.medio === "banco" ? cuentas.banco : cuentas.caja, datos.monto),
      haber(cuentas.cuentasPorCobrar, datos.monto),
    ],
  };
}

export interface TotalesParaAsientoPlanilla {
  haberBasicoGanado: number;
  bonoAntiguedad: number;
  aporteLaboral: number;
  rcIva: number;
  liquidoPagable: number;
  aportePatronalCajaDeSalud: number;
  // Riesgo profesional, solidario y vivienda: se pagan a la AFP.
  aportesPatronalesAfp: number;
  provisionAguinaldo: number;
  provisionIndemnizacion: number;
}

// Planilla cerrada: el gasto de personal (sueldos, bono, aportes patronales y
// provisiones) contra lo que se debe pagar a cada destinatario.
export function asientoDePlanilla(datos: {
  idPlanilla: string;
  nombreMes: string;
  fecha: string;
  totales: TotalesParaAsientoPlanilla;
}): BorradorAsiento {
  const t = datos.totales;
  return {
    fecha: datos.fecha,
    glosa: `Planilla de sueldos de ${datos.nombreMes}`,
    origen: "planilla",
    idOrigen: datos.idPlanilla,
    lineas: [
      debe(cuentas.sueldosYSalarios, t.haberBasicoGanado),
      debe(cuentas.bonoAntiguedad, t.bonoAntiguedad),
      debe(cuentas.aportesPatronalesGasto, t.aportePatronalCajaDeSalud + t.aportesPatronalesAfp),
      debe(cuentas.aguinaldosGasto, t.provisionAguinaldo),
      debe(cuentas.indemnizacionesGasto, t.provisionIndemnizacion),
      haber(cuentas.sueldosPorPagar, t.liquidoPagable),
      haber(cuentas.aportesLaboralesPorPagar, t.aporteLaboral),
      haber(cuentas.rcIvaPorPagar, t.rcIva),
      haber(cuentas.cajaDeSaludPorPagar, t.aportePatronalCajaDeSalud),
      haber(cuentas.aportesPatronalesAfpPorPagar, t.aportesPatronalesAfp),
      haber(cuentas.aguinaldoPorPagar, t.provisionAguinaldo),
      haber(cuentas.previsionIndemnizaciones, t.provisionIndemnizacion),
    ],
  };
}

export function asientoDeDepreciacion(datos: {
  idDepreciacion: string;
  nombreMes: string;
  fecha: string;
  porCategoria: Partial<Record<CategoriaActivo, number>>;
}): BorradorAsiento {
  const categorias = Object.entries(datos.porCategoria) as [CategoriaActivo, number][];
  const total = categorias.reduce((suma, [, monto]) => suma + aCentavos(monto), 0) / 100;
  return {
    fecha: datos.fecha,
    glosa: `Depreciación de activos fijos de ${datos.nombreMes}`,
    origen: "depreciacion",
    idOrigen: datos.idDepreciacion,
    lineas: [
      debe(cuentas.depreciacionGasto, total),
      ...categorias.map(([categoria, monto]) => haber(cuentasPorCategoriaDeActivo[categoria].depreciacionAcumulada, monto)),
    ],
  };
}
