import type { BorradorAsiento } from "../lib/contabilidad.ts";
import type { Aleatorio } from "./aleatorio.ts";
import { diasDelMes, mesDeFecha, sumarMesesAMes } from "./fechas.ts";
import { formatearNombreMesYAnio } from "./meses.ts";
import { cuentasDelSistema } from "./plan-cuentas.ts";

// Asientos que no vienen de otro módulo: los saldos iniciales y los gastos
// fijos de cada mes (alquiler, servicios básicos, internet), registrados a
// mano. Los asientos de facturas, cobros, planillas y depreciación los generan
// sus módulos.

// Meses hacia atrás que cubre la contabilidad de ejemplo, además del actual.
export const mesesDeHistoria = 6;

const gastosFijos: { dia: number; cuenta: string; glosa: string; monto: [number, number] }[] = [
  { dia: 5, cuenta: "5.2.1.01", glosa: "Alquiler de la oficina", monto: [6500, 6500] },
  { dia: 10, cuenta: "5.2.1.03", glosa: "Internet y telefonía", monto: [720, 720] },
  { dia: 12, cuenta: "5.2.1.02", glosa: "Servicios básicos: luz y agua", monto: [610, 940] },
  { dia: 18, cuenta: "5.2.1.04", glosa: "Material de escritorio", monto: [280, 650] },
  { dia: 22, cuenta: "5.2.1.06", glosa: "Combustible del vehículo de la empresa", monto: [450, 800] },
];

export function generarAsientosManuales(aleatorio: Aleatorio, hoy: string): BorradorAsiento[] {
  const mesActual = mesDeFecha(hoy);
  const primerMes = sumarMesesAMes(mesActual, -mesesDeHistoria);
  const borradores: BorradorAsiento[] = [
    {
      fecha: `${primerMes}-01`,
      glosa: "Saldos iniciales",
      origen: "apertura",
      idOrigen: null,
      lineas: [
        { codigoCuenta: cuentasDelSistema.banco, debe: 185000, haber: 0 },
        { codigoCuenta: cuentasDelSistema.caja, debe: 5000, haber: 0 },
        { codigoCuenta: cuentasDelSistema.capitalSocial, debe: 0, haber: 150000 },
        { codigoCuenta: cuentasDelSistema.resultadosAcumulados, debe: 0, haber: 40000 },
      ],
    },
  ];

  for (let desfase = mesesDeHistoria; desfase >= 0; desfase--) {
    const mes = sumarMesesAMes(mesActual, -desfase);
    const ultimoDia = diasDelMes(mes).length;
    for (const gasto of gastosFijos) {
      const fecha = `${mes}-${String(Math.min(gasto.dia, ultimoDia)).padStart(2, "0")}`;
      const monto = Math.round(aleatorio.entero(gasto.monto[0], gasto.monto[1]) / 10) * 10;
      if (fecha > hoy) continue;
      borradores.push({
        fecha,
        glosa: `${gasto.glosa} de ${formatearNombreMesYAnio(mes)}`,
        origen: "manual",
        idOrigen: null,
        lineas: [
          { codigoCuenta: gasto.cuenta, debe: monto, haber: 0 },
          { codigoCuenta: cuentasDelSistema.banco, debe: 0, haber: monto },
        ],
      });
    }
  }
  return borradores;
}
