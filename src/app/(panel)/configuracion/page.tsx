import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Módulos" };

export default function PaginaConfiguracion() {
  return (
    <SeccionEnPreparacion
      titulo="Módulos"
      descripcion="Módulos opcionales de la plataforma."
      contenido={[
        "Interruptor para activar o desactivar la facturación en vivo durante la presentación.",
        "Sin facturación: no aparece el menú, la venta ganada solo registra el monto y el ingreso va con un asiento manual.",
      ]}
    />
  );
}
