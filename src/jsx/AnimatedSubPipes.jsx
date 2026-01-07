// src/jsx/SubPipes.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const FILES = [
  "/subpipe1.svg",
  "/subpipe2.svg",
  "/subpipe3.svg",
  "/subpipe4.svg",
  "/subpipe5.svg",
  "/subpipe6.svg",
];

const DEFAULT_REVERSE = [false, true, false, true, true, true];

export default function SubPipes({
  baseWidth = 18,
  fluidWidth = 12,
  baseColor = "#eeeeee50",  // 기본 파이프도 동일 컬러
  baseOpacity = 1,
  duration = 2.5,
  stagger = 0.18,
  easing = [0.2, 0.0, 0.1, 1.0],
  spring = false,
  reverse = DEFAULT_REVERSE,
  startDelay = 1,
  z = -55,
}) {
  const [paths, setPaths] = useState([]);

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

  return (
    <svg
      viewBox="0 0 1920 1080"
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: z }}
      aria-label="sub pipes"
    >
      {/* Base line (정지 상태 파이프) */}
      {paths.map(({ d, transform }, idx) => (
        <path
          key={`sub-base-${idx}`}
          d={d}
          transform={transform || undefined}
          fill="none"
          stroke={baseColor}
          strokeOpacity={baseOpacity}
          strokeWidth={baseWidth}
          strokeLinecap="butt"
          strokeLinejoin="bevel"
        />
      ))}

      {/* 애니메이션 라인 */}
      {paths.map(({ d, i, transform }, idx) => {
        const shouldReverse = Array.isArray(reverse) ? Boolean(reverse[i]) : Boolean(reverse);
        return (
          <motion.path
            key={`sub-fluid-${idx}`}
            d={d}
            transform={transform || undefined}
            fill="none"
            stroke="#eeeeee80"
            strokeWidth={fluidWidth}
            strokeLinecap="butt"
            strokeLinejoin="bevel"
            initial={{ pathLength: 0, pathOffset: shouldReverse ? 1 : 0 }}
            animate={{ pathLength: 1, pathOffset: 0 }}
            transition={
              spring
                ? { type: "spring", stiffness: 140, damping: 22, delay: startDelay + i * stagger }
                : { duration, ease: easing, delay: startDelay + i * stagger }
            }
          />
        );
      })}
    </svg>
  );
}
