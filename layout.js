// Renders the shared navigation bar and footer on every page.
(function () {
  const user = Auth.user;
  const here = location.pathname.replace(/\/$/, '/index.html');
  const link = (href, text) => `<li><a href="${href}" class="${here === href ? 'active' : ''}">${text}</a></li>`;

  const links = [
    link('/needs.html', 'Community needs'),
    link('/request-help.html', 'Get help'),
    link('/reminders.html', 'Reminders'),
    link('/diet.html', 'Diet planner'),
    link('/resources.html', 'Resources')
  ];
  if (user && user.role === 'admin') links.push(link('/admin.html', 'Admin'));

  const actions = user
    ? `<a class="user-chip hide-sm" href="/dashboard.html" title="Your dashboard"><span class="avatar">${esc(initials(user.name))}</span><span>${esc(user.role === 'organization' ? user.name : user.name.split(' ')[0])}</span></a>
       <a href="/dashboard.html" class="btn btn-dark btn-sm">Dashboard</a>
       <button class="btn btn-ghost btn-sm hide-sm" id="logout-btn">Log out</button>`
    : `<a href="/login.html" class="btn btn-ghost btn-sm hide-sm">Log in</a>
       <a href="/register.html" class="btn btn-dark btn-sm">Join for free</a>`;

  const header = document.getElementById('site-header');
  if (header) {
    header.className = 'nav-wrap';
    header.innerHTML = `
      <nav class="container nav" aria-label="Main">
        <a href="/" class="brand"><span class="brand-mark">${Icon.heart}</span>CommunityCare AI</a>
        <ul class="nav-links">${links.join('')}
          ${user ? '<li class="show-sm"><a href="#" id="logout-btn-2">Log out</a></li>' : '<li class="show-sm"><a href="/login.html">Log in</a></li>'}
        </ul>
        <div class="nav-actions">${actions}
          <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">${Icon.menu}</button>
        </div>
      </nav>`;
    const nav = header.querySelector('.nav');
    const toggle = header.querySelector('.nav-toggle');
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    header.querySelectorAll('#logout-btn, #logout-btn-2').forEach(b => b.addEventListener('click', e => { e.preventDefault(); Auth.logout(); }));
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 8));
  }

  // Fill <span data-icon="name"> placeholders in page markup
  document.querySelectorAll('[data-icon]').forEach(el => {
    if (Icon[el.dataset.icon]) { el.outerHTML = Icon[el.dataset.icon]; }
  });

  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.className = 'footer';
    footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div class="stack">
            <a href="/" class="brand"><span class="brand-mark">${Icon.heart}</span>CommunityCare AI</a>
            <p class="small">Connecting people in need with verified hospitals, NGOs, donors and volunteers, including people who don't use smartphones.</p>
          </div>
          <div><h4>Platform</h4><ul>
            <li><a href="/needs.html">Community needs</a></li>
            <li><a href="/request-help.html">Ask for help</a></li>
            <li><a href="/register.html">Register an organization</a></li></ul></div>
          <div><h4>Health tools</h4><ul>
            <li><a href="/reminders.html">Medicine reminders</a></li>
            <li><a href="/diet.html">AI diet planner</a></li>
            <li><a href="/resources.html">Helplines & schemes</a></li></ul></div>
          <div><h4>Emergency</h4><ul>
            <li>Emergency: <a href="tel:112">112</a></li>
            <li>Ambulance: <a href="tel:108">108</a></li>
            <li>Mental health: <a href="tel:14416">14416</a></li></ul></div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} CommunityCare AI · Built for community SDG goals</span>
          <span>Health information here is general guidance, not medical advice.</span>
        </div>
      </div>`;
  }
})();
