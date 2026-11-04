import type { CategoriaActivo, Cuenta, TipoCuenta } from "./tipos.ts";

export type { CategoriaActivo };

// Plan de cuentas simplificado de una empresa de servicios en Bolivia. El
// código tiene cuatro niveles (1.1.1.01): grupo, subgrupo, rubro y cuenta. Solo
// las cuentas de cuarto nivel reciben movimientos.

type FilaPlan = [codigo: string, nombre: string, opciones?: { regularizadora?: boolean }];

const filas: FilaPlan[] = [
  ["1", "Activo"],
  ["1.1", "Activo corriente"],
  ["1.1.1", "Disponible"],
  ["1.1.1.01", "Caja"],
  ["1.1.1.02", "Banco moneda nacional"],
  ["1.1.2", "Exigible"],
  ["1.1.2.01", "Cuentas por cobrar a clientes"],
  ["1.1.2.02", "Anticipos al personal"],
  ["1.1.2.03", "Crédito fiscal IVA"],
  ["1.2", "Activo no corriente"],
  ["1.2.1", "Activo fijo"],
  ["1.2.1.01", "Muebles y enseres"],
  ["1.2.1.02", "Equipos de computación"],
  ["1.2.1.03", "Vehículos"],
  ["1.2.1.04", "Equipos de oficina"],
  ["1.2.2", "Depreciación acumulada"],
  ["1.2.2.01", "Depreciación acumulada de muebles y enseres", { regularizadora: true }],
  ["1.2.2.02", "Depreciación acumulada de equipos de computación", { regularizadora: true }],
  ["1.2.2.03", "Depreciación acumulada de vehículos", { regularizadora: true }],
  ["1.2.2.04", "Depreciación acumulada de equipos de oficina", { regularizadora: true }],

  ["2", "Pasivo"],
  ["2.1", "Pasivo corriente"],
  ["2.1.1", "Cuentas por pagar"],
  ["2.1.1.01", "Proveedores"],
  ["2.1.2", "Obligaciones laborales"],
  ["2.1.2.01", "Sueldos por pagar"],
  ["2.1.2.02", "Aguinaldo por pagar"],
  ["2.1.3", "Obligaciones sociales"],
  ["2.1.3.01", "Aportes laborales a la AFP por pagar"],
  ["2.1.3.02", "Aportes patronales a la AFP por pagar"],
  ["2.1.3.03", "Caja de salud por pagar"],
  ["2.1.4", "Obligaciones fiscales"],
  ["2.1.4.01", "Débito fiscal IVA"],
  ["2.1.4.02", "Impuesto a las transacciones por pagar"],
  ["2.1.4.03", "RC-IVA retenido a dependientes por pagar"],
  ["2.2", "Pasivo no corriente"],
  ["2.2.1", "Previsiones"],
  ["2.2.1.01", "Previsión para indemnizaciones"],

  ["3", "Patrimonio"],
  ["3.1", "Capital y resultados"],
  ["3.1.1", "Capital"],
  ["3.1.1.01", "Capital social"],
  ["3.1.2", "Resultados"],
  ["3.1.2.01", "Resultados acumulados"],

  ["4", "Ingresos"],
  ["4.1", "Ingresos operativos"],
  ["4.1.1", "Venta de servicios"],
  ["4.1.1.01", "Ingresos por servicios"],
  ["4.2", "Otros ingresos"],
  ["4.2.1", "Ingresos no operativos"],
  ["4.2.1.01", "Otros ingresos"],

  ["5", "Gastos"],
  ["5.1", "Gastos de personal"],
  ["5.1.1", "Remuneraciones"],
  ["5.1.1.01", "Sueldos y salarios"],
  ["5.1.1.02", "Bono de antigüedad"],
  ["5.1.1.03", "Aportes patronales"],
  ["5.1.1.04", "Aguinaldos"],
  ["5.1.1.05", "Indemnizaciones"],
  ["5.2", "Gastos de administración"],
  ["5.2.1", "Gastos generales"],
  ["5.2.1.01", "Alquileres"],
  ["5.2.1.02", "Servicios básicos"],
  ["5.2.1.03", "Internet y telefonía"],
  ["5.2.1.04", "Material de escritorio"],
  ["5.2.1.05", "Mantenimiento y reparaciones"],
  ["5.2.1.06", "Combustible"],
  ["5.2.1.07", "Depreciación de activos fijos"],
  ["5.3", "Impuestos"],
  ["5.3.1", "Impuestos a cargo de la empresa"],
  ["5.3.1.01", "Impuesto a las transacciones"],
];

const tipoPorGrupo: Record<string, TipoCuenta> = {
  "1": "activo",
  "2": "pasivo",
  "3": "patrimonio",
  "4": "ingreso",
  "5": "gasto",
};

export const planDeCuentas: Cuenta[] = filas.map(([codigo, nombre, opciones]) => {
  const nivel = codigo.split(".").length;
  return {
    codigo,
    nombre,
    tipo: tipoPorGrupo[codigo[0]],
    nivel,
    imputable: nivel === 4,
    ...(opciones?.regularizadora ? { regularizadora: true } : {}),
  };
});

const cuentaPorCodigo = new Map(planDeCuentas.map((cuenta) => [cuenta.codigo, cuenta]));

export function buscarCuenta(codigo: string) {
  return cuentaPorCodigo.get(codigo);
}

// Las cuentas de activo y gasto aumentan por el debe; las de pasivo,
// patrimonio e ingreso, por el haber. Las regularizadoras van al revés.
export function esDeudora(cuenta: Cuenta) {
  const deudoraPorTipo = cuenta.tipo === "activo" || cuenta.tipo === "gasto";
  return cuenta.regularizadora ? !deudoraPorTipo : deudoraPorTipo;
}

// Cuentas que usan los asientos automáticos. Si cambia el plan, se ajusta aquí
// y no en la lógica de cada asiento.
export const cuentasDelSistema = {
  caja: "1.1.1.01",
  banco: "1.1.1.02",
  cuentasPorCobrar: "1.1.2.01",
  ingresosPorServicios: "4.1.1.01",
  debitoFiscalIva: "2.1.4.01",
  impuestoTransaccionesGasto: "5.3.1.01",
  impuestoTransaccionesPorPagar: "2.1.4.02",
  capitalSocial: "3.1.1.01",
  resultadosAcumulados: "3.1.2.01",
  // Planilla
  sueldosYSalarios: "5.1.1.01",
  bonoAntiguedad: "5.1.1.02",
  aportesPatronalesGasto: "5.1.1.03",
  aguinaldosGasto: "5.1.1.04",
  indemnizacionesGasto: "5.1.1.05",
  sueldosPorPagar: "2.1.2.01",
  aguinaldoPorPagar: "2.1.2.02",
  aportesLaboralesPorPagar: "2.1.3.01",
  aportesPatronalesAfpPorPagar: "2.1.3.02",
  cajaDeSaludPorPagar: "2.1.3.03",
  rcIvaPorPagar: "2.1.4.03",
  previsionIndemnizaciones: "2.2.1.01",
  // Activos fijos
  depreciacionGasto: "5.2.1.07",
} as const;

// Cuenta del activo y de su depreciación acumulada, por categoría de activo.
export const cuentasPorCategoriaDeActivo: Record<CategoriaActivo, { activo: string; depreciacionAcumulada: string }> = {
  muebles: { activo: "1.2.1.01", depreciacionAcumulada: "1.2.2.01" },
  computacion: { activo: "1.2.1.02", depreciacionAcumulada: "1.2.2.02" },
  vehiculos: { activo: "1.2.1.03", depreciacionAcumulada: "1.2.2.03" },
  equipos_oficina: { activo: "1.2.1.04", depreciacionAcumulada: "1.2.2.04" },
};
