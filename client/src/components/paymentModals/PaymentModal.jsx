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
      </div>
    </div>
  );
}

function CancelledModal({ amount, onClose }) {
  const navigate = useNavigate();

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button className="close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="icon-ring cancel">✕</div>

        <p className="modal-title">Payment cancelled</p>
        <p className="modal-sub">
          You cancelled the payment. No money has been taken from your account.
        </p>

        <div className="amount-badge">
          <div className="label">Amount</div>
          <div className="value">R {amount}</div>
        </div>

        <div className="ref-row">
          🕐 No charge made
        </div>

        <div className="divider" />

        <button
          className="modal-btn primary cancel"
          onClick={() => navigate(-1)}
        >
          Try again
        </button>

      </div>
    </div>
  );
}

export default function PaymentModal({amount , reference}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('payment');

  const closeModal = () => {
    searchParams.delete('payment');
    setSearchParams(searchParams);
  };

  if (!status) return null;

  if (status === 'success') {
  return (
    <SuccessModal
      amount={amount}
      reference={reference}
      onClose={closeModal}
    />
  );
}

if (status === 'cancelled') {
  return (
    <CancelledModal
      amount={amount}
      onClose={closeModal}
    />
  );
}

  return null;
}