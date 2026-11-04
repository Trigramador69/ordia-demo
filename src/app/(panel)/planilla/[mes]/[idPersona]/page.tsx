import type { Metadata } from "next";
import { BoletaDePago } from "@/components/planilla/boleta-de-pago";

export const metadata: Metadata = { title: "Boleta de pago" };

export default function PaginaBoleta() {
  return <BoletaDePago />;
}
