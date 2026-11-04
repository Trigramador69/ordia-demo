import type { Metadata } from "next";
import { ListaFacturas } from "@/components/facturacion/lista-facturas";

export const metadata: Metadata = { title: "Facturas" };

export default function PaginaFacturas() {
  return <ListaFacturas />;
}
