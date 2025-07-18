import React, { useEffect } from "react";

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 20,
       background: "linear-gradient(90deg, #ff9966 0%, #ff5e62 100%)",
      color: "#fff",
      padding: "20px 30px",
      borderRadius: 4,
      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      zIndex: 9999,
    }}>
      {message}
    </div>
  );
};

export default Toast;
