// Role-based dashboard
(async function () {
  if (!Auth.require()) return;
  const dash = document.getElementById('dash');
  let user;
  try { ({ user } = await api('/auth/me')); Auth.setUser(user); }
  catch { Auth.logout(); return; }
  if (user.role === 'admin') { location.href = '/admin.html'; return; }

  document.getElementById('role-label').textContent = ROLE_LABELS[user.role];
  document.getElementById('hello').textContent = user.role === 'organization' ? user.name : `Hello, ${user.name.split(' ')[0]}`;
  document.getElementById('sub').textContent = {
    organization: 'Post needs, review offers and respond to help requests.',
    donor: 'Here are the needs our AI thinks suit you best.',
    volunteer: 'Here are the needs and requests our AI thinks suit you best.',
    caregiver: 'Manage help requests and medicine reminders for the people you care for.',
    beneficiary: 'Ask for help, track your requests and manage your health.'
  }[user.role];
  document.getElementById('edit-profile').addEventListener('click', () => editProfile(user));

  const render = { organization: orgDashboard, donor: helperDashboard, volunteer: helperDashboard, caregiver: personDashboard, beneficiary: personDashboard }[user.role];
  render(user);

  // ---------------- Organization ----------------
  async function orgDashboard(u) {
    dash.innerHTML = `
      ${u.verified ? '' : `<div class="banner banner-warn" style="margin-bottom:20px">${Icon.shield}<span><b>Waiting for verification.</b> An admin will check your registration details. You can post needs once you're verified.</span></div>`}
      <div class="dash-grid">
        <div class="stack">
          <div class="card">
            <div class="section-title"><h3>Your needs</h3><button class="btn btn-primary btn-sm" id="new-need-btn" ${u.verified ? '' : 'disabled'}>${Icon.plus} Post a need</button></div>
            <form class="form hidden" id="need-form" style="background:var(--lav-50);padding:18px;border-radius:16px;margin-bottom:18px">
              <div><label for="n-title">Title</label><input id="n-title" name="title" maxlength="120" required placeholder="e.g. 10 wheelchairs for the general ward"></div>
              <div><label for="n-desc">Description</label><textarea id="n-desc" name="description" required></textarea></div>
              <div class="form-row-3">
                <div><label for="n-cat">Category</label><select id="n-cat" name="category">${categoryOptions()}</select></div>
                <div><label for="n-qty">Quantity</label><input id="n-qty" name="quantityNeeded" type="number" min="1" value="1" required></div>
                <div><label for="n-unit">Unit</label><input id="n-unit" name="unit" value="items"></div>
              </div>
              <div class="form-row-3">
                <div><label for="n-city">City</label><input id="n-city" name="city" value="${esc(u.city || '')}" required></div>
                <div><label for="n-urg">Urgency</label><select id="n-urg" name="urgency"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
                <div><label for="n-dead">Deadline</label><input id="n-dead" name="deadline" type="date"></div>
              </div>
              <div class="form-error hidden"></div>
              <div class="row"><button class="btn btn-primary">Publish need</button><button type="button" class="btn btn-light" id="cancel-need">Cancel</button></div>
            </form>
            <div class="list" id="my-needs"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="card card-flat">
          <div class="section-title"><h3>Help requests near you</h3></div>
          <div class="list" id="nearby"></div>
        </div>
      </div>`;

    const form = document.getElementById('need-form');
    const toggleForm = show => form.classList.toggle('hidden', !show);
    document.getElementById('new-need-btn').addEventListener('click', () => toggleForm(true));
    document.getElementById('cancel-need').addEventListener('click', () => toggleForm(false));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const err = form.querySelector('.form-error');
      err.classList.add('hidden');
      try {
        await api('/needs', { method: 'POST', body: formData(form) });
        toast('Need published', 'success'); form.reset(); form.city.value = u.city || ''; toggleForm(false); loadNeeds();
      } catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
    });

    async function loadNeeds() {
      const box = document.getElementById('my-needs');
      const { needs } = await api('/needs/mine');
      box.innerHTML = needs.length ? needs.map(n => {
        const pct = Math.min(100, Math.round((n.quantityFulfilled / n.quantityNeeded) * 100));
        return `<div class="list-item" data-need="${n._id}">
          <div class="row between"><span class="title">${esc(n.title)}</span>
            <div class="row">${urgencyBadge(n.urgency)}<span class="badge ${n.status === 'fulfilled' ? 'badge-verified' : 'badge-muted'}">${esc(n.status)}</span></div></div>
          <div class="row between small muted" style="margin:8px 0 4px"><span>${n.quantityFulfilled} of ${n.quantityNeeded} ${esc(n.unit)} · ${esc(label(n.category))} · ${esc(n.city)}</span>
            ${n.pendingOffers ? `<span class="badge badge-pending">${n.pendingOffers} new offer${n.pendingOffers > 1 ? 's' : ''}</span>` : ''}</div>
          <div class="progress"><span style="width:${pct}%"></span></div>
          <div class="row" style="margin-top:12px">
            <button class="btn btn-light btn-sm" data-act="offers">Offers</button>
            <button class="btn btn-ghost btn-sm" data-act="suggest">${Icon.spark} AI suggested helpers</button>
            ${['open', 'in-progress'].includes(n.status) ? '<button class="btn btn-ghost btn-sm" data-act="close">Close need</button>' : ''}
            <button class="btn btn-danger btn-sm" data-act="delete" aria-label="Delete need">${Icon.trash}</button>
          </div>
          <div class="detail"></div>
        </div>`;
      }).join('') : `<div class="empty">${u.verified ? 'You have not posted any needs yet.' : 'Needs you post will appear here.'}</div>`;
    }

    document.getElementById('my-needs').addEventListener('click', async e => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const item = btn.closest('[data-need]');
      const id = item.dataset.need;
      const detail = item.querySelector('.detail');
      try {
        if (btn.dataset.act === 'offers') {
          detail.innerHTML = '<div class="spinner"></div>';
          const { offers } = await api(`/offers/for-need/${id}`);
          detail.innerHTML = offers.length ? `<div class="table-wrap" style="margin-top:12px"><table>
            <thead><tr><th>Helper</th><th>Offer</th><th>Status</th><th></th></tr></thead><tbody>
            ${offers.map(o => `<tr>
              <td><b>${esc(o.helper?.name)}</b><div class="small muted">${esc(o.helper?.email || '')}${o.helper?.phone ? ' · ' + esc(o.helper.phone) : ''}</div></td>
              <td>${esc(label(o.type))} × ${o.quantity}<div class="small muted">${esc(o.message || '')}</div></td>
              <td><span class="badge ${o.status === 'completed' ? 'badge-verified' : o.status === 'declined' ? 'badge-muted' : 'badge-pending'}">${esc(o.status)}</span></td>
              <td><div class="row">
                ${o.status === 'pending' ? `<button class="btn btn-success btn-sm" data-offer-status="accepted" data-offer-id="${o._id}">Accept</button><button class="btn btn-light btn-sm" data-offer-status="declined" data-offer-id="${o._id}">Decline</button>` : ''}
                ${o.status === 'accepted' ? `<button class="btn btn-primary btn-sm" data-offer-status="completed" data-offer-id="${o._id}">Mark received</button>` : ''}
              </div></td></tr>`).join('')}
            </tbody></table></div>` : '<p class="small muted" style="margin-top:10px">No offers yet. Try the AI suggested helpers.</p>';
        } else if (btn.dataset.act === 'suggest') {
          detail.innerHTML = '<div class="spinner"></div>';
          const { matches } = await api(`/match/helpers/${id}`);
          detail.innerHTML = matches.length ? `<div class="list" style="margin-top:12px">${matches.map(m => `
            <div class="row between" style="background:var(--lav-50);padding:10px 12px;border-radius:12px">
              <div><b class="small">${esc(m.helper.name)}</b> <span class="badge badge-muted">${esc(ROLE_LABELS[m.helper.role])}</span>
                <span class="small muted">${esc(m.helper.email)}${m.helper.phone ? ' · ' + esc(m.helper.phone) : ''}</span>
                <ul class="reasons" style="margin-top:6px">${m.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
              <span class="match-score">${m.score}%</span></div>`).join('')}</div>`
            : '<p class="small muted" style="margin-top:10px">No matching donors or volunteers yet.</p>';
        } else if (btn.dataset.act === 'close') {
          await api(`/needs/${id}`, { method: 'PUT', body: { status: 'closed' } }); toast('Need closed'); loadNeeds();
        } else if (btn.dataset.act === 'delete') {
          if (!confirm('Delete this need and all its offers? This cannot be undone.')) return;
          await api(`/needs/${id}`, { method: 'DELETE' }); toast('Need deleted'); loadNeeds();
        }
      } catch (ex) { toast(ex.message, 'error'); }
    });

    document.getElementById('my-needs').addEventListener('click', async e => {
      const b = e.target.closest('[data-offer-status]');
      if (!b) return;
      try {
        await api(`/offers/${b.dataset.offerId}`, { method: 'PATCH', body: { status: b.dataset.offerStatus } });
        toast(`Offer ${b.dataset.offerStatus}`, 'success');
        const id = b.closest('[data-need]').dataset.need;
        await loadNeeds();
        document.querySelector(`[data-need="${id}"] [data-act="offers"]`)?.click();
      } catch (ex) { toast(ex.message, 'error'); }
    });

    loadNeeds().catch(ex => { document.getElementById('my-needs').innerHTML = `<div class="empty">${esc(ex.message)}</div>`; });
    if (u.verified) loadNearby(u); else document.getElementById('nearby').innerHTML = '<div class="empty">Available after verification.</div>';
  }

  // ---------------- Donor / Volunteer ----------------
  async function helperDashboard(u) {
    dash.innerHTML = `
      ${(u.interests || []).length ? '' : `<div class="banner banner-info" style="margin-bottom:20px">${Icon.spark}<span>Add your interests${u.role === 'volunteer' ? ' and skills' : ''} in <a href="#" id="prof-link">your profile</a> to get better AI matches.</span></div>`}
      <div class="section-title"><div><span class="eyebrow">${Icon.spark} AI matches for you</span></div><a href="/needs.html" class="btn btn-light btn-sm">Browse all needs</a></div>
      <div class="grid grid-3" id="matches"><div class="spinner"></div></div>
      <div class="dash-grid" style="margin-top:28px">
        <div class="card card-flat"><div class="section-title"><h3>My offers</h3></div><div class="list" id="my-offers"></div></div>
        ${u.role === 'volunteer' ? '<div class="card card-flat"><div class="section-title"><h3>Help requests near you</h3></div><div class="list" id="nearby"></div></div>'
          : `<div class="card card-dark"><div class="icon-badge">${Icon.heart}</div><h3>Thank you for giving</h3><p class="muted" style="margin-top:8px">Every offer goes straight to a verified organization, and you can track it here.</p></div>`}
      </div>`;
    document.getElementById('prof-link')?.addEventListener('click', e => { e.preventDefault(); editProfile(u); });

    api('/match/needs?limit=6').then(({ matches }) => {
      const box = document.getElementById('matches');
      box.innerHTML = matches.length ? matches.map(m => needCard(m.need, m)).join('') : '<div class="empty" style="grid-column:1/-1">No open needs right now.</div>';
      bindOfferButtons(box, matches.map(m => m.need));
    }).catch(ex => { document.getElementById('matches').innerHTML = `<div class="empty">${esc(ex.message)}</div>`; });

    api('/offers/mine').then(({ offers }) => {
      document.getElementById('my-offers').innerHTML = offers.length ? offers.map(o => `
        <div class="list-item">
          <div class="row between"><span class="title">${esc(o.need?.title || 'Removed need')}</span>
            <span class="badge ${o.status === 'completed' ? 'badge-verified' : o.status === 'declined' ? 'badge-muted' : 'badge-pending'}">${esc(o.status)}</span></div>
          <div class="small muted">${esc(label(o.type))} × ${o.quantity} · ${esc(o.need?.organization?.name || '')}${o.status === 'accepted' && o.need?.organization?.phone ? ' · Call ' + esc(o.need.organization.phone) : ''} · ${fmtDate(o.createdAt)}</div>
        </div>`).join('') : '<div class="empty">You have not offered help yet.</div>';
    }).catch(() => {});

    if (u.role === 'volunteer') loadNearby(u);
  }

  // ---------------- Person in need / Caregiver ----------------
  function personDashboard(u) {
    const tiles = [
      ['/request-help.html', Icon.hand, 'Ask for help', u.role === 'caregiver' ? 'Request support for someone you care for' : 'Medicines, food, equipment or care'],
      ['/reminders.html', Icon.bell, 'Medicine reminders', 'Set alerts so no dose is missed'],
      ['/diet.html', Icon.apple, 'AI diet planner', 'A 7-day meal plan for your health'],
      ['/resources.html', Icon.phone, 'Helplines', 'Ambulance, health and mental-health lines']
    ];
    dash.innerHTML = `
      <div class="grid grid-4">${tiles.map(([href, ic, t, d]) => `
        <a href="${href}" class="card card-flat" style="color:inherit;text-decoration:none"><div class="icon-badge">${ic}</div><h3>${t}</h3><p class="small muted">${d}</p></a>`).join('')}</div>
      <div class="dash-grid" style="margin-top:24px">
        <div class="card"><div class="section-title"><h3>My help requests</h3><a href="/request-help.html" class="btn btn-primary btn-sm">${Icon.plus} New request</a></div><div class="list" id="my-requests"></div></div>
        <div class="card card-flat"><div class="section-title"><h3>Today's medicines</h3><a href="/reminders.html" class="btn btn-ghost btn-sm">Manage</a></div><div class="list" id="today-meds"></div></div>
      </div>`;
    loadMyRequests(document.getElementById('my-requests'));
    api('/reminders').then(({ reminders }) => {
      const doses = reminders.filter(r => r.active).flatMap(r => r.times.map(t => ({ r, t }))).sort((a, b) => a.t.localeCompare(b.t));
      document.getElementById('today-meds').innerHTML = doses.length ? doses.map(({ r, t }) =>
        `<div class="dose"><span class="time" style="font-size:1rem">${t}</span><div style="flex:1"><b>${esc(r.medicine)}</b> <span class="small muted">${esc(r.dosage)}${r.forPerson ? ' · for ' + esc(r.forPerson) : ''}</span></div></div>`).join('')
        : '<div class="empty">No reminders yet.</div>';
    }).catch(() => {});
  }

  // ---------------- Shared: help requests for responders ----------------
  async function loadNearby(u) {
    const box = document.getElementById('nearby');
    box.innerHTML = '<div class="spinner"></div>';
    try {
      const { requests } = await api('/help-requests');
      const same = c => (c || '').toLowerCase() === (u.city || '').toLowerCase();
      requests.sort((a, b) => (same(b.city) - same(a.city)));
      box.innerHTML = requests.length ? requests.map(r => {
        const mine = r.assignedTo && r.assignedTo._id === u._id;
        return `<div class="list-item">
          <div class="row between"><span class="title">${esc(label(r.category))}${r.onBehalfOf?.name ? ` · ${esc(r.onBehalfOf.name)}${r.onBehalfOf.age ? ', ' + r.onBehalfOf.age : ''}` : ''}</span>${urgencyBadge(r.urgency)}</div>
          <p class="small muted" style="margin:6px 0">${esc(r.description)}</p>
          <div class="small muted">${Icon.pin} ${esc(r.city)} · Asked by ${esc(r.requestedBy?.name)} (${esc(ROLE_LABELS[r.requestedBy?.role] || '')})${mine && r.requestedBy?.phone ? ' · <a href="tel:' + esc(r.requestedBy.phone) + '">' + esc(r.requestedBy.phone) + '</a>' : ''}</div>
          <div class="row" style="margin-top:10px">
            ${r.status === 'open' ? `<button class="btn btn-primary btn-sm" data-assign="${r._id}">I'll handle this</button>` : ''}
            ${mine && r.status === 'assigned' ? `<span class="badge">Assigned to you</span><button class="btn btn-success btn-sm" data-resolve-req="${r._id}">Mark resolved</button>` : ''}
          </div></div>`;
      }).join('') : '<div class="empty">No open help requests right now.</div>';
      box.onclick = async e => {
        const a = e.target.closest('[data-assign]'), r = e.target.closest('[data-resolve-req]');
        try {
          if (a) { await api(`/help-requests/${a.dataset.assign}/assign`, { method: 'PATCH' }); toast('Request assigned to you. Please contact them.', 'success'); loadNearby(u); }
          if (r) { await api(`/help-requests/${r.dataset.resolveReq}/resolve`, { method: 'PATCH' }); toast('Marked resolved', 'success'); loadNearby(u); }
        } catch (ex) { toast(ex.message, 'error'); }
      };
    } catch (ex) { box.innerHTML = `<div class="empty">${esc(ex.message)}</div>`; }
  }

  // ---------------- Profile modal ----------------
  function editProfile(u) {
    const helper = ['donor', 'volunteer', 'organization'].includes(u.role);
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="p-title">
      <h3 id="p-title" style="margin-bottom:16px">Edit profile</h3>
      <form class="form">
        <div><label for="p-name">Name</label><input id="p-name" name="name" value="${esc(u.name)}" required></div>
        <div class="form-row">
          <div><label for="p-city">City</label><input id="p-city" name="city" value="${esc(u.city || '')}"></div>
          <div><label for="p-phone">Phone</label><input id="p-phone" name="phone" value="${esc(u.phone || '')}"></div>
        </div>
        ${helper ? `<div><label>Types of help ${u.role === 'organization' ? 'you handle' : 'you want to give'}</label><div class="check-group">${CATEGORIES.map(([v, l]) =>
          `<label class="check-pill"><input type="checkbox" name="interests" value="${v}" ${(u.interests || []).includes(v) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>` : ''}
        ${u.role === 'volunteer' ? `<div><label for="p-skills">Skills (comma separated)</label><input id="p-skills" name="skills" value="${esc((u.skills || []).join(', '))}"></div>` : ''}
        <div class="form-error hidden"></div>
        <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary">Save</button></div>
      </form></div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', e => { if (e.target === wrap || e.target.hasAttribute('data-close')) wrap.remove(); });
    wrap.querySelector('form').addEventListener('submit', async e => {
      e.preventDefault();
      const d = formData(e.target);
      if (helper) d.interests = [].concat(d.interests || []);
      try {
        const { user: updated } = await api('/auth/me', { method: 'PUT', body: d });
        Auth.setUser(updated);
        location.reload();
      } catch (ex) { const b = wrap.querySelector('.form-error'); b.textContent = ex.message; b.classList.remove('hidden'); }
    });
  }
})();
