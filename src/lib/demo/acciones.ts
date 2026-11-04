"use client";

import { contarDiasHabiles } from "@/datos/feriados";
import type { MovimientoDiaLibre, Permiso, PlanillaCerrada, SolicitudVacacion } from "@/datos/tipos";
import { crearAsiento } from "@/lib/contabilidad";
import { actualizarEstado, obtenerEstado } from "@/lib/demo/almacen";
import { borradorAsientoPlanilla, calcularPlanillaDelMes, idPlanillaDelMes } from "@/lib/planilla";
import { fechaDeHoy } from "@/lib/formato";

// Cambios que se pueden hacer durante la demo. Todos pasan por actualizarEstado,
// que guarda en el navegador y avisa a las pantallas abiertas.

function crearId(prefijo: string) {
  return `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// --- Vacaciones ---

export function solicitarVacacion(datos: { idPersona: string; desde: string; hasta: string; comentario: string }) {
  const solicitud: SolicitudVacacion = {
    ...datos,
    id: crearId("vac"),
    diasHabiles: contarDiasHabiles(datos.desde, datos.hasta),
    estado: "pendiente",
    fechaSolicitud: fechaDeHoy(),
    fechaResolucion: null,
    idResolutor: null,
    motivoRechazo: null,
  };
  actualizarEstado((estado) => ({ ...estado, solicitudesVacacion: [...estado.solicitudesVacacion, solicitud] }));
  return solicitud;
}

// Aprueba o rechaza. Devuelve una función que deja la solicitud como estaba.
export function resolverSolicitud(idSolicitud: string, aprobada: boolean, idResolutor: string, motivoRechazo?: string) {
  let anterior: SolicitudVacacion | undefined;
  actualizarEstado((estado) => ({
    ...estado,
    solicitudesVacacion: estado.solicitudesVacacion.map((solicitud) => {
      if (solicitud.id !== idSolicitud) return solicitud;
      anterior = solicitud;
      return {
        ...solicitud,
        estado: aprobada ? "aprobada" : "rechazada",
        fechaResolucion: fechaDeHoy(),
        idResolutor,
        motivoRechazo: aprobada ? null : (motivoRechazo?.trim() || null),
      };
    }),
  }));
  return () => {
    if (!anterior) return;
    const original = anterior;
    actualizarEstado((estado) => ({
      ...estado,
      solicitudesVacacion: estado.solicitudesVacacion.map((solicitud) => (solicitud.id === idSolicitud ? original : solicitud)),
    }));
  };
}

// La propia persona retira una solicitud que todavía no se resolvió.
export function cancelarSolicitud(idSolicitud: string) {
  actualizarEstado((estado) => ({
    ...estado,
    solicitudesVacacion: estado.solicitudesVacacion.filter(
      (solicitud) => !(solicitud.id === idSolicitud && solicitud.estado === "pendiente"),
    ),
  }));
}

// --- Días libres y permisos ---

export function registrarMovimientoDiaLibre(datos: Omit<MovimientoDiaLibre, "id">) {
  const movimiento: MovimientoDiaLibre = { ...datos, id: crearId("dli") };
  actualizarEstado((estado) => ({ ...estado, movimientosDiasLibres: [...estado.movimientosDiasLibres, movimiento] }));
}

export function registrarPermiso(datos: Omit<Permiso, "id" | "diasHabiles" | "fechaRegistro">) {
  const permiso: Permiso = {
    ...datos,
    id: crearId("prm"),
    diasHabiles: contarDiasHabiles(datos.desde, datos.hasta),
    fechaRegistro: fechaDeHoy(),
  };
  actualizarEstado((estado) => ({ ...estado, permisos: [...estado.permisos, permiso] }));
}

// --- Planilla ---

// Cierra la planilla del mes: la deja fija con los datos de hoy y registra su
// asiento contable. Devuelve el asiento creado y una función para deshacerlo
// (solo para el instante siguiente al cierre, desde el aviso).
export function cerrarPlanilla(mes: string, idCerradoPor: string) {
  const estadoActual = obtenerEstado();
  if (estadoActual.planillas.some((planilla) => planilla.mes === mes)) throw new Error("La planilla de ese mes ya está cerrada.");
  const filas = calcularPlanillaDelMes(estadoActual.personas, estadoActual.permisos, mes);
  const asiento = crearAsiento(borradorAsientoPlanilla(mes, filas), estadoActual.asientos, fechaDeHoy());
  const planilla: PlanillaCerrada = {
    id: idPlanillaDelMes(mes),
    mes,
    fechaCierre: fechaDeHoy(),
    idCerradoPor,
    filas,
    idAsiento: asiento.id,
  };
  actualizarEstado((estado) => ({
    ...estado,
    planillas: [...estado.planillas, planilla],
    asientos: [...estado.asientos, asiento],
  }));
  const deshacer = () =>
    actualizarEstado((estado) => ({
      ...estado,
      planillas: estado.planillas.filter((item) => item.id !== planilla.id),
      asientos: estado.asientos.filter((item) => item.id !== asiento.id),
    }));
  return { asiento, deshacer };
}
