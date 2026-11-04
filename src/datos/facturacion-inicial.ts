import { asientoDeAnulacion, asientoDeCobro, asientoDeFactura, type BorradorAsiento } from "../lib/contabilidad.ts";
import { cuentaDelMedio, generarCuf } from "../lib/facturacion.ts";
import type { Aleatorio } from "./aleatorio.ts";
import { diferenciaEnDias, mesDeFecha, primerDiaDelMes, sumarDias, sumarMesesAMes } from "./fechas.ts";
import { diaHabilDesde } from "./feriados.ts";
import type { Cliente, Cobro, Factura, MedioDeCobro, Oportunidad } from "./tipos.ts";

// Facturas de los últimos 3 meses, salidas de las ventas ganadas, con sus
// cobros y asientos. Para la presentación quedan: una factura anulada y
// reemitida, algunas por cobrar (una ya vencida), una cobrada en parte y la
// venta ganada más reciente sin facturar, para emitirla en vivo.

const primerNumeroDeFactura = 1201;
// Una factura se considera vencida si no se cobra en este plazo.
export const diasDeCredito = 30;

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
  const desde = primerDiaDelMes(sumarMesesAMes(mesDeFecha(hoy), -2));

  const ganadas = datos.oportunidades
    .filter((oportunidad) => oportunidad.etapa === "ganada" && oportunidad.fechaCierre && oportunidad.fechaCierre >= desde)
    .sort((a, b) => a.fechaCierre!.localeCompare(b.fechaCierre!) || a.id.localeCompare(b.id));
  // La más reciente queda sin facturar, para emitirla durante la demo.
  const aFacturar = ganadas.slice(0, -1);
  const indiceAnulada = Math.min(2, aFacturar.length - 1);
  let numero = primerNumeroDeFactura;

  function emitir(oportunidad: Oportunidad, fecha: string, razonSocial: string) {
    const cliente = clientePorId.get(oportunidad.idCliente)!;
    const hora = `${String(aleatorio.entero(9, 17)).padStart(2, "0")}:${String(aleatorio.entero(0, 59)).padStart(2, "0")}`;
    const factura: FacturacionGenerada["facturas"][number] = {
      id: `fac-${numero}`,
      numero,
      cuf: generarCuf(numero, fecha, hora),
      idCliente: cliente.id,
      idOportunidad: oportunidad.id,
      fecha,
      hora,
      documentoCliente: cliente.nit,
      razonSocialCliente: razonSocial,
      lineas: [{ descripcion: oportunidad.titulo, cantidad: 1, precioUnitario: oportunidad.monto, subtotal: oportunidad.monto }],
      total: oportunidad.monto,
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

  aFacturar.forEach((oportunidad, indice) => {
    const cliente = clientePorId.get(oportunidad.idCliente)!;
    let fecha = diaHabilDesde(oportunidad.fechaCierre!);
    if (fecha > hoy) fecha = oportunidad.fechaCierre!;

    if (indice === indiceAnulada) {
      // Se emitió sin la forma societaria en la razón social: se anula y se reemite.
      const razonIncompleta = cliente.razonSocial.replace(/ (S\.R\.L\.|S\.A\.|Ltda\.|R\.L\.)$/, "");
      const { factura, borrador } = emitir(oportunidad, fecha, razonIncompleta === cliente.razonSocial ? `${razonIncompleta} (sin NIT)` : razonIncompleta);
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

    const { factura } = emitir(oportunidad, fecha, cliente.razonSocial);

    // Cobros: las de hace más de 20 días ya se cobraron, salvo una vencida y
    // una cobrada en parte; las más recientes siguen por cobrar.
    const antiguedad = diferenciaEnDias(factura.fecha, hoy);
    if (antiguedad <= 20) return;
    if (indice === 1 && antiguedad > diasDeCredito) return; // queda vencida, sin cobrar
    const medio = aleatorio.elegir<MedioDeCobro>(["transferencia", "transferencia", "transferencia", "cheque", "efectivo"]);
    const fechaCobro = sumarDias(factura.fecha, aleatorio.entero(6, Math.min(25, antiguedad - 1)));
    const monto = indice === 4 ? Math.round(factura.total / 2) : factura.total;
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
  });

  return { facturas, cobros, borradores };
}
