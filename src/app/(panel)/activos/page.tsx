import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Activos fijos" };

export default function PaginaActivos() {
  return (
    <SeccionEnPreparacion
      titulo="Activos fijos"
      descripcion="Bienes de la empresa con su responsable y su valor actual."
      contenido={[
        "Lista con categoría, fecha y valor de compra, responsable, ubicación, valor actual y estado.",
        "Ficha del activo con su cuadro de depreciación mes a mes e historial.",
      ]}
    />
  );
}
