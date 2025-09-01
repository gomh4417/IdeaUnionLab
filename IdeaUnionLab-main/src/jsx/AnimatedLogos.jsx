import { motion } from "framer-motion";

const INS = ["/in1.svg", "/in2.svg", "/in3.svg", "/in4.svg", "/in5.svg"];

export default function AnimatedLogos({ show = false, delay = 0.1, gap = 0.2 }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {INS.map((src, i) => (
        <motion.img
          key={src}
          src={src}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            // ✅ in1은 zIndex 5, 나머지는 -5
            zIndex: i === 0 ? 5 : -5,
          }}
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={show ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0 }}
          transition={{
            delay: delay + i * gap,
            duration: 0.45,
            ease: [0.2, 0.0, 0.1, 1.0],
          }}
        />
      ))}
    </div>
  );
}
