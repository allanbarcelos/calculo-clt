import { RichText, SourcesInline } from '../../../components/ui';
import { useAgreementSource } from '../../../hooks/useAgreementSource.js';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';
import { formatDate } from '../../../lib/format.js';

// Facts of the chosen agreement, with every reason to double-check it shown up front.
export default function AgreementDetail({ agreement }) {
  const t = useFormText();
  const warnings = useServices().agreements.warnings(agreement);
  const source = useAgreementSource();
  const line = (key, vars) => <li>{t.text('agreementDetail', key, vars)}</li>;
  const warn = (text, key) => (
    <p key={key} className="field-notice field-notice--differs" role="note">⚠ <RichText text={text} /></p>
  );

  return (
    <div className="band-detail" aria-live="polite">
      <p><strong>{agreement.name}</strong></p>
      {warnings.expired && warn(t.text('agreement', 'expired', { validTo: formatDate(agreement.validTo) }), 'expired')}
      {warnings.unofficial && warn(source.sourceText(agreement), 'source')}
      {warnings.calculated && warn(t.text('agreementDetail', 'calculatedFloors'), 'calculated')}
      <ul className="agreement-facts">
        {!warnings.unofficial && <li>{source.sourceText(agreement)}</li>}
        {line('validity', { validFrom: formatDate(agreement.validFrom), validTo: formatDate(agreement.validTo) })}
        {line('territory', agreement)}
        {agreement.parties && line('parties', agreement)}
      </ul>
      {agreement.notes?.length > 0 && (
        <ul className="agreement-notes">
          {agreement.notes.map((note, i) => <li key={i}>{note}</li>)}
        </ul>
      )}
      <p className="hint"><RichText text={source.whereOfficial(agreement)} /></p>
      <p className="hint">{t.text('agreementDetail', 'disclaimer')} {t.text('agreementDetail', 'appliedNote')}</p>
      <SourcesInline sources={[{ id: agreement.source }]} />
    </div>
  );
}
