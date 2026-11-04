import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Control del ciclo de ventas" };

export default function PaginaCicloVentas() {
  return (
    <SeccionEnPreparacion
      titulo="Control del ciclo de ventas"
      descripcion="Cómo avanzan las oportunidades y cuánto tardan en cerrarse."
      contenido={[
        "Monto en cada etapa y tasa de conversión entre etapas.",
        "Días promedio hasta cerrar y oportunidades estancadas.",
        "Resultados por vendedor.",
      ]}
    />
  );
}
