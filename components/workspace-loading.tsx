// Slice the original vector artwork between letters so each glyph keeps its shape.
const BRAND_LETTERS = [
  { letter: "D", x: 0, width: 62.3294 },
  { letter: "O", x: 62.3294, width: 66.6685 },
  { letter: "M", x: 128.9979, width: 96.28355 },
  { letter: "E", x: 225.28145, width: 66.6689 },
  { letter: "L", x: 291.95035, width: 53.87645 },
];

export function WorkspaceLoading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <main>
      <section className="status-card workspace-loading" role="status" aria-live="polite">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <div className="loading-brand" aria-hidden="true" data-no-translate>
          <span className="loading-brand-word">
            {BRAND_LETTERS.map((glyph, index) => (
              <svg
                className="loading-brand-letter"
                viewBox={`${glyph.x} 0 ${glyph.width} 116.2205`}
                style={{ width: `${glyph.width / 345.8268 * 100}%`, animationDelay: `${index * 0.13}s` }}
                focusable="false"
                key={glyph.letter}
              >
                <image href="/domel-logo.svg" width={345.8268} height={116.2205} />
              </svg>
            ))}
          </span>
        </div>
      </section>
    </main>
  );
}
