import type { Metadata } from "next";
import { VistaDepreciacion } from "@/components/activos/vista-depreciacion";

export const metadata: Metadata = { title: "Depreciación del mes" };

export default function PaginaDepreciacion() {
  return <VistaDepreciacion />;
}
