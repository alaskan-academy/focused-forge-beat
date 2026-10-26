import { cn } from '@/lib/utils';
import { FASES, REGRAS, fase } from '@/lib/caverna/plano';

export default function CavernaRegras({ dia }: { dia: number }) {
  const atual = fase(dia);
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="font-semibold text-foreground mb-3">As 4 fases</h2>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="font-medium pb-2 pr-3">Semana</th>
                <th className="font-medium pb-2 pr-3">Foco</th>
                <th className="font-medium pb-2 pr-3">Dormir</th>
                <th className="font-medium pb-2 pr-3">Bike / caminhada</th>
                <th className="font-medium pb-2 pr-3">Elásticos</th>
                <th className="font-medium pb-2">Trilha</th>
              </tr>
            </thead>
            <tbody>
              {FASES.map((f, i) => (
                <tr key={f.nome} className={cn('border-t border-border', i === atual - 1 && 'bg-primary/5')}>
                  <td className="py-2 pr-3 font-medium text-foreground whitespace-nowrap">
                    {i + 1} · {f.nome}
                    {i === atual - 1 && <span className="ml-2 text-[10px] font-semibold uppercase text-primary">agora</span>}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{f.foco}</td>
                  <td className="py-2 pr-3 text-muted-foreground tabular-nums">{f.dormir}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{f.cardio}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{f.series}</td>
                  <td className="py-2 text-muted-foreground">{f.trilha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {REGRAS.map((secao) => (
          <div key={secao.titulo} className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold text-foreground mb-2">{secao.titulo}</h2>
            <ul className="space-y-1.5">
              {secao.itens.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
