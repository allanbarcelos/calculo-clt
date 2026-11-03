import { useServices } from '../../hooks/useServices.js';
import RichText from '../ui/RichText.jsx';

export default function MethodSection() {
  const cards = useServices().repositories.content.method();
  return (
    <section id="como-calculamos" className="container info" aria-labelledby="method-title">
      <h2 id="method-title">Como calculamos</h2>
      <div className="info-grid">
        {cards.map((c) => (
          <article key={c.title} className="card">
            <h3>{c.title}</h3>
            <p><RichText text={c.text} /></p>
          </article>
        ))}
      </div>
    </section>
  );
}
