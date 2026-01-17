const { createModal, closeModal } = require('./modal');

// --- Embedded Styles ---
const cssStyles = `
#payment-gateway-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647; font-family: sans-serif; }
.pg-overlay { background: rgba(0,0,0,0.6); width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; position: relative; }
.pg-iframe { width: 400px; height: 600px; background: white; border: none; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.pg-close-btn { position: absolute; top: 20px; right: 20px; background: white; border: none; font-size: 24px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
`;

function injectStyles() {
  if (document.getElementById('pg-styles')) return;
  const style = document.createElement('style');
  style.id = 'pg-styles';
  style.innerText = cssStyles;
  document.head.appendChild(style);
}

// --- Main Class ---
class PaymentGateway {
  constructor(options) {
    this.key = options.key;
    this.orderId = options.orderId;
    this.onSuccess = options.onSuccess;
    this.onFailure = options.onFailure;
    injectStyles();
  }

  open() {
    createModal(this.orderId);
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  handleMessage(event) {
    if (!event.data) return;
    if (event.data.type === 'payment_success') {
      if (this.onSuccess) this.onSuccess(event.data.data);
      this.close();
    } else if (event.data.type === 'payment_failed') {
      if (this.onFailure) this.onFailure(event.data.data);
    } else if (event.data.type === 'close_modal') {
      this.close();
    }
  }

  close() {
    closeModal();
    window.removeEventListener('message', this.handleMessage.bind(this));
  }
}

// Standard Export
module.exports = PaymentGateway;