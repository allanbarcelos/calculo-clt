import { Fragment } from 'react';
import { useServices } from '../../hooks/useServices.js';
import SourceLink from './SourceLink.jsx';

// "Fonte: A · B · C" line (also used by explainers, whose sources may omit the label). sources = [{ id, label? }]; without a label, the source's
// short name from sources.json is used.
export default function SourcesInline({ sources, prefix = 'Fonte:' }) {
  const repository = useServices().repositories.sources;
  if (!sources?.length) return null;
  return (
    <p className="sources-inline">
      {prefix}{' '}
      {sources.map((s, i) => (
        <Fragment key={`${s.id}-${i}`}>
          {i > 0 && ' · '}
          <SourceLink id={s.id}>{s.label ?? repository.get(s.id).short}</SourceLink>
        </Fragment>
      ))}
    </p>
  );
}
