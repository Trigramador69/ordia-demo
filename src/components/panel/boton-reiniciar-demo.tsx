"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reiniciarDemo } from "@/lib/demo/almacen";

export function BotonReiniciarDemo({ className }: { className?: string }) {
  const [abierto, setAbierto] = useState(false);

  function confirmar() {
    reiniciarDemo();
    setAbierto(false);
    toast.success("La demo volvió a su estado inicial.");
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger render={<Button variant="outline" size="sm" className={className} />}>
        <RotateCcw />
        Reiniciar demo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Reiniciar la demo?</DialogTitle>
          <DialogDescription>
            Se descartan los cambios hechos en este navegador (solicitudes, seguimientos, facturas, asientos y
            demás) y se vuelve a los datos de ejemplo originales, con fechas relativas a hoy.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button onClick={confirmar}>Reiniciar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
