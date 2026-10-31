export default function SiteHeader({ siteName }) {
  return (
    <>
      <a className="skip-link" href="#calculadora">Pular para a calculadora</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="#topo" aria-label={`${siteName}, início`}>
            <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <path d="M21.5 11.2A7 7 0 1 0 21.5 20.8" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span>{siteName}</span>
          </a>
          <nav aria-label="Seções da página">
            <ul>
              <li><a href="#calculadora">Calculadora</a></li>
              <li><a href="#como-calculamos">Como calculamos</a></li>
              <li><a href="#fontes">Fontes</a></li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
