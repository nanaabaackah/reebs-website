import React, { useState, useEffect } from 'react';

const TypingEffect = ({
  text,
  speed = 100,
  ariaHidden = false,
  ariaLive = 'off',
  className = '',
}) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index === text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span
      className={className}
      aria-hidden={ariaHidden}
      aria-live={ariaLive}
    >
      {displayedText}
    </span>
  );
};

export default TypingEffect;
