import type { Metadata } from "next";
import { LibroMayor } from "@/components/contabilidad/libro-mayor";

export const metadata: Metadata = { title: "Libro mayor" };

export default function PaginaLibroMayor() {
  return <LibroMayor />;
}
