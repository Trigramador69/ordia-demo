import { asientoDeAnulacion, asientoDeCobro, asientoDeFactura, type BorradorAsiento } from "../lib/contabilidad.ts";
import { cuentaDelMedio, generarCuf } from "../lib/facturacion.ts";
import type { Aleatorio } from "./aleatorio.ts";
import { formatearNombreMesYAnio } from "./meses.ts";
import { diferenciaEnDias, mesDeFecha, primerDiaDelMes, sumarDias, sumarMesesAMes } from "./fechas.ts";
import { diaHabilDesde } from "./feriados.ts";
import type { Cliente, Cobro, Factura, MedioDeCobro, Oportunidad } from "./tipos.ts";

// Facturas de los últimos 3 meses, con sus cobros y asientos: las ventas
// ganadas en el CRM y las cuotas mensuales de los clientes con contrato. Para la presentación quedan: una factura anulada y
// reemitida, algunas por cobrar (una ya vencida), una cobrada en parte y la
// venta ganada más reciente sin facturar, para emitirla en vivo.

const primerNumeroDeFactura = 1201;
// Una factura se considera vencida si no se cobra en este plazo.
export const diasDeCredito = 30;

// Clientes que pagan una cuota mensual por su contrato de servicio.
const clientesConCuotaMensual = 12;

interface Emision {
  fecha: string;
  idCliente: string;
  idOportunidad: string | null;
  descripcion: string;
  monto: number;
  // Orden de la venta nueva entre las del periodo; null para una cuota mensual.
  indiceVenta: number | null;
}

export interface FacturacionGenerada {
  facturas: Omit<Factura, "idAsiento" | "idAsientoAnulacion">[];
  cobros: Omit<Cobro, "idAsiento">[];
  borradores: BorradorAsiento[];
}

export function generarFacturacion(
  aleatorio: Aleatorio,
  datos: { clientes: Cliente[]; oportunidades: Oportunidad[] },
  hoy: string,
  idEmisor: string,
): FacturacionGenerada {
  const facturas: FacturacionGenerada["facturas"] = [];
  const cobros: FacturacionGenerada["cobros"] = [];
  const borradores: BorradorAsiento[] = [];
  const clientePorId = new Map(datos.clientes.map((cliente) => [cliente.id, cliente]));
  const mesActual = mesDeFecha(hoy);
  const desde = primerDiaDelMes(sumarMesesAMes(mesActual, -2));

  // 1. Ventas nuevas: las oportunidades ganadas en el periodo. La más reciente
  //    queda sin facturar, para emitirla durante la demo.
  const ganadas = datos.oportunidades
    .filter((oportunidad) => oportunidad.etapa === "ganada" && oportunidad.fechaCierre && oportunidad.fechaCierre >= desde)
    .sort((a, b) => a.fechaCierre!.localeCompare(b.fechaCierre!) || a.id.localeCompare(b.id));
  const emisiones: Emision[] = ganadas.slice(0, -1).map((oportunidad, indiceVenta) => {
    const fecha = diaHabilDesde(oportunidad.fechaCierre!);
    return {
      fecha: fecha > hoy ? oportunidad.fechaCierre! : fecha,
      idCliente: oportunidad.idCliente,
      idOportunidad: oportunidad.id,
      descripcion: oportunidad.titulo,
      monto: oportunidad.monto,
      indiceVenta,
    };
  });

  // 2. Cuotas mensuales de los clientes con contrato de servicio, el día 5 de cada mes.
  const conContrato = aleatorio.elegirVarios(
    datos.clientes.filter((cliente) => cliente.estado === "activo").sort((a, b) => a.id.localeCompare(b.id)),
    clientesConCuotaMensual,
  );
  const cuotas = new Map(conContrato.map((cliente) => [cliente.id, aleatorio.entero(35, 95) * 100]));
  for (let desfase = 2; desfase >= 0; desfase--) {
    const mes = sumarMesesAMes(mesActual, -desfase);
    const fecha = diaHabilDesde(`${mes}-05`);
    if (fecha > hoy) continue;
    for (const cliente of conContrato) {
      emisiones.push({
        fecha,
        idCliente: cliente.id,
        idOportunidad: null,
        descripcion: `Servicio mensual de ${formatearNombreMesYAnio(mes)}`,
        monto: cuotas.get(cliente.id)!,
        indiceVenta: null,
      });
    }
  }

  // Se numeran en orden de fecha, como salen del sistema.
  emisiones.sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      Number(a.indiceVenta !== null) - Number(b.indiceVenta !== null) ||
      a.idCliente.localeCompare(b.idCliente),
  );
  const indiceAnulada = 2;
  let numero = primerNumeroDeFactura;

  function emitir(emision: Emision, fecha: string, razonSocial: string) {
    const cliente = clientePorId.get(emision.idCliente)!;
    const hora = `${String(aleatorio.entero(9, 17)).padStart(2, "0")}:${String(aleatorio.entero(0, 59)).padStart(2, "0")}`;
    const factura: FacturacionGenerada["facturas"][number] = {
      id: `fac-${numero}`,
      numero,
      cuf: generarCuf(numero, fecha, hora),
      idCliente: cliente.id,
      idOportunidad: emision.idOportunidad,
      fecha,
      hora,
      documentoCliente: cliente.nit,
      razonSocialCliente: razonSocial,
      lineas: [{ descripcion: emision.descripcion, cantidad: 1, precioUnitario: emision.monto, subtotal: emision.monto }],
      total: emision.monto,
      estado: "vigente",
      fechaAnulacion: null,
      motivoAnulacion: null,
      idEmisor,
    };
    numero += 1;
    facturas.push(factura);
    const borrador = asientoDeFactura({ idFactura: factura.id, numeroFactura: factura.numero, razonSocial, fecha, total: factura.total });
    borradores.push(borrador);
    return { factura, borrador };
  }

  function cobrar(factura: FacturacionGenerada["facturas"][number], diasMinimos: number, diasMaximos: number, monto: number) {
    const antiguedad = diferenciaEnDias(factura.fecha, hoy);
    const medio = aleatorio.elegir<MedioDeCobro>(["transferencia", "transferencia", "transferencia", "cheque", "efectivo"]);
    const fechaCobro = sumarDias(factura.fecha, aleatorio.entero(diasMinimos, Math.max(diasMinimos, Math.min(diasMaximos, antiguedad - 1))));
    const cobro: FacturacionGenerada["cobros"][number] = {
      id: `cob-${String(cobros.length + 1).padStart(3, "0")}`,
      idFactura: factura.id,
      fecha: diaHabilDesde(fechaCobro) <= hoy ? diaHabilDesde(fechaCobro) : fechaCobro,
      monto,
      medio,
    };
    cobros.push(cobro);
    borradores.push(
      asientoDeCobro({
        idCobro: cobro.id,
        numeroFactura: factura.numero,
        razonSocial: factura.razonSocialCliente,
        fecha: cobro.fecha,
        monto,
        medio: cuentaDelMedio(medio),
      }),
    );
  }

  for (const emision of emisiones) {
    const cliente = clientePorId.get(emision.idCliente)!;
    let fecha = emision.fecha;

    if (emision.indiceVenta === indiceAnulada) {
      // Se emitió sin la forma societaria en la razón social: se anula y se reemite.
      const razonIncompleta = cliente.razonSocial.replace(/ (S\.R\.L\.|S\.A\.|Ltda\.|R\.L\.)$/, "");
      const { factura, borrador } = emitir(emision, fecha, razonIncompleta === cliente.razonSocial ? `${razonIncompleta} (sin NIT)` : razonIncompleta);
      const fechaAnulacion = fecha < hoy ? sumarDias(fecha, 1) : fecha;
      factura.estado = "anulada";
      factura.fechaAnulacion = fechaAnulacion;
      factura.motivoAnulacion = "Datos de emisión incorrectos";
      borradores.push(
        asientoDeAnulacion(borrador, {
          fecha: fechaAnulacion,
          glosa: `Anulación de la factura N° ${factura.numero} a ${factura.razonSocialCliente}. Motivo: datos de emisión incorrectos`,
        }),
      );
      fecha = fechaAnulacion;
    }

    const { factura } = emitir(emision, fecha, cliente.razonSocial);
    const antiguedad = diferenciaEnDias(factura.fecha, hoy);

    if (emision.indiceVenta === null) {
      // Las cuotas mensuales se pagan en una o dos semanas.
      if (antiguedad > 12) cobrar(factura, 4, 15, factura.total);
      continue;
    }
    // Ventas nuevas: las de hace más de 20 días ya se cobraron, salvo una
    // vencida y una cobrada en parte; las más recientes siguen por cobrar.
    if (antiguedad <= 20) continue;
    if (emision.indiceVenta === 1 && antiguedad > diasDeCredito) continue;
    cobrar(factura, 6, 25, emision.indiceVenta === 4 ? Math.round(factura.total / 2) : factura.total);
  }

  return { facturas, cobros, borradores };
}
