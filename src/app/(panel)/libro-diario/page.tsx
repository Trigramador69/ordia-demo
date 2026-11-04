import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Libro diario" };

export default function PaginaLibroDiario() {
  return (
    <SeccionEnPreparacion
      titulo="Libro diario"
      descripcion="Asientos automáticos y manuales, en orden."
      contenido={[
        "Asientos con su origen: factura, cobro, planilla, depreciación o manual.",
        "Registro de asientos manuales con validación de debe igual a haber.",
      ]}
    />
  );
}
