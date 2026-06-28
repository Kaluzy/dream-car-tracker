const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const percent = (n) => `${Number(n).toFixed(n % 1 ? 1 : 0)}%`;
const APP_VERSION = 'trade-tracker-1';

let state;

function payment(principal, aprPct, months) {
  const apr = aprPct / 100;
  const r = apr / 12;
  if (principal <= 0) return 0;
  if (!r) return principal / months;
  return principal * r / (1 - Math.pow(1 + r, -months));
}

function aprBadge(vehicle, profile) {
  if (vehicle.currentAprBest <= profile.aprAcceptableMax) return ['green', 'APR fits'];
  if (vehicle.currentAprBest <= 3) return ['yellow', 'APR close'];
  return ['red', 'APR too high'];
}

function creditReadiness(score) {
  if (score >= 720) return ['green', 'Promo-ready'];
  if (score >= 690) return ['yellow', 'Almost there'];
  return ['yellow', 'Hold: use conservative score'];
}

function dealScore(vehicle, profile, estPayment) {
  let score = 0;
  if (vehicle.rank === 1) score += 25;
  if (vehicle.rank === 2) score += 18;
  if (vehicle.rank === 3) score += 12;
  score += Math.min(30, vehicle.familyFit / 4);
  if (vehicle.currentAprBest <= 0) score += 25;
  else if (vehicle.currentAprBest <= profile.aprAcceptableMax) score += 20;
  else if (vehicle.currentAprBest <= 3) score += 10;
  if (estPayment <= profile.monthlyTargetMax) score += 25;
  else if (estPayment <= 450) score += 12;
  else score -= 15;
  if (vehicle.insuranceRisk === 'medium-high') score -= 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function statusFromScore(score, vehicle, paymentEstimate, profile) {
  if (vehicle.currentAprBest > 3) return ['red', 'WAIT'];
  if (paymentEstimate > 450) return ['red', 'TOO HIGH'];
  if (profile.creditScoreNow < 690) return ['yellow', 'HOLD / WATCH'];
  if (score >= 75 && paymentEstimate <= profile.monthlyTargetMax) return ['green', 'BUY SIGNAL'];
  if (score >= 60) return ['yellow', 'WATCH CLOSELY'];
  return ['red', 'WAIT'];
}

function valueRangeText(item) {
  if (item.valueLow === item.valueHigh) return money.format(item.valueLow);
  return `${money.format(item.valueLow)}–${money.format(item.valueHigh)}`;
}

function renderTradeTracker(profile) {
  const tracker = state.tradeValueTracker;
  if (!tracker) return;
  document.querySelector('#tradePlanningValue').textContent = money.format(profile.tradeValueAssumption || tracker.planningValue);
  document.querySelector('#tradeApiStatus').textContent = tracker.status.replaceAll('-', ' ');
  document.querySelector('#tradeTrackerSummary').textContent = `${tracker.vehicleLabel}. Last checked ${tracker.lastUpdated}. Target: ${money.format(tracker.targetValueMin)}+ acceptable, ${money.format(tracker.targetValueGood)}+ strong.`;
  document.querySelector('#tradeValueCards').innerHTML = tracker.latestValues.map(item => `
    <article class="trade-value-card">
      <span>${item.source}</span>
      <strong>${valueRangeText(item)}</strong>
      <small>${item.confidence} confidence · ${item.updated}</small>
      <p>${item.notes}</p>
    </article>
  `).join('');
  document.querySelector('#tradeSourceLinks').innerHTML = tracker.trustedSources.map(source => `
    <article>
      <strong>${source.name}</strong>
      <span>${source.type}</span>
      <p>${source.apiNotes}</p>
      <a href="${source.url}" target="_blank" rel="noreferrer">Open source</a>
    </article>
  `).join('');
  document.querySelector('#tradeRefreshChecklist').innerHTML = tracker.refreshChecklist.map(item => `<li>${item}</li>`).join('');
  document.querySelector('#tradeAlertRules').innerHTML = tracker.alertRules.map(item => `<li>${item}</li>`).join('');
}

function render() {
  const profile = { ...state.profile };
  profile.creditScoreNow = Number(document.querySelector('#creditScore').value);
  profile.tradeValueAssumption = Number(document.querySelector('#tradeValue').value);
  profile.cashDownAssumption = Number(document.querySelector('#cashDown').value);
  profile.loanTermMonths = Number(document.querySelector('#loanTerm').value);

  document.querySelector('#lastUpdated').textContent = `Snapshot updated ${profile.lastUpdated}`;
  document.querySelector('#strategySummary').textContent = profile.summary;
  document.querySelector('#paymentTarget').textContent = `${money.format(profile.monthlyTargetMin)}–${money.format(profile.monthlyTargetMax)}/mo`;
  document.querySelector('#aprRule').textContent = `Ideal ${percent(profile.aprIdealMax)}, max ${percent(profile.aprAcceptableMax)}`;
  document.querySelector('#insuranceBaseline').textContent = `~${money.format(profile.insuranceBaselineMonthly)}/mo baseline`;
  document.querySelector('#currentVehicle').textContent = profile.currentVehicle;
  renderTradeTracker(profile);

  const [creditClass, creditText] = creditReadiness(profile.creditScoreNow);

  const patternList = document.querySelector('#marketPatterns');
  patternList.innerHTML = state.marketPatterns.map(pattern => `
    <li>
      <strong>${pattern.source}</strong>
      <span>${pattern.productLesson}</span>
    </li>
  `).join('');

  const cards = state.vehicles.map(vehicle => {
    const financed = Math.max(0, vehicle.estimatedTargetOtd - profile.tradeValueAssumption - profile.cashDownAssumption);
    const estPayment = payment(financed, vehicle.currentAprBest, profile.loanTermMonths);
    const score = dealScore(vehicle, profile, estPayment);
    const [statusClass, statusText] = statusFromScore(score, vehicle, estPayment, profile);
    const [aprClass, aprText] = aprBadge(vehicle, profile);
    const cargoText = vehicle.cargoUnit === 'liters on cited practicality source'
      ? `${vehicle.cargoBehindSecondCuFt}–${vehicle.cargoMaxCuFt} L cargo cited`
      : `${vehicle.cargoBehindSecondCuFt} / ${vehicle.cargoMaxCuFt} cu ft cargo`;

    return `
      <article class="vehicle-card panel ${statusClass}">
        <div class="card-topline">
          <span class="rank">#${vehicle.rank}</span>
          <span class="status-pill ${statusClass}">${statusText}</span>
        </div>
        <h3>${vehicle.model}</h3>
        <p class="role">${vehicle.preferenceRole}</p>
        <div class="score-row">
          <div class="score-ring" style="--score:${score}"><span>${score}</span></div>
          <div>
            <strong>${money.format(estPayment)}/mo est.</strong>
            <small>${money.format(financed)} financed @ ${percent(vehicle.currentAprBest)} for ${profile.loanTermMonths} mo</small>
          </div>
        </div>
        <div class="specs">
          <span><b>MSRP</b>${money.format(vehicle.msrpLow)}–${money.format(vehicle.msrpHigh)}</span>
          <span><b>APR</b><em class="tag ${aprClass}">${aprText}: ${percent(vehicle.currentAprBest)}</em></span>
          <span><b>Rear legroom</b>${vehicle.rearLegroomIn || 'TBD'} in</span>
          <span><b>Cargo</b>${cargoText}</span>
          <span><b>Fuel</b>${vehicle.fuelType}</span>
          <span><b>Insurance risk</b>${vehicle.insuranceRisk}</span>
        </div>
        <p>${vehicle.why}</p>
        <details>
          <summary>Watch triggers</summary>
          <ul>${vehicle.watchTriggers.map(x => `<li>${x}</li>`).join('')}</ul>
        </details>
        <details>
          <summary>Red flags</summary>
          <ul>${vehicle.redFlags.map(x => `<li>${x}</li>`).join('')}</ul>
        </details>
        <div class="links">
          ${vehicle.sourceLinks.map((url, idx) => `<a href="${url}" target="_blank" rel="noreferrer">Source ${idx + 1}</a>`).join('')}
        </div>
      </article>
    `;
  }).join('');

  document.querySelector('#vehicleCards').innerHTML = cards;
  const scoreLabel = profile.creditScoreNow < 690 ? `${profile.creditScoreNow} conservative credit scenario` : `${profile.creditScoreNow} credit score`;
  document.querySelector('#headlineStatus').textContent = `${creditText}: ${scoreLabel}`;
  document.querySelector('.hero-card').className = `hero-card ${creditClass}`;
}

async function init() {
  const response = await fetch(`data.json?v=${APP_VERSION}`, { cache: 'no-store' });
  state = await response.json();
  document.querySelector('#creditScore').value = state.profile.creditScoreNow;
  document.querySelector('#tradeValue').value = state.profile.tradeValueAssumption;
  document.querySelector('#cashDown').value = state.profile.cashDownAssumption;
  document.querySelector('#loanTerm').value = state.profile.loanTermMonths;
  document.querySelector('#recalculate').addEventListener('click', render);
  document.querySelectorAll('input, select').forEach(el => el.addEventListener('change', render));
  render();
}

init().catch(error => {
  document.body.innerHTML = `<pre>Failed to load dashboard: ${error.message}</pre>`;
});
