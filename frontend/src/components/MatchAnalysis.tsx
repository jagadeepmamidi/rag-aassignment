interface MatchResult {
  score: number;
  strengths: string[];
  gaps: string[];
  insights: string[];
  summary: string;
}

interface MatchAnalysisProps {
  result: MatchResult;
}

export default function MatchAnalysis({ result }: MatchAnalysisProps) {
  const circumference = 2 * Math.PI * 68;
  const offset = circumference - (result.score / 100) * circumference;

  return (
    <div className="match-section">
      {/* Score Card */}
      <div className="score-card">
        <div className="score-ring">
          <svg viewBox="0 0 160 160">
            <circle className="track" cx="80" cy="80" r="68" />
            <circle
              className="progress"
              cx="80" cy="80" r="68"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <span className="score-text">{result.score}%</span>
        </div>
        <p className="summary">{result.summary}</p>
      </div>

      {/* Strengths & Gaps */}
      <div className="insights-grid">
        <div className="insight-column strengths">
          <h3>Strengths</h3>
          {result.strengths.map((s, i) => (
            <div key={i} className="insight-item">
              <span className="icon">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              <p>{s}</p>
            </div>
          ))}
        </div>
        <div className="insight-column gaps">
          <h3>Gaps</h3>
          {result.gaps.map((g, i) => (
            <div key={i} className="insight-item">
              <span className="icon">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </span>
              <p>{g}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      {result.insights.length > 0 && (
        <div className="key-insights">
          <h3>Key Insights</h3>
          <ul>
            {result.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
