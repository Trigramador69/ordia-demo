import type { Metadata } from "next";
import { VistaDiasLibres } from "@/components/rrhh/vista-dias-libres";

export const metadata: Metadata = { title: "Días libres y permisos" };

export default function PaginaDiasLibres() {
  return <VistaDiasLibres />;
}
