import { useEffect, useState } from 'react';
import './PopupModal.css';

const PopupModal = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const popupShown = sessionStorage.getItem('popupShown');

    if (!popupShown) {
      const timer = setTimeout(() => {
        setVisible(true);
        sessionStorage.setItem('popupShown', 'true');
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <button onClick={() => setVisible(false)} className="popup-close">×</button>
        <img src='/imgs/banner.jpg' />
      </div>
    </div>
  );
};

export default PopupModal;
