export default function ScoreGauge({ score = 0 }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const tone =
    score >= 80 ? "#2E7D4F" : score >= 55 ? "#E2932F" : "#C1443C";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#DEDDD6"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
        <text
          x="70"
          y="66"
          textAnchor="middle"
          fontSize="28"
          fontWeight="600"
          fill="#1B1E20"
          fontFamily="var(--font-sans)"
        >
          {score}
        </text>
        <text
          x="70"
          y="86"
          textAnchor="middle"
          fontSize="11"
          fill="#5B6266"
          fontFamily="var(--font-sans)"
        >
          / 100
        </text>
      </svg>
      <p className="text-sm text-inkmute">Overall quality score</p>
    </div>
  );
}
