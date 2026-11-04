import type { Metadata } from "next";
import { FichaPersona } from "@/components/rrhh/ficha-persona";

export const metadata: Metadata = { title: "Ficha del personal" };

export default function PaginaPersona() {
  return <FichaPersona />;
}
