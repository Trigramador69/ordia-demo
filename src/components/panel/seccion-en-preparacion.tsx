import { Hammer } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Pantalla provisoria mientras se construye cada módulo: dice qué va a mostrar,
// para poder recorrer la navegación completa desde el primer día.
export function SeccionEnPreparacion({
  titulo,
  descripcion,
  contenido,
}: {
  titulo: string;
  descripcion: string;
  contenido: string[];
}) {
  return (
    <>
      <EncabezadoPagina titulo={titulo} descripcion={descripcion} />
      <Card className="max-w-2xl border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hammer className="size-4 text-muted-foreground" />
            Pantalla en preparación
          </CardTitle>
          <CardDescription>Esto es lo que va a mostrar:</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm">
            {contenido.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
