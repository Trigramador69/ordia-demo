import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Facturas" };

export default function PaginaFacturas() {
  return (
    <SeccionEnPreparacion
      titulo="Facturas"
      descripcion="Facturación simulada, con el formato de una factura en línea."
      contenido={[
        "Lista de facturas con cliente, fecha, monto y estado (vigente, anulada, cobrada, por cobrar).",
        "Emitir desde una oportunidad ganada o desde la ficha del cliente, con número, CUF simulado, QR y PDF.",
        "Anular con motivo: revierte su asiento contable.",
      ]}
    />
  );
}
