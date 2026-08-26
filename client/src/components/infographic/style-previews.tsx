import type { InfographicStyleId } from "@/lib/types";

const PREVIEW_WIDTH = 120;
const PREVIEW_HEIGHT = 76;

function Frame({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <svg
      width={PREVIEW_WIDTH}
      height={PREVIEW_HEIGHT}
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      style={style}
    >
      {children}
    </svg>
  );
}

export function StylePreview({ styleId }: { styleId: InfographicStyleId }) {
  switch (styleId) {
    case "minimal":
      return (
        <Frame>
          <rect width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} fill="#ffffff" />
          <rect x={10} y={10} width={100} height={4} fill="#111827" rx={1} />
          <rect x={10} y={20} width={72} height={2} fill="#9ca3af" rx={1} />
          <line x1={10} y1={34} x2={110} y2={34} stroke="#e5e7eb" strokeWidth={1} />
          <rect x={10} y={42} width={100} height={12} fill="#f9fafb" />
          <rect x={10} y={60} width={100} height={8} fill="#f3f4f6" />
        </Frame>
      );
    case "modern":
      return (
        <Frame>
          <rect width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} fill="#fafafa" />
          <rect x={10} y={10} width={100} height={4} fill="#111827" rx={2} />
          <rect x={10} y={20} width={60} height={2} fill="#a1a1aa" rx={1} />
          <rect x={10} y={30} width={100} height={18} rx={5} fill="#ffffff" stroke="#e4e4e7" />
          <rect x={16} y={36} width={40} height={6} rx={3} fill="#eef2ff" />
          <rect x={10} y={54} width={48} height={16} rx={5} fill="#ffffff" stroke="#e4e4e7" />
          <rect x={62} y={54} width={48} height={16} rx={5} fill="#ffffff" stroke="#e4e4e7" />
          <circle cx={16} cy={36 + 3} r={3} fill="#4f46e5" />
        </Frame>
      );
    case "academic":
      return (
        <Frame>
          <rect width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} fill="#faf7f0" />
          <rect x={10} y={10} width={100} height={4} fill="#1f2937" />
          <rect x={10} y={20} width={55} height={2} fill="#9ca3af" />
          <rect x={10} y={30} width={100} height={16} fill="#ffffff" stroke="#d6d3d1" />
          <rect x={16} y={36} width={30} height={6} fill="#fde68a" />
          <rect x={10} y={52} width={100} height={1} stroke="#d6d3d1" />
          <rect x={10} y={58} width={100} height={10} fill="#ffffff" stroke="#d6d3d1" />
        </Frame>
      );
    case "hand-drawn":
      return (
        <Frame>
          <rect width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} fill="#fffdf5" />
          <path d="M10 10 q25 -2 100 0" fill="none" stroke="#292524" strokeWidth={2} strokeLinecap="round" />
          <path d="M12 20 q20 -1 60 1" fill="none" stroke="#a8a29e" strokeWidth={1.5} strokeLinecap="round" />
          <path
            d="M12 30 q5 5 0 10 q5 5 0 10 q5 5 0 10"
            fill="none"
            stroke="#b45309"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <rect x={26} y={32} width={82} height={36} rx={3} fill="#ffffff" stroke="#292524" strokeWidth={1.5} transform="rotate(-0.8 26 32)" />
          <path d="M34 42 q10 -3 20 0 q8 2 16 0" fill="none" stroke="#e11d48" strokeWidth={1.5} strokeLinecap="round" />
          <path d="M34 50 q10 2 20 0" fill="none" stroke="#78716c" strokeWidth={1.5} strokeLinecap="round" />
        </Frame>
      );
    case "technical":
      return (
        <Frame>
          <rect width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} fill="#f8fafc" />
          <g stroke="#e2e8f0" strokeWidth={0.5}>
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`v${i}`} x1={i * 20} y1={0} x2={i * 20} y2={PREVIEW_HEIGHT} />
            ))}
            {Array.from({ length: 4 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 19} x2={PREVIEW_WIDTH} y2={i * 19} />
            ))}
          </g>
          <rect x={10} y={8} width={100} height={10} rx={2} fill="#1e3a8a" />
          <path d="M34 18 h52 M60 18 v10 M34 28 h52" fill="none" stroke="#475569" strokeWidth={1.5} />
          <rect x={18} y={28} width={32} height={14} rx={2} fill="#ffffff" stroke="#2563eb" />
          <rect x={66} y={28} width={32} height={14} rx={2} fill="#ffffff" stroke="#2563eb" />
          <path d="M50 35 h16" stroke="#475569" strokeWidth={1.5} />
          <rect x={18} y={52} width={80} height={14} rx={2} fill="#ffffff" stroke="#d97706" />
        </Frame>
      );
    case "visual-story":
      return (
        <Frame>
          <rect width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} fill="#fdf4ff" />
          <defs>
            <linearGradient id="vs-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <rect x={10} y={10} width={100} height={8} rx={4} fill="url(#vs-grad)" />
          <circle cx={92} cy={14} r={10} fill="#fbbf24" opacity={0.9} />
          <rect x={10} y={26} width={100} height={18} rx={8} fill="#ffffff" stroke="#e9d5ff" />
          <circle cx={22} cy={35} r={5} fill="#fbcfe8" />
          <rect x={32} y={32} width={60} height={5} rx={2.5} fill="#c4b5fd" />
          <rect x={10} y={50} width={46} height={18} rx={8} fill="#fecdd3" />
          <rect x={62} y={50} width={48} height={18} rx={8} fill="#dbeafe" />
          <path d="M56 55 q6 -4 6 2" fill="none" stroke="#a1a1aa" strokeWidth={1.5} />
        </Frame>
      );
  }
}