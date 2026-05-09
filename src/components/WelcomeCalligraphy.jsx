import { useEffect, useRef, useState } from "react";

const INK_COLOR_DARK  = "#4ade80"; // Brighter, more vibrant neon green
const INK_COLOR_LIGHT = "#16a34a";

export default function WelcomeCalligraphy({ subtitle = "to LexGuard AI" }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const progressRef = useRef(0);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);

  const FONT = "108px 'UnifrakturMaguntia', serif";
  const FONT_W = "italic 112px 'Georgia', 'Times New Roman', serif";

  // Wait for font to load before starting animation
  useEffect(() => {
    document.fonts.ready.then(() => setFontLoaded(true));
  }, []);

  useEffect(() => {
    if (!fontLoaded) return;
    const delay = setTimeout(startAnimation, 700);
    return () => clearTimeout(delay);
  }, [fontLoaded]);

  function getInk() {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return dark ? INK_COLOR_DARK : INK_COLOR_LIGHT;
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function drawFrame(p) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W_canvas = canvas.width;
    const H_canvas = canvas.height;
    const ink = getInk();
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    ctx.clearRect(0, 0, W_canvas, H_canvas);
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    // Measure W
    ctx.font = FONT_W;
    const wWidth = ctx.measureText("W").width;

    // Measure elcome
    ctx.font = FONT;
    const elcomeWidth = ctx.measureText("elcome").width;

    const tw = wWidth + elcomeWidth + 2;
    const startX = (W_canvas - tw) / 2;
    const centerY = H_canvas / 2 + 8;
    const clipW = tw * p;

    // Ghost silhouette behind (shows full word faintly)
    ctx.save();
    ctx.globalAlpha = isDark ? 0.06 : 0.08;
    ctx.fillStyle = ink;
    ctx.font = FONT_W;
    ctx.fillText("W", startX, centerY);
    ctx.font = FONT;
    ctx.fillText("elcome", startX + wWidth, centerY);
    ctx.restore();

    // Clip to revealed portion
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX - 10, 0, clipW + 20, H_canvas);
    ctx.clip();

    // Crisp, vibrant glowing text (no muddy 3D effect)
    ctx.shadowColor = isDark ? "rgba(74, 222, 128, 0.6)" : "rgba(22, 163, 74, 0.4)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = ink;

    // Draw W
    ctx.font = FONT_W;
    ctx.fillText("W", startX, centerY);

    // Draw elcome
    ctx.font = FONT;
    ctx.fillText("elcome", startX + wWidth, centerY);

    ctx.restore(); // restores clip and shadow

    // PEN NIB CURSOR — only while animating
    if (p < 0.998) {
      const penX = startX + clipW;
      const penY = centerY + 28;

      ctx.save();
      ctx.translate(penX, penY);
      ctx.rotate(0.45); // ~26 degrees — natural pen angle

      // Pen barrel (wood/metal look)
      ctx.fillStyle = isDark ? "#4a4a4a" : "#a0a0a0";
      ctx.beginPath();
      ctx.roundRect(-4, -36, 8, 26, 3);
      ctx.fill();

      // Ferrule ring
      ctx.fillStyle = isDark ? "#888" : "#c8c8c8";
      ctx.fillRect(-4.5, -11, 9, 5);

      // Nib body (diamond shape)
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(6, 4);
      ctx.lineTo(0, 18);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();

      // Nib center slit
      ctx.strokeStyle = isDark
        ? "rgba(0,0,0,0.5)"
        : "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(0, 16);
      ctx.stroke();

      // Fresh ink droplet at tip
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.ellipse(0, 20, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  function startAnimation() {
    cancelAnimationFrame(rafRef.current);
    progressRef.current = 0;
    setSubtitleVisible(false);

    function frame() {
      progressRef.current += 0.006; // speed — lower = slower writing
      if (progressRef.current >= 1) {
        progressRef.current = 1;
        drawFrame(1);
        setTimeout(() => setSubtitleVisible(true), 200);
        return;
      }
      drawFrame(easeInOut(progressRef.current));
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
  }

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "6px",
      userSelect: "none"
    }}>
      {/* Canvas — pen draws here */}
      <canvas
        ref={canvasRef}
        width={420}
        height={160}
        style={{
          width: "100%",
          maxWidth: "420px",
          height: "auto"
        }}
      />

      {/* Subtitle fades in after writing completes */}
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: "12px",
        fontWeight: 400,
        color: "var(--color-text-secondary, #64748b)",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        margin: 0,
        opacity: subtitleVisible ? 1 : 0,
        transform: subtitleVisible ? "translateY(0)" : "translateY(5px)",
        transition: "opacity 500ms ease, transform 500ms ease"
      }}>
        {subtitle}
      </p>
    </div>
  );
}
