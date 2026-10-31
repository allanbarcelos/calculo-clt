export default function Callout({ tone = 'info', title, children }) {
  return (
    <div className={`callout callout--${tone}`} role={tone === 'warning' ? 'note' : undefined}>
      {title && <p className="callout__title">{title}</p>}
      <div>{children}</div>
    </div>
  );
}
