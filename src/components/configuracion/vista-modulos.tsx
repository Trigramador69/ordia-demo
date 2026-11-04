"use client";

import { Check, Minus } from "lucide-react";
import { toast } from "sonner";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cambiarModulo } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";

// Qué cambia en el circuito de una venta con y sin el módulo de facturación.
const diferencias: [string, string, string][] = [
  ["Menú", "No aparece Facturación", "Aparece Facturación (facturas y cobros)"],
  ["Venta ganada en el CRM", "Se registra el monto; la factura se emite en el sistema que ya usan", "Se emite la factura desde la misma oportunidad"],
  ["Contabilidad", "El ingreso se registra con un asiento manual", "El asiento del ingreso y la cuenta por cobrar se generan solos"],
  ["Ficha del cliente", "Sin facturas ni saldo", "Facturas y saldo por cobrar"],
];

export function VistaModulos() {
  const { modulos } = useEstadoDemo();
  const activo = modulos.facturacion;

  function cambiar(valor: boolean) {
    cambiarModulo("facturacion", valor);
    toast.success(valor ? "Facturación activada." : "Facturación desactivada.", {
      description: valor ? "El menú y las fichas muestran facturas y cobros." : "Las facturas emitidas se conservan; vuelven a verse al activarla.",
    });
  }

  return (
    <>
      <EncabezadoPagina titulo="Módulos" descripcion="Módulos opcionales de la plataforma. Se activan o desactivan al instante, sin perder datos." />

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Facturación</CardTitle>
          <CardDescription>
            Emisión de facturas con el formato de una factura en línea, anulaciones y cobros, con sus asientos contables. En esta demo es
            una simulación: no se conecta con el SIAT.
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{activo ? "Activo" : "Inactivo"}</span>
            <Switch checked={activo} onCheckedChange={cambiar} aria-label="Módulo de facturación" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Sin facturación</TableHead>
                <TableHead>Con facturación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diferencias.map(([aspecto, sin, con]) => (
                <TableRow key={aspecto}>
                  <TableCell className="font-medium">{aspecto}</TableCell>
                  <TableCell className={activo ? "text-muted-foreground" : ""}>
                    <span className="flex items-start gap-2 whitespace-normal">
                      {!activo && <Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
                      {sin}
                    </span>
                  </TableCell>
                  <TableCell className={activo ? "" : "text-muted-foreground"}>
                    <span className="flex items-start gap-2 whitespace-normal">
                      {activo && <Check className="mt-0.5 size-4 shrink-0 text-exito" />}
                      {con}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
