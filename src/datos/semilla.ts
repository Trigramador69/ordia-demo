import { crearAsiento, type BorradorAsiento } from "../lib/contabilidad.ts";
import type { Asiento } from "./tipos.ts";
import { crearAleatorio } from "./aleatorio.ts";
import { generarAusencias } from "./ausencias.ts";
import { generarAsientosManuales } from "./contabilidad-inicial.ts";
import { generarCrm } from "./crm.ts";
import { generarEquipo, idsVendedores } from "./equipo.ts";
import { fechaDeHoy } from "./fechas.ts";
import { crearGeneradorIdentidades } from "./identidades.ts";
import type { EstadoDemo } from "./tipos.ts";

// Cambiar esta versión descarta lo guardado en los navegadores y vuelve a la semilla.
export const versionEstadoDemo = 3;

// Cada parte usa su propia semilla para que un cambio en una no altere las demás.
// Las fechas salen de `hoy`: con la misma fecha, los datos salen idénticos.
const semillas = {
  identidades: 20261104,
  equipo: 1101,
  crm: 1102,
  contabilidad: 1103,
};

// Numera los asientos en orden de fecha, como en un libro diario.
export function numerarAsientos(borradores: BorradorAsiento[], hoy: string): Asiento[] {
  const ordenados = [...borradores].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const asientos: Asiento[] = [];
  for (const borrador of ordenados) asientos.push(crearAsiento(borrador, asientos, borrador.fecha <= hoy ? borrador.fecha : hoy));
  return asientos;
}

export function crearEstadoInicial(hoy: string = fechaDeHoy()): EstadoDemo {
  const crearIdentidad = crearGeneradorIdentidades(crearAleatorio(semillas.identidades));
  const personas = generarEquipo(crearAleatorio(semillas.equipo), crearIdentidad, hoy);
  const crm = generarCrm(crearAleatorio(semillas.crm), crearIdentidad, hoy, idsVendedores);
  const asientos = numerarAsientos(generarAsientosManuales(crearAleatorio(semillas.contabilidad), hoy), hoy);

  return {
    version: versionEstadoDemo,
    fechaBase: hoy,
    rol: "gerente",
    modulos: { facturacion: true },
    personas,
    ...generarAusencias(personas, hoy),
    ...crm,
    asientos,
  };
}
