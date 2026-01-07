// src/components/AnimatedPipesFM.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const FILES = ["/pipe1.svg", "/pipe2.svg", "/pipe3.svg", "/pipe4.svg"];

// 순서: pipe4, pipe3, pipe2, pipe1
const GRADS = {
  3: ["#00B571", "#00CD80"], // green
  2: ["#1ABCFE", "#08ADF0"], // cyan
  1: ["#F30549", "#FF1659"], // pink/red
  0: ["#4846ED", "#5755FE"], // purple
};

export default function AnimatedPipesFM({
  baseWidth = 20,
  fluidWidth = 14,
  baseColor = "#F9F9F9",
  baseOpacity = 0.85,
  duration = 2.8,
  stagger = 0.22,
  easing = [0.2, 0.0, 0.1, 1.0],
  spring = false,
  reverse = [false, false, false, false],
  /** ✅ 추가: 모든 파이프 채움 완료 콜백 */
  onFilled,
}) {
  const [paths, setPaths] = useState([]); // [{ d, i, transform }]

  useEffect(() => {
    let canceled = false;
    (async () => {
      const all = [];
      for (let i = 0; i < FILES.length; i++) {
        const res = await fetch(FILES[i]);
        if (!res.ok) continue;
        const txt = await res.text();
        const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
        const ps = [...doc.querySelectorAll("path")];
        for (const p of ps) {
          const d = p.getAttribute("d");
          if (!d || d.includes("...")) continue;
          const tf = p.getAttribute("transform") || "";
          all.push({ d, i, transform: tf });
        }
      }
      if (!canceled) setPaths(all);
    })();
    return () => { canceled = true; };
  }, []);

  /** ✅ 추가: 마지막 파이프가 끝나는 시간 뒤 onFilled 호출 */
  useEffect(() => {
    if (!onFilled) return;
    const lastIndex = FILES.length - 1;                // 0..3
    const totalSec  = duration + stagger * lastIndex + 0.1; // 버퍼 0.1s
    const t = setTimeout(() => onFilled(), totalSec * 1000);
    return () => clearTimeout(t);
  }, [duration, stagger, onFilled]);

  return (
    <svg
      viewBox="0 0 1920 1080"
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: -50 }}
      aria-label="pipe fill"
    >
      <defs>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.1" floodOpacity=".18" />
        </filter>

        {Object.entries(GRADS).map(([k, [c1, c2]]) => (
          <linearGradient
            key={k}
            id={`grad-${k}`}
            x1="0" y1="0" x2="1920" y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%"  stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        ))}
      </defs>

      {/* 파이프 벽 */}
      {paths.map(({ d, transform }, idx) => (
        <path
          key={`base-${idx}`}
          d={d}
          transform={transform || undefined}
          fill="none"
          stroke={baseColor}
          strokeOpacity={baseOpacity}
          strokeWidth={baseWidth}
          strokeLinecap="butt"
          strokeLinejoin="bevel"
          filter="url(#softShadow)"
        />
      ))}

      {/* 유체(면 채움) */}
      {paths.map(({ d, i, transform }, idx) => (
        <motion.path
          key={`fluid-${idx}`}
          d={d}
          transform={transform || undefined}
          fill="none"
          stroke={`url(#grad-${i})`}
          strokeWidth={fluidWidth}
          strokeLinecap="butt"
          strokeLinejoin="bevel"
          initial={{ pathLength: 0, pathOffset: reverse[i] ? 1 : 0 }}
          animate={{ pathLength: 1, pathOffset: 0 }}
          transition={
            spring
              ? { type: "spring", stiffness: 140, damping: 22, delay: i * stagger }
              : { duration, ease: easing, delay: i * stagger }
          }
        />
      ))}
    </svg>
  );
}
