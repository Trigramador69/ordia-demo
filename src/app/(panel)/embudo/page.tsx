import type { Metadata } from "next";
import { TableroEmbudo } from "@/components/crm/tablero-embudo";

export const metadata: Metadata = { title: "Embudo de ventas" };

export default function PaginaEmbudo() {
  return <TableroEmbudo />;
}
