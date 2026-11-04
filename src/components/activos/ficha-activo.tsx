"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, UserRoundCog, Wrench } from "lucide-react";
import { toast } from "sonner";
import { InsigniaEstadoActivo } from "@/components/activos/lista-activos";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mesDeFecha } from "@/datos/fechas";
import { vidaUtilPorCategoria } from "@/datos/parametros";
import type { Activo, TipoEventoActivo } from "@/datos/tipos";
import { cuadroDeDepreciacion, cuotaMensual, depreciacionAcumulada, nombresCategoriaActivo, valorEnLibros } from "@/lib/activos";
import { cambiarEstadoReparacion, reasignarActivo } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { personaPorId, ultimoMesDepreciado } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearFecha, formatearImporte, formatearMes, formatearMonto, nombreCompleto } from "@/lib/formato";
import { cn } from "@/lib/utils";

const nombresEvento: Record<TipoEventoActivo, string> = {
  compra: "Compra",
  asignacion: "Asignación",
  reparacion: "Reparación",
  retorno: "Vuelve de reparación",
  baja: "Baja",
};

export function FichaActivo() {
  const { idActivo } = useParams<{ idActivo: string }>();
  const filtrosDeOrigen = useSearchParams().get("filtros");
  const estado = useEstadoDemo();
  const activo = estado.activos.find((item) => item.id === idActivo);
  const enlaceVolver = `/activos${filtrosDeOrigen ? `?${filtrosDeOrigen}` : ""}`;
  if (!activo) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-heading text-lg font-semibold">No encontramos este activo</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/activos" />}>
          Volver a los activos
        </Button>
      </div>
    );
  }
  return <Contenido activo={activo} enlaceVolver={enlaceVolver} />;
}

function Contenido({ activo, enlaceVolver }: { activo: Activo; enlaceVolver: string }) {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const [reasignando, setReasignando] = useState(false);
  const [reparando, setReparando] = useState(false);
  const hastaMes = ultimoMesDepreciado(estado);
  const mesActual = mesDeFecha(hoy);
  const responsable = activo.idResponsable ? personaPorId(estado, activo.idResponsable) : undefined;
  // El cuadro llega hasta el mes en curso; lo posterior al último mes registrado queda "por registrar".
  const cuadro = cuadroDeDepreciacion(activo, mesActual);
  const libro = valorEnLibros(activo, hastaMes);
  const historial = [...activo.historial].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" nativeButton={false} render={<Link href={enlaceVolver} />}>
          <ArrowLeft />
          Activos fijos
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{activo.nombre}</h1>
            <InsigniaEstadoActivo estado={activo.estado} />
          </div>
          <p className="text-sm text-muted-foreground">
            {activo.codigo} · {nombresCategoriaActivo[activo.categoria]} · {activo.ubicacion}
            {responsable && ` · a cargo de ${nombreCompleto(responsable)}`}
          </p>
        </div>
        {activo.estado !== "baja" && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setReparando(true)}>
              <Wrench />
              {activo.estado === "en_reparacion" ? "Volvió de reparación" : "Enviar a reparación"}
            </Button>
            <Button onClick={() => setReasignando(true)}>
              <UserRoundCog />
              Reasignar
            </Button>
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Valores</CardTitle>
              <CardDescription>A {formatearMes(hastaMes).toLowerCase()}, el último mes depreciado.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                <Dato etiqueta="Fecha de compra" valor={formatearFecha(activo.fechaCompra)} />
                <Dato etiqueta="Valor de compra" valor={formatearMonto(activo.valorCompra)} />
                <Dato etiqueta="Vida útil" valor={`${vidaUtilPorCategoria[activo.categoria]} años (${nombresCategoriaActivo[activo.categoria].toLowerCase()})`} />
                <Dato etiqueta="Depreciación mensual" valor={formatearMonto(cuotaMensual(activo))} />
                <Dato etiqueta="Depreciación acumulada" valor={formatearMonto(depreciacionAcumulada(activo, hastaMes))} />
                <Dato etiqueta="Valor en libros" valor={activo.estado === "baja" ? "Dado de baja" : libro === 0 ? "Totalmente depreciado" : formatearMonto(libro)} destacado />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative flex flex-col gap-4 border-l pl-5">
                {historial.map((evento, indice) => (
                  <li key={`${evento.fecha}-${indice}`} className="relative text-sm">
                    <span className={cn("absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-card", evento.tipo === "baja" ? "bg-destructive" : evento.tipo === "reparacion" ? "bg-advertencia" : "bg-primary")} />
                    <p className="text-xs text-muted-foreground">
                      {nombresEvento[evento.tipo]} · {formatearFecha(evento.fecha)}
                    </p>
                    <p>{evento.detalle}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <Card className="pb-0">
          <CardHeader>
            <CardTitle>Cuadro de depreciación</CardTitle>
            <CardDescription>
              Lineal: {formatearMonto(activo.valorCompra)} en {vidaUtilPorCategoria[activo.categoria] * 12} meses, desde el mes siguiente a la compra.
            </CardDescription>
          </CardHeader>
          <div className="max-h-[32rem] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Mes</TableHead>
                  <TableHead className="text-right">Depreciación</TableHead>
                  <TableHead className="text-right">Acumulada</TableHead>
                  <TableHead className="pr-6 text-right">Valor en libros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuadro.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Empieza a depreciarse el mes siguiente a la compra.
                    </TableCell>
                  </TableRow>
                )}
                {[...cuadro].reverse().map((fila) => {
                  const porRegistrar = fila.mes > hastaMes;
                  return (
                    <TableRow key={fila.mes} className={cn(porRegistrar && "text-muted-foreground")}>
                      <TableCell className="pl-6">
                        {formatearMes(fila.mes)}
                        {porRegistrar && <span className="ml-2 text-xs">por registrar</span>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatearImporte(fila.monto)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatearImporte(fila.acumulada)}</TableCell>
                      <TableCell className="pr-6 text-right font-medium tabular-nums">{formatearImporte(fila.valorEnLibros)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {reasignando && <DialogoReasignar activo={activo} alCerrar={() => setReasignando(false)} />}
      {reparando && <DialogoReparacion activo={activo} alCerrar={() => setReparando(false)} />}
    </>
  );
}

function DialogoReasignar({ activo, alCerrar }: { activo: Activo; alCerrar: () => void }) {
  const estado = useEstadoDemo();
  const [idResponsable, setIdResponsable] = useState(activo.idResponsable ?? "");
  const [ubicacion, setUbicacion] = useState(activo.ubicacion);
  const opciones = Object.fromEntries(estado.personas.map((persona) => [persona.id, nombreCompleto(persona)]));

  function guardar() {
    const persona = personaPorId(estado, idResponsable);
    reasignarActivo(activo.id, idResponsable, ubicacion.trim(), `Asignado a ${persona ? nombreCompleto(persona) : ""} · ${ubicacion.trim()}`);
    toast.success(`${activo.codigo} reasignado.`);
    alCerrar();
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reasignar {activo.codigo}</DialogTitle>
          <DialogDescription>{activo.nombre}. Queda registrado en su historial.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="responsable-activo">Responsable</Label>
            <SelectorSimple id="responsable-activo" opciones={opciones} valor={idResponsable} alCambiar={setIdResponsable} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ubicacion-activo">Ubicación</Label>
            <Input id="ubicacion-activo" value={ubicacion} onChange={(evento) => setUbicacion(evento.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button onClick={guardar} disabled={!idResponsable || ubicacion.trim() === ""}>
            Reasignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogoReparacion({ activo, alCerrar }: { activo: Activo; alCerrar: () => void }) {
  const enviar = activo.estado !== "en_reparacion";
  const [detalle, setDetalle] = useState("");

  function guardar() {
    cambiarEstadoReparacion(activo.id, enviar, detalle.trim());
    toast.success(enviar ? `${activo.codigo} enviado a reparación.` : `${activo.codigo} vuelve a estar en uso.`);
    alCerrar();
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{enviar ? "Enviar a reparación" : "Volvió de reparación"}</DialogTitle>
          <DialogDescription>
            {activo.codigo} · {activo.nombre}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="detalle-reparacion">{enviar ? "Qué le pasa" : "Qué se hizo"}</Label>
          <Input
            id="detalle-reparacion"
            value={detalle}
            onChange={(evento) => setDetalle(evento.target.value)}
            placeholder={enviar ? "Por ejemplo: no enciende" : "Por ejemplo: se cambió la batería"}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button onClick={guardar} disabled={detalle.trim() === ""}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Dato({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className={cn(destacado && "font-heading text-lg font-semibold")}>{valor}</dd>
    </div>
  );
}
