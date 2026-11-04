import type { Metadata } from "next";
import { VistaFactura } from "@/components/facturacion/vista-factura";

export const metadata: Metadata = { title: "Factura" };

export default function PaginaFactura() {
  return <VistaFactura />;
}
