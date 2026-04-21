import Button from "./Button";

export default function Modal({ open, title, children, onClose, actionLabel = "Close" }) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <Button onClick={onClose}>{actionLabel}</Button>
        </div>
      </div>
    </div>
  );
}
