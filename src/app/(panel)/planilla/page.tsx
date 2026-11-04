import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Planilla del mes" };

export default function PaginaPlanilla() {
  return (
    <SeccionEnPreparacion
      titulo="Planilla del mes"
      descripcion="Sueldos del mes con descuentos, aportes y provisiones."
      contenido={[
        "Por persona: haber básico, bono de antigüedad, total ganado, descuentos (AFP, RC-IVA, días sin goce de haber) y líquido pagable.",
        "Totales del mes, aportes patronales y provisiones de aguinaldo e indemnización.",
        "Cerrar la planilla la deja fija y genera su asiento contable, con las provisiones incluidas.",
        "La boleta de cada persona, lista para imprimir o descargar en PDF.",
      ]}
    />
  );
}
