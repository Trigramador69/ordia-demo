"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { usuarioDelRol } from "@/components/panel/selector-rol";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { motivosPerdida, nombresTipoActividad, servicios } from "@/datos/catalogos";
import { idsVendedores } from "@/datos/equipo";
import { sumarDias } from "@/datos/fechas";
import { diaHabilDesde } from "@/datos/feriados";
import type { Oportunidad, Seguimiento, TipoActividad } from "@/datos/tipos";
import { agendarSeguimiento, crearOportunidad, moverOportunidad, registrarActividad } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { clientePorId, clientesVisibles, idVendedorDelRol } from "@/lib/demo/consultas";
import { esAbierta } from "@/lib/crm";
import { fechaDeHoy, formatearFecha, formatearMonto, nombreCompleto } from "@/lib/formato";

const sinOportunidad = "ninguna";

function Campo({ id, etiqueta, children, ancho }: { id: string; etiqueta: string; children: React.ReactNode; ancho?: boolean }) {
  return (
    <div className={`flex flex-col gap-2 ${ancho ? "sm:col-span-2" : ""}`}>
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
    </div>
  );
}

// Oportunidades abiertas de un cliente, para elegir a cuál va una actividad.
function opcionesOportunidad(oportunidades: Oportunidad[], idCliente: string) {
  const opciones: Record<string, string> = { [sinOportunidad]: "General de la cuenta" };
  for (const oportunidad of oportunidades.filter((item) => item.idCliente === idCliente && esAbierta(item))) {
    opciones[oportunidad.id] = `${oportunidad.titulo} (${formatearMonto(oportunidad.monto)})`;
  }
  return opciones;
}

// --- Registrar actividad ---

export function DialogoRegistrarActividad({
  idCliente,
  idOportunidad,
  seguimiento,
  abierto,
  alCambiarAbierto,
}: {
  idCliente: string;
  idOportunidad?: string | null;
  // Si se registra desde un seguimiento, queda como realizado.
  seguimiento?: Seguimiento | null;
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
}) {
  const estado = useEstadoDemo();
  const cliente = clientePorId(estado, idCliente);
  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{seguimiento ? "Registrar lo que se hizo" : "Registrar actividad"}</DialogTitle>
          <DialogDescription>
            {cliente?.razonSocial}
            {seguimiento && ` · Seguimiento: ${seguimiento.motivo}`}
          </DialogDescription>
        </DialogHeader>
        {abierto && (
          <FormularioActividad
            idCliente={idCliente}
            idOportunidad={idOportunidad ?? seguimiento?.idOportunidad ?? null}
            seguimiento={seguimiento ?? null}
            alTerminar={() => alCambiarAbierto(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormularioActividad({
  idCliente,
  idOportunidad,
  seguimiento,
  alTerminar,
}: {
  idCliente: string;
  idOportunidad: string | null;
  seguimiento: Seguimiento | null;
  alTerminar: () => void;
}) {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const [tipo, setTipo] = useState<TipoActividad>("llamada");
  const [oportunidad, setOportunidad] = useState(idOportunidad ?? sinOportunidad);
  const [fecha, setFecha] = useState(hoy);
  const [descripcion, setDescripcion] = useState("");
  const [agendar, setAgendar] = useState(true);
  const [fechaProximo, setFechaProximo] = useState(diaHabilDesde(sumarDias(hoy, 7)));
  const [motivoProximo, setMotivoProximo] = useState(seguimiento?.motivo ?? "Llamada de seguimiento");
  const opciones = opcionesOportunidad(estado.oportunidades, idCliente);
  const valido = descripcion.trim() !== "" && fecha !== "" && fecha <= hoy && (!agendar || (fechaProximo > hoy && motivoProximo.trim() !== ""));

  function guardar() {
    registrarActividad(
      {
        idCliente,
        idOportunidad: oportunidad === sinOportunidad ? null : oportunidad,
        tipo,
        fecha,
        descripcion: descripcion.trim(),
        idAutor: usuarioDelRol(estado).id,
      },
      {
        idSeguimientoRealizado: seguimiento?.id,
        proximoSeguimiento: agendar ? { fecha: fechaProximo, motivo: motivoProximo.trim() } : undefined,
      },
    );
    toast.success(`${nombresTipoActividad[tipo]} registrada.`, {
      description: agendar ? `Próximo seguimiento: ${formatearFecha(fechaProximo)}.` : seguimiento ? "El seguimiento quedó como realizado." : undefined,
    });
    alTerminar();
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="tipo-actividad" etiqueta="Tipo">
          <SelectorSimple id="tipo-actividad" opciones={nombresTipoActividad} valor={tipo} alCambiar={setTipo} />
        </Campo>
        <Campo id="fecha-actividad" etiqueta="Fecha">
          <Input id="fecha-actividad" type="date" max={hoy} value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
        </Campo>
        {Object.keys(opciones).length > 1 && (
          <Campo id="oportunidad-actividad" etiqueta="Oportunidad" ancho>
            <SelectorSimple id="oportunidad-actividad" opciones={opciones} valor={oportunidad} alCambiar={setOportunidad} />
          </Campo>
        )}
        <Campo id="descripcion-actividad" etiqueta="Qué se habló o se hizo" ancho>
          <Textarea
            id="descripcion-actividad"
            value={descripcion}
            onChange={(evento) => setDescripcion(evento.target.value)}
            placeholder="Por ejemplo: confirmó que revisan la propuesta el viernes con su gerente."
            rows={3}
          />
        </Campo>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Checkbox checked={agendar} onCheckedChange={(valor) => setAgendar(valor === true)} />
          Agendar el próximo seguimiento
        </label>
        {agendar && (
          <>
            <Campo id="fecha-proximo" etiqueta="Fecha">
              <Input id="fecha-proximo" type="date" min={sumarDias(hoy, 1)} value={fechaProximo} onChange={(evento) => setFechaProximo(evento.target.value)} />
            </Campo>
            <Campo id="motivo-proximo" etiqueta="Para qué">
              <Input id="motivo-proximo" value={motivoProximo} onChange={(evento) => setMotivoProximo(evento.target.value)} />
            </Campo>
          </>
        )}
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button onClick={guardar} disabled={!valido}>
          Registrar
        </Button>
      </DialogFooter>
    </>
  );
}

// --- Agendar seguimiento ---

export function DialogoAgendarSeguimiento({
  idCliente,
  idOportunidad,
  abierto,
  alCambiarAbierto,
}: {
  idCliente: string;
  idOportunidad?: string | null;
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
}) {
  const estado = useEstadoDemo();
  const cliente = clientePorId(estado, idCliente);
  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar seguimiento</DialogTitle>
          <DialogDescription>{cliente?.razonSocial} · aparece en la lista de seguimientos y en la campana el día que toca.</DialogDescription>
        </DialogHeader>
        {abierto && cliente && (
          <FormularioSeguimiento idCliente={idCliente} idOportunidad={idOportunidad ?? null} idResponsable={cliente.idVendedor} alTerminar={() => alCambiarAbierto(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormularioSeguimiento({
  idCliente,
  idOportunidad,
  idResponsable,
  alTerminar,
}: {
  idCliente: string;
  idOportunidad: string | null;
  idResponsable: string;
  alTerminar: () => void;
}) {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const [fecha, setFecha] = useState(diaHabilDesde(sumarDias(hoy, 2)));
  const [motivo, setMotivo] = useState("");
  const [oportunidad, setOportunidad] = useState(idOportunidad ?? sinOportunidad);
  const opciones = opcionesOportunidad(estado.oportunidades, idCliente);

  function guardar() {
    agendarSeguimiento({
      idCliente,
      idOportunidad: oportunidad === sinOportunidad ? null : oportunidad,
      fecha,
      motivo: motivo.trim(),
      idResponsable,
    });
    toast.success(`Seguimiento agendado para el ${formatearFecha(fecha)}.`);
    alTerminar();
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="fecha-seguimiento" etiqueta="Fecha">
          <Input id="fecha-seguimiento" type="date" min={hoy} value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
        </Campo>
        {Object.keys(opciones).length > 1 && (
          <Campo id="oportunidad-seguimiento" etiqueta="Oportunidad">
            <SelectorSimple id="oportunidad-seguimiento" opciones={opciones} valor={oportunidad} alCambiar={setOportunidad} />
          </Campo>
        )}
        <Campo id="motivo-seguimiento" etiqueta="Para qué" ancho>
          <Input id="motivo-seguimiento" value={motivo} onChange={(evento) => setMotivo(evento.target.value)} placeholder="Por ejemplo: llamar para conocer su decisión" />
        </Campo>
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button onClick={guardar} disabled={fecha < hoy || motivo.trim() === ""}>
          Agendar
        </Button>
      </DialogFooter>
    </>
  );
}

// --- Oportunidad perdida ---

const otroMotivo = "otro";

export function DialogoPerdida({ oportunidad, alCerrar }: { oportunidad: Oportunidad | null; alCerrar: () => void }) {
  const estado = useEstadoDemo();
  const [motivo, setMotivo] = useState(motivosPerdida[0]);
  const [detalle, setDetalle] = useState("");
  const opciones: Record<string, string> = Object.fromEntries([...motivosPerdida.map((item) => [item, item]), [otroMotivo, "Otro motivo"]]);
  const texto = motivo === otroMotivo ? detalle.trim() : motivo;

  function confirmar() {
    if (!oportunidad) return;
    const deshacer = moverOportunidad(oportunidad.id, "perdida", usuarioDelRol(estado).id, texto);
    toast.success("Oportunidad marcada como perdida.", { action: { label: "Deshacer", onClick: deshacer } });
    alCerrar();
  }

  return (
    <Dialog open={oportunidad !== null} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Por qué se perdió?</DialogTitle>
          <DialogDescription>
            {oportunidad?.titulo} · el motivo alimenta el control del ciclo de ventas.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <SelectorSimple opciones={opciones} valor={motivo} alCambiar={setMotivo} />
          {motivo === otroMotivo && (
            <Input value={detalle} onChange={(evento) => setDetalle(evento.target.value)} placeholder="Describa el motivo" aria-label="Motivo" />
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button variant="destructive" onClick={confirmar} disabled={texto === ""}>
            Marcar como perdida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Nueva oportunidad ---

export function DialogoNuevaOportunidad({
  idClienteFijo,
  abierto,
  alCambiarAbierto,
}: {
  idClienteFijo?: string;
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
}) {
  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva oportunidad</DialogTitle>
          <DialogDescription>Entra al embudo en la etapa Prospecto.</DialogDescription>
        </DialogHeader>
        {abierto && <FormularioOportunidad idClienteFijo={idClienteFijo} alTerminar={() => alCambiarAbierto(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function FormularioOportunidad({ idClienteFijo, alTerminar }: { idClienteFijo?: string; alTerminar: () => void }) {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const clientes = clientesVisibles(estado).filter((cliente) => cliente.estado !== "inactivo" || cliente.id === idClienteFijo);
  const opcionesCliente = Object.fromEntries(
    [...clientes].sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, "es")).map((cliente) => [cliente.id, cliente.razonSocial]),
  );
  const opcionesServicio = Object.fromEntries(servicios.map((servicio) => [servicio.id, servicio.nombre]));
  const [idCliente, setIdCliente] = useState(idClienteFijo ?? "");
  const [idServicio, setIdServicio] = useState(servicios[0].id);
  const [titulo, setTitulo] = useState(servicios[0].nombre);
  const [monto, setMonto] = useState("");
  const [cierre, setCierre] = useState(sumarDias(hoy, 30));
  const cliente = clientePorId(estado, idCliente);
  const montoNumero = Number(monto.replace(",", "."));
  const valido = cliente !== undefined && titulo.trim() !== "" && montoNumero > 0 && cierre >= hoy;

  function elegirServicio(id: string) {
    const anterior = servicios.find((servicio) => servicio.id === idServicio);
    if (titulo === anterior?.nombre) setTitulo(servicios.find((servicio) => servicio.id === id)?.nombre ?? titulo);
    setIdServicio(id);
  }

  function guardar() {
    if (!cliente) return;
    // Ventas crea a su nombre; el gerente, a nombre del vendedor del cliente.
    const idVendedor = idVendedorDelRol(estado) ?? (idsVendedores.includes(cliente.idVendedor) ? cliente.idVendedor : idsVendedores[0]);
    crearOportunidad({ idCliente: cliente.id, titulo: titulo.trim(), idServicio, monto: montoNumero, fechaCierreEstimada: cierre, idVendedor });
    const vendedor = estado.personas.find((persona) => persona.id === idVendedor);
    toast.success("Oportunidad creada en Prospecto.", { description: vendedor ? `A cargo de ${nombreCompleto(vendedor)}.` : undefined });
    alTerminar();
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {!idClienteFijo && (
          <Campo id="cliente-oportunidad" etiqueta="Cliente" ancho>
            <SelectorSimple id="cliente-oportunidad" opciones={opcionesCliente} valor={idCliente} alCambiar={setIdCliente} textoVacio="Elija el cliente" />
          </Campo>
        )}
        <Campo id="servicio-oportunidad" etiqueta="Servicio" ancho>
          <SelectorSimple id="servicio-oportunidad" opciones={opcionesServicio} valor={idServicio} alCambiar={elegirServicio} />
        </Campo>
        <Campo id="titulo-oportunidad" etiqueta="Título" ancho>
          <Input id="titulo-oportunidad" value={titulo} onChange={(evento) => setTitulo(evento.target.value)} />
        </Campo>
        <Campo id="monto-oportunidad" etiqueta="Monto estimado (Bs)">
          <Input id="monto-oportunidad" inputMode="decimal" value={monto} onChange={(evento) => setMonto(evento.target.value)} placeholder="Por ejemplo: 24000" />
        </Campo>
        <Campo id="cierre-oportunidad" etiqueta="Cierre estimado">
          <Input id="cierre-oportunidad" type="date" min={hoy} value={cierre} onChange={(evento) => setCierre(evento.target.value)} />
        </Campo>
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button onClick={guardar} disabled={!valido}>
          Crear oportunidad
        </Button>
      </DialogFooter>
    </>
  );
}
