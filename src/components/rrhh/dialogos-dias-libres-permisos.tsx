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
import { nombresTipoMovimientoDiaLibre, nombresTipoPermiso } from "@/datos/catalogos";
import { contarDiasHabiles, esDiaHabil } from "@/datos/feriados";
import type { TipoMovimientoDiaLibre, TipoPermiso } from "@/datos/tipos";
import { registrarMovimientoDiaLibre, registrarPermiso, resolverSolicitud } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { fechaDeHoy, nombreCompleto, pluralizar } from "@/lib/formato";
import { resumenPermisos, saldoDiasLibres } from "@/lib/vacaciones";

function Errores({ errores }: { errores: string[] }) {
  if (errores.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 text-sm text-destructive sm:col-span-2">
      {errores.map((error) => (
        <li key={error} className="flex items-start gap-1.5">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </li>
      ))}
    </ul>
  );
}

function SelectorPersona({ valor, alCambiar }: { valor: string; alCambiar: (valor: string) => void }) {
  const { personas } = useEstadoDemo();
  const opciones = Object.fromEntries(personas.map((persona) => [persona.id, nombreCompleto(persona)]));
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label htmlFor="persona-registro">Persona</Label>
      <SelectorSimple id="persona-registro" opciones={opciones} valor={valor} alCambiar={alCambiar} textoVacio="Elija a la persona" />
    </div>
  );
}

// Día libre ganado (por trabajar un feriado o un fin de semana) o usado.
export function DialogoDiaLibre({
  idPersonaFija,
  abierto,
  alCambiarAbierto,
}: {
  idPersonaFija?: string;
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
}) {
  const estado = useEstadoDemo();
  const [idElegido, setIdElegido] = useState("");
  const [tipo, setTipo] = useState<TipoMovimientoDiaLibre>("ganado");
  const [fecha, setFecha] = useState(fechaDeHoy());
  const [motivo, setMotivo] = useState("");
  const idPersona = idPersonaFija ?? idElegido;
  const persona = estado.personas.find((item) => item.id === idPersona);
  const saldo = persona ? saldoDiasLibres(persona.id, estado.movimientosDiasLibres).saldo : 0;

  const errores: string[] = [];
  if (persona && fecha && tipo === "usado" && saldo < 1) errores.push("No tiene días libres ganados para usar.");
  if (fecha && tipo === "usado" && !esDiaHabil(fecha)) errores.push("Un día libre se usa en un día hábil.");
  if (fecha && tipo === "ganado" && esDiaHabil(fecha)) errores.push("Se gana trabajando un feriado o un fin de semana: la fecha es un día hábil.");

  function guardar() {
    if (!persona) return;
    const textoMotivo = motivo.trim() || (tipo === "usado" ? "Día libre" : "Trabajó en día no hábil");
    registrarMovimientoDiaLibre({ idPersona: persona.id, tipo, fecha, dias: 1, motivo: textoMotivo });
    toast.success(tipo === "ganado" ? `Día libre ganado registrado para ${nombreCompleto(persona)}.` : `Día libre usado por ${nombreCompleto(persona)}.`);
    alCambiarAbierto(false);
    setMotivo("");
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar día libre</DialogTitle>
          <DialogDescription>
            {persona ? `${nombreCompleto(persona)} · saldo actual: ${pluralizar(saldo, "día", "días")}` : "Se gana al trabajar un feriado o un fin de semana."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {!idPersonaFija && <SelectorPersona valor={idElegido} alCambiar={setIdElegido} />}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tipo-dia-libre">Movimiento</Label>
            <SelectorSimple id="tipo-dia-libre" opciones={nombresTipoMovimientoDiaLibre} valor={tipo} alCambiar={setTipo} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fecha-dia-libre">{tipo === "ganado" ? "Día trabajado" : "Día de descanso"}</Label>
            <Input id="fecha-dia-libre" type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="motivo-dia-libre">Detalle</Label>
            <Input
              id="motivo-dia-libre"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder={tipo === "ganado" ? "Por ejemplo: trabajó el sábado en una instalación" : "Por ejemplo: día libre"}
            />
          </div>
          <Errores errores={persona ? errores : []} />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button onClick={guardar} disabled={!persona || !fecha || errores.length > 0}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Permiso con o sin goce de haber. Los con goce tienen un cupo por gestión; los
// sin goce se descuentan en la planilla del mes.
export function DialogoPermiso({
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
  const [idElegido, setIdElegido] = useState("");
  const [tipo, setTipo] = useState<TipoPermiso>("con_goce");
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [motivo, setMotivo] = useState("");
  const idPersona = idPersonaFija ?? idElegido;
  const persona = estado.personas.find((item) => item.id === idPersona);
  const resumen = persona ? resumenPermisos(persona.id, estado.permisos, hoy) : null;
  const fechasValidas = desde !== "" && hasta !== "" && hasta >= desde;
  const dias = fechasValidas ? contarDiasHabiles(desde, hasta) : 0;

  const errores: string[] = [];
  if (!fechasValidas) errores.push("Revise las fechas.");
  else if (dias === 0) errores.push("El rango elegido no tiene días hábiles.");
  if (resumen && tipo === "con_goce" && dias > resumen.saldoConGoce) {
    errores.push(`Supera el cupo con goce de haber (le quedan ${resumen.saldoConGoce}). Regístrelo sin goce o en partes.`);
  }

  function guardar() {
    if (!persona) return;
    registrarPermiso({ idPersona: persona.id, tipo, desde, hasta, motivo: motivo.trim() });
    toast.success(`Permiso registrado para ${nombreCompleto(persona)}.`, {
      description: tipo === "sin_goce" ? "Se descuenta en la planilla del mes." : undefined,
    });
    alCambiarAbierto(false);
    setMotivo("");
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar permiso</DialogTitle>
          <DialogDescription>
            {persona && resumen
              ? `${nombreCompleto(persona)} · con goce: ${resumen.saldoConGoce} de ${resumen.cupoConGoce} días disponibles este año`
              : "Con goce de haber, dentro del cupo anual, o sin goce, con descuento en la planilla."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {!idPersonaFija && <SelectorPersona valor={idElegido} alCambiar={setIdElegido} />}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="tipo-permiso">Tipo</Label>
            <SelectorSimple id="tipo-permiso" opciones={nombresTipoPermiso} valor={tipo} alCambiar={setTipo} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="desde-permiso">Desde</Label>
            <Input
              id="desde-permiso"
              type="date"
              value={desde}
              onChange={(evento) => {
                setDesde(evento.target.value);
                if (hasta < evento.target.value) setHasta(evento.target.value);
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="hasta-permiso">Hasta</Label>
            <Input id="hasta-permiso" type="date" min={desde} value={hasta} onChange={(evento) => setHasta(evento.target.value)} />
          </div>
          <p className="text-sm sm:col-span-2">
            <span className="font-medium tabular-nums">{pluralizar(dias, "día hábil", "días hábiles")}</span>
          </p>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="motivo-permiso">Motivo</Label>
            <Input id="motivo-permiso" value={motivo} onChange={(evento) => setMotivo(evento.target.value)} placeholder="Por ejemplo: cita médica" />
          </div>
          <Errores errores={persona ? errores : []} />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button onClick={guardar} disabled={!persona || errores.length > 0 || motivo.trim() === ""}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Rechazo de una solicitud de vacaciones, con un motivo para la persona.
export function DialogoRechazo({
  idSolicitud,
  idResolutor,
  alCerrar,
}: {
  idSolicitud: string | null;
  idResolutor: string;
  alCerrar: () => void;
}) {
  const [motivo, setMotivo] = useState("");

  function rechazar() {
    if (!idSolicitud) return;
    const deshacer = resolverSolicitud(idSolicitud, false, idResolutor, motivo);
    toast.success("Solicitud rechazada.", { action: { label: "Deshacer", onClick: deshacer } });
    setMotivo("");
    alCerrar();
  }

  return (
    <Dialog open={idSolicitud !== null} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar la solicitud</DialogTitle>
          <DialogDescription>La persona verá el motivo en Mis vacaciones.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="motivo-rechazo">Motivo</Label>
          <Textarea
            id="motivo-rechazo"
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            placeholder="Por ejemplo: coincide con el cierre de mes. Reprogramar."
            rows={3}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button variant="destructive" onClick={rechazar} disabled={motivo.trim() === ""}>
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
