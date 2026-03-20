import React from 'react';

interface MatchResult {
  score: number;
  strengths: string[];
  gaps: string[];
  insights: string[];
  summary: string;
}

const MatchAnalysis: React.FC<{ result: MatchResult }> = ({ result }) => {
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (result.score / 100) * circumference;
  const scoreColor =
    result.score >= 75 ? 'var(--success)' :
    result.score >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="analysis-section">
      <div className="score-card">
        <div className="score-ring">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle className="score-ring-bg" cx="70" cy="70" r="58" />
            <circle
              className="score-ring-fill"
              cx="70" cy="70" r="58"
              stroke={scoreColor}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="score-value" style={{ color: scoreColor }}>
            {result.score}<span>%</span>
          </div>
        </div>
        <div className="score-label">Match Score</div>
        <p className="summary-text">{result.summary}</p>
      </div>

      <div className="insights-grid">
        <div className="insight-card strengths">
          <h3><span>✅</span> Strengths</h3>
          <ul className="insight-list">
            {result.strengths.map((s, i) => (
              <li key={i}><span className="icon">✓</span>{s}</li>
            ))}
          </ul>
        </div>

        <div className="insight-card gaps">
          <h3><span>❌</span> Gaps</h3>
          <ul className="insight-list">
            {result.gaps.map((g, i) => (
              <li key={i}><span className="icon">✗</span>{g}</li>
            ))}
          </ul>
        </div>
      </div>

      {result.insights.length > 0 && (
        <div className="insight-card insights" style={{ marginBottom: 28 }}>
          <h3><span>💡</span> Key Insights</h3>
          <ul className="insight-list">
            {result.insights.map((ins, i) => (
              <li key={i}><span className="icon">→</span>{ins}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MatchAnalysis;
