import { crearAsiento, type BorradorAsiento } from "../lib/contabilidad.ts";
import { borradorAsientoPlanilla, calcularPlanillaDelMes, idPlanillaDelMes } from "../lib/planilla.ts";
import { crearAleatorio } from "./aleatorio.ts";
import { generarAusencias } from "./ausencias.ts";
import { generarAsientosManuales, mesesDeHistoria } from "./contabilidad-inicial.ts";
import { generarCrm } from "./crm.ts";
import { generarFacturacion } from "./facturacion-inicial.ts";
import { generarEquipo, idsVendedores, personaPorRol } from "./equipo.ts";
import { fechaDeHoy, mesDeFecha, sumarDias, sumarMesesAMes, ultimoDiaDelMes } from "./fechas.ts";
import { diaHabilDesde } from "./feriados.ts";
import { crearGeneradorIdentidades } from "./identidades.ts";
import type { Asiento, Cobro, EstadoDemo, Factura, PlanillaCerrada } from "./tipos.ts";

// Cambiar esta versión descarta lo guardado en los navegadores y vuelve a la semilla.
export const versionEstadoDemo = 5;

// Cada parte usa su propia semilla para que un cambio en una no altere las demás.
// Las fechas salen de `hoy`: con la misma fecha, los datos salen idénticos.
const semillas = {
  identidades: 20261104,
  equipo: 1101,
  crm: 1102,
  contabilidad: 1103,
  facturacion: 1104,
};

// Numera los asientos en orden de fecha, como en un libro diario.
export function numerarAsientos(borradores: BorradorAsiento[], hoy: string): Asiento[] {
  const ordenados = [...borradores].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const asientos: Asiento[] = [];
  for (const borrador of ordenados) asientos.push(crearAsiento(borrador, asientos, borrador.fecha <= hoy ? borrador.fecha : hoy));
  return asientos;
}

export function crearEstadoInicial(hoy: string = fechaDeHoy()): EstadoDemo {
  const crearIdentidad = crearGeneradorIdentidades(crearAleatorio(semillas.identidades));
  const personas = generarEquipo(crearAleatorio(semillas.equipo), crearIdentidad, hoy);
  const ausencias = generarAusencias(personas, hoy);
  const crm = generarCrm(crearAleatorio(semillas.crm), crearIdentidad, hoy, idsVendedores);

  // Planillas de los meses anteriores, ya cerradas; la del mes en curso queda
  // por cerrar. Cada una se cerró el primer día hábil del mes siguiente.
  const mesActual = mesDeFecha(hoy);
  const planillasSinAsiento: Omit<PlanillaCerrada, "idAsiento">[] = [];
  for (let desfase = mesesDeHistoria; desfase >= 1; desfase--) {
    const mes = sumarMesesAMes(mesActual, -desfase);
    const cierre = diaHabilDesde(sumarDias(ultimoDiaDelMes(mes), 1));
    planillasSinAsiento.push({
      id: idPlanillaDelMes(mes),
      mes,
      fechaCierre: cierre < hoy ? cierre : hoy,
      idCerradoPor: personaPorRol.administracion,
      filas: calcularPlanillaDelMes(personas, ausencias.permisos, mes),
    });
  }

  const facturacion = generarFacturacion(crearAleatorio(semillas.facturacion), crm, hoy, personaPorRol.administracion);

  const asientos = numerarAsientos(
    [
      ...generarAsientosManuales(crearAleatorio(semillas.contabilidad), hoy),
      ...planillasSinAsiento.map((planilla) => borradorAsientoPlanilla(planilla.mes, planilla.filas)),
      ...facturacion.borradores,
    ],
    hoy,
  );
  const idAsientoDe = (origen: Asiento["origen"], idOrigen: string) =>
    asientos.find((asiento) => asiento.origen === origen && asiento.idOrigen === idOrigen)?.id ?? null;
  const facturas: Factura[] = facturacion.facturas.map((factura) => ({
    ...factura,
    idAsiento: idAsientoDe("factura", factura.id)!,
    idAsientoAnulacion: factura.estado === "anulada" ? idAsientoDe("anulacion_factura", factura.id) : null,
  }));
  const cobros: Cobro[] = facturacion.cobros.map((cobro) => ({ ...cobro, idAsiento: idAsientoDe("cobro", cobro.id)! }));
  const planillas: PlanillaCerrada[] = planillasSinAsiento.map((planilla) => ({
    ...planilla,
    idAsiento: asientos.find((asiento) => asiento.origen === "planilla" && asiento.idOrigen === planilla.id)!.id,
  }));

  return {
    version: versionEstadoDemo,
    fechaBase: hoy,
    rol: "gerente",
    modulos: { facturacion: true },
    personas,
    ...ausencias,
    planillas,
    ...crm,
    facturas,
    cobros,
    asientos,
  };
}
