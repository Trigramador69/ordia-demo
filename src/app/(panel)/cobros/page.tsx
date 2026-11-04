import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Cobros" };

export default function PaginaCobros() {
  return (
    <SeccionEnPreparacion
      titulo="Cobros"
      descripcion="Pagos recibidos de las facturas emitidas."
      contenido={[
        "Registrar el pago de una factura; genera su asiento.",
        "Saldo por cobrar de cada cliente.",
      ]}
    />
  );
}
