/**
 * RSC TOOLS – WhatsApp Link Generator
 * Client-side only. Built for speed and privacy.
 */

'use strict';

// ── DOM References ────────────────────────────────────────────────────────────
const waForm        = document.getElementById('waForm');
const countryCode   = document.getElementById('countryCode');
const mobileNumber  = document.getElementById('mobileNumber');
const customMessage = document.getElementById('customMessage');
const waFormSection = document.getElementById('waFormSection');
const waResultSection= document.getElementById('waResultSection');
const generatedLink = document.getElementById('generatedLink');
const copyBtn       = document.getElementById('copyBtn');
const qrcodeBox     = document.getElementById('qrcode');
const downloadQRBtn = document.getElementById('downloadQRBtn');
const resetBtn      = document.getElementById('resetBtn');
const noticeClose   = document.getElementById('noticeClose');

let qrInstance      = null;

// ── Notice Banner ─────────────────────────────────────────────────────────────
noticeClose.addEventListener('click', () => {
  const banner = document.getElementById('noticeBanner');
  banner.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  banner.style.opacity = '0';
  banner.style.transform = 'translateY(-8px)';
  setTimeout(() => banner.remove(), 320);
});

// ── Form Submission ───────────────────────────────────────────────────────────
waForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Strip anything that is not a digit or '+' from the code and number
  const code = countryCode.value.replace(/[^\d+]/g, '');
  const number = mobileNumber.value.replace(/[^\d]/g, '');

  if (!number || number.length < 5) {
    notify('Please enter a valid mobile number.', 'error');
    return;
  }

  // Ensure code defaults to something if purely empty, though required handles it mostly.
  const finalCode = code || '';
  // Construct pure number string
  const fullNumber = (finalCode + number).replace(/\+/g, ''); // wa.me prefers pure numbers without + 

  const msg = customMessage.value.trim();
  
  // Construct Link
  let link = `https://wa.me/${fullNumber}`;
  if (msg) {
    link += `?text=${encodeURIComponent(msg)}`;
  }

  // Update UI components
  generatedLink.value = link;

  // Generate QR Code
  generateQR(link);

  // Transition UI
  waFormSection.style.display = 'none';
  waResultSection.classList.add('show');
});

// ── QR Code Generation ────────────────────────────────────────────────────────
function generateQR(text) {
  // Clear any existing QR code
  qrcodeBox.innerHTML = '';

  qrInstance = new QRCode(qrcodeBox, {
    text: text,
    width: 200,
    height: 200,
    colorDark : "#0a0a12",   // dark background matching theme
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
}

// ── Actions ───────────────────────────────────────────────────────────────────
downloadQRBtn.addEventListener('click', () => {
  const canvasElement = qrcodeBox.querySelector('canvas');
  
  if (!canvasElement) {
    notify('QR code not generated yet.', 'error');
    return;
  }

  try {
    // Add white padding to match the visual display
    const padding = 24; // 24px clear border on all sides
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvasElement.width + (padding * 2);
    finalCanvas.height = canvasElement.height + (padding * 2);
    
    const ctx = finalCanvas.getContext('2d');
    
    // 1. Fill entire canvas with solid white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    
    // 2. Draw the actual QR code centered inside our padded canvas
    ctx.drawImage(canvasElement, padding, padding);

    // 3. Export this bordered canvas as a JPEG
    const dataUrl = finalCanvas.toDataURL('image/jpeg', 1.0);
    
    // Convert the data URL to a Blob to ensure formatting and filename
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `WhatsApp-QR-${Date.now()}.jpg`;
        link.href = blobUrl;
        
        // Firefox requires the link to be in the body
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      });
      
  } catch (err) {
    notify('Failed to process QR code image.', 'error');
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(generatedLink.value);
    notify('Link copied to clipboard!', 'success');
    copyBtn.textContent = 'Copied!';
    copyBtn.style.background = 'rgba(16, 185, 129, 0.2)'; // success green
    copyBtn.style.color = '#34d399';
    
    setTimeout(() => {
      copyBtn.textContent = 'Copy Link';
      copyBtn.style.background = '';
      copyBtn.style.color = '';
    }, 2500);
  } catch (err) {
    notify('Failed to copy link. Please copy manually.', 'error');
  }
});

resetBtn.addEventListener('click', () => {
  // Wipe inputs for privacy as requested
  mobileNumber.value = '';
  customMessage.value = '';
  generatedLink.value = '';
  qrcodeBox.innerHTML = '';
  
  // Transition UI back
  waResultSection.classList.remove('show');
  setTimeout(() => {
    waFormSection.style.display = 'block';
  }, 300);
});

// ── Toast Notifications ───────────────────────────────────────────────────────

// ── Memory Cleanup on Page Unload ─────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  mobileNumber.value = '';
  customMessage.value = '';
  generatedLink.value = '';
});

// ── Donation Box Interactions ─────────────────────────────────────────────────
const donationGrid = document.getElementById('donationGridWa');
const donateDisplayAmt = document.getElementById('donateDisplayAmtWa');
const customAmtInput = document.getElementById('customAmtWa');
const donateBtn = document.getElementById('donateBtnWa');

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
      notify('Please select or enter a valid amount.', 'error');
    }
  });
}
