import { useFormText } from './useFormText.js';

const SOURCE_KEYS = { registry: 'sourceRegistry', parties: 'sourceParties', copy: 'sourceCopy', summary: 'sourceSummary' };

// Sentences about where an agreement's values came from and where to find the official text.
// They keep their markup (**bold**, [link](source:id)); render them with <RichText />.
export function useAgreementSource() {
  const t = useFormText();
  return {
    sourceText(agreement) {
      const registrationText = agreement.registration ? t.text('agreementDetail', 'registrationText', agreement) : '';
      return t.text('agreementDetail', SOURCE_KEYS[agreement.sourceKind] ?? 'sourceSummary', { registrationText });
    },
    whereOfficial(agreement) {
      const key = agreement.registration ? 'officialWithRegistration' : 'officialWithoutRegistration';
      return t.text('agreementDetail', key, { ...agreement, uf: agreement.ufs.join(', ') });
    },
  };
}
