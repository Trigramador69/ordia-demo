"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { usuarioDelRol } from "@/components/panel/selector-rol";
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
import { parametrosImpuestos } from "@/datos/parametros";
import type { Factura, MedioDeCobro } from "@/datos/tipos";
import { anularFactura, emitirFactura, registrarCobro } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { clientePorId, oportunidadPorId } from "@/lib/demo/consultas";
import { nombresMedioDeCobro, situacionDeFactura, totalDeLineas } from "@/lib/facturacion";
import { fechaDeHoy, formatearImporte, formatearMonto } from "@/lib/formato";

// --- Emitir factura ---

export function DialogoEmitirFactura({
  idCliente,
  idOportunidad,
  abierto,
  alCambiarAbierto,
}: {
  // Sin cliente, el formulario empieza pidiendo elegirlo.
  idCliente?: string;
  idOportunidad?: string | null;
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
}) {
  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Emitir factura</DialogTitle>
          <DialogDescription>Facturación simulada: tiene el formato de una factura en línea, pero no se envía al SIAT.</DialogDescription>
        </DialogHeader>
        {abierto && <FormularioFactura idClienteInicial={idCliente ?? null} idOportunidad={idOportunidad ?? null} alTerminar={() => alCambiarAbierto(false)} />}
      </DialogContent>
    </Dialog>
  );
}

interface LineaEditable {
  clave: number;
  descripcion: string;
  cantidad: string;
  precio: string;
}

const numero = (texto: string) => Number(texto.replace(",", "."));

function FormularioFactura({
  idClienteInicial,
  idOportunidad,
  alTerminar,
}: {
  idClienteInicial: string | null;
  idOportunidad: string | null;
  alTerminar: () => void;
}) {
  const estado = useEstadoDemo();
  const router = useRouter();
  const [idCliente, setIdCliente] = useState(idClienteInicial ?? "");
  const cliente = clientePorId(estado, idCliente);
  const opcionesCliente = Object.fromEntries(
    estado.clientes
      .filter((item) => item.estado !== "inactivo")
      .sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, "es"))
      .map((item) => [item.id, item.razonSocial]),
  );
  const oportunidad = idOportunidad ? oportunidadPorId(estado, idOportunidad) : undefined;
  const [documento, setDocumento] = useState(cliente?.nit ?? "");
  const [razonSocial, setRazonSocial] = useState(cliente?.razonSocial ?? "");
  const [lineas, setLineas] = useState<LineaEditable[]>([
    { clave: 1, descripcion: oportunidad?.titulo ?? "", cantidad: "1", precio: oportunidad ? String(oportunidad.monto) : "" },
  ]);
  const lineasValidas = lineas.map((linea) => ({ descripcion: linea.descripcion.trim(), cantidad: numero(linea.cantidad), precioUnitario: numero(linea.precio) }));
  const total = totalDeLineas(lineasValidas.filter((linea) => linea.cantidad > 0 && linea.precioUnitario > 0));
  const valido =
    cliente !== undefined &&
    documento.trim() !== "" &&
    razonSocial.trim() !== "" &&
    lineasValidas.every((linea) => linea.descripcion !== "" && linea.cantidad > 0 && linea.precioUnitario > 0);

  function cambiar(clave: number, campo: keyof Omit<LineaEditable, "clave">, valor: string) {
    setLineas((actuales) => actuales.map((linea) => (linea.clave === clave ? { ...linea, [campo]: valor } : linea)));
  }

  function elegirCliente(id: string) {
    const elegido = clientePorId(estado, id);
    setIdCliente(id);
    setDocumento(elegido?.nit ?? "");
    setRazonSocial(elegido?.razonSocial ?? "");
  }

  function emitir() {
    const { factura, asiento } = emitirFactura({
      idCliente,
      idOportunidad,
      documentoCliente: documento.trim(),
      razonSocialCliente: razonSocial.trim(),
      lineas: lineasValidas,
      idEmisor: usuarioDelRol(estado).id,
    });
    toast.success(`Factura N° ${factura.numero} emitida por ${formatearMonto(factura.total)}.`, {
      description: `Se registró el asiento N° ${asiento.numero}: cuenta por cobrar, ingreso, IVA e IT.`,
    });
    alTerminar();
    router.push(`/facturas/${factura.id}`);
  }

  return (
    <>
      {!idClienteInicial && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-factura">Cliente</Label>
          <SelectorSimple id="cliente-factura" opciones={opcionesCliente} valor={idCliente} alCambiar={elegirCliente} textoVacio="Elija el cliente" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="documento-factura">NIT o carnet</Label>
          <Input id="documento-factura" value={documento} onChange={(evento) => setDocumento(evento.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="razon-factura">Razón social</Label>
          <Input id="razon-factura" value={razonSocial} onChange={(evento) => setRazonSocial(evento.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Detalle</span>
        {lineas.map((linea, indice) => (
          <div key={linea.clave} className="grid grid-cols-[1fr_4.5rem_7rem_2rem] items-center gap-2">
            <Input
              aria-label={`Descripción de la línea ${indice + 1}`}
              value={linea.descripcion}
              onChange={(evento) => cambiar(linea.clave, "descripcion", evento.target.value)}
              placeholder="Descripción del servicio"
            />
            <Input aria-label="Cantidad" inputMode="decimal" value={linea.cantidad} onChange={(evento) => cambiar(linea.clave, "cantidad", evento.target.value)} />
            <Input aria-label="Precio unitario (Bs)" inputMode="decimal" value={linea.precio} onChange={(evento) => cambiar(linea.clave, "precio", evento.target.value)} placeholder="Precio Bs" />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Quitar línea"
              disabled={lineas.length === 1}
              onClick={() => setLineas((actuales) => actuales.filter((item) => item.clave !== linea.clave))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => setLineas((actuales) => [...actuales, { clave: Math.max(...actuales.map((item) => item.clave)) + 1, descripcion: "", cantidad: "1", precio: "" }])}
        >
          <Plus />
          Agregar línea
        </Button>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
        <span className="text-muted-foreground">
          Incluye IVA ({parametrosImpuestos.iva * 100}%) por {formatearMonto(Math.round(total * parametrosImpuestos.iva * 100) / 100)}
        </span>
        <span className="font-heading text-lg font-semibold tabular-nums">Total {formatearMonto(total)}</span>
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button onClick={emitir} disabled={!valido}>
          Emitir factura
        </Button>
      </DialogFooter>
    </>
  );
}

// --- Registrar cobro ---

const opcionesMedio = nombresMedioDeCobro as Record<MedioDeCobro, string>;

export function DialogoCobro({ factura, alCerrar }: { factura: Factura | null; alCerrar: () => void }) {
  return (
    <Dialog open={factura !== null} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar cobro</DialogTitle>
          <DialogDescription>
            {factura && `Factura N° ${factura.numero} · ${factura.razonSocialCliente}`}
          </DialogDescription>
        </DialogHeader>
        {factura && <FormularioCobro factura={factura} alTerminar={alCerrar} />}
      </DialogContent>
    </Dialog>
  );
}

function FormularioCobro({ factura, alTerminar }: { factura: Factura; alTerminar: () => void }) {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const { saldo } = situacionDeFactura(factura, estado.cobros);
  const [fecha, setFecha] = useState(hoy);
  const [monto, setMonto] = useState(String(saldo));
  const [medio, setMedio] = useState<MedioDeCobro>("transferencia");
  const montoNumero = numero(monto);
  const valido = montoNumero > 0 && Math.round(montoNumero * 100) <= Math.round(saldo * 100) && fecha >= factura.fecha && fecha <= hoy;

  function guardar() {
    const { asiento } = registrarCobro({ idFactura: factura.id, fecha, monto: montoNumero, medio });
    const resta = Math.round((saldo - montoNumero) * 100) / 100;
    toast.success(`Cobro de ${formatearMonto(montoNumero)} registrado.`, {
      description: `${resta > 0 ? `Queda por cobrar ${formatearMonto(resta)}. ` : "La factura quedó cobrada. "}Asiento N° ${asiento.numero}.`,
    });
    alTerminar();
  }

  return (
    <>
      <p className="rounded-lg bg-muted px-3 py-2 text-sm">
        Saldo por cobrar: <span className="font-semibold tabular-nums">{formatearMonto(saldo)}</span> de {formatearMonto(factura.total)}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="monto-cobro">Monto (Bs)</Label>
          <Input id="monto-cobro" inputMode="decimal" value={monto} onChange={(evento) => setMonto(evento.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha-cobro">Fecha</Label>
          <Input id="fecha-cobro" type="date" min={factura.fecha} max={hoy} value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="medio-cobro">Medio de pago</Label>
          <SelectorSimple id="medio-cobro" opciones={opcionesMedio} valor={medio} alCambiar={setMedio} />
        </div>
      </div>
      {Math.round(montoNumero * 100) > Math.round(saldo * 100) && <p className="text-sm text-destructive">El monto supera el saldo por cobrar.</p>}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button onClick={guardar} disabled={!valido}>
          Registrar cobro
        </Button>
      </DialogFooter>
    </>
  );
}

// --- Anular factura ---

// Motivos de anulación del SIAT que aplican a una factura.
const motivosAnulacion = ["Factura mal emitida", "Datos de emisión incorrectos", "Factura devuelta"];

export function DialogoAnular({ factura, alCerrar }: { factura: Factura | null; alCerrar: () => void }) {
  const [motivo, setMotivo] = useState(motivosAnulacion[0]);
  const opciones = Object.fromEntries(motivosAnulacion.map((item) => [item, item]));

  function anular() {
    if (!factura) return;
    const reverso = anularFactura(factura.id, motivo);
    toast.success(`Factura N° ${factura.numero} anulada.`, { description: `Su asiento se revirtió con el asiento N° ${reverso.numero}.` });
    alCerrar();
  }

  return (
    <Dialog open={factura !== null} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Anular la factura N° {factura?.numero}?</DialogTitle>
          <DialogDescription>
            Queda registrada como anulada y se genera el asiento inverso. Si hay que facturar de nuevo, se emite una factura nueva.
          </DialogDescription>
        </DialogHeader>
        {factura && (
          <p className="text-sm">
            {factura.razonSocialCliente} · <span className="font-medium tabular-nums">Bs {formatearImporte(factura.total)}</span>
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="motivo-anulacion">Motivo</Label>
          <SelectorSimple id="motivo-anulacion" opciones={opciones} valor={motivo} alCambiar={setMotivo} />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button variant="destructive" onClick={anular}>
            Anular factura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
