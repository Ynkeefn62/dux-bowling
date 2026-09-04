'use client';
import { useEffect } from 'react';

export default function SentModal({
  title,
  body,
  onClose,
}: {
  title: string;
  body: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="tick" aria-hidden="true">&#10003;</div>
        <h3 className="stripe sub" style={{ color: 'var(--orange)' }}>{title}</h3>
        <p className="lede" style={{ margin: '10px auto 0' }}>{body}</p>
        <button className="btn primary" style={{ marginTop: 22 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
