import { useServices } from '../../hooks/useServices.js';

export default function SourceLink({ id, children }) {
  const source = useServices().repositories.sources.get(id);
  return (
    <a className="source-link" href={source.url} target="_blank" rel="noreferrer">
      {children ?? source.title}
      <span className="visually-hidden"> (abre em nova aba, fonte: {source.org})</span>
    </a>
  );
}
