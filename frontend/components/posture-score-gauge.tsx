"use client"

interface PostureScoreGaugeProps {
  score: number // 0–100
  size?: "sm" | "md" | "lg"
}

export default function PostureScoreGauge({ score, size = "md" }: PostureScoreGaugeProps) {
  const R = 50
  const CIRCUMFERENCE = Math.PI * R // semicircle arc length ≈ 157

  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444"
  const label = score >= 70 ? "Good" : score >= 40 ? "Fair" : "Poor"
  const dashOffset = CIRCUMFERENCE * (1 - score / 100)

  const dims = { sm: 100, md: 140, lg: 180 }[size]
  const fontSize = { sm: 18, md: 26, lg: 34 }[size]

  return (
    <div className="flex flex-col items-center">
      <svg
        width={dims}
        height={dims * 0.65}
        viewBox="0 0 120 80"
        style={{ overflow: "visible" }}
      >
        {/* Track */}
        <path
          d="M 10 70 A 50 50 0 0 1 110 70"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 10 70 A 50 50 0 0 1 110 70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.4s ease" }}
        />
        {/* Score number */}
        <text x="60" y="58" textAnchor="middle" fontSize={fontSize} fontWeight="bold" fill={color}>
          {score}
        </text>
        {/* Label */}
        <text x="60" y="74" textAnchor="middle" fontSize="11" fill="#6b7280">
          {label}
        </text>
      </svg>
      <p className="text-xs text-gray-500 -mt-1">Posture Score</p>
    </div>
  )
}
