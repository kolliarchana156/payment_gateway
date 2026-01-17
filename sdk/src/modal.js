function createModal(orderId) {
  if (document.getElementById('payment-gateway-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'payment-gateway-modal';
  // IMPORTANT: Matches your Docker service port
  const iframeSrc = `http://localhost:3001/checkout?order_id=${orderId}`;

  modal.innerHTML = `
    <div class="pg-overlay">
      <button class="pg-close-btn">&times;</button>
      <iframe class="pg-iframe" src="${iframeSrc}"></iframe>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.pg-close-btn').onclick = () => closeModal();
}

function closeModal() {
  const modal = document.getElementById('payment-gateway-modal');
  if (modal) modal.remove();
}

// Standard Node.js export
module.exports = { createModal, closeModal };