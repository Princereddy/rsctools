/**
 * RSC TOOLS – Image Dimension Checker
 * All processing is 100% client-side. No data ever leaves the browser.
 * Memory is cleared automatically on page close / refresh.
 */

'use strict';

// ── DOM References ────────────────────────────────────────────────────────────
const dropZone      = document.getElementById('dropZone');
const fileInput     = document.getElementById('fileInput');
const browseBtn     = document.getElementById('browseBtn');
const resultsGrid   = document.getElementById('resultsGrid');
const resultsHeader = document.getElementById('resultsHeader');
const resultsSection= document.getElementById('resultsSection');
const resultCount   = document.getElementById('resultCount');
const resultPlural  = document.getElementById('resultPlural');
const clearBtn      = document.getElementById('clearBtn');
const uploadCounter = document.getElementById('uploadCounter');
const countDisplay  = document.getElementById('countDisplay');
const noticeClose   = document.getElementById('noticeClose');

// ── State ─────────────────────────────────────────────────────────────────────
const MAX_IMAGES    = 50;
let uploadedImages  = [];   // { id, name, type, size, width, height, url }
let cardIdCounter   = 0;

// ── Notice Banner ─────────────────────────────────────────────────────────────
noticeClose.addEventListener('click', () => {
  const banner = document.getElementById('noticeBanner');
  banner.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  banner.style.opacity = '0';
  banner.style.transform = 'translateY(-8px)';
  setTimeout(() => banner.remove(), 320);
});

// ── Drop Zone Events ──────────────────────────────────────────────────────────

// Prevent default browser behaviour for all drag events
['dragenter','dragover','dragleave','drop'].forEach(evt => {
  dropZone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); });
  document.body.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); });
});

dropZone.addEventListener('dragenter', () => dropZone.classList.add('drag-over'));
dropZone.addEventListener('dragover',  () => dropZone.classList.add('drag-over'));
dropZone.addEventListener('dragleave', e => {
  if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over');
});
dropZone.addEventListener('drop', e => {
  dropZone.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

// Click anywhere on drop zone triggers file picker
dropZone.addEventListener('click', e => {
  // Prevent double-fire if the click came from the file input or browse link
  if (e.target === fileInput || e.target === browseBtn) return;
  fileInput.click();
});

browseBtn.addEventListener('click', e => {
  e.stopPropagation();
  fileInput.click();
});

// Keyboard accessibility
dropZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

// File input change
fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
  fileInput.value = ''; // reset so same file can be re-added after clearing
});

// ── Clear All ─────────────────────────────────────────────────────────────────
clearBtn.addEventListener('click', clearAll);

function clearAll() {
  // Revoke object URLs to free memory
  uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
  uploadedImages = [];
  resultsGrid.innerHTML = '';
  updateUI();
}

// ── File Processing ───────────────────────────────────────────────────────────
function handleFiles(fileList) {
  if (!fileList || fileList.length === 0) return;

  const files = Array.from(fileList);

  // Filter non-image files
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  const rejected   = files.length - imageFiles.length;
  if (rejected > 0) {
    notify(`⚠️ ${rejected} non-image file${rejected > 1 ? 's were' : ' was'} skipped.`, 'info');
  }

  // Check limit
  const slots = MAX_IMAGES - uploadedImages.length;
  if (slots <= 0) {
    notify(`🚫 Maximum of ${MAX_IMAGES} images reached. Clear some to add more.`, 'info');
    return;
  }

  const toProcess = imageFiles.slice(0, slots);
  const overflow  = imageFiles.length - toProcess.length;
  if (overflow > 0) {
    notify(`⚠️ Only ${slots} slot${slots > 1 ? 's' : ''} remaining. ${overflow} image${overflow > 1 ? 's' : ''} skipped.`, 'info');
  }

  toProcess.forEach(file => processImage(file));
}

function processImage(file) {
  const id  = ++cardIdCounter;
  const url = URL.createObjectURL(file);

  const img = new Image();
  img.onload = () => {
    const entry = {
      id,
      name:   file.name,
      type:   getExtLabel(file.type, file.name),
      size:   file.size,
      width:  img.naturalWidth,
      height: img.naturalHeight,
      url,
      aspectRatio: getAspectRatio(img.naturalWidth, img.naturalHeight),
      megapixels:  getMegapixels(img.naturalWidth, img.naturalHeight),
    };
    uploadedImages.push(entry);
    renderCard(entry);
    updateUI();
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    notify(`Could not read "${file.name}". File may be corrupt.`, 'error');
  };
  img.src = url;
}

// ── Render Card ───────────────────────────────────────────────────────────────
function renderCard(entry) {
  const card = document.createElement('article');
  card.className = 'image-card';
  card.id = `card-${entry.id}`;
  // Stagger animation delay slightly
  card.style.animationDelay = `${(uploadedImages.length - 1) * 0.06}s`;

  card.innerHTML = `
    <div class="card-thumb">
      <img src="${entry.url}" alt="${escHtml(entry.name)}" loading="lazy" />
      <span class="card-type-badge">${escHtml(entry.type)}</span>
      <button class="card-remove" data-id="${entry.id}" aria-label="Remove ${escHtml(entry.name)}" title="Remove image">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
        </svg>
      </button>
    </div>

    <div class="card-body">
      <p class="card-name" title="${escHtml(entry.name)}">${escHtml(entry.name)}</p>

      <div class="card-dims">
        <div class="card-dims-row main-dim">
          <span class="card-dims-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18M3 9h18"/>
            </svg>
          </span>
          <span class="card-dims-value">${entry.width} × ${entry.height}</span>
          <span class="card-dims-px">px</span>
        </div>
        <div class="card-dims-extra">
          <div class="dim-item"><span class="dim-val">${(entry.width / 96 * 2.54).toFixed(2)} × ${(entry.height / 96 * 2.54).toFixed(2)}</span> <span class="dim-unit">cm</span></div>
          <div class="dim-item"><span class="dim-val">${(entry.width / 96 * 25.4).toFixed(2)} × ${(entry.height / 96 * 25.4).toFixed(2)}</span> <span class="dim-unit">mm</span></div>
          <div class="dim-item"><span class="dim-val">${(entry.width / 96).toFixed(2)} × ${(entry.height / 96).toFixed(2)}</span> <span class="dim-unit">in</span></div>
        </div>
      </div>

      <div class="card-meta">
        <span class="meta-chip">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          ${formatBytes(entry.size)}
        </span>
        <span class="meta-chip">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          ${entry.aspectRatio}
        </span>
        <span class="meta-chip">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
          ${entry.megapixels} MP
        </span>
      </div>
    </div>
  `;

  // Remove button handler
  card.querySelector('.card-remove').addEventListener('click', e => {
    e.stopPropagation();
    removeCard(entry.id);
  });

  // Animate out when removed
  resultsGrid.appendChild(card);
}

// ── Remove Individual Card ────────────────────────────────────────────────────
function removeCard(id) {
  const idx   = uploadedImages.findIndex(img => img.id === id);
  if (idx === -1) return;

  URL.revokeObjectURL(uploadedImages[idx].url);
  uploadedImages.splice(idx, 1);

  const card = document.getElementById(`card-${id}`);
  if (card) {
    card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(0.92)';
    setTimeout(() => { card.remove(); updateUI(); }, 260);
  } else {
    updateUI();
  }
}

// ── Update UI State ───────────────────────────────────────────────────────────
function updateUI() {
  const count = uploadedImages.length;

  // Counter badge
  countDisplay.textContent = count;
  if (count >= MAX_IMAGES) {
    uploadCounter.classList.add('full');
  } else {
    uploadCounter.classList.remove('full');
  }

  // Results header
  if (count > 0) {
    resultsHeader.style.display = 'flex';
    resultCount.textContent = count;
    resultPlural.textContent = count === 1 ? '' : 's';
  } else {
    resultsHeader.style.display = 'none';
  }

  // Disable input at max
  fileInput.disabled = count >= MAX_IMAGES;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getExtLabel(mimeType, fileName) {
  const extMap = {
    'image/jpeg':    'JPG',
    'image/jpg':     'JPG',
    'image/png':     'PNG',
    'image/webp':    'WEBP',
    'image/gif':     'GIF',
    'image/bmp':     'BMP',
    'image/svg+xml': 'SVG',
    'image/avif':    'AVIF',
    'image/tiff':    'TIFF',
    'image/heic':    'HEIC',
    'image/heif':    'HEIF',
  };
  if (extMap[mimeType]) return extMap[mimeType];
  const ext = fileName.split('.').pop();
  return ext ? ext.toUpperCase() : 'IMG';
}

function getAspectRatio(w, h) {
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function getMegapixels(w, h) {
  return (w * h / 1_000_000).toFixed(2);
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Toast Notifications ───────────────────────────────────────────────────────

// ── Memory Cleanup on Page Unload ─────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  uploadedImages.forEach(img => URL.revokeObjectURL(img.url));
  uploadedImages = [];
});

// ── Donation Box Interactions ─────────────────────────────────────────────────
const donationGrid = document.getElementById('donationGrid');
const donateDisplayAmt = document.getElementById('donateDisplayAmt');
const customAmtInput = document.getElementById('customAmt');
const donateBtn = document.getElementById('donateBtn');

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
      // Redirect in same window to standard Razorpay.me collection link EXACTLY as requested
      window.location.href = `https://razorpay.me/@reddysricharandigitalservices`;
    } else {
      notify('Please select or enter a valid amount.', 'error');
    }
  });
}
