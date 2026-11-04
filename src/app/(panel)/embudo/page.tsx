import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Embudo de ventas" };

export default function PaginaEmbudo() {
  return (
    <SeccionEnPreparacion
      titulo="Embudo de ventas"
      descripcion="Oportunidades por etapa, con monto y probabilidad."
      contenido={[
        "Tablero por etapas: prospecto, contactado, propuesta enviada, negociación, ganada y perdida.",
        "Las oportunidades se arrastran de una etapa a otra y los indicadores se actualizan.",
      ]}
    />
  );
}
