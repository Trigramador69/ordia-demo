import type { Metadata } from "next";
import { ListaActivos } from "@/components/activos/lista-activos";

export const metadata: Metadata = { title: "Activos fijos" };

export default function PaginaActivos() {
  return <ListaActivos />;
}
