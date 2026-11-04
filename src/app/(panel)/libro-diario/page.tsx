import type { Metadata } from "next";
import { LibroDiario } from "@/components/contabilidad/libro-diario";

export const metadata: Metadata = { title: "Libro diario" };

export default function PaginaLibroDiario() {
  return <LibroDiario />;
}
