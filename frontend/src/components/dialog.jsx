import React from "react";

export const Dialog = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div>
      {/* Backdrop */}
      <div onClick={onClose} />

      {/* Dialog box */}
      <div>
        <h2>{title}</h2>

        <div>{children}</div>

        <button onClick={onClose}>
          ✖
        </button>
      </div>
    </div>
  );
};

export default Dialog;
