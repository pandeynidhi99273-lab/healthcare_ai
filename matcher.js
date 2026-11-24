/**
 * AI matching engine.
 *
 * Gives every (helper, need) pair a score from 0 to 100 using:
 *   - location  (same city)
 *   - type of help (helper's interests / role vs need category)
 *   - urgency and deadline
 *   - how much of the need is still unfilled
 * and returns human-readable reasons, so users can see WHY something was suggested.
 */

const URGENCY_POINTS = { critical: 25, high: 18, medium: 10, low: 4 };

const sameCity = (a, b) => a && b && a.trim().toLowerCase() === b.trim().toLowerCase();

function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((new Date(date) - Date.now()) / 86400000);
}

function scorePair(helper, need) {
  let score = 0;
  const reasons = [];

  // 1. Location (35)
  if (sameCity(helper.city, need.city)) {
    score += 35;
    reasons.push(`Close to you in ${need.city}`);
  }

  // 2. Type of help (30)
  const interests = helper.interests || [];
  if (interests.includes(need.category)) {
    score += 30;
    reasons.push(`Matches your interest in ${need.category.replace('-', ' ')}`);
  } else if (helper.role === 'volunteer' && need.category === 'volunteers') {
    score += 30;
    reasons.push('Needs volunteers like you');
  } else if (helper.role === 'donor' && need.category !== 'volunteers') {
    score += 10;
    reasons.push('Can be supported with a donation');
  }

  // Skills mentioned in the need text (bonus up to 10)
  const text = `${need.title} ${need.description}`.toLowerCase();
  const skillHits = (helper.skills || []).filter(s => s && text.includes(s.toLowerCase()));
  if (skillHits.length) {
    score += Math.min(10, skillHits.length * 5);
    reasons.push(`Uses your skills: ${skillHits.join(', ')}`);
  }

  // 3. Urgency (25)
  score += URGENCY_POINTS[need.urgency] || 0;
  if (need.urgency === 'critical' || need.urgency === 'high') reasons.push(`${capitalize(need.urgency)} urgency`);

  // Deadline coming soon (10)
  const d = daysUntil(need.deadline);
  if (d !== null && d >= 0 && d <= 3) { score += 10; reasons.push(`Deadline in ${d} day${d === 1 ? '' : 's'}`); }
  else if (d !== null && d > 3 && d <= 7) score += 5;

  // 4. Still mostly unfilled (5)
  const needed = need.quantityNeeded || 1;
  const progress = (need.quantityFulfilled || 0) / needed;
  if (progress < 0.25) { score += 5; reasons.push('Has received little help so far'); }

  return { score: Math.min(100, Math.round(score)), reasons };
}

// Best needs for a donor / volunteer
function rankNeedsForHelper(helper, needs, limit = 10) {
  return needs
    .map(need => ({ need, ...scorePair(helper, need) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Best donors / volunteers for a need (used by organizations)
function rankHelpersForNeed(need, helpers, limit = 10) {
  return helpers
    .map(helper => ({ helper, ...scorePair(helper, need) }))
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Best organizations / volunteers to handle a person's help request
function rankResponders(request, responders, limit = 5) {
  return responders
    .map(r => {
      let score = 0;
      const reasons = [];
      if (sameCity(r.city, request.city)) { score += 50; reasons.push(`Based in ${request.city}`); }
      if ((r.interests || []).includes(request.category)) { score += 30; reasons.push('Handles this type of help'); }
      if (r.role === 'organization' && r.verified) { score += 20; reasons.push('Verified organization'); }
      else if (r.role === 'volunteer') { score += 10; reasons.push('Volunteer'); }
      return { responder: r, score: Math.min(100, score), reasons };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

module.exports = { scorePair, rankNeedsForHelper, rankHelpersForNeed, rankResponders };
