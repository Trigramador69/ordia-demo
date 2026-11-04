import { etapasAbiertas, umbralesAlarmas } from "../datos/catalogos.ts";
import { diferenciaEnDias, sumarDias } from "../datos/fechas.ts";
import type { Actividad, Cliente, Oportunidad, Seguimiento } from "../datos/tipos.ts";

// Lógica del CRM: última actividad, alarmas automáticas y en qué grupo cae
// cada seguimiento. Son funciones puras que reciben los datos y la fecha de
// hoy. Importa con extensión .ts porque también lo ejecuta Node.

export function esAbierta(oportunidad: Oportunidad) {
  return etapasAbiertas.includes(oportunidad.etapa);
}

// Fecha de la última actividad de cada oportunidad y de cada cliente.
export function ultimasActividades(actividades: Actividad[]) {
  const porOportunidad = new Map<string, string>();
  const porCliente = new Map<string, string>();
  for (const actividad of actividades) {
    if (actividad.idOportunidad && (porOportunidad.get(actividad.idOportunidad) ?? "") < actividad.fecha) {
      porOportunidad.set(actividad.idOportunidad, actividad.fecha);
    }
    if ((porCliente.get(actividad.idCliente) ?? "") < actividad.fecha) porCliente.set(actividad.idCliente, actividad.fecha);
  }
  return { porOportunidad, porCliente };
}

export type TipoAlarma = "oportunidad_sin_actividad" | "propuesta_sin_respuesta" | "cliente_sin_contacto";

export interface AlarmaAutomatica {
  tipo: TipoAlarma;
  idCliente: string;
  idOportunidad: string | null;
  idResponsable: string;
  // Fecha del último movimiento y días que pasaron desde entonces.
  desde: string | null;
  dias: number;
}

export const nombresAlarma: Record<TipoAlarma, string> = {
  oportunidad_sin_actividad: "Oportunidad sin actividad",
  propuesta_sin_respuesta: "Propuesta sin respuesta",
  cliente_sin_contacto: "Cliente activo sin contacto",
};

export function describirAlarma(alarma: AlarmaAutomatica) {
  const hace = alarma.desde === null ? "nunca" : `hace ${alarma.dias} ${alarma.dias === 1 ? "día" : "días"}`;
  switch (alarma.tipo) {
    case "oportunidad_sin_actividad":
      return `Última actividad ${hace} (más de ${umbralesAlarmas.diasOportunidadSinActividad} días).`;
    case "propuesta_sin_respuesta":
      return `Propuesta enviada sin respuesta: último movimiento ${hace}.`;
    case "cliente_sin_contacto":
      return `Último contacto ${hace} (más de ${umbralesAlarmas.diasClienteActivoSinContacto} días).`;
  }
}

// Alarmas que el sistema calcula solo, además de los seguimientos agendados:
// - una oportunidad abierta sin actividad hace más de N días;
// - una propuesta enviada sin respuesta (sin actividad desde hace más de M días);
// - un cliente activo sin ningún contacto en el último mes.
// Una propuesta estancada cuenta solo como "sin respuesta", para no repetirla.
export function alarmasAutomaticas(
  datos: { clientes: Cliente[]; oportunidades: Oportunidad[]; actividades: Actividad[] },
  hoy: string,
): AlarmaAutomatica[] {
  const { porOportunidad, porCliente } = ultimasActividades(datos.actividades);
  const alarmas: AlarmaAutomatica[] = [];
  const diasDesde = (fecha: string | undefined) => (fecha ? diferenciaEnDias(fecha, hoy) : Number.POSITIVE_INFINITY);

  for (const oportunidad of datos.oportunidades.filter(esAbierta)) {
    const ultima = porOportunidad.get(oportunidad.id) ?? oportunidad.historialEtapas.at(-1)?.fecha;
    const dias = diasDesde(ultima);
    const tipo: TipoAlarma | null =
      oportunidad.etapa === "propuesta"
        ? dias > umbralesAlarmas.diasPropuestaSinRespuesta
          ? "propuesta_sin_respuesta"
          : null
        : dias > umbralesAlarmas.diasOportunidadSinActividad
          ? "oportunidad_sin_actividad"
          : null;
    if (tipo) {
      alarmas.push({
        tipo,
        idCliente: oportunidad.idCliente,
        idOportunidad: oportunidad.id,
        idResponsable: oportunidad.idVendedor,
        desde: ultima ?? null,
        dias: Number.isFinite(dias) ? dias : 0,
      });
    }
  }

  for (const cliente of datos.clientes.filter((item) => item.estado === "activo")) {
    const ultima = porCliente.get(cliente.id);
    const dias = diasDesde(ultima);
    if (dias > umbralesAlarmas.diasClienteActivoSinContacto) {
      alarmas.push({
        tipo: "cliente_sin_contacto",
        idCliente: cliente.id,
        idOportunidad: null,
        idResponsable: cliente.idVendedor,
        desde: ultima ?? null,
        dias: Number.isFinite(dias) ? dias : 0,
      });
    }
  }

  return alarmas.sort((a, b) => b.dias - a.dias);
}

export type GrupoSeguimiento = "vencido" | "hoy" | "semana" | "proximo";

export const nombresGrupoSeguimiento: Record<GrupoSeguimiento, string> = {
  vencido: "Vencidos",
  hoy: "Para hoy",
  semana: "Próximos 7 días",
  proximo: "Más adelante",
};

export function grupoDeSeguimiento(seguimiento: Pick<Seguimiento, "fecha">, hoy: string): GrupoSeguimiento {
  if (seguimiento.fecha < hoy) return "vencido";
  if (seguimiento.fecha === hoy) return "hoy";
  if (seguimiento.fecha <= sumarDias(hoy, 7)) return "semana";
  return "proximo";
}

// Próximo seguimiento pendiente de cada cliente (el más cercano en fecha).
export function proximoSeguimientoPorCliente(seguimientos: Seguimiento[]) {
  const proximo = new Map<string, Seguimiento>();
  for (const seguimiento of seguimientos) {
    if (seguimiento.estado !== "pendiente") continue;
    const actual = proximo.get(seguimiento.idCliente);
    if (!actual || seguimiento.fecha < actual.fecha) proximo.set(seguimiento.idCliente, seguimiento);
  }
  return proximo;
}

// Monto ponderado: el monto por la probabilidad de cierre.
export function montoPonderado(oportunidad: Oportunidad) {
  return (oportunidad.monto * oportunidad.probabilidad) / 100;
}
