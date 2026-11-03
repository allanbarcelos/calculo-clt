import { useServices } from '../../hooks/useServices.js';
import { formatDate } from '../../lib/format.js';
import { scrollToSection } from '../../lib/scroll.js';
import { fillTemplate } from '../../lib/template.js';
import BrandMark from './BrandMark.jsx';
import { SECTIONS } from './navigation.js';

// GitHub mark (octicons, MIT).
function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

export default function SiteFooter() {
  const { meta, repositories } = useServices();
  const label = (id, vars) => fillTemplate(repositories.content.label(id), vars);
  const external = { target: '_blank', rel: 'noreferrer' };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <p className="site-footer__name"><BrandMark size={28} /> {meta.siteName}</p>
            <p>{label('footerTagline')}</p>
          </div>

          <nav aria-labelledby="footer-nav-title">
            <h2 id="footer-nav-title" className="site-footer__heading">{label('footerNavTitle')}</h2>
            <ul>
              {SECTIONS.map((s) => (
                <li key={s.href}><a href={s.href} onClick={scrollToSection}>{label(s.label)}</a></li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="site-footer__heading">{label('footerProjectTitle')}</h2>
            <ul>
              <li><a href={meta.repository} {...external}>{label('footerRepository')}</a></li>
              <li><a href={`${meta.repository}/issues`} {...external}>{label('footerIssues')}</a></li>
              <li><span>{label('footerReview', { date: formatDate(meta.lastReview) })}</span></li>
            </ul>
          </div>
        </div>

        <p className="site-footer__disclaimer">{repositories.content.footer()}</p>

        <div className="site-footer__bar">
          <span>© {meta.lastReview.slice(0, 4)} {meta.siteName}</span>
          <span className="site-footer__credits">
            {label('footerDevelopedBy')} <a href={meta.developer.url} {...external}>{meta.developer.name}</a>
            <a className="site-footer__icon" href={meta.repository} {...external} aria-label={label('footerRepository')} title={label('footerRepository')}>
              <GitHubIcon />
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
