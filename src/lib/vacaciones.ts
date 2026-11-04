import { aniosCumplidos, primerDiaDelMes, sumarAnios, sumarDias, ultimoDiaDelMes } from "../datos/fechas.ts";
import { contarDiasHabiles } from "../datos/feriados.ts";
import { parametrosPermisos, parametrosVacaciones } from "../datos/parametros.ts";
import type { MovimientoDiaLibre, Permiso, Persona, SolicitudVacacion } from "../datos/tipos.ts";

// Vacaciones, días libres y permisos: derechos según la antigüedad y saldos.
// Importa con extensión .ts porque también lo ejecuta Node desde scripts/.

// Días hábiles de vacación que da una gestión, según los años cumplidos al empezarla.
export function diasPorAntiguedad(anios: number) {
  let dias = 0;
  for (const tramo of parametrosVacaciones.tramos) if (anios >= tramo.desdeAnios) dias = tramo.dias;
  return dias;
}

// Una gestión de vacaciones va de un aniversario de ingreso al siguiente. La
// primera gestión con derecho empieza al cumplir el primer año.
export interface GestionVacacion {
  numero: number;
  desde: string;
  hasta: string;
  dias: number;
}

export interface ResumenVacaciones {
  anios: number;
  // Días que da la gestión en curso según su antigüedad (0 si no cumple el año).
  diasGestionActual: number;
  // Gestiones que todavía cuentan en el saldo (como mucho, las acumulables).
  gestionesVigentes: GestionVacacion[];
  derecho: number;
  tomados: number;
  // Aprobados con fecha futura: ya descuentan del saldo.
  programados: number;
  pendientesDeAprobar: number;
  saldo: number;
  // Cuándo cumple el año, si todavía no le corresponden vacaciones.
  fechaPrimerDerecho: string | null;
  // Cuándo pasa al siguiente tramo de días, si hay uno.
  proximoTramo: { fecha: string; dias: number } | null;
}

export function resumenVacaciones(persona: Persona, solicitudes: SolicitudVacacion[], hoy: string): ResumenVacaciones {
  const anios = aniosCumplidos(persona.fechaIngreso, hoy);
  const gestiones: GestionVacacion[] = [];
  for (let numero = 1; numero <= anios; numero++) {
    const desde = sumarAnios(persona.fechaIngreso, numero);
    gestiones.push({ numero, desde, hasta: sumarDias(sumarAnios(desde, 1), -1), dias: diasPorAntiguedad(numero) });
  }
  const gestionesVigentes = gestiones.slice(-parametrosVacaciones.gestionesAcumulables);
  const inicioVigente = gestionesVigentes[0]?.desde ?? null;

  const propias = solicitudes.filter((solicitud) => solicitud.idPersona === persona.id);
  const aprobadasVigentes = propias.filter(
    (solicitud) => solicitud.estado === "aprobada" && inicioVigente !== null && solicitud.desde >= inicioVigente,
  );
  const tomados = aprobadasVigentes.filter((solicitud) => solicitud.desde <= hoy).reduce((suma, solicitud) => suma + solicitud.diasHabiles, 0);
  const programados = aprobadasVigentes.filter((solicitud) => solicitud.desde > hoy).reduce((suma, solicitud) => suma + solicitud.diasHabiles, 0);
  const pendientesDeAprobar = propias.filter((solicitud) => solicitud.estado === "pendiente").reduce((suma, solicitud) => suma + solicitud.diasHabiles, 0);
  const derecho = gestionesVigentes.reduce((suma, gestion) => suma + gestion.dias, 0);

  const siguienteTramo = parametrosVacaciones.tramos.find((tramo) => tramo.desdeAnios > anios && tramo.desdeAnios > 1);
  return {
    anios,
    diasGestionActual: diasPorAntiguedad(anios),
    gestionesVigentes,
    derecho,
    tomados,
    programados,
    pendientesDeAprobar,
    saldo: derecho - tomados - programados,
    fechaPrimerDerecho: anios < 1 ? sumarAnios(persona.fechaIngreso, 1) : null,
    proximoTramo: siguienteTramo ? { fecha: sumarAnios(persona.fechaIngreso, siguienteTramo.desdeAnios), dias: siguienteTramo.dias } : null,
  };
}

// Problemas de una solicitud antes de registrarla; vacía si se puede.
export function validarSolicitud(
  datos: { idPersona: string; desde: string; hasta: string; diasHabiles: number },
  resumen: ResumenVacaciones,
  solicitudes: SolicitudVacacion[],
): string[] {
  const errores: string[] = [];
  if (!datos.desde || !datos.hasta || datos.hasta < datos.desde) errores.push("Revise las fechas.");
  else if (datos.diasHabiles === 0) errores.push("El rango elegido no tiene días hábiles.");
  if (resumen.fechaPrimerDerecho) errores.push("Todavía no le corresponden vacaciones: no cumple un año en la empresa.");
  else if (datos.diasHabiles > resumen.saldo - resumen.pendientesDeAprobar) {
    errores.push(`Pide ${datos.diasHabiles} días y tiene ${Math.max(0, resumen.saldo - resumen.pendientesDeAprobar)} disponibles.`);
  }
  const superpuesta = solicitudes.some(
    (solicitud) =>
      solicitud.idPersona === datos.idPersona &&
      solicitud.estado !== "rechazada" &&
      solicitud.desde <= datos.hasta &&
      solicitud.hasta >= datos.desde,
  );
  if (superpuesta) errores.push("Ya tiene una solicitud en esas fechas.");
  return errores;
}

// --- Días libres ---

export function saldoDiasLibres(idPersona: string, movimientos: MovimientoDiaLibre[]) {
  const propios = movimientos.filter((movimiento) => movimiento.idPersona === idPersona);
  const ganados = propios.filter((movimiento) => movimiento.tipo === "ganado").reduce((suma, movimiento) => suma + movimiento.dias, 0);
  const usados = propios.filter((movimiento) => movimiento.tipo === "usado").reduce((suma, movimiento) => suma + movimiento.dias, 0);
  return { ganados, usados, saldo: ganados - usados };
}

// --- Permisos ---

// Los permisos con goce tienen un cupo por gestión calendario; los sin goce no
// tienen tope, pero se descuentan en la planilla.
export function resumenPermisos(idPersona: string, permisos: Permiso[], hoy: string) {
  const anio = hoy.slice(0, 4);
  const delAnio = permisos.filter((permiso) => permiso.idPersona === idPersona && permiso.desde.startsWith(anio));
  const conGoce = delAnio.filter((permiso) => permiso.tipo === "con_goce").reduce((suma, permiso) => suma + permiso.diasHabiles, 0);
  const sinGoce = delAnio.filter((permiso) => permiso.tipo === "sin_goce").reduce((suma, permiso) => suma + permiso.diasHabiles, 0);
  return {
    cupoConGoce: parametrosPermisos.diasConGocePorGestion,
    conGoce,
    saldoConGoce: parametrosPermisos.diasConGocePorGestion - conGoce,
    sinGoce,
  };
}

// Días hábiles sin goce de haber que caen dentro de un mes: los que descuenta
// la planilla (un permiso que cruza de mes descuenta en cada mes lo suyo).
export function diasSinGoceEnMes(idPersona: string, permisos: Permiso[], mes: string) {
  const desdeMes = primerDiaDelMes(mes);
  const hastaMes = ultimoDiaDelMes(mes);
  return permisos
    .filter((permiso) => permiso.idPersona === idPersona && permiso.tipo === "sin_goce")
    .filter((permiso) => permiso.desde <= hastaMes && permiso.hasta >= desdeMes)
    .reduce((suma, permiso) => {
      const desde = permiso.desde > desdeMes ? permiso.desde : desdeMes;
      const hasta = permiso.hasta < hastaMes ? permiso.hasta : hastaMes;
      return suma + contarDiasHabiles(desde, hasta);
    }, 0);
}
