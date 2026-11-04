import type { Metadata } from "next";
import { Reportes } from "@/components/contabilidad/reportes";

export const metadata: Metadata = { title: "Reportes contables" };

export default function PaginaReportes() {
  return <Reportes />;
}
