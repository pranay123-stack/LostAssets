import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export const LostAssetsIQLogo: React.FC<LogoProps> = ({ size = "md", showText = true, className = "" }) => {
  const dimensions = {
    sm: { icon: 30, text: "text-xs" },
    md: { icon: 38, text: "text-sm" },
    lg: { icon: 48, text: "text-base" },
    xl: { icon: 64, text: "text-xl" }
  }[size];

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Precision Vector Emblem matching uploaded logo */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg
          width={dimensions.icon}
          height={dimensions.icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_10px_rgba(45,212,191,0.2)]"
        >
          <defs>
            {/* Gold Frame Gradient */}
            <linearGradient id="goldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="35%" stopColor="#FCD34D" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#78350F" />
            </linearGradient>

            {/* Cyan Accent Line & Glow */}
            <linearGradient id="cyanGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0D9488" />
              <stop offset="60%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#5EEAD4" />
            </linearGradient>

            {/* Gold Letter Gradient */}
            <linearGradient id="goldTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Diamond Border */}
          <polygon
            points="50,14 86,50 50,86 14,50"
            fill="#081017"
            stroke="url(#goldBorderGrad)"
            strokeWidth="3.5"
            strokeLinejoin="miter"
          />

          {/* Inner hairline border */}
          <polygon
            points="50,18 82,50 50,82 18,50"
            fill="none"
            stroke="#1E293B"
            strokeWidth="1"
          />

          {/* Diagonal Slash Line through LA */}
          <line
            x1="26"
            y1="74"
            x2="78"
            y2="22"
            stroke="url(#cyanGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* "L" in serif gold */}
          <text
            x="31"
            y="59"
            fill="url(#goldTextGrad)"
            fontFamily="Georgia, Times, serif"
            fontWeight="bold"
            fontSize="31"
            letterSpacing="-1"
          >
            L
          </text>

          {/* "A" in serif teal */}
          <text
            x="49"
            y="61"
            fill="url(#cyanGrad)"
            fontFamily="Georgia, Times, serif"
            fontWeight="bold"
            fontSize="31"
            letterSpacing="-1"
          >
            A
          </text>

          {/* Top-Right IQ Radar / Signal Ring */}
          <circle
            cx="81"
            cy="19"
            r="8"
            fill="#06121E"
            stroke="#2DD4BF"
            strokeWidth="2"
          />
          <circle
            cx="81"
            cy="19"
            r="3"
            fill="#5EEAD4"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`${dimensions.text} font-bold font-sans tracking-wider flex items-center gap-1.5`}>
            <span className="text-neutral-100">LOST ASSETS</span>
            <span className="text-teal-400 font-extrabold bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/30 text-[11px] tracking-widest font-mono">
              IQ
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-semibold font-mono mt-0.5">
            Asset Intelligence & Recovery
          </span>
        </div>
      )}
    </div>
  );
};
