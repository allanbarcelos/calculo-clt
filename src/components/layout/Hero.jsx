import { useServices } from '../../hooks/useServices.js';
import { formatDate, formatMoney } from '../../lib/format.js';

export default function Hero() {
  const { referenceDate, repositories } = useServices();
  return (
    <section className="hero">
      <div className="container">
        <p className="eyebrow">
          Regras em vigor em {formatDate(referenceDate)} · salário mínimo de {formatMoney(repositories.rates.minimumWage())}
        </p>
        <h1>Quanto custa, de verdade, contratar um funcionário CLT?</h1>
        <p className="lead">
          Responda a algumas perguntas e veja o investimento mensal e anual: salário, encargos, 13º, férias, FGTS, benefícios e pisos salariais do seu estado. Todos os números vêm de fontes oficiais do governo.
        </p>
      </div>
    </section>
  );
}
