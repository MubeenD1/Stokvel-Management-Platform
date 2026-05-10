import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function SuccessModal({ amount, reference, onClose }) {
  const navigate = useNavigate();

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button className="close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="icon-ring success">✓</div>

        <p className="modal-title">Payment successful</p>
        <p className="modal-sub">
          Your stokvel contribution has been received and confirmed.
        </p>

        <div className="amount-badge">
          <div className="label">Amount paid</div>
          <div className="value">R {amount}</div>
        </div>

        <div className="ref-row">
          🧾 Ref: {reference}
        </div>

        <div className="divider" />

        <button
          className="modal-btn primary success"
          onClick={() => navigate('/contributions')}
        >
          Back to contributions
        </button>
      </div>
    </div>
  );
}