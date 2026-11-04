import { empresa } from "@/datos/catalogos";
import type { Factura } from "@/datos/tipos";
import { avisoSimulacion, leyendaDeFactura, leyendaGeneral, notaRepresentacionGrafica, textoQr } from "@/lib/facturacion";
import { formatearFecha, formatearImporte } from "@/lib/formato";
import { montoALetras } from "@/lib/numero-a-letras";
import { matrizQr } from "@/lib/qr";

export function CodigoQr({ texto, className }: { texto: string; className?: string }) {
  const qr = matrizQr(texto);
  let trazo = "";
  for (let fila = 0; fila < qr.tamanio; fila++) {
    for (let columna = 0; columna < qr.tamanio; columna++) {
      if (qr.oscuro(fila, columna)) trazo += `M${columna} ${fila}h1v1h-1z`;
    }
  }
  return (
    <svg viewBox={`-1 -1 ${qr.tamanio + 2} ${qr.tamanio + 2}`} className={className} role="img" aria-label="Código QR de la factura simulada" shapeRendering="crispEdges">
      <rect x={-1} y={-1} width={qr.tamanio + 2} height={qr.tamanio + 2} fill="white" />
      <path d={trazo} fill="black" />
    </svg>
  );
}

// Representación gráfica de la factura, con el formato de una factura en línea.
export function HojaFactura({ factura, codigoCliente }: { factura: Factura; codigoCliente: string }) {
  return (
    <article className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-xl border bg-white p-6 text-[13px] text-neutral-900 shadow-sm sm:p-8 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <p className="mb-5 rounded-md bg-advertencia-suave px-3 py-2 text-center text-xs font-semibold text-advertencia">{avisoSimulacion}</p>

      <header className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div>
          <p className="font-semibold uppercase">{empresa.razonSocial}</p>
          <p className="text-xs text-neutral-500">CASA MATRIZ</p>
          <p className="text-xs text-neutral-500">No. Punto de Venta 0</p>
          <p className="text-xs text-neutral-500">{empresa.direccion}</p>
          <p className="text-xs text-neutral-500">Teléfono: {empresa.telefono}</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs sm:w-72">
          <dt className="font-semibold">NIT</dt>
          <dd>{empresa.nit}</dd>
          <dt className="font-semibold">FACTURA N°</dt>
          <dd>{factura.numero}</dd>
          <dt className="col-span-2 font-semibold">CÓD. AUTORIZACIÓN</dt>
          <dd className="col-span-2 font-mono text-[11px] break-all">{factura.cuf}</dd>
        </dl>
      </header>

      <div className="my-5 text-center">
        <h1 className="font-heading text-xl font-semibold">FACTURA</h1>
        <p className="text-xs">(Con Derecho a Crédito Fiscal)</p>
      </div>

      <dl className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-[auto_1fr_auto_auto]">
        <dt className="font-semibold">Fecha:</dt>
        <dd>
          {formatearFecha(factura.fecha)} {factura.hora}
        </dd>
        <dt className="font-semibold">NIT/CI/CEX:</dt>
        <dd>{factura.documentoCliente}</dd>
        <dt className="font-semibold">Nombre/Razón Social:</dt>
        <dd>{factura.razonSocialCliente}</dd>
        <dt className="font-semibold">Cod. Cliente:</dt>
        <dd>{codigoCliente}</dd>
      </dl>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-neutral-100 text-left">
              <th className="px-2 py-1.5 font-semibold">CÓDIGO</th>
              <th className="px-2 py-1.5 text-right font-semibold">CANTIDAD</th>
              <th className="px-2 py-1.5 font-semibold">UNIDAD</th>
              <th className="px-2 py-1.5 font-semibold">DESCRIPCIÓN</th>
              <th className="px-2 py-1.5 text-right font-semibold">P. UNITARIO</th>
              <th className="px-2 py-1.5 text-right font-semibold">DESCUENTO</th>
              <th className="px-2 py-1.5 text-right font-semibold">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {factura.lineas.map((linea, indice) => (
              <tr key={indice} className="border-b">
                <td className="px-2 py-1.5">SRV-{String(indice + 1).padStart(3, "0")}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{linea.cantidad}</td>
                <td className="px-2 py-1.5">Servicio</td>
                <td className="px-2 py-1.5">{linea.descripcion}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{formatearImporte(linea.precioUnitario)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">0,00</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{formatearImporte(linea.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="mt-3 ml-auto grid w-full max-w-sm grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-xs">
        {(
          [
            ["SUBTOTAL Bs", factura.total, false],
            ["DESCUENTO Bs", 0, false],
            ["TOTAL Bs", factura.total, true],
            ["MONTO GIFT CARD Bs", 0, false],
            ["MONTO A PAGAR Bs", factura.total, true],
            ["IMPORTE BASE CRÉDITO FISCAL Bs", factura.total, true],
          ] as const
        ).map(([etiqueta, monto, negrita]) => (
          <div key={etiqueta} className="contents">
            <dt className={`text-right ${negrita ? "font-semibold" : ""}`}>{etiqueta}</dt>
            <dd className={`text-right tabular-nums ${negrita ? "font-semibold" : ""}`}>{formatearImporte(monto)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs">Son: {montoALetras(factura.total)}</p>

      <footer className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-xl flex-col gap-2 text-[11px]">
          <p className="font-semibold">{leyendaGeneral}</p>
          <p className="text-neutral-500">{leyendaDeFactura(factura.numero)}</p>
          <p className="text-neutral-500">{notaRepresentacionGrafica}</p>
        </div>
        <CodigoQr texto={textoQr(factura)} className="size-32 shrink-0 self-center sm:self-start" />
      </footer>

      {factura.estado === "anulada" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="-rotate-12 rounded-lg border-4 border-destructive px-6 py-1 font-heading text-6xl font-bold text-destructive/80">ANULADA</span>
          <span className="rounded bg-white/90 px-2 text-sm text-destructive">
            el {formatearFecha(factura.fechaAnulacion ?? factura.fecha)}: {factura.motivoAnulacion}
          </span>
        </div>
      )}
    </article>
  );
}
