import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

// A modal "Are you sure?" dialog, used before deleting a task.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={() => !loading && onCancel()}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="modal__icon">
          <Icon name="alert" size={22} />
        </span>
        <h2 id="confirm-title" className="modal__title">{title}</h2>
        <p id="confirm-message" className="modal__message">{message}</p>
        <div className="modal__actions">
          <button ref={cancelRef} type="button" className="btn btn--ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={loading}>
            {loading && <span className="spinner spinner--sm spinner--light" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
