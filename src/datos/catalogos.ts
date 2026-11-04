import type {
  Area,
  Ciudad,
  EstadoCliente,
  EstadoSeguimiento,
  EstadoSolicitud,
  EtapaOportunidad,
  ModuloOpcional,
  OrigenAsiento,
  OrigenCliente,
  Rol,
  TipoActividad,
  TipoContrato,
  TipoCuenta,
  TipoMovimientoDiaLibre,
  TipoPermiso,
} from "./tipos.ts";

// Empresa de ejemplo. El nombre es provisional (decisión pendiente en el plan).
export const empresa = {
  nombre: "Empresa ADC",
  razonSocial: "Empresa ADC S.R.L.",
  nit: "1028457023",
  ciudad: "Cochabamba" as Ciudad,
  direccion: "Av. Ballivián 520, piso 3, Cochabamba",
  telefono: "4 452 8130",
  dominioCorreo: "empresaadc.com.bo",
  actividad: "Servicios empresariales",
} as const;

export const nombresRol: Record<Rol, string> = {
  gerente: "Gerente",
  administracion: "Administración",
  ventas: "Ventas",
};

export const descripcionesRol: Record<Rol, string> = {
  gerente: "Ve todo y aprueba vacaciones",
  administracion: "Recursos humanos, planilla, facturación, contabilidad y activos",
  ventas: "CRM, solo con sus clientes y seguimientos",
};

export const nombresModulo: Record<ModuloOpcional, string> = {
  facturacion: "Facturación",
};

// --- Personal ---

export const nombresArea: Record<Area, string> = {
  gerencia: "Gerencia",
  administracion: "Administración y finanzas",
  comercial: "Comercial",
  operaciones: "Operaciones",
};

export const nombresTipoContrato: Record<TipoContrato, string> = {
  indefinido: "Indefinido",
  plazo_fijo: "Plazo fijo",
};

export const nombresEstadoSolicitud: Record<EstadoSolicitud, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

export const nombresTipoMovimientoDiaLibre: Record<TipoMovimientoDiaLibre, string> = {
  ganado: "Ganado",
  usado: "Usado",
};

export const nombresTipoPermiso: Record<TipoPermiso, string> = {
  con_goce: "Con goce de haber",
  sin_goce: "Sin goce de haber",
};

// --- CRM ---

export const ciudades: Ciudad[] = ["Cochabamba", "La Paz", "Santa Cruz", "Sucre", "Tarija", "Oruro"];

export const nombresEstadoCliente: Record<EstadoCliente, string> = {
  prospecto: "Prospecto",
  activo: "Activo",
  inactivo: "Inactivo",
};

export const nombresOrigenCliente: Record<OrigenCliente, string> = {
  referido: "Referido",
  sitio_web: "Sitio web",
  feria: "Feria o evento",
  llamada: "Llamada en frío",
  redes_sociales: "Redes sociales",
};

export const nombresEtapa: Record<EtapaOportunidad, string> = {
  prospecto: "Prospecto",
  contactado: "Contactado",
  propuesta: "Propuesta enviada",
  negociacion: "Negociación",
  ganada: "Ganada",
  perdida: "Perdida",
};

export const etapas = Object.keys(nombresEtapa) as EtapaOportunidad[];

export const etapasAbiertas: EtapaOportunidad[] = ["prospecto", "contactado", "propuesta", "negociacion"];

// Probabilidad de cierre con la que entra una oportunidad a cada etapa.
export const probabilidadPorEtapa: Record<EtapaOportunidad, number> = {
  prospecto: 10,
  contactado: 25,
  propuesta: 50,
  negociacion: 75,
  ganada: 100,
  perdida: 0,
};

export const motivosPerdida = [
  "Eligió a otro proveedor",
  "Precio fuera de su presupuesto",
  "Postergó la decisión para la próxima gestión",
  "Dejó de responder",
  "Lo resolvió con su propio personal",
];

export const nombresTipoActividad: Record<TipoActividad, string> = {
  llamada: "Llamada",
  reunion: "Reunión",
  correo: "Correo",
  nota: "Nota",
};

export const nombresEstadoSeguimiento: Record<EstadoSeguimiento, string> = {
  pendiente: "Pendiente",
  realizado: "Realizado",
};

// Rubros de los clientes y los tipos de negocio con que se arman sus nombres.
export const rubros: { nombre: string; tiposDeNegocio: string[] }[] = [
  { nombre: "Comercio mayorista", tiposDeNegocio: ["Distribuidora", "Comercial", "Importadora"] },
  { nombre: "Salud", tiposDeNegocio: ["Clínica", "Centro Médico", "Laboratorio Clínico"] },
  { nombre: "Educación", tiposDeNegocio: ["Unidad Educativa Privada", "Instituto Técnico", "Centro de Formación"] },
  { nombre: "Construcción", tiposDeNegocio: ["Constructora", "Inmobiliaria y Constructora", "Ingeniería y Obras"] },
  { nombre: "Industria alimenticia", tiposDeNegocio: ["Industrias Alimenticias", "Lácteos", "Molinera"] },
  { nombre: "Transporte y logística", tiposDeNegocio: ["Transportes", "Logística", "Courier"] },
  { nombre: "Hotelería y turismo", tiposDeNegocio: ["Hotel", "Turismo", "Apart Hotel"] },
  { nombre: "Agroindustria", tiposDeNegocio: ["Agroindustrial", "Agropecuaria", "Semillas"] },
  { nombre: "Servicios financieros", tiposDeNegocio: ["Cooperativa de Ahorro y Crédito", "Financiera", "Corredora de Seguros"] },
  { nombre: "Tecnología", tiposDeNegocio: ["Sistemas", "Soluciones Digitales", "Tecnologías"] },
  { nombre: "Manufactura", tiposDeNegocio: ["Textiles", "Plásticos", "Metalmecánica"] },
];

// Lo que vende la empresa de ejemplo. Es genérico a propósito: cuando se
// confirme el rubro del cliente (decisión pendiente), se ajusta solo aquí.
export const servicios: { id: string; nombre: string; montoMinimo: number; montoMaximo: number }[] = [
  { id: "srv-anual", nombre: "Contrato anual de servicios", montoMinimo: 36000, montoMaximo: 120000 },
  { id: "srv-mensual", nombre: "Servicio mensual de mantenimiento", montoMinimo: 6000, montoMaximo: 24000 },
  { id: "srv-proyecto", nombre: "Proyecto de implementación", montoMinimo: 18000, montoMaximo: 75000 },
  { id: "srv-diagnostico", nombre: "Diagnóstico y consultoría", montoMinimo: 5000, montoMaximo: 20000 },
  { id: "srv-ampliacion", nombre: "Ampliación de contrato", montoMinimo: 10000, montoMaximo: 45000 },
  { id: "srv-capacitacion", nombre: "Capacitación al personal", montoMinimo: 3500, montoMaximo: 12000 },
];

export const nombreServicio = (idServicio: string) =>
  servicios.find((servicio) => servicio.id === idServicio)?.nombre ?? idServicio;

// Alarmas automáticas del CRM, además de los seguimientos que agenda cada
// vendedor. Los días se cuentan contra la fecha de la demo.
export const umbralesAlarmas = {
  // Oportunidad abierta sin ninguna actividad registrada en este tiempo.
  diasOportunidadSinActividad: 14,
  // Propuesta enviada sin respuesta (sin actividad desde que se envió).
  diasPropuestaSinRespuesta: 7,
  // Cliente activo sin ningún contacto en este tiempo.
  diasClienteActivoSinContacto: 30,
};

// --- Contabilidad ---

export const nombresTipoCuenta: Record<TipoCuenta, string> = {
  activo: "Activo",
  pasivo: "Pasivo",
  patrimonio: "Patrimonio",
  ingreso: "Ingresos",
  gasto: "Gastos",
};

export const nombresOrigenAsiento: Record<OrigenAsiento, string> = {
  apertura: "Apertura",
  manual: "Manual",
  factura: "Factura",
  anulacion_factura: "Anulación de factura",
  cobro: "Cobro",
  planilla: "Planilla",
  depreciacion: "Depreciación",
};
