"use client";

import { nombresEtapa, probabilidadPorEtapa } from "@/datos/catalogos";
import { contarDiasHabiles } from "@/datos/feriados";
import type {
  Activo,
  Actividad,
  DepreciacionDelMes,
  EventoActivo,
  LineaAsiento,
  Cobro,
  EtapaOportunidad,
  Factura,
  LineaFactura,
  MedioDeCobro,
  ModuloOpcional,
  MovimientoDiaLibre,
  Oportunidad,
  Permiso,
  PlanillaCerrada,
  Seguimiento,
  SolicitudVacacion,
} from "@/datos/tipos";
import { ultimoDiaDelMes } from "@/datos/fechas";
import { formatearNombreMesYAnio } from "@/datos/meses";
import { calcularDepreciacionDelMes, idDepreciacionDelMes } from "@/lib/activos";
import { asientoDeAnulacion, asientoDeCobro, asientoDeDepreciacion, asientoDeFactura, crearAsiento, redondear } from "@/lib/contabilidad";
import { cuentaDelMedio, generarCuf, totalDeLineas } from "@/lib/facturacion";
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

// --- CRM ---

// Registra una llamada, reunión, correo o nota. Si viene de un seguimiento, lo
// marca como realizado; si se pide, agenda el próximo. Así se trabaja una alarma
// sin salir de ella.
export function registrarActividad(
  datos: Omit<Actividad, "id">,
  opciones: { idSeguimientoRealizado?: string; proximoSeguimiento?: { fecha: string; motivo: string } } = {},
) {
  const actividad: Actividad = { ...datos, id: crearId("act") };
  const proximo: Seguimiento | null = opciones.proximoSeguimiento
    ? {
        id: crearId("seg"),
        idCliente: datos.idCliente,
        idOportunidad: datos.idOportunidad,
        fecha: opciones.proximoSeguimiento.fecha,
        motivo: opciones.proximoSeguimiento.motivo,
        idResponsable: datos.idAutor,
        estado: "pendiente",
        fechaRealizado: null,
        idActividad: null,
      }
    : null;
  actualizarEstado((estado) => ({
    ...estado,
    actividades: [actividad, ...estado.actividades],
    seguimientos: [
      ...estado.seguimientos.map((seguimiento) =>
        seguimiento.id === opciones.idSeguimientoRealizado
          ? { ...seguimiento, estado: "realizado" as const, fechaRealizado: datos.fecha, idActividad: actividad.id }
          : seguimiento,
      ),
      ...(proximo ? [proximo] : []),
    ],
  }));
  return actividad;
}

export function agendarSeguimiento(datos: Omit<Seguimiento, "id" | "estado" | "fechaRealizado" | "idActividad">) {
  const seguimiento: Seguimiento = { ...datos, id: crearId("seg"), estado: "pendiente", fechaRealizado: null, idActividad: null };
  actualizarEstado((estado) => ({ ...estado, seguimientos: [...estado.seguimientos, seguimiento] }));
  return seguimiento;
}

// Mueve una oportunidad de etapa. Deja una nota en su historial de actividad,
// cierra la oportunidad si es ganada o perdida, y pasa a activo a un prospecto
// que gana. Devuelve una función que deja todo como estaba.
export function moverOportunidad(idOportunidad: string, etapa: EtapaOportunidad, idAutor: string, motivoPerdida?: string) {
  const anterior = obtenerEstado();
  const oportunidad = anterior.oportunidades.find((item) => item.id === idOportunidad);
  if (!oportunidad || oportunidad.etapa === etapa) return () => {};
  const hoy = fechaDeHoy();
  const cerrada = etapa === "ganada" || etapa === "perdida";
  const nota: Actividad = {
    id: crearId("act"),
    idCliente: oportunidad.idCliente,
    idOportunidad,
    tipo: "nota",
    fecha: hoy,
    descripcion:
      etapa === "perdida"
        ? `Oportunidad perdida: ${(motivoPerdida ?? "sin motivo").toLowerCase()}.`
        : etapa === "ganada"
          ? `Oportunidad ganada por Bs ${oportunidad.monto.toLocaleString("es-BO")}.`
          : `Pasó de ${nombresEtapa[oportunidad.etapa].toLowerCase()} a ${nombresEtapa[etapa].toLowerCase()}.`,
    idAutor,
  };
  actualizarEstado((estado) => ({
    ...estado,
    oportunidades: estado.oportunidades.map((item) =>
      item.id === idOportunidad
        ? {
            ...item,
            etapa,
            probabilidad: probabilidadPorEtapa[etapa],
            fechaCierre: cerrada ? hoy : null,
            motivoPerdida: etapa === "perdida" ? (motivoPerdida ?? null) : null,
            historialEtapas: [...item.historialEtapas, { etapa, fecha: hoy }],
          }
        : item,
    ),
    actividades: [nota, ...estado.actividades],
    clientes:
      etapa === "ganada"
        ? estado.clientes.map((cliente) =>
            cliente.id === oportunidad.idCliente && cliente.estado !== "activo" ? { ...cliente, estado: "activo" as const } : cliente,
          )
        : estado.clientes,
  }));
  return () =>
    actualizarEstado((estado) => ({
      ...estado,
      oportunidades: anterior.oportunidades,
      actividades: estado.actividades.filter((actividad) => actividad.id !== nota.id),
      clientes: anterior.clientes,
    }));
}

export function crearOportunidad(datos: Pick<Oportunidad, "idCliente" | "titulo" | "idServicio" | "monto" | "fechaCierreEstimada" | "idVendedor">) {
  const hoy = fechaDeHoy();
  const oportunidad: Oportunidad = {
    ...datos,
    id: crearId("opo"),
    etapa: "prospecto",
    probabilidad: probabilidadPorEtapa.prospecto,
    fechaCreacion: hoy,
    fechaCierre: null,
    motivoPerdida: null,
    historialEtapas: [{ etapa: "prospecto", fecha: hoy }],
  };
  const nota: Actividad = {
    id: crearId("act"),
    idCliente: datos.idCliente,
    idOportunidad: oportunidad.id,
    tipo: "nota",
    fecha: hoy,
    descripcion: `Se registró la oportunidad: ${datos.titulo.toLowerCase()}.`,
    idAutor: datos.idVendedor,
  };
  actualizarEstado((estado) => ({
    ...estado,
    oportunidades: [...estado.oportunidades, oportunidad],
    actividades: [nota, ...estado.actividades],
  }));
  return oportunidad;
}

// --- Facturación (simulada) ---

function horaActual() {
  const ahora = new Date();
  return `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
}

// Emite una factura y registra su asiento (cuenta por cobrar, ingreso, IVA e IT).
export function emitirFactura(datos: {
  idCliente: string;
  idOportunidad: string | null;
  documentoCliente: string;
  razonSocialCliente: string;
  lineas: Omit<LineaFactura, "subtotal">[];
  idEmisor: string;
}) {
  const estadoActual = obtenerEstado();
  const numero = estadoActual.facturas.reduce((maximo, factura) => Math.max(maximo, factura.numero), 1200) + 1;
  const fecha = fechaDeHoy();
  const hora = horaActual();
  const lineas: LineaFactura[] = datos.lineas.map((linea) => ({ ...linea, subtotal: redondear(linea.cantidad * linea.precioUnitario) }));
  const total = totalDeLineas(lineas);
  const id = crearId("fac");
  const asiento = crearAsiento(
    asientoDeFactura({ idFactura: id, numeroFactura: numero, razonSocial: datos.razonSocialCliente, fecha, total }),
    estadoActual.asientos,
    fecha,
  );
  const factura: Factura = {
    id,
    numero,
    cuf: generarCuf(numero, fecha, hora),
    idCliente: datos.idCliente,
    idOportunidad: datos.idOportunidad,
    fecha,
    hora,
    documentoCliente: datos.documentoCliente,
    razonSocialCliente: datos.razonSocialCliente,
    lineas,
    total,
    estado: "vigente",
    fechaAnulacion: null,
    motivoAnulacion: null,
    idAsiento: asiento.id,
    idAsientoAnulacion: null,
    idEmisor: datos.idEmisor,
  };
  actualizarEstado((estado) => ({ ...estado, facturas: [...estado.facturas, factura], asientos: [...estado.asientos, asiento] }));
  return { factura, asiento };
}

// Anula una factura sin cobros: queda registrada como anulada y su asiento se revierte.
export function anularFactura(idFactura: string, motivo: string) {
  const estadoActual = obtenerEstado();
  const factura = estadoActual.facturas.find((item) => item.id === idFactura);
  const original = estadoActual.asientos.find((asiento) => asiento.id === factura?.idAsiento);
  if (!factura || !original || factura.estado === "anulada") throw new Error("La factura no se puede anular.");
  if (estadoActual.cobros.some((cobro) => cobro.idFactura === idFactura)) throw new Error("La factura tiene cobros registrados.");
  const fecha = fechaDeHoy();
  const reverso = crearAsiento(
    asientoDeAnulacion(original, {
      fecha,
      // Si la razón social termina en abreviatura ("S.R.L."), su punto cierra la frase.
      glosa: `Anulación de la factura N° ${factura.numero} a ${factura.razonSocialCliente}${factura.razonSocialCliente.endsWith(".") ? "" : "."} Motivo: ${motivo.toLowerCase()}`,
    }),
    estadoActual.asientos,
    fecha,
  );
  actualizarEstado((estado) => ({
    ...estado,
    facturas: estado.facturas.map((item) =>
      item.id === idFactura
        ? { ...item, estado: "anulada" as const, fechaAnulacion: fecha, motivoAnulacion: motivo, idAsientoAnulacion: reverso.id }
        : item,
    ),
    asientos: [...estado.asientos, reverso],
  }));
  return reverso;
}

export function registrarCobro(datos: { idFactura: string; fecha: string; monto: number; medio: MedioDeCobro }) {
  const estadoActual = obtenerEstado();
  const factura = estadoActual.facturas.find((item) => item.id === datos.idFactura);
  if (!factura || factura.estado === "anulada") throw new Error("La factura no admite cobros.");
  const id = crearId("cob");
  const asiento = crearAsiento(
    asientoDeCobro({
      idCobro: id,
      numeroFactura: factura.numero,
      razonSocial: factura.razonSocialCliente,
      fecha: datos.fecha,
      monto: datos.monto,
      medio: cuentaDelMedio(datos.medio),
    }),
    estadoActual.asientos,
    fechaDeHoy(),
  );
  const cobro: Cobro = { ...datos, id, monto: redondear(datos.monto), idAsiento: asiento.id };
  actualizarEstado((estado) => ({ ...estado, cobros: [...estado.cobros, cobro], asientos: [...estado.asientos, asiento] }));
  return { cobro, asiento };
}

// --- Configuración ---

export function cambiarModulo(modulo: ModuloOpcional, activo: boolean) {
  actualizarEstado((estado) => ({ ...estado, modulos: { ...estado.modulos, [modulo]: activo } }));
}

// --- Contabilidad ---

// Registra un asiento manual. crearAsiento lo valida y lo numera; si no cuadra,
// lanza un error con la lista de problemas.
export function registrarAsientoManual(datos: { fecha: string; glosa: string; lineas: LineaAsiento[] }) {
  const estadoActual = obtenerEstado();
  const asiento = crearAsiento({ ...datos, origen: "manual", idOrigen: null }, estadoActual.asientos, fechaDeHoy());
  actualizarEstado((estado) => ({ ...estado, asientos: [...estado.asientos, asiento] }));
  return asiento;
}

// --- Activos fijos ---

export function registrarDepreciacion(mes: string) {
  const estadoActual = obtenerEstado();
  if (estadoActual.depreciaciones.some((depreciacion) => depreciacion.mes === mes)) throw new Error("La depreciación de ese mes ya está registrada.");
  const calculo = calcularDepreciacionDelMes(estadoActual.activos, mes);
  const id = idDepreciacionDelMes(mes);
  const asiento = crearAsiento(
    asientoDeDepreciacion({ idDepreciacion: id, nombreMes: formatearNombreMesYAnio(mes), fecha: ultimoDiaDelMes(mes), porCategoria: calculo.porCategoria }),
    estadoActual.asientos,
    fechaDeHoy(),
  );
  const depreciacion: DepreciacionDelMes = { id, mes, fechaRegistro: fechaDeHoy(), montos: calculo.montos, idAsiento: asiento.id };
  actualizarEstado((estado) => ({
    ...estado,
    depreciaciones: [...estado.depreciaciones, depreciacion],
    asientos: [...estado.asientos, asiento],
  }));
  const deshacer = () =>
    actualizarEstado((estado) => ({
      ...estado,
      depreciaciones: estado.depreciaciones.filter((item) => item.id !== id),
      asientos: estado.asientos.filter((item) => item.id !== asiento.id),
    }));
  return { asiento, deshacer };
}

function agregarEvento(activo: Activo, evento: EventoActivo): Activo {
  return { ...activo, historial: [...activo.historial, evento] };
}

export function reasignarActivo(idActivo: string, idResponsable: string, ubicacion: string, detalle: string) {
  actualizarEstado((estado) => ({
    ...estado,
    activos: estado.activos.map((activo) =>
      activo.id === idActivo
        ? agregarEvento({ ...activo, idResponsable, ubicacion }, { fecha: fechaDeHoy(), tipo: "asignacion", detalle })
        : activo,
    ),
  }));
}

// Envía un activo a reparación o lo da por reparado.
export function cambiarEstadoReparacion(idActivo: string, enReparacion: boolean, detalle: string) {
  actualizarEstado((estado) => ({
    ...estado,
    activos: estado.activos.map((activo) =>
      activo.id === idActivo && activo.estado !== "baja"
        ? agregarEvento(
            { ...activo, estado: enReparacion ? "en_reparacion" : "en_uso" },
            { fecha: fechaDeHoy(), tipo: enReparacion ? "reparacion" : "retorno", detalle },
          )
        : activo,
    ),
  }));
}
