import type { BorradorAsiento } from "../lib/contabilidad.ts";
import type { Aleatorio } from "./aleatorio.ts";
import { diasDelMes, mesDeFecha, sumarMesesAMes } from "./fechas.ts";
import { formatearNombreMesYAnio } from "./meses.ts";
import { depreciacionAcumulada } from "../lib/activos.ts";
import { redondear } from "../lib/contabilidad.ts";
import { cuentasDelSistema, cuentasPorCategoriaDeActivo } from "./plan-cuentas.ts";
import type { Activo } from "./tipos.ts";

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

// Alcanza para varios meses de sueldos: en el periodo solo entran los cobros
// de las facturas de los últimos meses.
const saldoInicialBanco = 650000;
const saldoInicialCaja = 5000;
const capitalSocial = 500000;

// Saldos iniciales: disponible, los activos fijos al costo con su depreciación
// acumulada, y el patrimonio que los equilibra. Los activos comprados dentro
// del periodo entran con su propio asiento de compra.
function asientoDeApertura(fecha: string, activos: Activo[]): BorradorAsiento {
  const mesAnterior = sumarMesesAMes(mesDeFecha(fecha), -1);
  const enLibros = activos.filter((activo) => activo.fechaCompra < fecha && !(activo.fechaBaja && activo.fechaBaja < fecha));
  const costo = new Map<string, number>();
  const depreciacion = new Map<string, number>();
  for (const activo of enLibros) {
    const cuentas = cuentasPorCategoriaDeActivo[activo.categoria];
    costo.set(cuentas.activo, (costo.get(cuentas.activo) ?? 0) + activo.valorCompra);
    depreciacion.set(cuentas.depreciacionAcumulada, redondear((depreciacion.get(cuentas.depreciacionAcumulada) ?? 0) + depreciacionAcumulada(activo, mesAnterior)));
  }
  const totalCosto = [...costo.values()].reduce((suma, monto) => suma + monto, 0);
  const totalDepreciacion = [...depreciacion.values()].reduce((suma, monto) => suma + monto, 0);
  const resultados = redondear(saldoInicialBanco + saldoInicialCaja + totalCosto - totalDepreciacion - capitalSocial);
  return {
    fecha,
    glosa: "Saldos iniciales",
    origen: "apertura",
    idOrigen: null,
    lineas: [
      { codigoCuenta: cuentasDelSistema.banco, debe: saldoInicialBanco, haber: 0 },
      { codigoCuenta: cuentasDelSistema.caja, debe: saldoInicialCaja, haber: 0 },
      ...[...costo.entries()].sort().map(([codigoCuenta, monto]) => ({ codigoCuenta, debe: monto, haber: 0 })),
      ...[...depreciacion.entries()].sort().filter(([, monto]) => monto > 0).map(([codigoCuenta, monto]) => ({ codigoCuenta, debe: 0, haber: monto })),
      { codigoCuenta: cuentasDelSistema.capitalSocial, debe: 0, haber: capitalSocial },
      { codigoCuenta: cuentasDelSistema.resultadosAcumulados, debe: 0, haber: resultados },
    ],
  };
}

export function generarAsientosManuales(aleatorio: Aleatorio, hoy: string, activos: Activo[]): BorradorAsiento[] {
  const mesActual = mesDeFecha(hoy);
  const primerMes = sumarMesesAMes(mesActual, -mesesDeHistoria);
  const inicio = `${primerMes}-01`;
  const borradores: BorradorAsiento[] = [asientoDeApertura(inicio, activos)];

  // Compras de activos dentro del periodo, pagadas por banco.
  for (const activo of activos.filter((item) => item.fechaCompra >= inicio && item.fechaCompra <= hoy)) {
    borradores.push({
      fecha: activo.fechaCompra,
      glosa: `Compra de ${activo.nombre.charAt(0).toLowerCase()}${activo.nombre.slice(1)} (${activo.codigo})`,
      origen: "manual",
      idOrigen: null,
      lineas: [
        { codigoCuenta: cuentasPorCategoriaDeActivo[activo.categoria].activo, debe: activo.valorCompra, haber: 0 },
        { codigoCuenta: cuentasDelSistema.banco, debe: 0, haber: activo.valorCompra },
      ],
    });
  }

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
