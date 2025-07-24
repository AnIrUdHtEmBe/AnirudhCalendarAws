import React, { ReactNode, MouseEvent } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(33, 37, 41, 0.55)", // darker, subtle overlay
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1300,
  backdropFilter: "blur(2px)", // soft blur for depth
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  padding: "2.5rem 2rem 1.5rem 2rem",
  borderRadius: "16px",
  minWidth: "740px",
  maxWidth: "95vw",
  maxHeight:"70vh",
  boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 1.5px 4px rgba(0,0,0,0.08)",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  gap: "1.2rem",
  animation: "modalIn 0.22s cubic-bezier(0.4,0,0.2,1)",
   overflowY: "auto",    
};

const closeButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "14px",
  right: "16px",
  background: "none",
  border: "none",
  fontSize: "2rem",
  color: "#888",
  cursor: "pointer",
  transition: "color 0.15s",
};


const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div style={backdropStyle} onClick={onClose}>
      <div
        style={modalStyle}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <button
          style={closeButtonStyle}
          onMouseOver={e => (e.currentTarget.style.color = "#1976d2")}
          onMouseOut={e => (e.currentTarget.style.color = "#888")}
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};


export default Modal;
