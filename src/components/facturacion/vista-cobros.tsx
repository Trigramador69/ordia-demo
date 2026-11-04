"use client";

import { useState } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";
import { DialogoCobro } from "@/components/facturacion/dialogos";
import { Cifra, InsigniaSituacion } from "@/components/facturacion/lista-facturas";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { diasDeCredito } from "@/datos/facturacion-inicial";
import { diferenciaEnDias, mesDeFecha } from "@/datos/fechas";
import type { Factura } from "@/datos/tipos";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { facturaPorId, facturasConSituacion } from "@/lib/demo/consultas";
import { nombresMedioDeCobro } from "@/lib/facturacion";
import { fechaDeHoy, formatearFecha, formatearImporte, formatearMonto, pluralizar } from "@/lib/formato";
import { puedeVerRuta } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

export function VistaCobros() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const mes = mesDeFecha(hoy);
  const [cobrando, setCobrando] = useState<Factura | null>(null);
  const verClientes = puedeVerRuta(estado.rol, "/clientes");

  const pendientes = facturasConSituacion(estado)
    .filter((fila) => fila.saldo > 0)
    .map((fila) => ({ ...fila, dias: diferenciaEnDias(fila.factura.fecha, hoy) }))
    .sort((a, b) => b.dias - a.dias);
  const vencidas = pendientes.filter((fila) => fila.dias > diasDeCredito);
  const cobros = [...estado.cobros].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const cobradoMes = cobros.filter((cobro) => cobro.fecha.startsWith(mes)).reduce((suma, cobro) => suma + cobro.monto, 0);

  return (
    <>
      <EncabezadoPagina
        titulo="Cobros"
        descripcion="Lo que falta cobrar, de lo más antiguo a lo más reciente, y los pagos recibidos. Cada cobro registra su asiento."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Cifra
          titulo="Por cobrar"
          valor={formatearMonto(pendientes.reduce((suma, fila) => suma + fila.saldo, 0))}
          detalle={pluralizar(pendientes.length, "factura con saldo", "facturas con saldo")}
        />
        <Cifra
          titulo="Vencido"
          valor={formatearMonto(vencidas.reduce((suma, fila) => suma + fila.saldo, 0))}
          detalle={`${pluralizar(vencidas.length, "factura", "facturas")} con más de ${diasDeCredito} días`}
          alerta={vencidas.length > 0}
        />
        <Cifra titulo="Cobrado este mes" valor={formatearMonto(cobradoMes)} detalle={pluralizar(cobros.filter((cobro) => cobro.fecha.startsWith(mes)).length, "cobro", "cobros")} />
      </div>

      <Card className="pb-0">
        <CardHeader>
          <CardTitle>Cuentas por cobrar</CardTitle>
          <CardDescription>Se vence a los {diasDeCredito} días de emitida.</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Total</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">Antigüedad</TableHead>
              <TableHead className="pr-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No hay nada por cobrar.
                </TableCell>
              </TableRow>
            )}
            {pendientes.map(({ factura, saldo, situacion, dias }) => (
              <TableRow key={factura.id}>
                <TableCell className="pl-6">
                  <Link href={`/facturas/${factura.id}`} className="font-medium hover:underline">
                    N° {factura.numero}
                  </Link>
                  <p className="text-xs text-muted-foreground">{formatearFecha(factura.fecha)}</p>
                </TableCell>
                <TableCell>
                  {verClientes ? (
                    <Link href={`/clientes/${factura.idCliente}`} className="hover:underline">
                      {factura.razonSocialCliente}
                    </Link>
                  ) : (
                    factura.razonSocialCliente
                  )}
                  <div className="mt-1">
                    <InsigniaSituacion situacion={situacion} vencida={dias > diasDeCredito} />
                  </div>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatearImporte(factura.total)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatearImporte(saldo)}</TableCell>
                <TableCell className={cn("text-right tabular-nums", dias > diasDeCredito && "font-medium text-destructive")}>{dias} días</TableCell>
                <TableCell className="pr-6 text-right">
                  <Button size="sm" variant="outline" onClick={() => setCobrando(factura)}>
                    <Coins />
                    Cobrar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="pb-0">
        <CardHeader>
          <CardTitle>Cobros registrados</CardTitle>
          <CardDescription>{pluralizar(cobros.length, "cobro", "cobros")}</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Fecha</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead className="hidden md:table-cell">Medio</TableHead>
              <TableHead className="pr-6 text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cobros.map((cobro) => {
              const factura = facturaPorId(estado, cobro.idFactura);
              return (
                <TableRow key={cobro.id}>
                  <TableCell className="pl-6 tabular-nums">{formatearFecha(cobro.fecha)}</TableCell>
                  <TableCell>
                    {factura && (
                      <Link href={`/facturas/${factura.id}`} className="hover:underline">
                        N° {factura.numero} · {factura.razonSocialCliente}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{nombresMedioDeCobro[cobro.medio]}</TableCell>
                  <TableCell className="pr-6 text-right font-medium tabular-nums">{formatearImporte(cobro.monto)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <DialogoCobro factura={cobrando} alCerrar={() => setCobrando(null)} />
    </>
  );
}
