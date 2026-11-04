import { aniosCumplidos, primerDiaDelMes, ultimoDiaDelMes } from "../datos/fechas.ts";
import { formatearNombreMesYAnio } from "../datos/meses.ts";
import { parametrosPlanilla as p } from "../datos/parametros.ts";
import { cuentasDelSistema as cuentas } from "../datos/plan-cuentas.ts";
import type { FilaPlanilla, Permiso, Persona } from "../datos/tipos.ts";
import { aCentavos, asientoDePlanilla, redondear, type BorradorAsiento, type TotalesParaAsientoPlanilla } from "./contabilidad.ts";
import { diasSinGoceEnMes } from "./vacaciones.ts";

// Cálculo de la planilla de sueldos de un mes. Todos los porcentajes y montos
// legales salen de src/datos/parametros.ts: aquí solo está la lógica.
// Importa con extensión .ts porque también lo ejecuta Node desde scripts/.

export type { FilaPlanilla };

export function porcentajeBonoAntiguedad(anios: number) {
  let porcentaje = 0;
  for (const tramo of p.bonoAntiguedad.tramos) if (anios >= tramo.desdeAnios) porcentaje = tramo.porcentaje;
  return porcentaje;
}

export function calcularAporteNacionalSolidario(totalGanado: number) {
  return p.aporteNacionalSolidario.reduce(
    (suma, tramo) => suma + Math.max(0, totalGanado - tramo.excedenteDe) * tramo.porcentaje,
    0,
  );
}

export function calcularRcIva(totalGanado: number, aportesLaborales: number) {
  const salarioMinimo = p.salarioMinimoNacional;
  const sueldoNeto = totalGanado - aportesLaborales;
  const base = Math.max(0, sueldoNeto - p.rcIva.salariosMinimosNoImponibles * salarioMinimo);
  const impuesto = base * p.rcIva.alicuota;
  const computoAFavor = p.rcIva.salariosMinimosComputoAFavor * salarioMinimo * p.rcIva.alicuota;
  return Math.max(0, impuesto - computoAFavor);
}

// Días de un mes comercial (30) anteriores al ingreso, si la persona entró ese mes.
export function diasAntesDelIngreso(fechaIngreso: string, mes: string) {
  if (fechaIngreso <= primerDiaDelMes(mes) || fechaIngreso > ultimoDiaDelMes(mes)) return 0;
  return Math.min(p.diasDelMesComercial, Number(fechaIngreso.slice(8, 10)) - 1);
}

// La antigüedad que cuenta para el bono es la cumplida al cierre del mes.
export function calcularFilaPlanilla(persona: Persona, mes: string, diasSinGoce: number): FilaPlanilla {
  const aniosServicio = aniosCumplidos(persona.fechaIngreso, ultimoDiaDelMes(mes));
  const diasMes = p.diasDelMesComercial;
  const antesDelIngreso = diasAntesDelIngreso(persona.fechaIngreso, mes);
  const sinGoce = Math.min(diasMes - antesDelIngreso, diasSinGoce);
  const diasPagados = diasMes - antesDelIngreso - sinGoce;
  const proporcion = diasPagados / diasMes;

  const haberBasico = persona.sueldoBasico;
  const haberBasicoGanado = redondear(haberBasico * proporcion);
  const descuentoDiasNoPagados = redondear(haberBasico - haberBasicoGanado);

  const porcentajeBono = porcentajeBonoAntiguedad(aniosServicio);
  const bonoCompleto = (p.bonoAntiguedad.salariosMinimosBase * p.salarioMinimoNacional * porcentajeBono) / 100;
  const bonoAntiguedad = redondear(p.descontarSinGoceDelBono ? bonoCompleto * proporcion : bonoCompleto);

  const totalGanado = redondear(haberBasicoGanado + bonoAntiguedad);
  const aporteLaboral = redondear(totalGanado * p.aporteLaboralAfp);
  const aporteNacionalSolidario = redondear(calcularAporteNacionalSolidario(totalGanado));
  const rcIva = redondear(calcularRcIva(totalGanado, aporteLaboral + aporteNacionalSolidario));
  const totalDescuentos = redondear(aporteLaboral + aporteNacionalSolidario + rcIva);
  const liquidoPagable = redondear(totalGanado - totalDescuentos);

  const patronal = p.aportesPatronales;
  const cajaDeSalud = redondear(totalGanado * patronal.cajaDeSalud);
  const riesgoProfesional = redondear(totalGanado * patronal.riesgoProfesional);
  const solidario = redondear(totalGanado * patronal.solidario);
  const vivienda = redondear(totalGanado * patronal.vivienda);

  return {
    idPersona: persona.id,
    nombreCompleto: `${persona.nombres} ${persona.apellidos}`,
    carnetIdentidad: persona.carnetIdentidad,
    cargo: persona.cargo,
    fechaIngreso: persona.fechaIngreso,
    cuentaBancaria: persona.cuentaBancaria,
    aniosServicio,
    haberBasico,
    diasSinGoce: sinGoce,
    diasAntesDelIngreso: antesDelIngreso,
    diasPagados,
    descuentoDiasNoPagados,
    haberBasicoGanado,
    porcentajeBono,
    bonoAntiguedad,
    totalGanado,
    aporteLaboral,
    aporteNacionalSolidario,
    rcIva,
    totalDescuentos,
    liquidoPagable,
    aportesPatronales: {
      cajaDeSalud,
      riesgoProfesional,
      solidario,
      vivienda,
      total: redondear(cajaDeSalud + riesgoProfesional + solidario + vivienda),
    },
    provisionAguinaldo: redondear(totalGanado * p.provisiones.aguinaldo),
    provisionIndemnizacion: redondear(totalGanado * p.provisiones.indemnizacion),
  };
}

// La planilla de un mes con los datos actuales: todas las personas que ya
// habían ingresado al cierre del mes, con sus días sin goce de haber.
export function calcularPlanillaDelMes(personas: Persona[], permisos: Permiso[], mes: string): FilaPlanilla[] {
  const cierre = ultimoDiaDelMes(mes);
  return personas
    .filter((persona) => persona.fechaIngreso <= cierre)
    .map((persona) => calcularFilaPlanilla(persona, mes, diasSinGoceEnMes(persona.id, permisos, mes)));
}

// Suma en centavos, para que los totales cuadren exacto con las filas.
function sumar(filas: FilaPlanilla[], valor: (fila: FilaPlanilla) => number) {
  return filas.reduce((suma, fila) => suma + aCentavos(valor(fila)), 0) / 100;
}

export function totalesPlanilla(filas: FilaPlanilla[]) {
  const totales = {
    haberBasico: sumar(filas, (fila) => fila.haberBasico),
    descuentoDiasNoPagados: sumar(filas, (fila) => fila.descuentoDiasNoPagados),
    haberBasicoGanado: sumar(filas, (fila) => fila.haberBasicoGanado),
    bonoAntiguedad: sumar(filas, (fila) => fila.bonoAntiguedad),
    totalGanado: sumar(filas, (fila) => fila.totalGanado),
    aporteLaboral: sumar(filas, (fila) => fila.aporteLaboral),
    aporteNacionalSolidario: sumar(filas, (fila) => fila.aporteNacionalSolidario),
    rcIva: sumar(filas, (fila) => fila.rcIva),
    totalDescuentos: sumar(filas, (fila) => fila.totalDescuentos),
    liquidoPagable: sumar(filas, (fila) => fila.liquidoPagable),
    cajaDeSalud: sumar(filas, (fila) => fila.aportesPatronales.cajaDeSalud),
    riesgoProfesional: sumar(filas, (fila) => fila.aportesPatronales.riesgoProfesional),
    solidario: sumar(filas, (fila) => fila.aportesPatronales.solidario),
    vivienda: sumar(filas, (fila) => fila.aportesPatronales.vivienda),
    aportesPatronales: sumar(filas, (fila) => fila.aportesPatronales.total),
    provisionAguinaldo: sumar(filas, (fila) => fila.provisionAguinaldo),
    provisionIndemnizacion: sumar(filas, (fila) => fila.provisionIndemnizacion),
  };
  return {
    ...totales,
    // Lo que le cuesta el mes a la empresa: sueldos, aportes y provisiones.
    costoEmpresa: redondear(totales.totalGanado + totales.aportesPatronales + totales.provisionAguinaldo + totales.provisionIndemnizacion),
  };
}

// Lo que necesita el asiento de la planilla cerrada (src/lib/contabilidad.ts).
export function totalesParaAsiento(filas: FilaPlanilla[]): TotalesParaAsientoPlanilla {
  const totales = totalesPlanilla(filas);
  return {
    haberBasicoGanado: totales.haberBasicoGanado,
    bonoAntiguedad: totales.bonoAntiguedad,
    aporteLaboral: redondear(totales.aporteLaboral + totales.aporteNacionalSolidario),
    rcIva: totales.rcIva,
    liquidoPagable: totales.liquidoPagable,
    aportePatronalCajaDeSalud: totales.cajaDeSalud,
    aportesPatronalesAfp: redondear(totales.riesgoProfesional + totales.solidario + totales.vivienda),
    provisionAguinaldo: totales.provisionAguinaldo,
    provisionIndemnizacion: totales.provisionIndemnizacion,
  };
}

export const idPlanillaDelMes = (mes: string) => `pla-${mes}`;

// El asiento de la planilla va con fecha del último día del mes: es el gasto
// devengado en ese mes, aunque se cierre antes o después.
export function borradorAsientoPlanilla(mes: string, filas: FilaPlanilla[]): BorradorAsiento {
  return asientoDePlanilla({
    idPlanilla: idPlanillaDelMes(mes),
    nombreMes: formatearNombreMesYAnio(mes),
    fecha: ultimoDiaDelMes(mes),
    totales: totalesParaAsiento(filas),
  });
}

// Pagos de una planilla cerrada, por banco: los sueldos (al cerrarla) y los
// aportes y retenciones (a la Gestora, la Caja de Salud e Impuestos), hasta el
// día 15 del mes siguiente.
export function borradoresPagoPlanilla(mes: string, filas: FilaPlanilla[], fechaSueldos: string, fechaAportes: string): BorradorAsiento[] {
  const t = totalesParaAsiento(filas);
  const nombreMes = formatearNombreMesYAnio(mes);
  const aportes = redondear(t.aporteLaboral + t.aportesPatronalesAfp + t.aportePatronalCajaDeSalud + t.rcIva);
  return [
    {
      fecha: fechaSueldos,
      glosa: `Pago de sueldos de ${nombreMes}`,
      origen: "manual",
      idOrigen: null,
      lineas: [
        { codigoCuenta: cuentas.sueldosPorPagar, debe: t.liquidoPagable, haber: 0 },
        { codigoCuenta: cuentas.banco, debe: 0, haber: t.liquidoPagable },
      ],
    },
    {
      fecha: fechaAportes,
      glosa: `Pago de aportes y retenciones de ${nombreMes}`,
      origen: "manual",
      idOrigen: null,
      lineas: [
        { codigoCuenta: cuentas.aportesLaboralesPorPagar, debe: t.aporteLaboral, haber: 0 },
        { codigoCuenta: cuentas.aportesPatronalesAfpPorPagar, debe: t.aportesPatronalesAfp, haber: 0 },
        { codigoCuenta: cuentas.cajaDeSaludPorPagar, debe: t.aportePatronalCajaDeSalud, haber: 0 },
        { codigoCuenta: cuentas.rcIvaPorPagar, debe: t.rcIva, haber: 0 },
        { codigoCuenta: cuentas.banco, debe: 0, haber: aportes },
      ],
    },
  ];
}
