import type { Metadata } from "next";
import { SeccionEnPreparacion } from "@/components/panel/seccion-en-preparacion";

export const metadata: Metadata = { title: "Clientes" };

export default function PaginaClientes() {
  return (
    <SeccionEnPreparacion
      titulo="Clientes"
      descripcion="Cuentas comerciales con su vendedor y su próximo seguimiento."
      contenido={[
        "Los 100 clientes con rubro, ciudad, contacto, vendedor a cargo, estado y fecha del próximo seguimiento.",
        "Búsqueda y filtros por estado, vendedor, rubro y ciudad.",
        "Ficha del cliente: contactos, oportunidades, historial de actividades y seguimientos pendientes.",
      ]}
    />
  );
}
