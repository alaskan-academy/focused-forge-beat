import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BOOK_PAGES } from '@/content/coffee/books';

const LAST_PAGE_KEY = 'coffee-cats:book-page';

function loadPage(): number {
  try {
    const n = Number(localStorage.getItem(LAST_PAGE_KEY));
    return Number.isFinite(n) && n >= 0 && n < BOOK_PAGES.length ? n : 0;
  } catch {
    return 0;
  }
}

// Estante: um "livro" com dicas dos grandes nomes do ensino de línguas, folha por folha.
export default function Bookshelf({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(loadPage);
  const p = BOOK_PAGES[page];

  const go = (n: number) => {
    const next = (n + BOOK_PAGES.length) % BOOK_PAGES.length;
    setPage(next);
    try {
      localStorage.setItem(LAST_PAGE_KEY, String(next));
    } catch {
      /* ok */
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24170f]/55 p-2 sm:p-4" onClick={onClose}>
      <div
        className="relative flex max-h-[94%] w-full max-w-md flex-col overflow-hidden rounded-r-[18px] rounded-l-md border-l-[10px] border-[#7d4f33] bg-[#fffaf0] shadow-[0_4px_0_#5e3a24,0_12px_30px_rgba(20,10,5,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#7d4f33]/70">📚 Rumo à fluência · folha {page + 1} de {BOOK_PAGES.length}</span>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#efe0c4]" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div key={p.id} className="animate-in fade-in slide-in-from-right-4 flex-1 overflow-y-auto px-5 pb-4 pt-1 duration-300">
          <div className="text-sm font-semibold text-[#c4554d]">{p.author}</div>
          <h2 className="cc-title text-2xl leading-tight">{p.title}</h2>
          <p className="mt-3 text-[15px] leading-relaxed">{p.idea_pt}</p>
          <div className="mt-3 rounded-xl bg-[#f2cc8f]/40 px-3 py-2 text-sm">
            <span className="font-semibold">Como usar hoje: </span>
            {p.practice_pt}
          </div>
          <div className="mt-3 rounded-xl border-2 border-dashed border-[#d4bf9a] px-3 py-2">
            <div className="text-[11px] font-bold uppercase tracking-wide opacity-60">Leia em voz alta 🗣️</div>
            <div className="cc-title text-lg">“{p.english}”</div>
            <div className="text-xs italic opacity-70">{p.english_pt}</div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t-2 border-[#e6d2ad] bg-[#f6ead3] px-3 py-2">
          <button type="button" onClick={() => go(page - 1)} className="cc-btn-ghost inline-flex items-center gap-1 text-sm">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>
          <div className="flex gap-1">
            {BOOK_PAGES.map((b, i) => (
              <button key={b.id} type="button" onClick={() => go(i)} aria-label={`Folha ${i + 1}`} className={`h-1.5 w-1.5 rounded-full ${i === page ? 'bg-[#7d4f33]' : 'bg-[#d4bf9a]'}`} />
            ))}
          </div>
          <button type="button" onClick={() => go(page + 1)} className="cc-btn-ghost inline-flex items-center gap-1 text-sm">
            Próxima <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
