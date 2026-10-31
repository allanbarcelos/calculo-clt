import { SourcesInline } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { formatDate } from '../../../lib/format.js';

export default function AgreementDetail({ agreement }) {
  const t = useFormText();
  const line = (key, vars) => <li>{t.text('agreementDetail', key, vars)}</li>;
  return (
    <div className="band-detail" aria-live="polite">
      <p><strong>{agreement.name}</strong></p>
      <ul className="agreement-facts">
        {agreement.registration && line('registration', agreement)}
        {line('validity', { validFrom: formatDate(agreement.validFrom), validTo: formatDate(agreement.validTo) })}
        {line('territory', agreement)}
        {agreement.parties && line('parties', agreement)}
      </ul>
      {agreement.notes?.length > 0 && (
        <ul className="agreement-notes">
          {agreement.notes.map((note, i) => <li key={i}>{note}</li>)}
        </ul>
      )}
      <p className="hint">{t.text('agreementDetail', 'appliedNote')}</p>
      <SourcesInline sources={[{ id: agreement.source }]} />
    </div>
  );
}
