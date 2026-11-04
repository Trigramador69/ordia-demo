import { idPersona } from "./equipo.ts";
import { sumarDias, sumarMeses } from "./fechas.ts";
import { diaHabilDesde } from "./feriados.ts";
import type { Activo, CategoriaActivo, EventoActivo, Persona } from "./tipos.ts";

// Activos fijos de la empresa de ejemplo, con fechas relativas a `hoy`. Para
// la presentación hay: una computadora ya totalmente depreciada y en uso, una
// impresora en reparación, una laptop dada de baja, una camioneta, y dos
// compras recientes que entran a la contabilidad del periodo.

interface DefinicionActivo {
  nombre: string;
  categoria: CategoriaActivo;
  // Meses antes de hoy en que se compró.
  mesesAtras: number;
  valor: number;
  responsable: number;
  ubicacion: string;
  enReparacion?: string;
  baja?: { mesesAtras: number; motivo: string };
}

const definiciones: DefinicionActivo[] = [
  { nombre: "Laptop 14 pulgadas, gerencia", categoria: "computacion", mesesAtras: 22, valor: 9800, responsable: 1, ubicacion: "Gerencia" },
  { nombre: "Laptop 14 pulgadas, administración", categoria: "computacion", mesesAtras: 30, valor: 8200, responsable: 2, ubicacion: "Administración" },
  { nombre: "Computadora de escritorio, contabilidad", categoria: "computacion", mesesAtras: 60, valor: 7400, responsable: 3, ubicacion: "Administración" },
  { nombre: "Laptop 15 pulgadas, contabilidad", categoria: "computacion", mesesAtras: 2, valor: 8900, responsable: 3, ubicacion: "Administración" },
  { nombre: "Laptop 14 pulgadas, asistente", categoria: "computacion", mesesAtras: 8, valor: 6500, responsable: 4, ubicacion: "Administración" },
  { nombre: "Laptop 14 pulgadas, jefatura comercial", categoria: "computacion", mesesAtras: 34, valor: 8600, responsable: 5, ubicacion: "Área comercial" },
  { nombre: "Laptop 14 pulgadas, ventas", categoria: "computacion", mesesAtras: 26, valor: 7200, responsable: 6, ubicacion: "Área comercial" },
  { nombre: "Laptop 14 pulgadas, ventas", categoria: "computacion", mesesAtras: 17, valor: 7300, responsable: 7, ubicacion: "Área comercial" },
  { nombre: "Laptop 14 pulgadas, ventas", categoria: "computacion", mesesAtras: 37, valor: 7100, responsable: 8, ubicacion: "Área comercial" },
  { nombre: "Laptop 15 pulgadas, operaciones", categoria: "computacion", mesesAtras: 32, valor: 8400, responsable: 9, ubicacion: "Operaciones" },
  { nombre: "Laptop 14 pulgadas, operaciones", categoria: "computacion", mesesAtras: 20, valor: 6900, responsable: 10, ubicacion: "Operaciones" },
  {
    nombre: "Laptop 13 pulgadas, ventas",
    categoria: "computacion",
    mesesAtras: 54,
    valor: 6800,
    responsable: 5,
    ubicacion: "Depósito",
    baja: { mesesAtras: 9, motivo: "Placa madre dañada: la reparación costaba más que reemplazarla" },
  },
  { nombre: "Servidor de archivos", categoria: "computacion", mesesAtras: 28, valor: 12500, responsable: 9, ubicacion: "Operaciones" },
  { nombre: "Proyector para la sala de reuniones", categoria: "equipos_oficina", mesesAtras: 4, valor: 5600, responsable: 5, ubicacion: "Sala de reuniones" },
  {
    nombre: "Impresora multifuncional",
    categoria: "equipos_oficina",
    mesesAtras: 40,
    valor: 9600,
    responsable: 4,
    ubicacion: "Administración",
    enReparacion: "Atasco recurrente del alimentador de hojas; en el servicio técnico",
  },
  { nombre: "Central telefónica", categoria: "equipos_oficina", mesesAtras: 70, valor: 11800, responsable: 2, ubicacion: "Recepción" },
  { nombre: "Aire acondicionado de la sala de reuniones", categoria: "equipos_oficina", mesesAtras: 46, valor: 8700, responsable: 2, ubicacion: "Sala de reuniones" },
  { nombre: "Sistema de cámaras de seguridad", categoria: "equipos_oficina", mesesAtras: 52, valor: 7900, responsable: 9, ubicacion: "Oficina" },
  { nombre: "Escritorio ejecutivo", categoria: "muebles", mesesAtras: 120, valor: 6200, responsable: 1, ubicacion: "Gerencia" },
  { nombre: "Mesa de reuniones para 10 personas", categoria: "muebles", mesesAtras: 84, valor: 9400, responsable: 2, ubicacion: "Sala de reuniones" },
  { nombre: "Escritorios operativos (8)", categoria: "muebles", mesesAtras: 66, valor: 16800, responsable: 2, ubicacion: "Oficina" },
  { nombre: "Sillas ergonómicas (12)", categoria: "muebles", mesesAtras: 38, valor: 14400, responsable: 2, ubicacion: "Oficina" },
  { nombre: "Archiveros metálicos (4)", categoria: "muebles", mesesAtras: 96, valor: 5200, responsable: 3, ubicacion: "Administración" },
  { nombre: "Mueble de recepción", categoria: "muebles", mesesAtras: 72, valor: 7800, responsable: 4, ubicacion: "Recepción" },
  { nombre: "Camioneta doble cabina", categoria: "vehiculos", mesesAtras: 31, valor: 245000, responsable: 9, ubicacion: "Parqueo de la oficina" },
];

export function generarActivos(personas: Persona[], hoy: string): Activo[] {
  const nombreDe = (numero: number) => {
    const persona = personas.find((item) => item.id === idPersona(numero));
    return persona ? `${persona.nombres.split(" ")[0]} ${persona.apellidos.split(" ")[0]}` : "";
  };

  return definiciones.map((definicion, indice) => {
    const fechaCompra = diaHabilDesde(sumarDias(sumarMeses(hoy, -definicion.mesesAtras), -((indice * 7) % 20)));
    const historial: EventoActivo[] = [
      { fecha: fechaCompra, tipo: "compra", detalle: `Compra por Bs ${definicion.valor.toLocaleString("es-BO")}` },
      { fecha: fechaCompra, tipo: "asignacion", detalle: `Asignado a ${nombreDe(definicion.responsable)} · ${definicion.ubicacion}` },
    ];
    let fechaBaja: string | null = null;
    if (definicion.baja) {
      fechaBaja = diaHabilDesde(sumarMeses(hoy, -definicion.baja.mesesAtras));
      historial.push({ fecha: sumarDias(fechaBaja, -12), tipo: "reparacion", detalle: "Enviada al servicio técnico: no enciende" });
      historial.push({ fecha: fechaBaja, tipo: "baja", detalle: definicion.baja.motivo });
    }
    if (definicion.enReparacion) {
      historial.push({ fecha: sumarDias(hoy, -5), tipo: "reparacion", detalle: definicion.enReparacion });
    }
    return {
      id: `af-${String(indice + 1).padStart(3, "0")}`,
      codigo: `AF-${String(indice + 1).padStart(3, "0")}`,
      nombre: definicion.nombre,
      categoria: definicion.categoria,
      fechaCompra,
      valorCompra: definicion.valor,
      idResponsable: idPersona(definicion.responsable),
      ubicacion: definicion.ubicacion,
      estado: definicion.baja ? "baja" : definicion.enReparacion ? "en_reparacion" : "en_uso",
      fechaBaja,
      historial,
    };
  });
}
