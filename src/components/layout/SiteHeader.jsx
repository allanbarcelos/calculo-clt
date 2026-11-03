import { useServices } from '../../hooks/useServices.js';
import { scrollToSection } from '../../lib/scroll.js';
import BrandMark from './BrandMark.jsx';
import { SECTIONS } from './navigation.js';

export default function SiteHeader({ siteName }) {
  const content = useServices().repositories.content;
  return (
    <>
      <a className="skip-link" href="#calculadora" onClick={scrollToSection}>{content.label('skipToCalculator')}</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="#topo" onClick={scrollToSection} aria-label={`${siteName}, início`}>
            <BrandMark />
            <span>{siteName}</span>
          </a>
          <nav aria-label={content.label('navAria')}>
            <ul>
              {SECTIONS.map((s) => (
                <li key={s.href}><a href={s.href} onClick={scrollToSection}>{content.label(s.label)}</a></li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
