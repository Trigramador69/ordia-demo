import type { Metadata } from "next";
import { FichaActivo } from "@/components/activos/ficha-activo";

export const metadata: Metadata = { title: "Ficha del activo" };

export default function PaginaActivo() {
  return <FichaActivo />;
}
