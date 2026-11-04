import type { Metadata } from "next";
import { FichaCliente } from "@/components/crm/ficha-cliente";

export const metadata: Metadata = { title: "Ficha del cliente" };

export default function PaginaCliente() {
  return <FichaCliente />;
}
