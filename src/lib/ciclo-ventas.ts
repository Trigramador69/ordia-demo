import { etapasAbiertas } from "../datos/catalogos.ts";
import { diferenciaEnDias, mesDeFecha, sumarDias, sumarMesesAMes } from "../datos/fechas.ts";
import type { Actividad, Cliente, EtapaOportunidad, Oportunidad, Seguimiento } from "../datos/tipos.ts";
import { alarmasAutomaticas, esAbierta, montoPonderado } from "./crm.ts";

// Indicadores del control del ciclo de ventas, para un periodo que termina hoy.
// Funciones puras: reciben los datos y la fecha. Importa con extensión .ts
// porque también lo ejecuta Node.

export interface DatosCiclo {
  clientes: Cliente[];
  oportunidades: Oportunidad[];
  actividades: Actividad[];
  seguimientos: Seguimiento[];
}

const promedio = (valores: number[]) => (valores.length === 0 ? null : valores.reduce((suma, valor) => suma + valor, 0) / valores.length);

export function inicioDelPeriodo(hoy: string, meses: number) {
  return sumarDias(hoy, -Math.round(meses * 30.4));
}

// Monto abierto en cada etapa del embudo, hoy.
export function montoPorEtapa(oportunidades: Oportunidad[]) {
  return etapasAbiertas.map((etapa) => {
    const enEtapa = oportunidades.filter((oportunidad) => oportunidad.etapa === etapa);
    return {
      etapa,
      cantidad: enEtapa.length,
      monto: enEtapa.reduce((suma, oportunidad) => suma + oportunidad.monto, 0),
      ponderado: enEtapa.reduce((suma, oportunidad) => suma + montoPonderado(oportunidad), 0),
    };
  });
}

const recorrido: EtapaOportunidad[] = [...etapasAbiertas, "ganada"];

// De las oportunidades creadas en el periodo, cuántas llegaron a cada etapa y
// qué porcentaje pasó de una etapa a la siguiente.
export function conversionEntreEtapas(oportunidades: Oportunidad[], desde: string) {
  const creadas = oportunidades.filter((oportunidad) => oportunidad.fechaCreacion >= desde);
  const llegaron = recorrido.map((etapa) => ({
    etapa,
    cantidad: creadas.filter((oportunidad) => oportunidad.historialEtapas.some((cambio) => cambio.etapa === etapa)).length,
  }));
  return llegaron.map((item, indice) => ({
    ...item,
    desdeAnterior: indice === 0 || llegaron[indice - 1].cantidad === 0 ? null : (item.cantidad / llegaron[indice - 1].cantidad) * 100,
  }));
}

// Días que pasan las oportunidades en cada etapa, con los cambios del periodo.
export function diasPorEtapa(oportunidades: Oportunidad[], desde: string) {
  return etapasAbiertas.map((etapa) => {
    const duraciones: number[] = [];
    for (const oportunidad of oportunidades) {
      oportunidad.historialEtapas.forEach((cambio, indice) => {
        const siguiente = oportunidad.historialEtapas[indice + 1];
        if (cambio.etapa === etapa && siguiente && siguiente.fecha >= desde) duraciones.push(diferenciaEnDias(cambio.fecha, siguiente.fecha));
      });
    }
    return { etapa, dias: promedio(duraciones) };
  });
}

export function resultadosDelPeriodo(oportunidades: Oportunidad[], desde: string) {
  const cerradas = oportunidades.filter((oportunidad) => oportunidad.fechaCierre && oportunidad.fechaCierre >= desde);
  const ganadas = cerradas.filter((oportunidad) => oportunidad.etapa === "ganada");
  const perdidas = cerradas.filter((oportunidad) => oportunidad.etapa === "perdida");
  return {
    ganadas: ganadas.length,
    montoGanado: ganadas.reduce((suma, oportunidad) => suma + oportunidad.monto, 0),
    perdidas: perdidas.length,
    tasaDeCierre: cerradas.length === 0 ? null : (ganadas.length / cerradas.length) * 100,
    cicloPromedio: promedio(ganadas.map((oportunidad) => diferenciaEnDias(oportunidad.fechaCreacion, oportunidad.fechaCierre!))),
    ticketPromedio: promedio(ganadas.map((oportunidad) => oportunidad.monto)),
  };
}

// Ventas ganadas por mes, de los últimos `meses` meses (el actual incluido).
export function ventasPorMes(oportunidades: Oportunidad[], hoy: string, meses: number) {
  const mesActual = mesDeFecha(hoy);
  return Array.from({ length: meses }, (_, indice) => {
    const mes = sumarMesesAMes(mesActual, indice - meses + 1);
    const ganadas = oportunidades.filter((oportunidad) => oportunidad.etapa === "ganada" && oportunidad.fechaCierre?.startsWith(mes));
    return { mes, cantidad: ganadas.length, monto: ganadas.reduce((suma, oportunidad) => suma + oportunidad.monto, 0) };
  });
}

export function motivosDePerdida(oportunidades: Oportunidad[], desde: string) {
  const conteo = new Map<string, number>();
  for (const oportunidad of oportunidades) {
    if (oportunidad.etapa !== "perdida" || !oportunidad.fechaCierre || oportunidad.fechaCierre < desde) continue;
    const motivo = oportunidad.motivoPerdida ?? "Sin motivo";
    conteo.set(motivo, (conteo.get(motivo) ?? 0) + 1);
  }
  return [...conteo.entries()].map(([motivo, cantidad]) => ({ motivo, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
}

export function resultadosPorVendedor(datos: DatosCiclo, idsVendedores: string[], desde: string, hoy: string) {
  const alarmas = alarmasAutomaticas(datos, hoy);
  const hace30 = sumarDias(hoy, -30);
  return idsVendedores.map((idVendedor) => {
    const propias = datos.oportunidades.filter((oportunidad) => oportunidad.idVendedor === idVendedor);
    const abiertas = propias.filter(esAbierta);
    return {
      idVendedor,
      abiertas: abiertas.length,
      montoAbierto: abiertas.reduce((suma, oportunidad) => suma + oportunidad.monto, 0),
      ...resultadosDelPeriodo(propias, desde),
      actividades30Dias: datos.actividades.filter((actividad) => actividad.idAutor === idVendedor && actividad.fecha >= hace30).length,
      alarmas: alarmas.filter((alarma) => alarma.idResponsable === idVendedor).length,
      seguimientosVencidos: datos.seguimientos.filter(
        (seguimiento) => seguimiento.idResponsable === idVendedor && seguimiento.estado === "pendiente" && seguimiento.fecha < hoy,
      ).length,
    };
  });
}
