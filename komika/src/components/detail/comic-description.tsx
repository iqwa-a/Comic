"use client";

import { useState } from "react";

// Sinopsis dengan Read More / Read Less.
export default function ComicDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const text = description || "Deskripsi belum tersedia untuk komik ini.";
  return (
    <section className="description-block">
      <p className={`description-text ${expanded ? "" : "clamped"}`}>{text}</p>
      <button type="button" className="text-link" onClick={() => setExpanded((value) => !value)}>
        {expanded ? "Read Less" : "Read More"}
      </button>
    </section>
  );
}
