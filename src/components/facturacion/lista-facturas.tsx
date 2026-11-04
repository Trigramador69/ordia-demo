"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, FilePlus2, Search } from "lucide-react";
import { DialogoEmitirFactura } from "@/components/facturacion/dialogos";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { diasDeCredito } from "@/datos/facturacion-inicial";
import { diferenciaEnDias, mesDeFecha } from "@/datos/fechas";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { facturasConSituacion } from "@/lib/demo/consultas";
import { nombresSituacionFactura, type SituacionFactura } from "@/lib/facturacion";
import { fechaDeHoy, formatearFecha, formatearImporte, formatearMonto, pluralizar } from "@/lib/formato";
import { useFiltroUrl, useFiltroUrlTexto } from "@/lib/use-filtro-url";
import { cn } from "@/lib/utils";

export const clasesSituacion: Record<SituacionFactura, string> = {
  anulada: "bg-muted text-muted-foreground line-through",
  cobrada: "bg-exito-suave text-exito",
  parcial: "bg-advertencia-suave text-advertencia",
  por_cobrar: "bg-marca-suave text-primary",
};

export function InsigniaSituacion({ situacion, vencida }: { situacion: SituacionFactura; vencida?: boolean }) {
  if (vencida) return <Badge className="bg-peligro-suave text-destructive">Vencida</Badge>;
  return <Badge className={clasesSituacion[situacion]}>{nombresSituacionFactura[situacion]}</Badge>;
}

const todas = "todas";
const opcionesSituacion: Record<SituacionFactura | typeof todas | "vencida", string> = {
  todas: "Todas las facturas",
  por_cobrar: "Por cobrar",
  parcial: "Cobradas en parte",
  vencida: `Vencidas (más de ${diasDeCredito} días)`,
  cobrada: "Cobradas",
  anulada: "Anuladas",
};

export function ListaFacturas() {
  const estado = useEstadoDemo();
  const router = useRouter();
  const hoy = fechaDeHoy();
  const mes = mesDeFecha(hoy);
  const [busqueda, setBusqueda] = useFiltroUrlTexto("buscar");
  const [filtro, setFiltro] = useFiltroUrl<keyof typeof opcionesSituacion>("situacion", todas, Object.keys(opcionesSituacion) as (keyof typeof opcionesSituacion)[]);
  const [emitir, setEmitir] = useState(false);

  const filas = facturasConSituacion(estado).map((fila) => ({
    ...fila,
    vencida: fila.saldo > 0 && diferenciaEnDias(fila.factura.fecha, hoy) > diasDeCredito,
  }));
  const delMes = filas.filter((fila) => fila.factura.estado === "vigente" && fila.factura.fecha.startsWith(mes));
  const porCobrar = filas.filter((fila) => fila.saldo > 0);
  const vencidas = filas.filter((fila) => fila.vencida);
  const cobradoMes = estado.cobros.filter((cobro) => cobro.fecha.startsWith(mes)).reduce((suma, cobro) => suma + cobro.monto, 0);

  const texto = busqueda.trim().toLowerCase();
  const visibles = filas
    .filter((fila) => {
      if (filtro === todas) return true;
      if (filtro === "vencida") return fila.vencida;
      return fila.situacion === filtro;
    })
    .filter((fila) => texto === "" || fila.factura.razonSocialCliente.toLowerCase().includes(texto) || String(fila.factura.numero).includes(texto));

  return (
    <>
      <EncabezadoPagina
        titulo="Facturas"
        descripcion="Facturación simulada con el formato de una factura en línea. Cada factura, anulación y cobro genera su asiento contable."
        acciones={
          <Button onClick={() => setEmitir(true)}>
            <FilePlus2 />
            Emitir factura
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cifra titulo="Facturado este mes" valor={formatearMonto(delMes.reduce((suma, fila) => suma + fila.factura.total, 0))} detalle={pluralizar(delMes.length, "factura", "facturas")} />
        <Cifra
          titulo="Por cobrar"
          valor={formatearMonto(porCobrar.reduce((suma, fila) => suma + fila.saldo, 0))}
          detalle={pluralizar(porCobrar.length, "factura con saldo", "facturas con saldo")}
        />
        <Cifra
          titulo="Vencido"
          valor={formatearMonto(vencidas.reduce((suma, fila) => suma + fila.saldo, 0))}
          detalle={`Más de ${diasDeCredito} días sin cobrar`}
          alerta={vencidas.length > 0}
        />
        <Cifra titulo="Cobrado este mes" valor={formatearMonto(cobradoMes)} detalle="Transferencias, cheques y efectivo" />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_16rem] lg:max-w-2xl">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Cliente o número de factura" aria-label="Buscar factura" className="pl-8" />
        </div>
        <SelectorSimple opciones={opcionesSituacion} valor={filtro} alCambiar={setFiltro} />
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">N°</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Saldo</TableHead>
              <TableHead>Situación</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Ninguna factura coincide con los filtros.
                </TableCell>
              </TableRow>
            )}
            {visibles.map(({ factura, saldo, situacion, vencida }) => (
              <TableRow key={factura.id} className="cursor-pointer" onClick={() => router.push(`/facturas/${factura.id}`)}>
                <TableCell className="pl-4 font-medium tabular-nums">
                  <Link href={`/facturas/${factura.id}`} className="hover:underline" onClick={(evento) => evento.stopPropagation()}>
                    {factura.numero}
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{formatearFecha(factura.fecha)}</TableCell>
                <TableCell className={cn(factura.estado === "anulada" && "text-muted-foreground")}>{factura.razonSocialCliente}</TableCell>
                <TableCell className={cn("text-right tabular-nums", factura.estado === "anulada" && "text-muted-foreground line-through")}>
                  {formatearImporte(factura.total)}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{saldo > 0 ? formatearImporte(saldo) : "-"}</TableCell>
                <TableCell>
                  <InsigniaSituacion situacion={situacion} vencida={vencida} />
                </TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <DialogoEmitirFactura abierto={emitir} alCambiarAbierto={setEmitir} />
    </>
  );
}

export function Cifra({ titulo, valor, detalle, alerta }: { titulo: string; valor: string; detalle: string; alerta?: boolean }) {
  return (
    <Card className={alerta ? "border-destructive/30" : undefined}>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className={cn("font-heading text-2xl font-semibold tabular-nums", alerta && "text-destructive")}>{valor}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  );
}
