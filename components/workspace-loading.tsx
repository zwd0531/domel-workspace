const BRAND_LETTERS = ["D", "O", "M", "E", "L"];

export function WorkspaceLoading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <main>
      <section className="status-card workspace-loading" role="status" aria-live="polite">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <div className="loading-brand" aria-hidden="true">
          <span className="loading-brand-icon" />
          <span className="loading-brand-word">
            {BRAND_LETTERS.map((letter, index) => (
              <span className="loading-brand-letter" style={{ animationDelay: `${index * 0.13}s` }} key={`${letter}-${index}`}>
                {letter}
              </span>
            ))}
          </span>
        </div>
      </section>
    </main>
  );
}
