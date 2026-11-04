// Imprime la planilla del mes de los datos de ejemplo, concepto por concepto, y
// el asiento que generaría al cerrarse. Sirve para revisar los parámetros de
// src/datos/parametros.ts con un contador sin abrir la demo.
//
//   pnpm revisar:planilla              planilla del mes en curso
//   pnpm revisar:planilla 2026-10      planilla de otro mes

import { fechaDeHoy, mesDeFecha } from "../src/datos/fechas.ts";
import { formatearNombreMesYAnio } from "../src/datos/meses.ts";
import { parametrosPlanilla } from "../src/datos/parametros.ts";
import { buscarCuenta } from "../src/datos/plan-cuentas.ts";
import { crearEstadoInicial } from "../src/datos/semilla.ts";
import { asientoDePlanilla, crearAsiento, totalesDeAsiento } from "../src/lib/contabilidad.ts";
import { calcularFilaPlanilla, totalesParaAsiento, totalesPlanilla } from "../src/lib/planilla.ts";
import { diasSinGoceEnMes } from "../src/lib/vacaciones.ts";

const hoy = fechaDeHoy();
const mes = process.argv[2] ?? mesDeFecha(hoy);
const estado = crearEstadoInicial(hoy);

const importe = (monto: number) => monto.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const columna = (texto: string | number, ancho: number) => String(texto).padStart(ancho);

console.log(`Planilla de ${formatearNombreMesYAnio(mes)} · salario mínimo Bs ${importe(parametrosPlanilla.salarioMinimoNacional)}\n`);
console.log(
  ["Persona".padEnd(30), "Años", "Básico", "Sin goce", "Bono", "T. ganado", "AFP", "RC-IVA", "Líquido", "Patronal"]
    .map((texto, indice) => (indice === 0 ? texto : columna(texto, indice === 1 ? 4 : 10)))
    .join(" "),
);

const filas = estado.personas.map((persona) => {
  const fila = calcularFilaPlanilla(persona, mes, diasSinGoceEnMes(persona.id, estado.permisos, mes));
  console.log(
    [
      `${persona.nombres} ${persona.apellidos}`.slice(0, 30).padEnd(30),
      columna(fila.aniosServicio, 4),
      columna(importe(fila.haberBasico), 10),
      columna(fila.diasSinGoce ? `-${importe(fila.descuentoSinGoce)}` : "-", 10),
      columna(`${importe(fila.bonoAntiguedad)}`, 10),
      columna(importe(fila.totalGanado), 10),
      columna(importe(fila.aporteAfp + fila.aporteNacionalSolidario), 10),
      columna(importe(fila.rcIva), 10),
      columna(importe(fila.liquidoPagable), 10),
      columna(importe(fila.aportesPatronales.total), 10),
    ].join(" "),
  );
  return fila;
});

const totales = totalesPlanilla(filas);
console.log(
  `\nTotal ganado Bs ${importe(totales.totalGanado)} · descuentos Bs ${importe(totales.totalDescuentos)} · líquido Bs ${importe(totales.liquidoPagable)}`,
);
console.log(
  `Aportes patronales Bs ${importe(totales.aportesPatronales)} · aguinaldo Bs ${importe(totales.provisionAguinaldo)} · indemnización Bs ${importe(totales.provisionIndemnizacion)}`,
);

const asiento = crearAsiento(
  asientoDePlanilla({ idPlanilla: `pla-${mes}`, nombreMes: formatearNombreMesYAnio(mes), fecha: hoy, totales: totalesParaAsiento(filas) }),
  estado.asientos,
  hoy,
);
console.log(`\nAsiento N° ${asiento.numero}: ${asiento.glosa}`);
for (const linea of asiento.lineas) {
  const nombre = `${linea.codigoCuenta} ${buscarCuenta(linea.codigoCuenta)?.nombre ?? ""}`.slice(0, 52).padEnd(52);
  console.log(`  ${nombre} ${columna(linea.debe ? importe(linea.debe) : "", 12)} ${columna(linea.haber ? importe(linea.haber) : "", 12)}`);
}
const { debe, haber } = totalesDeAsiento(asiento.lineas);
console.log(`  ${"Totales".padEnd(52)} ${columna(importe(debe), 12)} ${columna(importe(haber), 12)}`);
