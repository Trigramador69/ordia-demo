import type { Metadata } from "next";
import { VistaCobros } from "@/components/facturacion/vista-cobros";

export const metadata: Metadata = { title: "Cobros" };

export default function PaginaCobros() {
  return <VistaCobros />;
}
