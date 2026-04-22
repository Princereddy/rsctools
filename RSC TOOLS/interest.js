/**
 * RSC TOOLS – Interest Calculator
 * Client-side calculation and Chart.js integration
 */

'use strict';

// ── DOM References ────────────────────────────────────────────────────────────
const typeBtns       = document.querySelectorAll('.toggle-btn');
const compFreqGroup  = document.getElementById('compoundingFrequencyGroup');
const compoundFreq   = document.getElementById('compoundFreq');
const currency       = document.getElementById('currency');
const principal      = document.getElementById('principal');
const rate           = document.getElementById('rate');
const durationValue  = document.getElementById('durationValue');
const durationUnit   = document.getElementById('durationUnit');

const resPrincipal   = document.getElementById('resPrincipal');
const resInterest    = document.getElementById('resInterest');
const resTotal       = document.getElementById('resTotal');

let currentType = 'simple';
let myChart = null;

// ── Initialize ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initChart();
  calculateInterest();
});

// Attach listeners to all inputs to update live
[currency, principal, rate, durationValue, durationUnit, compoundFreq].forEach(el => {
  el.addEventListener('input', calculateInterest);
});

// Handle type toggles (Simple vs Compound)
typeBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    typeBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentType = e.target.getAttribute('data-type');
    
    // Show/hide compound frequency based on selection
    if (currentType === 'compound') {
      compFreqGroup.style.display = 'flex';
    } else {
      compFreqGroup.style.display = 'none';
    }
    
    calculateInterest();
  });
});

// ── Logic: Math ───────────────────────────────────────────────────────────────
function calculateInterest() {
  const p = parseFloat(principal.value);
  const r = parseFloat(rate.value) / 100; // Annual rate as decimal
  let tParams = parseFloat(durationValue.value);
  const unit = durationUnit.value;
  const sym = currency.value;

  if (isNaN(p) || isNaN(r) || isNaN(tParams) || p < 0 || r < 0 || tParams < 0) {
    updateUI(0, 0, 0, sym);
    return;
  }

  // Convert time to Years
  let t = 0;
  if (unit === 'days') t = tParams / 365;
  else if (unit === 'weeks') t = tParams / 52;
  else if (unit === 'months') t = tParams / 12;
  else if (unit === 'years') t = tParams;

  let interest = 0;
  let total = 0;

  if (currentType === 'simple') {
    interest = p * r * t;
    total = p + interest;
  } else if (currentType === 'compound') {
    const n = parseInt(compoundFreq.value); // e.g. 12 for monthly
    total = p * Math.pow(1 + (r / n), n * t);
    interest = total - p;
  }

  updateUI(p, interest, total, sym);
}

// ── Logic: Format & Update ────────────────────────────────────────────────────
function formatCurrency(amount, sym) {
  return sym + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateUI(p, i, total, sym) {
  // Prevent absurd NaN outputs gracefully
  if (isNaN(p)) p = 0;
  if (isNaN(i)) i = 0;
  if (isNaN(total)) total = 0;

  resPrincipal.textContent = formatCurrency(p, sym);
  resInterest.textContent = formatCurrency(i, sym);
  resTotal.textContent = formatCurrency(total, sym);

  updateChart(p, i);
}

// ── Chart.js Integration ──────────────────────────────────────────────────────
function initChart() {
  const ctx = document.getElementById('interestChart').getContext('2d');
  
  Chart.defaults.color = '#64748b'; // Label colors matching light theme text (Slate 500)
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

  myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Principal', 'Interest'],
      datasets: [{
        data: [10000, 500],
        backgroundColor: [
          '#6366f1', // Indigo primary
          '#f59e0b', // Amber accent for interest
        ],
        borderWidth: 2, // Fine borders match light UI better
        borderColor: '#ffffff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#0f172a',
          bodyColor: '#1e293b',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 14, weight: '700' },
          padding: 12,
          cornerRadius: 8,
          borderColor: 'rgba(0,0,0,0.06)',
          borderWidth: 1,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const val = context.parsed || 0;
              const sym = currency.value;
              return ` ${label}: ${formatCurrency(val, sym)}`;
            }
          }
        }
      }
    }
  });
}

function updateChart(p, i) {
  if (!myChart) return;
  // If everything is completely 0, render a blank donut to avoid weird visual bugs
  if (p === 0 && i === 0) {
    myChart.data.datasets[0].data = [1, 0]; 
    myChart.data.datasets[0].backgroundColor = ['rgba(0,0,0,0.04)', 'transparent'];
  } else {
    myChart.data.datasets[0].data = [p, i];
    myChart.data.datasets[0].backgroundColor = ['#6366f1', '#f59e0b'];
  }
  myChart.update();
}

// ── Donation Box Interactions ─────────────────────────────────────────────────
const donationGrid = document.getElementById('donationGridInt');
const donateDisplayAmt = document.getElementById('donateDisplayAmtInt');
const customAmtInput = document.getElementById('customAmtInt');
const donateBtn = document.getElementById('donateBtnInt');

if (donationGrid && donateDisplayAmt && customAmtInput && donateBtn) {
  const amtBtns = donationGrid.querySelectorAll('.amt-btn');

  // Handle predefined amount buttons
  amtBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amtBtns.forEach(b => b.classList.remove('active'));
      customAmtInput.value = '';
      btn.classList.add('active');
      donateDisplayAmt.textContent = `₹${btn.getAttribute('data-amt')}`;
    });
  });

  // Handle custom amount
  customAmtInput.addEventListener('input', (e) => {
    amtBtns.forEach(b => b.classList.remove('active'));
    let val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      donateDisplayAmt.textContent = `₹${val}`;
    } else {
      donateDisplayAmt.textContent = `₹0`;
    }
  });

  // Handle donation click
  donateBtn.addEventListener('click', () => {
    const finalAmtText = donateDisplayAmt.textContent.replace('₹', '');
    const amount = parseInt(finalAmtText, 10);
    if (amount > 0) {
      window.location.href = `https://razorpay.me/@reddysricharandigitalservices`;
    } else {
      alert('❌ Please select or enter a valid amount.');
    }
  });
}
