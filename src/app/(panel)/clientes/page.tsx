import type { Metadata } from "next";
import { ListaClientes } from "@/components/crm/lista-clientes";

export const metadata: Metadata = { title: "Clientes" };

export default function PaginaClientes() {
  return <ListaClientes />;
}
