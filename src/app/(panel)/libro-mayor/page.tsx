import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Libro mayor" };

export default function PaginaLibroMayor() {
  return (
    <SeccionEnPreparacion
      titulo="Libro mayor"
      descripcion="Movimientos y saldo de cada cuenta."
      contenido={[
        "Movimientos de la cuenta elegida con su saldo acumulado.",
      ]}
    />
  );
}
