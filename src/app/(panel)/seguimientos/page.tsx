import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Seguimientos y alarmas" };

export default function PaginaSeguimientos() {
  return (
    <SeccionEnPreparacion
      titulo="Seguimientos y alarmas"
      descripcion="Lo que hay que hacer hoy, esta semana y lo vencido."
      contenido={[
        "Seguimientos de hoy, de esta semana y vencidos, resaltados.",
        "Alarmas automáticas: oportunidades sin actividad, propuestas sin respuesta y clientes activos sin contacto en el último mes.",
        "Desde una alarma se registra la actividad y se agenda el próximo seguimiento.",
      ]}
    />
  );
}
