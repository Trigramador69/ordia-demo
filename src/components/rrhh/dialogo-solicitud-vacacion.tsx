"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { contarDiasHabiles, diaHabilDesde } from "@/datos/feriados";
import { sumarDias } from "@/datos/fechas";
import { solicitarVacacion } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { fechaDeHoy, formatearFecha, nombreCompleto, pluralizar } from "@/lib/formato";
import { resumenVacaciones, validarSolicitud } from "@/lib/vacaciones";

// Solicitud de vacaciones: la usa la propia persona ("Mis vacaciones") o
// Administración en nombre de alguien. Queda pendiente hasta que el gerente la
// apruebe.
export function DialogoSolicitudVacacion({
  idPersonaFija,
  abierto,
  alCambiarAbierto,
}: {
  idPersonaFija?: string;
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
}) {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const primerDiaPosible = diaHabilDesde(sumarDias(hoy, 1));
  const [idElegido, setIdElegido] = useState("");
  const [desde, setDesde] = useState(primerDiaPosible);
  const [hasta, setHasta] = useState(primerDiaPosible);
  const [comentario, setComentario] = useState("");

  const idPersona = idPersonaFija ?? idElegido;
  const persona = estado.personas.find((item) => item.id === idPersona);
  const opcionesPersona = Object.fromEntries(estado.personas.map((item) => [item.id, nombreCompleto(item)]));
  const resumen = persona ? resumenVacaciones(persona, estado.solicitudesVacacion, hoy) : null;
  const fechasValidas = desde !== "" && hasta !== "" && hasta >= desde;
  const diasHabiles = fechasValidas ? contarDiasHabiles(desde, hasta) : 0;
  const errores =
    persona && resumen ? validarSolicitud({ idPersona: persona.id, desde, hasta, diasHabiles }, resumen, estado.solicitudesVacacion) : [];
  const disponibles = resumen ? Math.max(0, resumen.saldo - resumen.pendientesDeAprobar) : 0;

  function enviar() {
    if (!persona) return;
    solicitarVacacion({ idPersona: persona.id, desde, hasta, comentario: comentario.trim() });
    toast.success(`Solicitud de ${pluralizar(diasHabiles, "día", "días")} enviada.`, {
      description: "Queda pendiente hasta que el gerente la apruebe.",
    });
    alCambiarAbierto(false);
    setComentario("");
    setDesde(primerDiaPosible);
    setHasta(primerDiaPosible);
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar vacaciones</DialogTitle>
          <DialogDescription>
            {persona && idPersonaFija ? nombreCompleto(persona) : "Se cuentan solo los días hábiles: sin fines de semana ni feriados."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {!idPersonaFija && (
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="persona-vacacion">Persona</Label>
              <SelectorSimple id="persona-vacacion" opciones={opcionesPersona} valor={idElegido} alCambiar={setIdElegido} textoVacio="Elija a la persona" />
            </div>
          )}
          {resumen && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm sm:col-span-2">
              {resumen.fechaPrimerDerecho
                ? `Todavía no le corresponden vacaciones. Las tendrá desde el ${formatearFecha(resumen.fechaPrimerDerecho)}.`
                : `Disponibles: ${pluralizar(disponibles, "día hábil", "días hábiles")}${resumen.pendientesDeAprobar > 0 ? ` (hay ${resumen.pendientesDeAprobar} en otra solicitud pendiente)` : ""}.`}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="desde-vacacion">Desde</Label>
            <Input
              id="desde-vacacion"
              type="date"
              min={hoy}
              value={desde}
              onChange={(evento) => {
                setDesde(evento.target.value);
                if (hasta < evento.target.value) setHasta(evento.target.value);
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hasta-vacacion">Hasta</Label>
            <Input id="hasta-vacacion" type="date" min={desde} value={hasta} onChange={(evento) => setHasta(evento.target.value)} />
          </div>
          <p className="text-sm sm:col-span-2">
            <span className="font-medium tabular-nums">{pluralizar(diasHabiles, "día hábil", "días hábiles")}</span>
            <span className="text-muted-foreground"> en el rango elegido</span>
          </p>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="comentario-vacacion">Comentario (opcional)</Label>
            <Textarea
              id="comentario-vacacion"
              value={comentario}
              onChange={(evento) => setComentario(evento.target.value)}
              placeholder="Por ejemplo: viaje familiar"
              rows={2}
            />
          </div>
          {persona && errores.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm text-destructive sm:col-span-2">
              {errores.map((error) => (
                <li key={error} className="flex items-start gap-1.5">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  {error}
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button onClick={enviar} disabled={!persona || errores.length > 0}>
            Enviar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
