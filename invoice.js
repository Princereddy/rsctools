/**
 * RSC TOOLS – Invoice Generator
 * Client-side only PDF generation & stateful invoice tracking.
 */

'use strict';

// ── DOM References ────────────────────────────────────────────────────────────
const invoiceForm   = document.getElementById('invoiceForm');
const bizNameInput  = document.getElementById('bizName');
const bizLogoInput  = document.getElementById('bizLogo');
const bizAddress    = document.getElementById('bizAddress');
const bizPhone      = document.getElementById('bizPhone');
const clientName    = document.getElementById('clientName');
const clientPhone   = document.getElementById('clientPhone');
const inputInvNum   = document.getElementById('inputInvNum');
const invoiceDate   = document.getElementById('invoiceDate');
const currencySym   = document.getElementById('currencySym');

const itemsContainer= document.getElementById('itemsContainer');
const addItemBtn    = document.getElementById('addItemBtn');

const applyGst      = document.getElementById('applyGst');
const gstRate       = document.getElementById('gstRate');

const generateBtn   = document.getElementById('generateInvoiceBtn');
const generatedList = document.getElementById('generatedList');
const emptyListMsg  = document.getElementById('emptyListMsg');
const hiddenPdfArea = document.getElementById('hiddenPdfRenderArea');
const liveTotalDisplay = document.getElementById('liveTotalDisplay');


// State
let items = [{ id: Date.now(), name: '', price: 0, qty: 1 }];
let bizLogoUrl = '';
let invoiceCounter = 1;
let savedInvoices = [];

// Initialize Date to Today
invoiceDate.valueAsDate = new Date();

// ── Event Listeners ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderItemInputs();
  calculateLiveTotal();
});

[currencySym, gstRate].forEach(el => {
  el.addEventListener('input', calculateLiveTotal);
});

// Clear error borders visually on type
[bizNameInput, bizAddress, bizPhone, clientName, clientPhone].forEach(el => {
  el.addEventListener('input', () => {
    el.classList.remove('error-border');
  });
});

applyGst.addEventListener('change', () => {
  gstRate.disabled = !applyGst.checked;
  calculateLiveTotal();
});

// ── Logo Upload ───────────────────────────────────────────────────────────────
bizLogoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) {
    bizLogoUrl = '';
    return;
  }
  
  // Validate type
  if (!file.type.match('image/(jpeg|png)')) {
    notify('Only JPG and PNG allowed for Logo', 'error');
    bizLogoInput.value = '';
    return;
  }
  
  // Validate Size (Max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    notify('Logo size exceeds 2MB limit', 'error');
    bizLogoInput.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (evt) => {
    bizLogoUrl = evt.target.result;
  };
  reader.readAsDataURL(file);
});

// ── Dynamic Items ─────────────────────────────────────────────────────────────
addItemBtn.addEventListener('click', () => {
  items.push({ id: Date.now(), name: '', price: 0, qty: 1 });
  renderItemInputs();
});

function renderItemInputs() {
  itemsContainer.innerHTML = '';
  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'item-row';
    
    row.innerHTML = `
      <input type="text" class="form-control" placeholder="Item Name" value="${item.name}" data-idx="${index}" data-field="name" />
      <input type="number" class="form-control" placeholder="Price" value="${item.price === 0 ? '' : item.price}" min="0" step="any" data-idx="${index}" data-field="price" />
      <input type="number" class="form-control" placeholder="Qty" value="${item.qty}" min="1" step="1" data-idx="${index}" data-field="qty" />
      <button type="button" class="btn-del" title="Remove Item" data-idx="${index}">✕</button>
    `;
    itemsContainer.appendChild(row);
  });
  
  // Attach listeners dynamically
  const inputs = itemsContainer.querySelectorAll('input');
  inputs.forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = e.currentTarget.getAttribute('data-idx');
      const field = e.target.getAttribute('data-field');
      const val = e.target.value;
      if (field === 'name') items[idx].name = val;
      else items[idx][field] = parseFloat(val) || 0;
      calculateLiveTotal();
    });
  });
  
  const delBtns = itemsContainer.querySelectorAll('.btn-del');
  delBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (items.length <= 1) return; // keep at least 1 row
      const idx = e.currentTarget.getAttribute('data-idx');
      items.splice(idx, 1);
      renderItemInputs();
      calculateLiveTotal();
    });
  });
}

function calculateLiveTotal() {
  const sym = currencySym.value;
  let subtotal = 0;
  items.forEach(item => {
    subtotal += (item.price * item.qty);
  });
  
  let gstAmount = 0;
  if (applyGst.checked) {
    const rate = parseFloat(gstRate.value) || 0;
    gstAmount = subtotal * (rate / 100);
  }
  
  const grandTotal = subtotal + gstAmount;
  if (liveTotalDisplay) {
    liveTotalDisplay.textContent = `${sym}${grandTotal.toFixed(2)}`;
  }
}

// ── Generator Engine ──────────────────────────────────────────────────────────
generateBtn.addEventListener('click', () => {
  if (typeof html2pdf === 'undefined') {
    notify('PDF Engine loading... Please try again.', 'error');
    return;
  }

  const bName = bizNameInput.value.trim();
  const bAddress= bizAddress.value.trim();
  const bPhone  = bizPhone.value.trim();
  const cName = clientName.value.trim();
  const cPhone = clientPhone.value.trim();
  
  const missing = [];
  const requiredInputs = [
    { el: bizNameInput, name: "Business Name" },
    { el: bizAddress, name: "Business Address" },
    { el: bizPhone, name: "Biz Phone" },
    { el: clientName, name: "Client Name" },
    { el: clientPhone, name: "Client Phone" }
  ];

  requiredInputs.forEach(item => {
    if (!item.el.value.trim()) {
      missing.push(item.name);
      item.el.classList.add('error-border');
    } else {
      item.el.classList.remove('error-border');
    }
  });
  
  if (missing.length > 0) {
    notify(`Missing required fields: ${missing.join(', ')}`, 'error');
    return;
  }
  
  const dateStr = invoiceDate.value || new Date().toISOString().split('T')[0];
  const sym = currencySym.value;
  
  // Use explicit input value for invoice number
  let currentInvNum = parseInt(inputInvNum.value, 10) || 1;
  const invNumberStr = `INV-${String(currentInvNum).padStart(5, '0')}`;
  
  // Auto-increment the input UI for the next one
  inputInvNum.value = currentInvNum + 1;
  
  let subtotal = 0;
  let itemsHtml = '';
  
  items.forEach(item => {
    const itemName = item.name.trim() || 'Item / Service';
    const totalLine = (item.price * item.qty);
    subtotal += totalLine;
    
    itemsHtml += `
      <tr>
        <td>${itemName}</td>
        <td>${sym}${item.price.toFixed(2)}</td>
        <td>${item.qty}</td>
        <td>${sym}${totalLine.toFixed(2)}</td>
      </tr>
    `;
  });
  
  let gstAmount = 0;
  if (applyGst.checked) {
    const rate = parseFloat(gstRate.value) || 0;
    gstAmount = subtotal * (rate / 100);
  }
  const grandTotal = subtotal + gstAmount;

  // Build Layout HTML for Memory
  let logoHtml = '';
  if (bizLogoUrl) {
    logoHtml = `<img src="${bizLogoUrl}" alt="Business Logo" class="inv-logo-preview" />`;
  }
  
  let addressHtml = '';
  if (bAddress || bPhone) {
    addressHtml = `<div style="font-size: 0.9rem; color: #64748b; margin-top: 0.25rem;">`;
    if (bAddress) addressHtml += `<span style="white-space: pre-wrap;">${bAddress}</span>`;
    if (bPhone) addressHtml += `<div style="margin-top: 0.15rem;">📞 ${bPhone}</div>`;
    addressHtml += `</div>`;
  }
  
  let phoneHtml = cPhone ? `<div style="font-size: 0.95rem; color: #475569; margin-top: 0.25rem;">📞 ${cPhone}</div>` : '';
  
  let gstRowHtml = applyGst.checked 
    ? `<div class="inv-summary-row"><span>GST (${gstRate.value || 0}%):</span><span>${sym}${gstAmount.toFixed(2)}</span></div>`
    : '';
  
  const finalHtml = `
    <div class="invoice-paper">
      <div class="inv-header">
        <div class="inv-brand">
          ${logoHtml}
          <h2 class="inv-biz-name">${bName}</h2>
          ${addressHtml}
        </div>
        <div class="inv-meta">
          <h1>INVOICE</h1>
          <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 0.25rem;">Date: <strong>${dateStr}</strong></div>
          <div style="font-size: 0.9rem; color: #64748b;">Invoice #: <strong>${invNumberStr}</strong></div>
        </div>
      </div>
      
      <div style="margin-bottom: 2rem;">
        <h3 style="font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;">Bill To:</h3>
        <p style="font-size: 1.1rem; font-weight: 600; margin: 0; color: #1e293b;">${cName}</p>
        ${phoneHtml}
      </div>
      
      <table class="inv-table">
        <thead>
          <tr>
            <th style="width: 50%">Description</th>
            <th>Rate</th>
            <th>Qty</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="inv-summary" style="page-break-inside: avoid;">
        <div class="inv-summary-row">
          <span>Subtotal:</span>
          <span>${sym}${subtotal.toFixed(2)}</span>
        </div>
        ${gstRowHtml}
        <div class="inv-summary-row total">
          <span>Total Amount:</span>
          <span>${sym}${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;

  // Push to memory
  const invoiceData = {
    id: Date.now(),
    invNumber: invNumberStr,
    client: cName,
    total: `${sym}${grandTotal.toFixed(2)}`,
    htmlBlob: finalHtml
  };
  
  savedInvoices.push(invoiceData);
  renderInvoiceList();
  notify('Invoice Generated Successfully!', 'success');
  
  // Scoped function triggers layout build
  function renderInvoiceList() {
    if (emptyListMsg) emptyListMsg.style.display = 'none';
    
    // Check if the card already exists so we don't wipe everything (performance)
    // For simplicity of sorting, we will clear and re-render.
    const allCards = document.querySelectorAll('.generated-invoice-card');
    allCards.forEach(c => c.remove());
    
    // Reverse loop to show newest at the top
    for (let i = savedInvoices.length - 1; i >= 0; i--) {
      const inv = savedInvoices[i];
      const card = document.createElement('div');
      card.className = 'generated-invoice-card';
      card.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.2rem; min-width: 100px;">
          <h4 style="margin: 0; color: var(--col-primary-d); font-size: 1.15rem; font-weight: 700;">${inv.invNumber}</h4>
          <div style="font-weight: 700; color: #10b981; font-size: 1rem;">${inv.total}</div>
        </div>
        <div style="flex: 1; text-align: center; font-size: 0.95rem; color: #64748b; padding: 0 1rem;">
          Client: <strong style="color: var(--col-text);">${inv.client}</strong>
        </div>
        <div>
          <button type="button" class="btn-sec btn-dl" data-id="${inv.id}">Download PDF</button>
        </div>
      `;
      generatedList.appendChild(card);
    }
    
    // Bind downloads
    const dlBtns = generatedList.querySelectorAll('.btn-dl');
    dlBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tgtId = parseInt(e.currentTarget.getAttribute('data-id'), 10);
        const data = savedInvoices.find(v => v.id === tgtId);
        if(data) executePdfDownload(data);
      });
    });
  }
});


// ── PDF Extraction Engine ─────────────────────────────────────────────────────
function executePdfDownload(invoiceData) {
  // Inject HTML temporarily into the absolute hidden div so html2pdf can physically "see" it to measure
  hiddenPdfArea.innerHTML = invoiceData.htmlBlob;
  
  // Find the exact DOM target
  const element = hiddenPdfArea.firstElementChild;
  
  const opt = {
    margin:       [0.4, 0, 0.4, 0], // Top, Left, Bottom, Right
    filename:     `${invoiceData.invNumber}_${invoiceData.client}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false, windowWidth: 800 },
    // A4 unit allows responsive height calculations. If the DOM naturally flows, it will paginate automatically.
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' } 
  };
  
  notify(`Downloading ${invoiceData.invNumber}...`, 'info');
  
  html2pdf().set(opt).from(element).save().then(() => {
    hiddenPdfArea.innerHTML = ''; // cleanup
  }).catch(err => {
    showToast('❌ Error generating PDF: ' + err.message);
  });
}

// ── Donation Box Interactions ─────────────────────────────────────────────────
const donationGrid = document.getElementById('donationGridInv');
const donateDisplayAmt = document.getElementById('donateDisplayAmtInv');
const customAmtInput = document.getElementById('customAmtInv');
const donateBtn = document.getElementById('donateBtnInv');

if (donationGrid && donateDisplayAmt && customAmtInput && donateBtn) {
  const amtBtns = donationGrid.querySelectorAll('.amt-btn');

  amtBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amtBtns.forEach(b => b.classList.remove('active'));
      customAmtInput.value = '';
      btn.classList.add('active');
      donateDisplayAmt.textContent = `₹${btn.getAttribute('data-amt')}`;
    });
  });

  customAmtInput.addEventListener('input', (e) => {
    amtBtns.forEach(b => b.classList.remove('active'));
    let val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      donateDisplayAmt.textContent = `₹${val}`;
    } else {
      donateDisplayAmt.textContent = `₹0`;
    }
  });

  donateBtn.addEventListener('click', () => {
    const finalAmtText = donateDisplayAmt.textContent.replace('₹', '');
    const amount = parseInt(finalAmtText, 10);
    if (amount > 0) {
      window.location.href = `https://razorpay.me/@reddysricharandigitalservices`;
    } else {
      notify('Please select or enter a valid amount.', 'error');
    }
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Memory Cleanup on Page Unload ─────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  bizLogoUrl = '';
  items = [];
  savedInvoices = []; // purge memory
  invoiceForm.reset();
});
