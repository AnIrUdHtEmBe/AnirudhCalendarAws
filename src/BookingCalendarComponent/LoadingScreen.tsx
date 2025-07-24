import React from 'react';

const LoadingScreen = () => {
  return (
    <div style={styles.loadingWrapper}>
      <div style={styles.overlay} />
      
      <div style={styles.contentContainer}>
        {/* Simple rotating spinner */}
        <div style={styles.spinner} />
        
        {/* Loading text */}
        <h1 style={styles.loadingText}>Loading...</h1>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  loadingWrapper: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backdropFilter: "blur(5px)",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: -1,
  },

  contentContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(255, 255, 255, 0.3)",
    borderTop: "4px solid #fff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },

  loadingText: {
    color: "#fff",
    fontSize: "3rem",
    fontWeight: "bold",
    margin: 0,
  },
};

// Add CSS animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

document.head.appendChild(styleSheet);

export default LoadingScreen;