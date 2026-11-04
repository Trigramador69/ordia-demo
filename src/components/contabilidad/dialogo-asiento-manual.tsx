"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
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
import { parametrosImpuestos } from "@/datos/parametros";
import { cuentasDelSistema, planDeCuentas } from "@/datos/plan-cuentas";
import { redondear, totalesDeAsiento, validarAsiento } from "@/lib/contabilidad";
import { registrarAsientoManual } from "@/lib/demo/acciones";
import { fechaDeHoy, formatearImporte } from "@/lib/formato";
import { cn } from "@/lib/utils";

interface LineaEditable {
  clave: number;
  codigoCuenta: string;
  debe: string;
  haber: string;
}

type Plantilla = "en_blanco" | "ingreso" | "gasto";

const nombresPlantilla: Record<Plantilla, string> = {
  en_blanco: "En blanco",
  ingreso: "Ingreso por una venta facturada en otro sistema",
  gasto: "Pago de un gasto por banco",
};

const opcionesCuenta = Object.fromEntries(
  planDeCuentas.filter((cuenta) => cuenta.imputable).map((cuenta) => [cuenta.codigo, `${cuenta.codigo} ${cuenta.nombre}`]),
);

const numero = (texto: string) => (texto.trim() === "" ? 0 : Number(texto.replace(",", ".")));

// Líneas de cada plantilla. El ingreso reparte el monto como lo hace el
// asiento automático de una factura: ingreso, IVA e IT.
function lineasDePlantilla(plantilla: Plantilla, monto: number): Omit<LineaEditable, "clave">[] {
  const texto = (valor: number) => (valor > 0 ? String(redondear(valor)) : "");
  if (plantilla === "ingreso") {
    const iva = redondear(monto * parametrosImpuestos.iva);
    const it = redondear(monto * parametrosImpuestos.impuestoTransacciones);
    return [
      { codigoCuenta: cuentasDelSistema.cuentasPorCobrar, debe: texto(monto), haber: "" },
      { codigoCuenta: cuentasDelSistema.ingresosPorServicios, debe: "", haber: texto(monto - iva) },
      { codigoCuenta: cuentasDelSistema.debitoFiscalIva, debe: "", haber: texto(iva) },
      { codigoCuenta: cuentasDelSistema.impuestoTransaccionesGasto, debe: texto(it), haber: "" },
      { codigoCuenta: cuentasDelSistema.impuestoTransaccionesPorPagar, debe: "", haber: texto(it) },
    ];
  }
  if (plantilla === "gasto") {
    return [
      { codigoCuenta: "5.2.1.05", debe: texto(monto), haber: "" },
      { codigoCuenta: cuentasDelSistema.banco, debe: "", haber: texto(monto) },
    ];
  }
  return [
    { codigoCuenta: "", debe: "", haber: "" },
    { codigoCuenta: "", debe: "", haber: "" },
  ];
}

export function DialogoAsientoManual({ abierto, alCambiarAbierto }: { abierto: boolean; alCambiarAbierto: (abierto: boolean) => void }) {
  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nuevo asiento manual</DialogTitle>
          <DialogDescription>Solo se registra si el debe es igual al haber y todas las cuentas son de movimiento.</DialogDescription>
        </DialogHeader>
        {abierto && <Formulario alTerminar={() => alCambiarAbierto(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Formulario({ alTerminar }: { alTerminar: () => void }) {
  const hoy = fechaDeHoy();
  const [plantilla, setPlantilla] = useState<Plantilla>("en_blanco");
  const [montoPlantilla, setMontoPlantilla] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [glosa, setGlosa] = useState("");
  const [lineas, setLineas] = useState<LineaEditable[]>(lineasDePlantilla("en_blanco", 0).map((linea, indice) => ({ ...linea, clave: indice })));

  const lineasNumericas = lineas.map((linea) => ({ codigoCuenta: linea.codigoCuenta, debe: numero(linea.debe), haber: numero(linea.haber) }));
  const errores = validarAsiento({ fecha, glosa, lineas: lineasNumericas });
  const { debe, haber } = totalesDeAsiento(lineasNumericas.map((linea) => ({ ...linea, debe: linea.debe || 0, haber: linea.haber || 0 })));
  const cuadra = Math.round(debe * 100) === Math.round(haber * 100) && debe > 0;

  function aplicarPlantilla(nueva: Plantilla, monto = numero(montoPlantilla)) {
    setPlantilla(nueva);
    setLineas(lineasDePlantilla(nueva, monto).map((linea, indice) => ({ ...linea, clave: indice })));
    if (nueva === "ingreso" && glosa === "") setGlosa("Venta de servicios según factura N° ");
    if (nueva === "gasto" && glosa === "") setGlosa("Pago de ");
  }

  function cambiar(clave: number, campo: "codigoCuenta" | "debe" | "haber", valor: string) {
    setLineas((actuales) =>
      actuales.map((linea) => {
        if (linea.clave !== clave) return linea;
        // Un monto en el debe vacía el haber de la misma línea, y al revés.
        if (campo === "debe" && valor !== "") return { ...linea, debe: valor, haber: "" };
        if (campo === "haber" && valor !== "") return { ...linea, haber: valor, debe: "" };
        return { ...linea, [campo]: valor };
      }),
    );
  }

  function guardar() {
    const asiento = registrarAsientoManual({ fecha, glosa: glosa.trim(), lineas: lineasNumericas });
    toast.success(`Asiento N° ${asiento.numero} registrado.`, { description: glosa.trim() });
    alTerminar();
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="plantilla-asiento">Plantilla</Label>
          <SelectorSimple id="plantilla-asiento" opciones={nombresPlantilla} valor={plantilla} alCambiar={(valor) => aplicarPlantilla(valor)} />
        </div>
        {plantilla !== "en_blanco" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="monto-plantilla">Monto (Bs)</Label>
            <Input
              id="monto-plantilla"
              inputMode="decimal"
              value={montoPlantilla}
              onChange={(evento) => {
                setMontoPlantilla(evento.target.value);
                aplicarPlantilla(plantilla, numero(evento.target.value));
              }}
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="glosa-asiento">Glosa</Label>
          <Input id="glosa-asiento" value={glosa} onChange={(evento) => setGlosa(evento.target.value)} placeholder="Qué se registra" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha-asiento">Fecha</Label>
          <Input id="fecha-asiento" type="date" max={hoy} value={fecha} onChange={(evento) => setFecha(evento.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_7rem_7rem_2rem] gap-2 text-xs font-medium text-muted-foreground">
          <span>Cuenta</span>
          <span className="text-right">Debe (Bs)</span>
          <span className="text-right">Haber (Bs)</span>
          <span />
        </div>
        {lineas.map((linea, indice) => (
          <div key={linea.clave} className="grid grid-cols-[1fr_7rem_7rem_2rem] items-center gap-2">
            <SelectorSimple opciones={opcionesCuenta} valor={linea.codigoCuenta} alCambiar={(valor) => cambiar(linea.clave, "codigoCuenta", valor)} textoVacio="Elija la cuenta" />
            <Input aria-label={`Debe de la línea ${indice + 1}`} inputMode="decimal" className="text-right" value={linea.debe} onChange={(evento) => cambiar(linea.clave, "debe", evento.target.value)} />
            <Input aria-label={`Haber de la línea ${indice + 1}`} inputMode="decimal" className="text-right" value={linea.haber} onChange={(evento) => cambiar(linea.clave, "haber", evento.target.value)} />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Quitar línea"
              disabled={lineas.length <= 2}
              onClick={() => setLineas((actuales) => actuales.filter((item) => item.clave !== linea.clave))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_7rem_7rem_2rem] items-center gap-2 border-t pt-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => setLineas((actuales) => [...actuales, { clave: Math.max(...actuales.map((item) => item.clave)) + 1, codigoCuenta: "", debe: "", haber: "" }])}
          >
            <Plus />
            Agregar línea
          </Button>
          <span className="text-right font-medium tabular-nums">{formatearImporte(debe)}</span>
          <span className="text-right font-medium tabular-nums">{formatearImporte(haber)}</span>
          <span />
        </div>
      </div>

      <div className={cn("rounded-lg px-3 py-2 text-sm", errores.length === 0 ? "bg-exito-suave text-exito" : "bg-muted")}>
        {errores.length === 0 ? (
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            Cuadra: debe y haber suman {formatearImporte(debe)}.
          </span>
        ) : (
          <ul className="flex flex-col gap-1">
            {(cuadra ? errores : [`Diferencia entre debe y haber: ${formatearImporte(Math.abs(debe - haber))}.`, ...errores.filter((error) => !error.startsWith("El debe"))]).map((error) => (
              <li key={error} className="flex items-start gap-1.5 text-muted-foreground">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </li>
            ))}
          </ul>
        )}
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
        <Button onClick={guardar} disabled={errores.length > 0}>
          Registrar asiento
        </Button>
      </DialogFooter>
    </>
  );
}
