// Tipos del modelo de datos de la demo. Las fechas van como texto ISO
// ("2026-11-04") y los meses como "2026-11", para que se guarden tal cual en el
// navegador y se comparen sin problemas de zona horaria.

export type Ciudad = "Cochabamba" | "La Paz" | "Santa Cruz" | "Sucre" | "Tarija" | "Oruro";

export type Rol = "gerente" | "administracion" | "ventas";

export type ModuloOpcional = "facturacion";

// --- Personal ---

export type Area = "gerencia" | "administracion" | "comercial" | "operaciones";

export type TipoContrato = "indefinido" | "plazo_fijo";

export interface Persona {
  id: string;
  nombres: string;
  apellidos: string;
  carnetIdentidad: string;
  fechaNacimiento: string;
  telefono: string;
  correoPersonal: string;
  correoLaboral: string;
  direccion: string;
  contactoEmergencia: string;
  cargo: string;
  area: Area;
  fechaIngreso: string;
  tipoContrato: TipoContrato;
  fechaFinContrato: string | null;
  // Haber básico mensual, en bolivianos.
  sueldoBasico: number;
  cuentaBancaria: string;
}

export type EstadoSolicitud = "pendiente" | "aprobada" | "rechazada";

export interface SolicitudVacacion {
  id: string;
  idPersona: string;
  desde: string;
  hasta: string;
  // Días hábiles dentro del rango: sin fines de semana ni feriados.
  diasHabiles: number;
  comentario: string;
  estado: EstadoSolicitud;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  idResolutor: string | null;
  motivoRechazo: string | null;
}

// Un día libre se gana al trabajar un feriado o un fin de semana, y se usa
// como un día de descanso. El saldo es lo ganado menos lo usado.
export type TipoMovimientoDiaLibre = "ganado" | "usado";

export interface MovimientoDiaLibre {
  id: string;
  idPersona: string;
  tipo: TipoMovimientoDiaLibre;
  fecha: string;
  dias: number;
  motivo: string;
}

export type TipoPermiso = "con_goce" | "sin_goce";

export interface Permiso {
  id: string;
  idPersona: string;
  tipo: TipoPermiso;
  desde: string;
  hasta: string;
  diasHabiles: number;
  motivo: string;
  fechaRegistro: string;
}

// --- Planilla ---

// Una persona en la planilla de un mes. Lleva una copia de sus datos para que
// la boleta de un mes cerrado no cambie si después cambia el cargo o el sueldo.
export interface FilaPlanilla {
  idPersona: string;
  nombreCompleto: string;
  carnetIdentidad: string;
  cargo: string;
  fechaIngreso: string;
  cuentaBancaria: string;
  aniosServicio: number;
  haberBasico: number;
  diasSinGoce: number;
  // Días del mes anteriores a la fecha de ingreso (si entró en ese mes).
  diasAntesDelIngreso: number;
  diasPagados: number;
  // Descuento por los días no pagados: sin goce de haber o antes del ingreso.
  descuentoDiasNoPagados: number;
  haberBasicoGanado: number;
  porcentajeBono: number;
  bonoAntiguedad: number;
  totalGanado: number;
  aporteLaboral: number;
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

// Planilla cerrada: queda fija con sus filas y el asiento que generó.
export interface PlanillaCerrada {
  id: string;
  // "2026-10"
  mes: string;
  fechaCierre: string;
  idCerradoPor: string;
  filas: FilaPlanilla[];
  idAsiento: string;
}

// --- CRM ---

export type EstadoCliente = "prospecto" | "activo" | "inactivo";

export type OrigenCliente = "referido" | "sitio_web" | "feria" | "llamada" | "redes_sociales";

export interface Cliente {
  id: string;
  razonSocial: string;
  nit: string;
  rubro: string;
  ciudad: Ciudad;
  direccion: string;
  telefono: string;
  // Persona del equipo comercial a cargo de la cuenta.
  idVendedor: string;
  estado: EstadoCliente;
  origen: OrigenCliente;
  fechaAlta: string;
}

export interface Contacto {
  id: string;
  idCliente: string;
  nombre: string;
  cargo: string;
  telefono: string;
  correo: string;
  principal: boolean;
}

export type EtapaOportunidad =
  | "prospecto"
  | "contactado"
  | "propuesta"
  | "negociacion"
  | "ganada"
  | "perdida";

export interface CambioEtapa {
  etapa: EtapaOportunidad;
  fecha: string;
}

export interface Oportunidad {
  id: string;
  idCliente: string;
  titulo: string;
  idServicio: string;
  monto: number;
  etapa: EtapaOportunidad;
  // Porcentaje de 0 a 100. Arranca con el de la etapa y se puede ajustar.
  probabilidad: number;
  idVendedor: string;
  fechaCreacion: string;
  fechaCierreEstimada: string;
  fechaCierre: string | null;
  motivoPerdida: string | null;
  // Etapas por las que pasó, en orden. Sirve para medir conversión y duración.
  historialEtapas: CambioEtapa[];
}

export type TipoActividad = "llamada" | "reunion" | "correo" | "nota";

export interface Actividad {
  id: string;
  idCliente: string;
  idOportunidad: string | null;
  tipo: TipoActividad;
  fecha: string;
  descripcion: string;
  idAutor: string;
}

export type EstadoSeguimiento = "pendiente" | "realizado";

// Seguimiento que agenda un vendedor. Es la alarma "manual" del CRM; las
// automáticas se calculan a partir de las actividades y las oportunidades.
export interface Seguimiento {
  id: string;
  idCliente: string;
  idOportunidad: string | null;
  fecha: string;
  motivo: string;
  idResponsable: string;
  estado: EstadoSeguimiento;
  fechaRealizado: string | null;
  idActividad: string | null;
}

// --- Contabilidad ---

export type TipoCuenta = "activo" | "pasivo" | "patrimonio" | "ingreso" | "gasto";

export interface Cuenta {
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  // 1 = grupo (Activo), 2 = subgrupo, 3 = rubro, 4 = cuenta de movimiento.
  nivel: number;
  // Solo las cuentas de movimiento reciben asientos; las demás agrupan.
  imputable: boolean;
  // Cuenta regularizadora: resta dentro de su grupo (por ejemplo, la
  // depreciación acumulada dentro del activo).
  regularizadora?: boolean;
}

export type OrigenAsiento =
  | "apertura"
  | "manual"
  | "factura"
  | "anulacion_factura"
  | "cobro"
  | "planilla"
  | "depreciacion";

export interface LineaAsiento {
  codigoCuenta: string;
  debe: number;
  haber: number;
  detalle?: string;
}

export interface Asiento {
  id: string;
  numero: number;
  fecha: string;
  glosa: string;
  origen: OrigenAsiento;
  // Documento que lo generó (factura, cobro, planilla de un mes, depreciación
  // de un mes). Los asientos manuales y el de apertura no tienen.
  idOrigen: string | null;
  lineas: LineaAsiento[];
  fechaRegistro: string;
}

// --- Estado completo de la demo ---

export interface EstadoDemo {
  version: number;
  // Día en que se generaron los datos. Si la demo se abre otro día, se vuelve
  // a generar para que las fechas sigan siendo relativas a hoy.
  fechaBase: string;
  rol: Rol;
  modulos: Record<ModuloOpcional, boolean>;
  personas: Persona[];
  solicitudesVacacion: SolicitudVacacion[];
  movimientosDiasLibres: MovimientoDiaLibre[];
  permisos: Permiso[];
  planillas: PlanillaCerrada[];
  clientes: Cliente[];
  contactos: Contacto[];
  oportunidades: Oportunidad[];
  actividades: Actividad[];
  seguimientos: Seguimiento[];
  asientos: Asiento[];
}
