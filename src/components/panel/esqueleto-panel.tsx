import { LogoOrdia } from "@/components/marca/logo-ordia";
import { Skeleton } from "@/components/ui/skeleton";
import { empresa } from "@/datos/catalogos";

// Lo que se ve durante el instante en que el navegador carga los datos de la demo.
export function EsqueletoPanel() {
  return (
    <div className="flex min-h-svh w-full">
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r bg-sidebar px-3 py-4 md:flex">
        <LogoOrdia subtitulo={empresa.nombre} />
        <div className="flex flex-col gap-2 px-2">
          {Array.from({ length: 7 }, (_, indice) => (
            <Skeleton key={indice} className="h-7 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <div className="h-14 border-b" />
        <EsqueletoContenido />
      </div>
    </div>
  );
}

export function EsqueletoContenido() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, indice) => (
          <Skeleton key={indice} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
