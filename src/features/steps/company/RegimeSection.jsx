import { ChoiceGroup, ContentCallout, Explainer } from '../../../components/ui';
import { useFormText } from '../../../hooks/useFormText.js';
import { useServices } from '../../../hooks/useServices.js';

export default function RegimeSection({ data, set, result }) {
  const { repositories, fatorR } = useServices();
  const t = useFormText();
  const regimes = repositories.regimes.list();
  const regime = repositories.regimes.get(data.regime);
  const limitOf = (id) => regimes.find((r) => r.id === id)?.revenueLimit;
  const { label, hint } = t.field('regime');

  const vars = {
    meiLimit: limitOf('mei'),
    simplesLimit: limitOf('simples'),
    presumidoLimit: limitOf('presumido'),
    fatorR: fatorR.threshold(),
    yearlyPayroll: result.gross > 0 ? fatorR.yearlyPayroll(result.gross) : 0,
    fatorRRevenue: result.gross > 0 ? fatorR.maxRevenueSupported(result.gross) : 0,
  };

  return (
    <>
      <ChoiceGroup
        legend={label}
        hint={hint}
        name="regime"
        value={data.regime}
        onChange={(v) => set({ regime: v })}
        options={regimes.map((r) => ({ value: r.id, label: r.label, description: r.description }))}
      />
      {regime.callout && <ContentCallout id={regime.callout} vars={vars} />}
      <Explainer id="regimes" vars={vars} />
    </>
  );
}
