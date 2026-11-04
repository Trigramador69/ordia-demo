import type { Metadata } from "next";
import { VistaPlanilla } from "@/components/planilla/vista-planilla";

export const metadata: Metadata = { title: "Planilla del mes" };

export default function PaginaPlanilla() {
  return <VistaPlanilla />;
}
