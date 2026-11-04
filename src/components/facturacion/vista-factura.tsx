"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Ban, Coins, Download, Printer } from "lucide-react";
import { TablaAsiento } from "@/components/contabilidad/tabla-asiento";
import { DialogoAnular, DialogoCobro } from "@/components/facturacion/dialogos";
import { HojaFactura } from "@/components/facturacion/hoja-factura";
import { InsigniaSituacion } from "@/components/facturacion/lista-facturas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { diasDeCredito } from "@/datos/facturacion-inicial";
import { diferenciaEnDias } from "@/datos/fechas";
import type { Factura } from "@/datos/tipos";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { asientoPorId, cobrosDeFactura, facturaPorId, oportunidadPorId } from "@/lib/demo/consultas";
import { crearPdfFactura, nombreArchivoFactura } from "@/lib/factura-pdf";
import { nombresMedioDeCobro, situacionDeFactura } from "@/lib/facturacion";
import { fechaDeHoy, formatearFecha, formatearImporte, formatearMonto } from "@/lib/formato";
import { descargarPdf } from "@/lib/pdf";

export function VistaFactura() {
  const { idFactura } = useParams<{ idFactura: string }>();
  const estado = useEstadoDemo();
  const factura = facturaPorId(estado, idFactura);
  if (!factura) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-heading text-lg font-semibold">No encontramos esta factura</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/facturas" />}>
          Volver a las facturas
        </Button>
      </div>
    );
  }
  return <Contenido factura={factura} />;
}

function Contenido({ factura }: { factura: Factura }) {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const [cobrando, setCobrando] = useState<Factura | null>(null);
  const [anulando, setAnulando] = useState<Factura | null>(null);
  const { saldo, situacion, cobrado } = situacionDeFactura(factura, estado.cobros);
  const cobros = cobrosDeFactura(estado, factura.id);
  const vencida = saldo > 0 && diferenciaEnDias(factura.fecha, hoy) > diasDeCredito;
  const oportunidad = factura.idOportunidad ? oportunidadPorId(estado, factura.idOportunidad) : undefined;
  const asientos = [factura.idAsiento, factura.idAsientoAnulacion, ...cobros.map((cobro) => cobro.idAsiento)]
    .flatMap((id) => (id ? [asientoPorId(estado, id)] : []))
    .filter((asiento) => asiento !== undefined);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" className="-ml-2" nativeButton={false} render={<Link href="/facturas" />}>
          <ArrowLeft />
          Facturas
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer />
            Imprimir
          </Button>
          <Button variant="outline" onClick={() => descargarPdf(crearPdfFactura(factura, factura.idCliente), nombreArchivoFactura(factura))}>
            <Download />
            PDF
          </Button>
          {factura.estado === "vigente" && cobros.length === 0 && (
            <Button variant="outline" className="text-destructive" onClick={() => setAnulando(factura)}>
              <Ban />
              Anular
            </Button>
          )}
          {saldo > 0 && (
            <Button onClick={() => setCobrando(factura)}>
              <Coins />
              Registrar cobro
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm print:hidden">
        <InsigniaSituacion situacion={situacion} vencida={vencida} />
        <span className="text-muted-foreground">
          Cobrado {formatearMonto(cobrado)} · saldo {formatearMonto(saldo)}
          {vencida && ` · emitida hace ${diferenciaEnDias(factura.fecha, hoy)} días`}
        </span>
        <Link href={`/clientes/${factura.idCliente}`} className="text-muted-foreground hover:underline">
          Ver cliente
        </Link>
        {oportunidad && <Badge variant="outline">De la oportunidad: {oportunidad.titulo}</Badge>}
        {factura.estado === "vigente" && cobros.length > 0 && (
          <span className="text-xs text-muted-foreground">Con cobros registrados no se puede anular.</span>
        )}
      </div>

      <HojaFactura factura={factura} codigoCliente={factura.idCliente} />

      <div className="grid items-start gap-4 xl:grid-cols-[22rem_1fr] print:hidden">
        <Card>
          <CardHeader>
            <CardTitle>Cobros</CardTitle>
            <CardDescription>{cobros.length === 0 ? "Todavía no se registraron cobros." : `${formatearMonto(cobrado)} cobrados.`}</CardDescription>
          </CardHeader>
          {cobros.length > 0 && (
            <CardContent>
              <ul className="flex flex-col divide-y text-sm">
                {cobros.map((cobro) => (
                  <li key={cobro.id} className="flex justify-between gap-4 py-2 first:pt-0 last:pb-0">
                    <span>
                      {formatearFecha(cobro.fecha)}
                      <span className="block text-xs text-muted-foreground">{nombresMedioDeCobro[cobro.medio]}</span>
                    </span>
                    <span className="font-medium tabular-nums">Bs {formatearImporte(cobro.monto)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Asientos contables</CardTitle>
            <CardDescription>Se generaron solos con la factura{factura.estado === "anulada" ? ", su anulación" : ""}{cobros.length ? " y sus cobros" : ""}.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {asientos.map((asiento) => (
              <div key={asiento.id} className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  N° {asiento.numero} · {formatearFecha(asiento.fecha)} · <span className="font-normal text-muted-foreground">{asiento.glosa}</span>
                </p>
                <TablaAsiento lineas={asiento.lineas} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <DialogoCobro factura={cobrando} alCerrar={() => setCobrando(null)} />
      <DialogoAnular factura={anulando} alCerrar={() => setAnulando(null)} />
    </>
  );
}
