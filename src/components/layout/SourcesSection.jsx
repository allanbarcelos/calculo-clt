import { useServices } from '../../hooks/useServices.js';
import { formatDate } from '../../lib/format.js';
import SourceLink from '../ui/SourceLink.jsx';

export default function SourcesSection() {
  const { meta, repositories } = useServices();
  return (
    <section id="fontes" className="container info" aria-labelledby="sources-title">
      <h2 id="sources-title">Fontes oficiais</h2>
      <p>Usamos apenas sites do governo federal, dos governos estaduais e das assembleias legislativas. Última revisão dos dados: {formatDate(meta.lastReview)}.</p>
      <div className="sources-grid">
        {repositories.sources.groups().map((group) => (
          <div key={group.title} className="card">
            <h3>{group.title}</h3>
            <ul className="sources-list">
              {group.ids.map((id) => (
                <li key={id}>
                  <SourceLink id={id} />
                  <span className="sources-list__org">{repositories.sources.get(id).org}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
