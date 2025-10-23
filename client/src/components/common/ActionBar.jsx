import React from 'react';

// Bottom-fixed action bar with Cancel (right) and Confirm (left), centered group.
// Props: onCancel, onConfirm, cancelText, confirmText, disabled, children (optional extra content)
const ActionBar = ({ onCancel, onConfirm, cancelText = 'ביטול', confirmText = 'אישור', disabled = false, children }) => {
  return (
    <div className="action-bar">
      <div className="action-bar-content">
        <button type="button" className="btn secondary right" onClick={onCancel}>{cancelText}</button>
        <div className="action-bar-middle">
          {children || null}
        </div>
        <button type="button" className="btn primary left" onClick={onConfirm} disabled={disabled}>{confirmText}</button>
      </div>
    </div>
  );
};

export default ActionBar;


