import { etapasAbiertas } from "@/datos/catalogos";
import { personaPorRol } from "@/datos/equipo";
import { mesDeFecha } from "@/datos/fechas";
import type { Cliente, EstadoDemo, FilaPlanilla, Oportunidad, PlanillaCerrada, Seguimiento } from "@/datos/tipos";
import { alarmasAutomaticas } from "@/lib/crm";
import { situacionDeFactura } from "@/lib/facturacion";
import { calcularPlanillaDelMes, totalesPlanilla } from "@/lib/planilla";

// Consultas derivadas del estado de la demo. Son funciones puras: las pantallas
// las llaman con el estado actual y React Compiler se encarga de memorizarlas.

export function personaPorId(estado: EstadoDemo, idPersona: string) {
  return estado.personas.find((persona) => persona.id === idPersona);
}

// --- Recursos humanos ---

export type TipoAusenciaDelDia = "vacacion" | "permiso_con_goce" | "permiso_sin_goce" | "dia_libre";

export interface AusenciaDelDia {
  tipo: TipoAusenciaDelDia;
  detalle: string;
}

// Por qué una persona no está en la oficina en una fecha (o null si está).
// Lo usan la lista de personal, la ficha y el calendario del equipo.
export function ausenciaEnFecha(estado: EstadoDemo, idPersona: string, fecha: string): AusenciaDelDia | null {
  const vacacion = estado.solicitudesVacacion.find(
    (solicitud) => solicitud.idPersona === idPersona && solicitud.estado === "aprobada" && solicitud.desde <= fecha && solicitud.hasta >= fecha,
  );
  if (vacacion) return { tipo: "vacacion", detalle: vacacion.comentario || "Vacación" };
  const permiso = estado.permisos.find((item) => item.idPersona === idPersona && item.desde <= fecha && item.hasta >= fecha);
  if (permiso) return { tipo: permiso.tipo === "con_goce" ? "permiso_con_goce" : "permiso_sin_goce", detalle: permiso.motivo };
  const diaLibre = estado.movimientosDiasLibres.find(
    (movimiento) => movimiento.idPersona === idPersona && movimiento.tipo === "usado" && movimiento.fecha === fecha,
  );
  if (diaLibre) return { tipo: "dia_libre", detalle: diaLibre.motivo };
  return null;
}

// Vacación aprobada que la persona está gozando hoy, si la hay.
export function vacacionEnCurso(estado: EstadoDemo, idPersona: string, hoy: string) {
  return estado.solicitudesVacacion.find(
    (solicitud) => solicitud.idPersona === idPersona && solicitud.estado === "aprobada" && solicitud.desde <= hoy && solicitud.hasta >= hoy,
  );
}

// --- CRM ---

// El rol Ventas solo ve lo suyo: sus clientes, oportunidades y seguimientos.
export function idVendedorDelRol(estado: EstadoDemo) {
  return estado.rol === "ventas" ? personaPorRol.ventas : null;
}

export function clientesVisibles(estado: EstadoDemo): Cliente[] {
  const idVendedor = idVendedorDelRol(estado);
  return idVendedor ? estado.clientes.filter((cliente) => cliente.idVendedor === idVendedor) : estado.clientes;
}

export function oportunidadesVisibles(estado: EstadoDemo): Oportunidad[] {
  const idVendedor = idVendedorDelRol(estado);
  return idVendedor ? estado.oportunidades.filter((oportunidad) => oportunidad.idVendedor === idVendedor) : estado.oportunidades;
}

export function oportunidadesAbiertas(oportunidades: Oportunidad[]) {
  return oportunidades.filter((oportunidad) => etapasAbiertas.includes(oportunidad.etapa));
}

export function seguimientosPendientes(estado: EstadoDemo): Seguimiento[] {
  const idVendedor = idVendedorDelRol(estado);
  return estado.seguimientos
    .filter((seguimiento) => seguimiento.estado === "pendiente")
    .filter((seguimiento) => !idVendedor || seguimiento.idResponsable === idVendedor)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function clientePorId(estado: EstadoDemo, idCliente: string) {
  return estado.clientes.find((cliente) => cliente.id === idCliente);
}

// --- Planilla ---

export interface PlanillaDelMes {
  mes: string;
  // null mientras el mes sigue abierto: las filas se calculan con los datos de hoy.
  cerrada: PlanillaCerrada | null;
  filas: FilaPlanilla[];
  totales: ReturnType<typeof totalesPlanilla>;
}

export function planillaDelMes(estado: EstadoDemo, mes: string): PlanillaDelMes {
  const cerrada = estado.planillas.find((planilla) => planilla.mes === mes) ?? null;
  const filas = cerrada ? cerrada.filas : calcularPlanillaDelMes(estado.personas, estado.permisos, mes);
  return { mes, cerrada, filas, totales: totalesPlanilla(filas) };
}

// Meses con planilla: el en curso (cerrado o no) y los cerrados, del más reciente al más antiguo.
export function mesesConPlanilla(estado: EstadoDemo, hoy: string) {
  const meses = new Set([mesDeFecha(hoy), ...estado.planillas.map((planilla) => planilla.mes)]);
  return [...meses].sort((a, b) => b.localeCompare(a));
}

export function asientoPorId(estado: EstadoDemo, idAsiento: string) {
  return estado.asientos.find((asiento) => asiento.id === idAsiento);
}

// --- CRM: alarmas y fichas ---

// Alarmas automáticas que ve el rol actual (Ventas, solo las suyas).
export function alarmasVisibles(estado: EstadoDemo, hoy: string) {
  const idVendedor = idVendedorDelRol(estado);
  return alarmasAutomaticas(estado, hoy).filter((alarma) => !idVendedor || alarma.idResponsable === idVendedor);
}

// Lo que avisa la campana: seguimientos vencidos y de hoy, más las alarmas automáticas.
export function avisosPendientes(estado: EstadoDemo, hoy: string) {
  const seguimientos = seguimientosPendientes(estado).filter((seguimiento) => seguimiento.fecha <= hoy);
  const alarmas = alarmasVisibles(estado, hoy);
  return { seguimientos, alarmas, total: seguimientos.length + alarmas.length };
}

export function contactoPrincipal(estado: EstadoDemo, idCliente: string) {
  const contactos = estado.contactos.filter((contacto) => contacto.idCliente === idCliente);
  return contactos.find((contacto) => contacto.principal) ?? contactos[0];
}

export function oportunidadPorId(estado: EstadoDemo, idOportunidad: string) {
  return estado.oportunidades.find((oportunidad) => oportunidad.id === idOportunidad);
}

// Ventas solo abre las fichas de sus propios clientes.
export function puedeVerCliente(estado: EstadoDemo, cliente: Cliente) {
  const idVendedor = idVendedorDelRol(estado);
  return !idVendedor || cliente.idVendedor === idVendedor;
}

// --- Facturación ---

export function facturaPorId(estado: EstadoDemo, idFactura: string) {
  return estado.facturas.find((factura) => factura.id === idFactura);
}

// Factura vigente de una oportunidad, si ya se facturó.
export function facturaDeOportunidad(estado: EstadoDemo, idOportunidad: string) {
  return estado.facturas.find((factura) => factura.idOportunidad === idOportunidad && factura.estado === "vigente");
}

export function cobrosDeFactura(estado: EstadoDemo, idFactura: string) {
  return estado.cobros.filter((cobro) => cobro.idFactura === idFactura).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// Facturas con su situación de cobro, de la más reciente a la más antigua.
export function facturasConSituacion(estado: EstadoDemo, idCliente?: string) {
  return estado.facturas
    .filter((factura) => !idCliente || factura.idCliente === idCliente)
    .map((factura) => ({ factura, ...situacionDeFactura(factura, estado.cobros) }))
    .sort((a, b) => b.factura.numero - a.factura.numero);
}

export function saldoPorCobrarDeCliente(estado: EstadoDemo, idCliente: string) {
  return facturasConSituacion(estado, idCliente).reduce((suma, item) => suma + item.saldo, 0);
}
