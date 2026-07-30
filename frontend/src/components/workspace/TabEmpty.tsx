export function TabEmpty({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="border border-dashed border-recall-border bg-white/70 px-6 py-12">
      <h2 className="text-base font-semibold text-recall-navy">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-recall-muted">{body}</p>
    </div>
  );
}
