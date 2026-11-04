import { aniosCumplidos, ultimoDiaDelMes } from "../datos/fechas.ts";
import { parametrosPlanilla as p } from "../datos/parametros.ts";
import type { Persona } from "../datos/tipos.ts";
import { aCentavos, redondear, type TotalesParaAsientoPlanilla } from "./contabilidad.ts";

// Cálculo de la planilla de sueldos de un mes. Todos los porcentajes y montos
// legales salen de src/datos/parametros.ts: aquí solo está la lógica.
// Importa con extensión .ts porque también lo ejecuta Node desde scripts/.

export interface FilaPlanilla {
  idPersona: string;
  aniosServicio: number;
  haberBasico: number;
  diasSinGoce: number;
  diasPagados: number;
  descuentoSinGoce: number;
  haberBasicoGanado: number;
  porcentajeBono: number;
  bonoAntiguedad: number;
  totalGanado: number;
  aporteAfp: number;
  aporteNacionalSolidario: number;
  rcIva: number;
  totalDescuentos: number;
  liquidoPagable: number;
  // A cargo de la empresa: no se descuentan al trabajador.
  aportesPatronales: {
    cajaDeSalud: number;
    riesgoProfesional: number;
    solidario: number;
    vivienda: number;
    total: number;
  };
  provisionAguinaldo: number;
  provisionIndemnizacion: number;
}

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

// La antigüedad que cuenta para el bono es la cumplida al cierre del mes.
export function calcularFilaPlanilla(persona: Persona, mes: string, diasSinGoce: number): FilaPlanilla {
  const aniosServicio = aniosCumplidos(persona.fechaIngreso, ultimoDiaDelMes(mes));
  const diasMes = p.diasDelMesComercial;
  const diasDescontados = Math.min(diasMes, diasSinGoce);
  const proporcion = (diasMes - diasDescontados) / diasMes;

  const haberBasico = persona.sueldoBasico;
  const haberBasicoGanado = redondear(haberBasico * proporcion);
  const descuentoSinGoce = redondear(haberBasico - haberBasicoGanado);

  const porcentajeBono = porcentajeBonoAntiguedad(aniosServicio);
  const bonoCompleto = (p.bonoAntiguedad.salariosMinimosBase * p.salarioMinimoNacional * porcentajeBono) / 100;
  const bonoAntiguedad = redondear(p.descontarSinGoceDelBono ? bonoCompleto * proporcion : bonoCompleto);

  const totalGanado = redondear(haberBasicoGanado + bonoAntiguedad);
  const aporteAfp = redondear(totalGanado * p.aporteLaboralAfp);
  const aporteNacionalSolidario = redondear(calcularAporteNacionalSolidario(totalGanado));
  const rcIva = redondear(calcularRcIva(totalGanado, aporteAfp + aporteNacionalSolidario));
  const totalDescuentos = redondear(aporteAfp + aporteNacionalSolidario + rcIva);
  const liquidoPagable = redondear(totalGanado - totalDescuentos);

  const patronal = p.aportesPatronales;
  const cajaDeSalud = redondear(totalGanado * patronal.cajaDeSalud);
  const riesgoProfesional = redondear(totalGanado * patronal.riesgoProfesional);
  const solidario = redondear(totalGanado * patronal.solidario);
  const vivienda = redondear(totalGanado * patronal.vivienda);

  return {
    idPersona: persona.id,
    aniosServicio,
    haberBasico,
    diasSinGoce: diasDescontados,
    diasPagados: diasMes - diasDescontados,
    descuentoSinGoce,
    haberBasicoGanado,
    porcentajeBono,
    bonoAntiguedad,
    totalGanado,
    aporteAfp,
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

// Suma en centavos, para que los totales cuadren exacto con las filas.
function sumar(filas: FilaPlanilla[], valor: (fila: FilaPlanilla) => number) {
  return filas.reduce((suma, fila) => suma + aCentavos(valor(fila)), 0) / 100;
}

export function totalesPlanilla(filas: FilaPlanilla[]) {
  return {
    haberBasico: sumar(filas, (fila) => fila.haberBasico),
    descuentoSinGoce: sumar(filas, (fila) => fila.descuentoSinGoce),
    haberBasicoGanado: sumar(filas, (fila) => fila.haberBasicoGanado),
    bonoAntiguedad: sumar(filas, (fila) => fila.bonoAntiguedad),
    totalGanado: sumar(filas, (fila) => fila.totalGanado),
    aporteAfp: sumar(filas, (fila) => fila.aporteAfp),
    aporteNacionalSolidario: sumar(filas, (fila) => fila.aporteNacionalSolidario),
    rcIva: sumar(filas, (fila) => fila.rcIva),
    totalDescuentos: sumar(filas, (fila) => fila.totalDescuentos),
    liquidoPagable: sumar(filas, (fila) => fila.liquidoPagable),
    cajaDeSalud: sumar(filas, (fila) => fila.aportesPatronales.cajaDeSalud),
    aportesPatronalesAfp: sumar(
      filas,
      (fila) => fila.aportesPatronales.riesgoProfesional + fila.aportesPatronales.solidario + fila.aportesPatronales.vivienda,
    ),
    aportesPatronales: sumar(filas, (fila) => fila.aportesPatronales.total),
    provisionAguinaldo: sumar(filas, (fila) => fila.provisionAguinaldo),
    provisionIndemnizacion: sumar(filas, (fila) => fila.provisionIndemnizacion),
  };
}

// Lo que necesita el asiento de la planilla cerrada (src/lib/contabilidad.ts).
export function totalesParaAsiento(filas: FilaPlanilla[]): TotalesParaAsientoPlanilla {
  const totales = totalesPlanilla(filas);
  return {
    haberBasicoGanado: totales.haberBasicoGanado,
    bonoAntiguedad: totales.bonoAntiguedad,
    aporteLaboral: redondear(totales.aporteAfp + totales.aporteNacionalSolidario),
    rcIva: totales.rcIva,
    liquidoPagable: totales.liquidoPagable,
    aportePatronalCajaDeSalud: totales.cajaDeSalud,
    aportesPatronalesAfp: totales.aportesPatronalesAfp,
    provisionAguinaldo: totales.provisionAguinaldo,
    provisionIndemnizacion: totales.provisionIndemnizacion,
  };
}
