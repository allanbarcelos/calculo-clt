// Informative note under a field, e.g. "previsto na convenção coletiva". Never blocks input.
export default function FieldNotice({ id, notice }) {
  if (!notice) return null;
  return (
    <p id={id} className={`field-notice${notice.differs ? ' field-notice--differs' : ''}`}>
      <span aria-hidden="true">{notice.differs ? '⚠' : '✓'}</span> {notice.text}
    </p>
  );
}
