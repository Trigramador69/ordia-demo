import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Reportes contables" };

export default function PaginaReportes() {
  return (
    <SeccionEnPreparacion
      titulo="Reportes contables"
      descripcion="Balance de comprobación y estado de resultados."
      contenido={[
        "Balance de comprobación de sumas y saldos.",
        "Estado de resultados del mes.",
      ]}
    />
  );
}
