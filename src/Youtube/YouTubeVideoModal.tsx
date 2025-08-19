import React from 'react';
import './YouTubeVideoModal.css';

interface YouTubeVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

const YouTubeVideoModal: React.FC<YouTubeVideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title = "Video Player"
}) => {
  // Function to extract YouTube video ID from URL
  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Handle modal close on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key press
  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if modal is not open
  if (!isOpen) return null;

  const videoId = extractVideoId(videoUrl);

  if (!videoId) {
    console.error('Invalid YouTube URL provided:', videoUrl);
    return null;
  }

  return (
    <div className="video-modal-overlay" onClick={handleOverlayClick}>
      <div className="video-modal-container" onClick={(e) => e.stopPropagation()}>
        <button
          className="video-modal-close"
          onClick={onClose}
          aria-label="Close video modal"
          title="Close (Esc)"
        >
          &times;
        </button>
        <div className="video-player">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

export default YouTubeVideoModal;