import { useState } from 'react';
import './App.css';

const FINDRISC_QUESTIONS = [
  {
    id: 'age',
    question: 'Age',
    options: [
      { label: 'Under 45 years', score: 0 },
      { label: '45–54 years',    score: 2 },
      { label: '55–64 years',    score: 3 },
      { label: 'Over 64 years',  score: 4 },
    ],
  },
  {
    id: 'bmi',
    question: 'Body Mass Index (BMI)',
    hint: 'Weight (kg) ÷ Height (m)²',
    options: [
      { label: 'Less than 25 kg/m²', score: 0 },
      { label: '25–30 kg/m²',        score: 1 },
      { label: 'More than 30 kg/m²', score: 3 },
    ],
  },
  {
    id: 'waist',
    question: 'Waist circumference',
    hint: 'Measured at the level of the navel',
    options: [
      { label: 'Men < 94 cm  /  Women < 80 cm',     score: 0 },
      { label: 'Men 94–102 cm  /  Women 80–88 cm',  score: 3 },
      { label: 'Men > 102 cm  /  Women > 88 cm',    score: 4 },
    ],
  },
  {
    id: 'diet',
    question: 'Do you eat vegetables, fruits, or berries every day?',
    options: [
      { label: 'Yes', score: 0 },
      { label: 'No',  score: 1 },
    ],
  },
  {
    id: 'activity',
    question: 'Do you exercise regularly? (at least 30 minutes per day, including normal daily activity)',
    options: [
      { label: 'Yes', score: 0 },
      { label: 'No',  score: 2 },
    ],
  },
  {
    id: 'bp_meds',
    question: 'Have you ever taken medication for high blood pressure regularly?',
    options: [
      { label: 'No',  score: 0 },
      { label: 'Yes', score: 2 },
    ],
  },
  {
    id: 'high_glucose',
    question: 'Have you ever been found to have high blood glucose (e.g. in a health check, during illness, or during pregnancy)?',
    options: [
      { label: 'No',  score: 0 },
      { label: 'Yes', score: 5 },
    ],
  },
  {
    id: 'family_history',
    question: 'Has any member of your family or close relatives been diagnosed with diabetes (type 1 or type 2)?',
    options: [
      { label: 'No',                                               score: 0 },
      { label: 'Yes — grandparent, aunt, uncle, or first cousin',  score: 3 },
      { label: 'Yes — parent, brother, sister, or own child',      score: 5 },
    ],
  },
];

const BLUE = '#1d6fce';
const font = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function getRiskInfo(score) {
  if (score < 7) return {
    level: 'Low Risk',
    color: '#15803d',
    bannerBg: '#dcfce7',
    bannerBorder: '#86efac',
    pageBg: '#f0fdf4',
    scoreBg: '#dcfce7',
    scoreBorder: '#86efac',
    description: 'This patient has a low probability of developing type 2 diabetes within the next 10 years.',
    probability: '~1 in 100 chance of developing type 2 diabetes',
    advice: 'Encourage continued healthy lifestyle habits — regular physical activity, balanced diet, and healthy weight maintenance.',
  };
  if (score < 12) return {
    level: 'Slightly Elevated Risk',
    color: '#a16207',
    bannerBg: '#fef9c3',
    bannerBorder: '#fde047',
    pageBg: '#fefce8',
    scoreBg: '#fef9c3',
    scoreBorder: '#fde047',
    description: 'This patient has a slightly elevated risk of developing type 2 diabetes in the next 10 years.',
    probability: '~1 in 25 chance of developing type 2 diabetes',
    advice: 'Advise lifestyle modifications. Consider referral for a fasting blood glucose or HbA1c test.',
  };
  if (score < 15) return {
    level: 'Moderate Risk',
    color: '#c2410c',
    bannerBg: '#ffedd5',
    bannerBorder: '#fdba74',
    pageBg: '#fff7ed',
    scoreBg: '#ffedd5',
    scoreBorder: '#fdba74',
    description: 'This patient has a moderate risk of developing type 2 diabetes in the next 10 years.',
    probability: '~1 in 6 chance of developing type 2 diabetes',
    advice: 'Strongly advise lifestyle changes. Refer to a physician for blood glucose testing and prevention counselling.',
  };
  if (score <= 20) return {
    level: 'High Risk',
    color: '#b91c1c',
    bannerBg: '#fee2e2',
    bannerBorder: '#fca5a5',
    pageBg: '#fef2f2',
    scoreBg: '#fee2e2',
    scoreBorder: '#fca5a5',
    description: 'This patient has a high risk of developing type 2 diabetes in the next 10 years.',
    probability: '~1 in 3 chance of developing type 2 diabetes',
    advice: 'Urgent physician referral recommended. Blood glucose testing and enrolment in a diabetes prevention programme is strongly advised.',
  };
  return {
    level: 'Very High Risk',
    color: '#7f1d1d',
    bannerBg: '#fee2e2',
    bannerBorder: '#f87171',
    pageBg: '#fef2f2',
    scoreBg: '#fecaca',
    scoreBorder: '#f87171',
    description: 'This patient has a very high risk of developing type 2 diabetes in the next 10 years.',
    probability: '~1 in 2 chance of developing type 2 diabetes',
    advice: 'Immediate physician referral required. Urgent blood glucose testing and intensive intervention is recommended.',
  };
}

function LogoBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '44px', height: '44px', borderRadius: '12px',
      backgroundColor: BLUE, flexShrink: 0,
    }}>
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <rect x="14" y="6" width="8" height="24" rx="2" fill="white"/>
        <rect x="6" y="14" width="24" height="8" rx="2" fill="white"/>
      </svg>
    </div>
  );
}

function PageHeader({ subtitle, onBack }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 10,
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '64px',
      boxShadow: '0 1px 8px rgba(15,23,42,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <LogoBadge />
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: BLUE, lineHeight: 1.2 }}>PharmaScan</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>{subtitle}</div>
        </div>
      </div>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px',
            padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, color: '#64748b',
            cursor: 'pointer', fontFamily: font,
          }}
        >
          ← Back
        </button>
      )}
    </header>
  );
}

function HomeScreen({ onStart }) {
  const [hovered, setHovered] = useState(false);
  return (
    <main style={{
      minHeight: '100vh', backgroundColor: '#f8fafc',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      padding: '32px 24px', fontFamily: font, color: '#1e293b',
    }}>
      <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '72px', height: '72px', borderRadius: '20px', backgroundColor: BLUE,
          marginBottom: '28px', boxShadow: '0 8px 24px rgba(29,111,206,0.28)',
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="14" y="6" width="8" height="24" rx="2" fill="white"/>
            <rect x="6" y="14" width="24" height="8" rx="2" fill="white"/>
          </svg>
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: '3.25rem', fontWeight: 800, letterSpacing: '-0.04em', color: BLUE, lineHeight: 1 }}>
          PharmaScan
        </h1>
        <p style={{ margin: '0 0 40px', fontSize: '1.125rem', fontWeight: 500, color: '#475569', lineHeight: 1.6 }}>
          NCD Risk Screening Tool for UAE Pharmacists
        </p>
        <div style={{ width: '48px', height: '3px', borderRadius: '999px', backgroundColor: BLUE, margin: '0 auto 40px', opacity: 0.3 }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '48px' }}>
          {['Diabetes Risk', 'Cardiovascular Risk', 'BMI Assessment'].map(label => (
            <span key={label} style={{
              padding: '6px 14px', borderRadius: '999px', backgroundColor: '#eff6ff',
              color: BLUE, fontSize: '0.8rem', fontWeight: 600, border: '1px solid #bfdbfe',
            }}>{label}</span>
          ))}
        </div>
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '20px', padding: '36px 32px',
          boxShadow: '0 4px 32px rgba(15,23,42,0.08)', border: '1px solid #e2e8f0',
        }}>
          <p style={{ margin: '0 0 24px', fontSize: '0.95rem', color: '#64748b', lineHeight: 1.7 }}>
            Screen patients for Type 2 diabetes and cardiovascular disease risk in under 5 minutes.
          </p>
          <button
            onClick={onStart}
            onMouseOver={() => setHovered(true)}
            onMouseOut={() => setHovered(false)}
            style={{
              width: '100%', padding: '18px 24px', border: 'none', borderRadius: '12px',
              backgroundColor: hovered ? '#15803d' : '#16a34a', color: '#ffffff',
              fontSize: '1.0625rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: hovered ? '0 6px 20px rgba(22,163,74,0.45)' : '0 4px 16px rgba(22,163,74,0.35)',
              transition: 'background-color 140ms ease, box-shadow 140ms ease',
              fontFamily: font,
            }}
          >
            Start New Screening
          </button>
        </div>
        <p style={{ marginTop: '28px', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
          For use by licensed pharmacists in the UAE only.
        </p>
      </div>
    </main>
  );
}

function OptionButton({ label, score, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '14px 18px',
        border: `2px solid ${selected ? BLUE : '#e2e8f0'}`,
        borderRadius: '10px',
        backgroundColor: selected ? '#eff6ff' : '#ffffff',
        color: selected ? BLUE : '#334155',
        fontSize: '0.9375rem', fontWeight: selected ? 600 : 400,
        cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        transition: 'border-color 120ms ease, background-color 120ms ease',
        fontFamily: font,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${selected ? BLUE : '#cbd5e1'}`,
          backgroundColor: selected ? BLUE : 'transparent',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {selected && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="white"/></svg>}
        </span>
        {label}
      </span>
      <span style={{
        fontSize: '0.75rem', fontWeight: 700, color: selected ? BLUE : '#94a3b8',
        whiteSpace: 'nowrap', backgroundColor: selected ? '#dbeafe' : '#f1f5f9',
        padding: '2px 8px', borderRadius: '999px',
      }}>
        +{score} pts
      </span>
    </button>
  );
}

function FindriscForm({ onBack, onResult }) {
  const [answers, setAnswers] = useState({});
  const [calcHovered, setCalcHovered] = useState(false);

  const answered = Object.keys(answers).length;
  const total = FINDRISC_QUESTIONS.length;
  const progress = Math.round((answered / total) * 100);
  const allAnswered = answered === total;

  const handleSelect = (questionId, optionIndex) =>
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));

  const handleCalculate = () => {
    const score = FINDRISC_QUESTIONS.reduce((sum, q) => {
      const idx = answers[q.id];
      return idx !== undefined ? sum + q.options[idx].score : sum;
    }, 0);
    onResult(score);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: font, color: '#1e293b' }}>
      <PageHeader subtitle="FINDRISC Diabetes Screening" onBack={onBack} />

      <div style={{ backgroundColor: '#e2e8f0', height: '4px' }}>
        <div style={{
          height: '100%', width: `${progress}%`, backgroundColor: BLUE,
          transition: 'width 300ms ease', borderRadius: '0 2px 2px 0',
        }} />
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px 48px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            FINDRISC Assessment
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            Finnish Diabetes Risk Score — {answered} of {total} questions answered
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {FINDRISC_QUESTIONS.map((q, qIdx) => (
            <div key={q.id} style={{
              backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px',
              border: `1px solid ${answers[q.id] !== undefined ? '#bfdbfe' : '#e2e8f0'}`,
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              transition: 'border-color 200ms ease',
            }}>
              <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'flex-start' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                  backgroundColor: answers[q.id] !== undefined ? BLUE : '#f1f5f9',
                  color: answers[q.id] !== undefined ? '#ffffff' : '#94a3b8',
                  fontSize: '0.78rem', fontWeight: 700,
                }}>
                  {qIdx + 1}
                </span>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>
                    {q.question}
                  </p>
                  {q.hint && <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>{q.hint}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '42px' }}>
                {q.options.map((opt, optIdx) => (
                  <OptionButton
                    key={optIdx}
                    label={opt.label}
                    score={opt.score}
                    selected={answers[q.id] === optIdx}
                    onClick={() => handleSelect(q.id, optIdx)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '32px' }}>
          {!allAnswered && (
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '12px' }}>
              Please answer all {total} questions to calculate the score
            </p>
          )}
          <button
            onClick={allAnswered ? handleCalculate : undefined}
            onMouseOver={() => allAnswered && setCalcHovered(true)}
            onMouseOut={() => setCalcHovered(false)}
            disabled={!allAnswered}
            style={{
              width: '100%', padding: '18px 24px', border: 'none', borderRadius: '12px',
              backgroundColor: allAnswered ? (calcHovered ? '#15803d' : '#16a34a') : '#e2e8f0',
              color: allAnswered ? '#ffffff' : '#94a3b8',
              fontSize: '1.0625rem', fontWeight: 700,
              cursor: allAnswered ? 'pointer' : 'not-allowed',
              boxShadow: allAnswered ? (calcHovered ? '0 6px 20px rgba(22,163,74,0.45)' : '0 4px 16px rgba(22,163,74,0.35)') : 'none',
              transition: 'background-color 140ms ease, box-shadow 140ms ease',
              fontFamily: font,
            }}
          >
            Calculate Risk Score
          </button>
        </div>
      </div>
    </div>
  );
}

function FindriscResult({ score, onBack, onContinue }) {
  const risk = getRiskInfo(score);
  const [contHovered, setContHovered] = useState(false);
  const MAX_SCORE = 26;
  const pct = Math.round((score / MAX_SCORE) * 100);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: font, color: '#1e293b' }}>
      <PageHeader subtitle="FINDRISC Diabetes Screening" onBack={onBack} />

      <div style={{ maxWidth: '620px', margin: '0 auto', padding: '40px 24px 64px' }}>

        {/* Score circle + label */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ margin: '0 0 20px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>
            FINDRISC Score
          </p>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: '160px', height: '160px', borderRadius: '50%',
            backgroundColor: risk.scoreBg,
            border: `4px solid ${risk.scoreBorder}`,
            boxShadow: `0 8px 32px ${risk.scoreBorder}80`,
          }}>
            <span style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1, color: risk.color, letterSpacing: '-0.04em' }}>
              {score}
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: risk.color, opacity: 0.7 }}>
              out of {MAX_SCORE}
            </span>
          </div>

          {/* Score bar */}
          <div style={{ marginTop: '20px', maxWidth: '320px', margin: '20px auto 0' }}>
            <div style={{ height: '8px', borderRadius: '999px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                backgroundColor: risk.color,
                borderRadius: '999px',
                transition: 'width 600ms ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>0</span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{MAX_SCORE}</span>
            </div>
          </div>
        </div>

        {/* Risk level banner */}
        <div style={{
          backgroundColor: risk.bannerBg,
          border: `1px solid ${risk.bannerBorder}`,
          borderRadius: '14px',
          padding: '18px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: risk.color, flexShrink: 0,
          }} />
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '1.0625rem', fontWeight: 700, color: risk.color }}>
              {risk.level}
            </p>
            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 500, color: risk.color, opacity: 0.8 }}>
              {risk.probability}
            </p>
          </div>
        </div>

        {/* Explanation card */}
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
          marginBottom: '20px',
        }}>
          <p style={{ margin: '0 0 16px', fontSize: '0.9375rem', color: '#334155', lineHeight: 1.7 }}>
            {risk.description}
          </p>
          <div style={{
            backgroundColor: '#f8fafc', borderRadius: '10px', padding: '14px 16px',
            borderLeft: `3px solid ${risk.color}`,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Clinical Recommendation
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6 }}>
              {risk.advice}
            </p>
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={onContinue}
          onMouseOver={() => setContHovered(true)}
          onMouseOut={() => setContHovered(false)}
          style={{
            width: '100%', padding: '18px 24px', border: 'none', borderRadius: '12px',
            backgroundColor: contHovered ? '#1558a8' : BLUE,
            color: '#ffffff', fontSize: '1.0625rem', fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.01em',
            boxShadow: contHovered ? '0 6px 20px rgba(29,111,206,0.45)' : '0 4px 16px rgba(29,111,206,0.3)',
            transition: 'background-color 140ms ease, box-shadow 140ms ease',
            fontFamily: font,
          }}
        >
          Continue to Heart Risk Assessment →
        </button>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: '#94a3b8' }}>
          Next: Framingham Cardiovascular Risk Score
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [findriscScore, setFindriscScore] = useState(null);

  if (screen === 'findrisc') {
    return (
      <FindriscForm
        onBack={() => setScreen('home')}
        onResult={score => { setFindriscScore(score); setScreen('findrisc-result'); }}
      />
    );
  }
  if (screen === 'findrisc-result') {
    return (
      <FindriscResult
        score={findriscScore}
        onBack={() => setScreen('findrisc')}
        onContinue={() => setScreen('framingham')}
      />
    );
  }
  return <HomeScreen onStart={() => setScreen('findrisc')} />;
}
