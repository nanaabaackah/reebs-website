import { useEffect, useRef } from 'react';

const BrushCanvas = () => {
  const canvasRef = useRef(null);
  const colorRef = useRef('rgba(128, 0, 128, 0.8)'); // Initial brush color
  const lastPosRef = useRef({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Smooth fading effect using semi-transparent overlay
    const fadeCanvas = () => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // White transparent overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawLine = (x1, y1, x2, y2) => {
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    const handleMouseMove = (e) => {
    const x = e.clientX;
    const y = e.clientY;

    // Only draw a line if lastPos is not uninitialized
    if (lastPosRef.current.x !== null) {
        drawLine(lastPosRef.current.x, lastPosRef.current.y, x, y);
    }

    // Always update last position
    lastPosRef.current = { x, y };
    };


    const changeColor = () => {
      const r = Math.floor(Math.random() * 156) + 100;
      const g = Math.floor(Math.random() * 156) + 100;
      const b = Math.floor(Math.random() * 156) + 100;
      colorRef.current = `rgba(${r}, ${g}, ${b}, 0.8)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', changeColor);

    // Set up animation loop for fading
    const animate = () => {
      fadeCanvas();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', changeColor);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 z-0 pointer-events-none"
    />
  );
};

export default BrushCanvas;
