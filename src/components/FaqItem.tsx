"use client";

import { useId, useState } from "react";

// Accordion row. The answer animates open via grid-template-rows 0fr -> 1fr, which <details> can't do.
export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`glass faq${open ? " open" : ""}`}>
      <button type="button" className="faq-q" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        {q}
      </button>
      <div id={id} className="faq-a" role="region" inert={!open}>
        <div><p>{a}</p></div>
      </div>
    </div>
  );
}
