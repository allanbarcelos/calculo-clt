import { RichText } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';
import PayrollReliefSection from './PayrollReliefSection.jsx';
import RatFapSection from './RatFapSection.jsx';
import RealTaxSection from './RealTaxSection.jsx';
import RegimeSection from './RegimeSection.jsx';
import ThirdPartiesSection from './ThirdPartiesSection.jsx';

export default function CompanyStep(props) {
  const { data, result } = props;
  const regime = useServices().repositories.regimes.get(data.regime);
  const t = useFormText();

  return (
    <>
      <RegimeSection {...props} />
      {regime.usesRatFap && <RatFapSection {...props} />}
      {regime.usesThirdParties && <ThirdPartiesSection {...props} />}
      {regime.allowsPayrollRelief && <PayrollReliefSection {...props} />}
      {regime.id === 'real' && <RealTaxSection {...props} />}
      {regime.usesRatFap && (
        <p className="hint" aria-live="polite">
          <RichText text={t.raw('chargesSummary', regime.usesThirdParties ? 'noteWithThirdParties' : 'note')} vars={result.rates} />
        </p>
      )}
    </>
  );
}
