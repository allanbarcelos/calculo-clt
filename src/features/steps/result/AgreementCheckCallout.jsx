import { ContentCallout } from '../../../components/ui';
import { useAgreementSource } from '../../../hooks/useAgreementSource.js';
import { useServices } from '../../../hooks/useServices.js';
import { formatDate } from '../../../lib/format.js';

// Reminds, on the result, that the chosen agreement's values need checking.
export default function AgreementCheckCallout({ data }) {
  const { agreements } = useServices();
  const source = useAgreementSource();
  const selection = agreements.selection(data);
  const warnings = agreements.warnings(selection?.agreement);
  if (!warnings?.any) return null;
  const { agreement } = selection;
  return (
    <ContentCallout
      id="agreementCheck"
      vars={{
        ...warnings,
        name: agreement.name,
        validTo: formatDate(agreement.validTo),
        sourceText: source.sourceText(agreement),
        whereOfficial: source.whereOfficial(agreement),
      }}
    />
  );
}
