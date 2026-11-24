// "My help requests" list with AI-suggested responders. Used on request-help and dashboard pages.
async function loadMyRequests(box) {
  box.innerHTML = '<div class="spinner"></div>';
  try {
    const { requests } = await api('/help-requests/mine');
    if (!requests.length) { box.innerHTML = '<div class="empty">No requests yet.</div>'; return; }
    box.innerHTML = requests.map(r => `
      <div class="list-item">
        <div class="row between">
          <span class="title">${esc(label(r.category))}${r.onBehalfOf?.name ? ` · for ${esc(r.onBehalfOf.name)}` : ''}</span>
          <span class="badge ${r.status === 'resolved' ? 'badge-verified' : r.status === 'assigned' ? '' : 'badge-pending'}">${esc(r.status)}</span>
        </div>
        <p class="small muted" style="margin:6px 0">${esc(r.description)}</p>
        <div class="row small muted">${urgencyBadge(r.urgency)} <span>${esc(r.city)}</span> <span>${fmtDate(r.createdAt)}</span></div>
        ${r.assignedTo ? `<p class="small" style="margin-top:8px">Taken by <b>${esc(r.assignedTo.name)}</b>${r.assignedTo.phone ? ` · <a href="tel:${esc(r.assignedTo.phone)}">${esc(r.assignedTo.phone)}</a>` : ''}</p>` : ''}
        <div class="row" style="margin-top:10px">
          ${r.status === 'open' ? `<button class="btn btn-ghost btn-sm" data-suggest="${r._id}">${Icon.spark} AI: who can help?</button>` : ''}
          ${r.status !== 'resolved' ? `<button class="btn btn-success btn-sm" data-resolve="${r._id}">Mark resolved</button>` : ''}
        </div>
        <div data-suggestions="${r._id}"></div>
      </div>`).join('');

    box.querySelectorAll('[data-suggest]').forEach(b => b.addEventListener('click', async () => {
      const out = box.querySelector(`[data-suggestions="${b.dataset.suggest}"]`);
      out.innerHTML = '<div class="spinner"></div>';
      try {
        const { matches } = await api(`/match/responders/${b.dataset.suggest}`);
        out.innerHTML = matches.length ? `<div class="list" style="margin-top:10px">${matches.map(m => `
          <div class="row between" style="background:var(--lav-50);padding:10px 12px;border-radius:12px">
            <div><b class="small">${esc(m.responder.name)}</b> <span class="badge badge-muted">${esc(ROLE_LABELS[m.responder.role])}</span>
              <ul class="reasons" style="margin-top:6px">${m.reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
            <span class="match-score">${m.score}%</span>
          </div>`).join('')}</div>` : '<p class="small muted" style="margin-top:8px">No matching organizations yet. Your request is still visible to everyone.</p>';
      } catch (e) { out.innerHTML = `<p class="small muted">${esc(e.message)}</p>`; }
    }));

    box.querySelectorAll('[data-resolve]').forEach(b => b.addEventListener('click', async () => {
      try { await api(`/help-requests/${b.dataset.resolve}/resolve`, { method: 'PATCH' }); toast('Marked as resolved', 'success'); loadMyRequests(box); }
      catch (e) { toast(e.message, 'error'); }
    }));
  } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
