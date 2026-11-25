import { useServices } from '../../../hooks/useServices.js';
import { formatMoney, formatNumber } from '../../../lib/format.js';

export default function ResultHero({ data, result }) {
  const regime = useServices().repositories.regimes.get(data.regime);
  return (
    <section className="result-hero" aria-labelledby="total-label">
      <p id="total-label" className="result-hero__label">{result.dayWorker ? 'Custo mensal estimado com a diarista' : 'Investimento mensal estimado neste funcionário'}</p>
      <p className="result-hero__value">{formatMoney(result.monthlyTotal)}</p>
      <dl className="result-hero__facts">
        <div><dt>Por ano</dt><dd>{formatMoney(result.yearlyTotal)}</dd></div>
        <div><dt>{result.dayWorker ? 'Diárias no mês' : 'Remuneração bruta'}</dt><dd>{formatMoney(result.gross)}</dd></div>
        {!result.dayWorker && <div><dt>Custo ÷ remuneração</dt><dd>{formatNumber(result.multiplier)}×</dd></div>}
        {result.hiringOneTime > 0 && <div><dt>Custo único de contratação</dt><dd>{formatMoney(result.hiringOneTime)}</dd></div>}
      </dl>
      <p className="result-hero__note">
        {result.dayWorker
          ? 'Diarista, sem vínculo de emprego: só diárias e transporte, sem encargos.'
          : `Regime: ${regime.label}. Valores mensais com 13º, férias e encargos já distribuídos (provisionados) ao longo do ano.`}
      </p>
    </section>
  );
}
