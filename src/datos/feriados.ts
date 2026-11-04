import { esFinDeSemana, fechasEntre, sumarDias } from "./fechas.ts";

// Feriados de Bolivia, calculados por año para que la demo funcione con
// cualquier fecha. Incluye los nacionales y el departamental de Cochabamba,
// donde está la oficina de la empresa de ejemplo, más los traslados y
// feriados adicionales que fija el decreto de cada año.

export interface Feriado {
  fecha: string;
  nombre: string;
}

// Domingo de Pascua (algoritmo de Meeus para el calendario gregoriano).
function domingoDePascua(anio: number) {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

const fijos: [string, string][] = [
  ["01-01", "Año Nuevo"],
  ["01-22", "Día del Estado Plurinacional"],
  ["05-01", "Día del Trabajo"],
  ["06-21", "Año Nuevo Andino Amazónico"],
  ["08-06", "Día de la Independencia"],
  // Departamental: no figura en los decretos nacionales.
  ["09-14", "Aniversario de Cochabamba"],
  ["11-02", "Día de Todos los Difuntos"],
  ["12-25", "Navidad"],
];

// Traslados y feriados adicionales que fija el Gobierno por decreto cada año.
// No hay una regla automática (por ejemplo, de domingo a lunes): los años sin
// decreto cargado usan las fechas base. Agregar aquí el decreto de cada año.
interface CambiosDelAnio {
  norma: string;
  traslados: { desde: string; hasta: string }[];
  adicionales: Feriado[];
}

const cambiosPorDecreto: Record<number, CambiosDelAnio> = {
  2026: {
    norma: "D.S. 5521 del 13/01/2026",
    traslados: [
      { desde: "2026-01-22", hasta: "2026-01-23" },
      { desde: "2026-06-21", hasta: "2026-06-22" },
    ],
    adicionales: [
      { fecha: "2026-06-05", nombre: "Feriado adicional de Corpus Christi" },
      { fecha: "2026-08-07", nombre: "Feriado adicional de la Independencia" },
    ],
  },
};

const cachePorAnio = new Map<number, Feriado[]>();

export function feriadosDelAnio(anio: number): Feriado[] {
  const guardado = cachePorAnio.get(anio);
  if (guardado) return guardado;

  const pascua = domingoDePascua(anio);
  const cambios = cambiosPorDecreto[anio];
  const base: Feriado[] = [
    ...fijos.map(([mesDia, nombre]) => ({ fecha: `${anio}-${mesDia}`, nombre })),
    { fecha: sumarDias(pascua, -48), nombre: "Carnaval" },
    { fecha: sumarDias(pascua, -47), nombre: "Carnaval" },
    { fecha: sumarDias(pascua, -2), nombre: "Viernes Santo" },
    { fecha: sumarDias(pascua, 60), nombre: "Corpus Christi" },
  ];
  const feriados = [
    ...base.map((feriado) => {
      const traslado = cambios?.traslados.find((item) => item.desde === feriado.fecha);
      return traslado ? { fecha: traslado.hasta, nombre: `${feriado.nombre} (trasladado)` } : feriado;
    }),
    ...(cambios?.adicionales ?? []),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));

  cachePorAnio.set(anio, feriados);
  return feriados;
}

export function feriadoDeFecha(fecha: string): Feriado | undefined {
  return feriadosDelAnio(Number(fecha.slice(0, 4))).find((feriado) => feriado.fecha === fecha);
}

export function esDiaHabil(fecha: string) {
  return !esFinDeSemana(fecha) && !feriadoDeFecha(fecha);
}

export function diasHabilesEntre(desde: string, hasta: string) {
  return fechasEntre(desde, hasta).filter(esDiaHabil);
}

export function contarDiasHabiles(desde: string, hasta: string) {
  return diasHabilesEntre(desde, hasta).length;
}

// Primer día hábil igual o posterior a la fecha.
export function diaHabilDesde(fecha: string) {
  let actual = fecha;
  while (!esDiaHabil(actual)) actual = sumarDias(actual, 1);
  return actual;
}

// Último día hábil igual o anterior a la fecha.
export function diaHabilHasta(fecha: string) {
  let actual = fecha;
  while (!esDiaHabil(actual)) actual = sumarDias(actual, -1);
  return actual;
}

// Fecha en la que se completan `cantidad` días hábiles empezando en `desde`.
export function sumarDiasHabiles(desde: string, cantidad: number) {
  let actual = diaHabilDesde(desde);
  for (let contados = 1; contados < cantidad; contados++) actual = diaHabilDesde(sumarDias(actual, 1));
  return actual;
}
