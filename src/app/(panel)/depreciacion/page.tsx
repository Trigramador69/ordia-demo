import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Depreciación del mes" };

export default function PaginaDepreciacion() {
  return (
    <SeccionEnPreparacion
      titulo="Depreciación del mes"
      descripcion="Depreciación lineal por categoría según su vida útil."
      contenido={[
        "Depreciación del mes por categoría y por activo.",
        "Genera su asiento contable.",
      ]}
    />
  );
}
