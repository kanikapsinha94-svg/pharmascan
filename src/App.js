import { useState } from 'react';
import './App.css';

// ─── FINDRISC data ────────────────────────────────────────────────────────────

const FINDRISC_QUESTIONS = [
  {
    id: 'age', question: 'Age',
    options: [
      { label: 'Under 45 years', score: 0 },
      { label: '45–54 years',    score: 2 },
      { label: '55–64 years',    score: 3 },
      { label: 'Over 64 years',  score: 4 },
    ],
  },
  {
    id: 'bmi', question: 'Body Mass Index (BMI)', hint: 'Weight (kg) ÷ Height (m)²',
    options: [
      { label: 'Less than 25 kg/m²', score: 0 },
      { label: '25–30 kg/m²',        score: 1 },
      { label: 'More than 30 kg/m²', score: 3 },
    ],
  },
  {
    id: 'waist', question: 'Waist circumference', hint: 'Measured at the level of the navel',
    options: [
      { label: 'Men < 94 cm  /  Women < 80 cm',     score: 0 },
      { label: 'Men 94–102 cm  /  Women 80–88 cm',  score: 3 },
      { label: 'Men > 102 cm  /  Women > 88 cm',    score: 4 },
    ],
  },
  {
    id: 'diet', question: 'Do you eat vegetables, fruits, or berries every day?',
    options: [{ label: 'Yes', score: 0 }, { label: 'No', score: 1 }],
  },
  {
    id: 'activity',
    question: 'Do you exercise regularly? (at least 30 minutes per day, including normal daily activity)',
    options: [{ label: 'Yes', score: 0 }, { label: 'No', score: 2 }],
  },
  {
    id: 'bp_meds', question: 'Have you ever taken medication for high blood pressure regularly?',
    options: [{ label: 'No', score: 0 }, { label: 'Yes', score: 2 }],
  },
  {
    id: 'high_glucose',
    question: 'Have you ever been found to have high blood glucose (e.g. in a health check, during illness, or during pregnancy)?',
    options: [{ label: 'No', score: 0 }, { label: 'Yes', score: 5 }],
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

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE = '#1d6fce';
const font = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

// ─── Risk helpers ─────────────────────────────────────────────────────────────

function getRiskInfo(score) {
  if (score < 7)  return { level: 'Low Risk',              color: '#15803d', bannerBg: '#dcfce7', bannerBorder: '#86efac', scoreBg: '#dcfce7', scoreBorder: '#86efac', probability: '~1 in 100 chance of developing type 2 diabetes', description: 'This patient has a low probability of developing type 2 diabetes within the next 10 years.', advice: 'Encourage continued healthy lifestyle habits — regular physical activity, balanced diet, and healthy weight maintenance.' };
  if (score < 12) return { level: 'Slightly Elevated Risk', color: '#a16207', bannerBg: '#fef9c3', bannerBorder: '#fde047', scoreBg: '#fef9c3', scoreBorder: '#fde047', probability: '~1 in 25 chance of developing type 2 diabetes',  description: 'This patient has a slightly elevated risk of developing type 2 diabetes in the next 10 years.',    advice: 'Advise lifestyle modifications. Consider referral for a fasting blood glucose or HbA1c test.' };
  if (score < 15) return { level: 'Moderate Risk',          color: '#c2410c', bannerBg: '#ffedd5', bannerBorder: '#fdba74', scoreBg: '#ffedd5', scoreBorder: '#fdba74', probability: '~1 in 6 chance of developing type 2 diabetes',   description: 'This patient has a moderate risk of developing type 2 diabetes in the next 10 years.',            advice: 'Strongly advise lifestyle changes. Refer to a physician for blood glucose testing and prevention counselling.' };
  if (score <= 20) return { level: 'High Risk',             color: '#b91c1c', bannerBg: '#fee2e2', bannerBorder: '#fca5a5', scoreBg: '#fee2e2', scoreBorder: '#fca5a5', probability: '~1 in 3 chance of developing type 2 diabetes',   description: 'This patient has a high risk of developing type 2 diabetes in the next 10 years.',                advice: 'Urgent physician referral recommended. Blood glucose testing and enrolment in a diabetes prevention programme is strongly advised.' };
  return               { level: 'Very High Risk',           color: '#7f1d1d', bannerBg: '#fee2e2', bannerBorder: '#f87171', scoreBg: '#fecaca', scoreBorder: '#f87171', probability: '~1 in 2 chance of developing type 2 diabetes',   description: 'This patient has a very high risk of developing type 2 diabetes in the next 10 years.',           advice: 'Immediate physician referral required. Urgent blood glucose testing and intensive intervention is recommended.' };
}

function getCardioRiskInfo(pct) {
  if (pct < 10) return {
    level: 'Low Risk',           color: '#15803d',
    bannerBg: '#dcfce7', bannerBorder: '#86efac', scoreBg: '#dcfce7', scoreBorder: '#86efac',
    description: 'This patient has a low estimated 10-year risk of a major cardiovascular event.',
    advice: 'Encourage heart-healthy lifestyle habits. Routine follow-up with primary care is appropriate.',
  };
  if (pct <= 20) return {
    level: 'Intermediate Risk',  color: '#c2410c',
    bannerBg: '#ffedd5', bannerBorder: '#fdba74', scoreBg: '#ffedd5', scoreBorder: '#fdba74',
    description: 'This patient has an intermediate estimated 10-year risk of a major cardiovascular event.',
    advice: 'Lifestyle modification strongly advised. Refer to physician for full cardiovascular assessment and lipid management.',
  };
  return {
    level: 'High Risk',          color: '#b91c1c',
    bannerBg: '#fee2e2', bannerBorder: '#fca5a5', scoreBg: '#fee2e2', scoreBorder: '#fca5a5',
    description: 'This patient has a high estimated 10-year risk of a major cardiovascular event.',
    advice: 'Urgent referral to physician required. Statin therapy, blood pressure management, and intensive lifestyle intervention should be considered.',
  };
}

// ─── Framingham calculation (D'Agostino 2008) ────────────────────────────────
// Cholesterol inputs in mmol/L; internally converted to mg/dL.
// Population averages used when cholesterol not entered:
//   TC 5.0 mmol/L (193 mg/dL), HDL ♂ 1.2 mmol/L (46 mg/dL), HDL ♀ 1.4 mmol/L (54 mg/dL)

function calculateFramingham({ age, sex, sbp, bpTreated, smoker, diabetic, totalChol, hdlChol }) {
  const CONV = 38.67;
  const estimated = !totalChol || !hdlChol;
  const tc  = totalChol ? totalChol * CONV : 193;
  const hdl = hdlChol   ? hdlChol   * CONV : (sex === 'male' ? 46 : 54);

  const lnAge = Math.log(age);
  const lnTC  = Math.log(tc);
  const lnHDL = Math.log(hdl);
  const lnSBP = Math.log(sbp);
  const sm = smoker   ? 1 : 0;
  const dm = diabetic ? 1 : 0;

  let sum, s0, mean;
  if (sex === 'male') {
    sum  = 3.11296 * lnAge + 1.12370 * lnTC - 0.93263 * lnHDL
         + (bpTreated ? 1.99881 : 1.93303) * lnSBP
         + 0.65451 * sm + 0.57367 * dm;
    s0   = 0.88936;
    mean = 23.9802;
  } else {
    sum  = 2.32888 * lnAge + 1.20904 * lnTC - 0.70833 * lnHDL
         + (bpTreated ? 2.76157 : 2.82263) * lnSBP
         + 0.52873 * sm + 0.69154 * dm;
    s0   = 0.94833;
    mean = 26.1931;
  }

  const risk = parseFloat(((1 - Math.pow(s0, Math.exp(sum - mean))) * 100).toFixed(1));
  return { risk: Math.min(99.9, Math.max(0.1, risk)), estimated };
}

// ─── Shared components ────────────────────────────────────────────────────────

function LogoBadge() {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'44px', height:'44px', borderRadius:'12px', backgroundColor:BLUE, flexShrink:0 }}>
      <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
        <rect x="14" y="6"  width="8"  height="24" rx="2" fill="white"/>
        <rect x="6"  y="14" width="24" height="8"  rx="2" fill="white"/>
      </svg>
    </div>
  );
}

function PageHeader({ subtitle, onBack }) {
  return (
    <header style={{ position:'sticky', top:0, zIndex:10, backgroundColor:'#ffffff', borderBottom:'1px solid #e2e8f0', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px', boxShadow:'0 1px 8px rgba(15,23,42,0.06)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <LogoBadge />
        <div>
          <div style={{ fontSize:'1rem', fontWeight:700, color:BLUE, lineHeight:1.2 }}>PharmaScan</div>
          <div style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:500 }}>{subtitle}</div>
        </div>
      </div>
      {onBack && (
        <button onClick={onBack} style={{ background:'none', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'7px 14px', fontSize:'0.82rem', fontWeight:600, color:'#64748b', cursor:'pointer', fontFamily:font }}>
          ← Back
        </button>
      )}
    </header>
  );
}

function ProgressBar({ pct }) {
  return (
    <div style={{ backgroundColor:'#e2e8f0', height:'4px' }}>
      <div style={{ height:'100%', width:`${pct}%`, backgroundColor:BLUE, transition:'width 300ms ease', borderRadius:'0 2px 2px 0' }} />
    </div>
  );
}

function RiskBanner({ risk }) {
  return (
    <div style={{ backgroundColor:risk.bannerBg, border:`1px solid ${risk.bannerBorder}`, borderRadius:'14px', padding:'18px 24px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'14px' }}>
      <div style={{ width:'10px', height:'10px', borderRadius:'50%', backgroundColor:risk.color, flexShrink:0 }} />
      <div>
        <p style={{ margin:'0 0 2px', fontSize:'1.0625rem', fontWeight:700, color:risk.color }}>{risk.level}</p>
        <p style={{ margin:0, fontSize:'0.82rem', fontWeight:500, color:risk.color, opacity:0.8 }}>{risk.probability || risk.subtitle}</p>
      </div>
    </div>
  );
}

function ContinueButton({ onClick, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseOver={() => setHov(true)} onMouseOut={() => setHov(false)}
      style={{ width:'100%', padding:'18px 24px', border:'none', borderRadius:'12px', backgroundColor: hov ? '#1558a8' : BLUE, color:'#ffffff', fontSize:'1.0625rem', fontWeight:700, cursor:'pointer', boxShadow: hov ? '0 6px 20px rgba(29,111,206,0.45)' : '0 4px 16px rgba(29,111,206,0.3)', transition:'background-color 140ms ease, box-shadow 140ms ease', fontFamily:font }}>
      {children}
    </button>
  );
}

// FINDRISC-style option button (radio with score badge)
function OptionButton({ label, score, selected, onClick }) {
  return (
    <button onClick={onClick} style={{ width:'100%', padding:'14px 18px', border:`2px solid ${selected ? BLUE : '#e2e8f0'}`, borderRadius:'10px', backgroundColor: selected ? '#eff6ff' : '#ffffff', color: selected ? BLUE : '#334155', fontSize:'0.9375rem', fontWeight: selected ? 600 : 400, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', transition:'border-color 120ms ease, background-color 120ms ease', fontFamily:font }}>
      <span style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <span style={{ width:'18px', height:'18px', borderRadius:'50%', flexShrink:0, border:`2px solid ${selected ? BLUE : '#cbd5e1'}`, backgroundColor: selected ? BLUE : 'transparent', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
          {selected && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="white"/></svg>}
        </span>
        {label}
      </span>
      <span style={{ fontSize:'0.75rem', fontWeight:700, color: selected ? BLUE : '#94a3b8', whiteSpace:'nowrap', backgroundColor: selected ? '#dbeafe' : '#f1f5f9', padding:'2px 8px', borderRadius:'999px' }}>+{score} pts</span>
    </button>
  );
}

// Framingham-style form components
function FormCard({ number, label, hint, answered, children }) {
  return (
    <div style={{ backgroundColor:'#ffffff', borderRadius:'16px', padding:'20px 24px', border:`1px solid ${answered ? '#bfdbfe' : '#e2e8f0'}`, boxShadow:'0 2px 8px rgba(15,23,42,0.04)', transition:'border-color 200ms ease' }}>
      <div style={{ display:'flex', gap:'14px', marginBottom:'14px', alignItems:'flex-start' }}>
        <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'28px', height:'28px', borderRadius:'8px', flexShrink:0, backgroundColor: answered ? BLUE : '#f1f5f9', color: answered ? '#ffffff' : '#94a3b8', fontSize:'0.78rem', fontWeight:700 }}>
          {number}
        </span>
        <div>
          <p style={{ margin:'0 0 2px', fontSize:'0.9375rem', fontWeight:600, color:'#0f172a', lineHeight:1.5 }}>{label}</p>
          {hint && <p style={{ margin:0, fontSize:'0.78rem', color:'#94a3b8' }}>{hint}</p>}
        </div>
      </div>
      <div style={{ paddingLeft:'42px' }}>{children}</div>
    </div>
  );
}

function BinarySelector({ value, onChange, options, disabled }) {
  return (
    <div style={{ display:'flex', gap:'8px' }}>
      {options.map(opt => {
        const sel = value === opt.value;
        return (
          <button key={String(opt.value)} onClick={() => !disabled && onChange(opt.value)}
            style={{ padding:'11px 28px', border:`2px solid ${sel ? BLUE : '#e2e8f0'}`, borderRadius:'10px', backgroundColor: sel ? '#eff6ff' : '#ffffff', color: disabled ? '#94a3b8' : (sel ? BLUE : '#334155'), fontWeight: sel ? 600 : 400, fontSize:'0.9375rem', cursor: disabled ? 'default' : 'pointer', fontFamily:font, transition:'border-color 120ms ease, background-color 120ms ease' }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function StyledNumberInput({ value, onChange, placeholder, unit, min, max }) {
  const [focused, setFocused] = useState(false);
  const filled = value !== '';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder} min={min} max={max}
        style={{ padding:'11px 16px', border:`2px solid ${focused ? BLUE : (filled ? '#bfdbfe' : '#e2e8f0')}`, borderRadius:'10px', fontSize:'1rem', fontFamily:font, color:'#0f172a', width:'130px', outline:'none', transition:'border-color 120ms ease', backgroundColor: filled ? '#eff6ff' : '#ffffff' }} />
      {unit && <span style={{ color:'#64748b', fontSize:'0.875rem', fontWeight:500 }}>{unit}</span>}
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p style={{ margin:'8px 0 0', fontSize:'0.78rem', color:'#dc2626' }}>{msg}</p>;
}

// ─── Home screen ──────────────────────────────────────────────────────────────

function HomeScreen({ onStart }) {
  const [hov, setHov] = useState(false);
  return (
    <main style={{ minHeight:'100vh', backgroundColor:'#f8fafc', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'32px 24px', fontFamily:font, color:'#1e293b' }}>
      <div style={{ maxWidth:'560px', width:'100%', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'72px', height:'72px', borderRadius:'20px', backgroundColor:BLUE, marginBottom:'28px', boxShadow:'0 8px 24px rgba(29,111,206,0.28)' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="14" y="6"  width="8"  height="24" rx="2" fill="white"/>
            <rect x="6"  y="14" width="24" height="8"  rx="2" fill="white"/>
          </svg>
        </div>
        <h1 style={{ margin:'0 0 12px', fontSize:'3.25rem', fontWeight:800, letterSpacing:'-0.04em', color:BLUE, lineHeight:1 }}>PharmaScan</h1>
        <p style={{ margin:'0 0 40px', fontSize:'1.125rem', fontWeight:500, color:'#475569', lineHeight:1.6 }}>NCD Risk Screening Tool for UAE Pharmacists</p>
        <div style={{ width:'48px', height:'3px', borderRadius:'999px', backgroundColor:BLUE, margin:'0 auto 40px', opacity:0.3 }} />
        <div style={{ display:'flex', justifyContent:'center', gap:'10px', flexWrap:'wrap', marginBottom:'48px' }}>
          {['Diabetes Risk','Cardiovascular Risk'].map(l => (
            <span key={l} style={{ padding:'6px 14px', borderRadius:'999px', backgroundColor:'#eff6ff', color:BLUE, fontSize:'0.8rem', fontWeight:600, border:'1px solid #bfdbfe' }}>{l}</span>
          ))}
        </div>
        <div style={{ backgroundColor:'#ffffff', borderRadius:'20px', padding:'36px 32px', boxShadow:'0 4px 32px rgba(15,23,42,0.08)', border:'1px solid #e2e8f0' }}>
          <p style={{ margin:'0 0 24px', fontSize:'0.95rem', color:'#64748b', lineHeight:1.7 }}>Screen patients for Type 2 diabetes and cardiovascular disease risk in under 5 minutes.</p>
          <button onClick={onStart} onMouseOver={() => setHov(true)} onMouseOut={() => setHov(false)}
            style={{ width:'100%', padding:'18px 24px', border:'none', borderRadius:'12px', backgroundColor: hov ? '#15803d' : '#16a34a', color:'#ffffff', fontSize:'1.0625rem', fontWeight:700, cursor:'pointer', boxShadow: hov ? '0 6px 20px rgba(22,163,74,0.45)' : '0 4px 16px rgba(22,163,74,0.35)', transition:'background-color 140ms ease, box-shadow 140ms ease', fontFamily:font }}>
            Start New Screening
          </button>
        </div>
        <p style={{ marginTop:'28px', fontSize:'0.78rem', color:'#94a3b8', lineHeight:1.6 }}>For use by licensed pharmacists in the UAE only.</p>
      </div>
    </main>
  );
}

// ─── FINDRISC form ────────────────────────────────────────────────────────────

function FindriscForm({ onBack, onResult }) {
  const [answers, setAnswers] = useState({});
  const [calcHov, setCalcHov] = useState(false);
  const answered = Object.keys(answers).length;
  const total    = FINDRISC_QUESTIONS.length;
  const allDone  = answered === total;

  const handleCalculate = () => {
    const score = FINDRISC_QUESTIONS.reduce((s, q) => {
      const i = answers[q.id]; return i !== undefined ? s + q.options[i].score : s;
    }, 0);
    onResult(score);
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="FINDRISC Diabetes Screening" onBack={onBack} />
      <ProgressBar pct={Math.round((answered / total) * 100)} />
      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'32px 24px 48px' }}>
        <div style={{ marginBottom:'32px' }}>
          <h2 style={{ margin:'0 0 6px', fontSize:'1.5rem', fontWeight:800, color:'#0f172a' }}>FINDRISC Assessment</h2>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#64748b' }}>Finnish Diabetes Risk Score — {answered} of {total} questions answered</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
          {FINDRISC_QUESTIONS.map((q, qi) => (
            <div key={q.id} style={{ backgroundColor:'#ffffff', borderRadius:'16px', padding:'24px', border:`1px solid ${answers[q.id] !== undefined ? '#bfdbfe' : '#e2e8f0'}`, boxShadow:'0 2px 8px rgba(15,23,42,0.04)', transition:'border-color 200ms ease' }}>
              <div style={{ display:'flex', gap:'14px', marginBottom:'16px', alignItems:'flex-start' }}>
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'28px', height:'28px', borderRadius:'8px', flexShrink:0, backgroundColor: answers[q.id] !== undefined ? BLUE : '#f1f5f9', color: answers[q.id] !== undefined ? '#ffffff' : '#94a3b8', fontSize:'0.78rem', fontWeight:700 }}>{qi + 1}</span>
                <div>
                  <p style={{ margin:'0 0 2px', fontSize:'0.9375rem', fontWeight:600, color:'#0f172a', lineHeight:1.5 }}>{q.question}</p>
                  {q.hint && <p style={{ margin:0, fontSize:'0.78rem', color:'#94a3b8' }}>{q.hint}</p>}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', paddingLeft:'42px' }}>
                {q.options.map((opt, oi) => (
                  <OptionButton key={oi} label={opt.label} score={opt.score} selected={answers[q.id] === oi} onClick={() => setAnswers(p => ({ ...p, [q.id]: oi }))} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:'32px' }}>
          {!allDone && <p style={{ textAlign:'center', fontSize:'0.82rem', color:'#94a3b8', marginBottom:'12px' }}>Please answer all {total} questions to calculate the score</p>}
          <button onClick={allDone ? handleCalculate : undefined} onMouseOver={() => allDone && setCalcHov(true)} onMouseOut={() => setCalcHov(false)} disabled={!allDone}
            style={{ width:'100%', padding:'18px 24px', border:'none', borderRadius:'12px', backgroundColor: allDone ? (calcHov ? '#15803d' : '#16a34a') : '#e2e8f0', color: allDone ? '#ffffff' : '#94a3b8', fontSize:'1.0625rem', fontWeight:700, cursor: allDone ? 'pointer' : 'not-allowed', boxShadow: allDone ? (calcHov ? '0 6px 20px rgba(22,163,74,0.45)' : '0 4px 16px rgba(22,163,74,0.35)') : 'none', transition:'background-color 140ms ease, box-shadow 140ms ease', fontFamily:font }}>
            Calculate Risk Score
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FINDRISC result ──────────────────────────────────────────────────────────

function FindriscResult({ score, onBack, onContinue }) {
  const risk = getRiskInfo(score);
  const MAX  = 26;
  const pct  = Math.round((score / MAX) * 100);
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="FINDRISC Diabetes Screening" onBack={onBack} />
      <div style={{ maxWidth:'620px', margin:'0 auto', padding:'40px 24px 64px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <p style={{ margin:'0 0 20px', fontSize:'0.8rem', fontWeight:600, letterSpacing:'0.08em', color:'#94a3b8', textTransform:'uppercase' }}>FINDRISC Score</p>
          <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'160px', height:'160px', borderRadius:'50%', backgroundColor:risk.scoreBg, border:`4px solid ${risk.scoreBorder}`, boxShadow:`0 8px 32px ${risk.scoreBorder}80` }}>
            <span style={{ fontSize:'4rem', fontWeight:900, lineHeight:1, color:risk.color, letterSpacing:'-0.04em' }}>{score}</span>
            <span style={{ fontSize:'0.875rem', fontWeight:500, color:risk.color, opacity:0.7 }}>out of {MAX}</span>
          </div>
          <div style={{ maxWidth:'320px', margin:'20px auto 0' }}>
            <div style={{ height:'8px', borderRadius:'999px', backgroundColor:'#e2e8f0', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, backgroundColor:risk.color, borderRadius:'999px', transition:'width 600ms ease' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px' }}>
              <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>0</span>
              <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{MAX}</span>
            </div>
          </div>
        </div>
        <RiskBanner risk={{ ...risk, subtitle: risk.probability }} />
        <div style={{ backgroundColor:'#ffffff', borderRadius:'16px', padding:'24px', border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(15,23,42,0.05)', marginBottom:'20px' }}>
          <p style={{ margin:'0 0 16px', fontSize:'0.9375rem', color:'#334155', lineHeight:1.7 }}>{risk.description}</p>
          <div style={{ backgroundColor:'#f8fafc', borderRadius:'10px', padding:'14px 16px', borderLeft:`3px solid ${risk.color}` }}>
            <p style={{ margin:'0 0 4px', fontSize:'0.75rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em', textTransform:'uppercase' }}>Clinical Recommendation</p>
            <p style={{ margin:0, fontSize:'0.9rem', color:'#1e293b', lineHeight:1.6 }}>{risk.advice}</p>
          </div>
        </div>
        <ContinueButton onClick={onContinue}>Continue to Heart Risk Assessment →</ContinueButton>
        <p style={{ textAlign:'center', marginTop:'16px', fontSize:'0.78rem', color:'#94a3b8' }}>Next: Framingham Cardiovascular Risk Score</p>
      </div>
    </div>
  );
}

// ─── Framingham form ──────────────────────────────────────────────────────────

function FraminghamForm({ findriscScore, onBack, onResult }) {
  const autoDiabetes = findriscScore !== null && findriscScore >= 15;

  const [age,       setAge]       = useState('');
  const [sex,       setSex]       = useState(null);
  const [sbp,       setSbp]       = useState('');
  const [bpTreated, setBpTreated] = useState(null);
  const [smoking,   setSmoking]   = useState(null);
  const [diabetes,  setDiabetes]  = useState(autoDiabetes ? true : null);
  const [totalChol, setTotalChol] = useState('');
  const [hdlChol,   setHdlChol]   = useState('');
  const [calcHov,   setCalcHov]   = useState(false);

  // Validation
  const ageN  = parseInt(age,  10);
  const sbpN  = parseInt(sbp,  10);
  const tcN   = parseFloat(totalChol);
  const hdlN  = parseFloat(hdlChol);

  const ageErr  = age       && (ageN  < 30 || ageN  > 79)                   ? 'Age must be between 30 and 79 years'       : null;
  const sbpErr  = sbp       && (sbpN  < 70 || sbpN  > 250)                  ? 'Enter a value between 70 and 250 mmHg'     : null;
  const tcErr   = totalChol && (tcN   < 1.5 || tcN  > 15.0)                 ? 'Enter a value between 1.5 and 15.0 mmol/L' : null;
  const hdlErr  = hdlChol   && (hdlN  < 0.3 || hdlN > 4.0)                  ? 'Enter a value between 0.3 and 4.0 mmol/L'  : null;
  const cholPairErr = (totalChol && !hdlChol) || (!totalChol && hdlChol)    ? 'Enter both cholesterol values or leave both empty' : null;

  const requiredOk = age && !ageErr && sex !== null && sbp && !sbpErr && bpTreated !== null && smoking !== null && diabetes !== null;
  const cholOk     = !cholPairErr && !tcErr && !hdlErr;
  const canCalc    = requiredOk && cholOk;

  const completedCount = [age && !ageErr, sex !== null, sbp && !sbpErr, bpTreated !== null, smoking !== null, diabetes !== null].filter(Boolean).length;

  const handleCalculate = () => {
    onResult({
      ...calculateFramingham({
        age: ageN, sex, sbp: sbpN, bpTreated, smoker: smoking, diabetic: diabetes,
        totalChol: totalChol ? tcN  : null,
        hdlChol:   hdlChol   ? hdlN : null,
      }),
      sex,
    });
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="Framingham Heart Risk Assessment" onBack={onBack} />
      <ProgressBar pct={Math.round((completedCount / 6) * 100)} />

      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'32px 24px 48px' }}>
        <div style={{ marginBottom:'32px' }}>
          <h2 style={{ margin:'0 0 6px', fontSize:'1.5rem', fontWeight:800, color:'#0f172a' }}>Framingham Assessment</h2>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#64748b' }}>10-year cardiovascular risk — {completedCount} of 6 required fields completed</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* 1 — Age */}
          <FormCard number={1} label="Age" hint="Framingham model is validated for ages 30–79" answered={age !== '' && !ageErr}>
            <StyledNumberInput value={age} onChange={setAge} placeholder="e.g. 52" min={30} max={79} unit="years" />
            <FieldError msg={ageErr} />
          </FormCard>

          {/* 2 — Sex */}
          <FormCard number={2} label="Sex" answered={sex !== null}>
            <BinarySelector value={sex} onChange={setSex} options={[{ value:'male', label:'Male' }, { value:'female', label:'Female' }]} />
          </FormCard>

          {/* 3 — Systolic BP */}
          <FormCard number={3} label="Systolic Blood Pressure" answered={sbp !== '' && !sbpErr}>
            <StyledNumberInput value={sbp} onChange={setSbp} placeholder="e.g. 128" min={70} max={250} unit="mmHg" />
            <FieldError msg={sbpErr} />
          </FormCard>

          {/* 4 — BP treatment */}
          <FormCard number={4} label="Currently on blood pressure treatment?" answered={bpTreated !== null}>
            <BinarySelector value={bpTreated} onChange={setBpTreated} options={[{ value:false, label:'No' }, { value:true, label:'Yes' }]} />
          </FormCard>

          {/* 5 — Smoking */}
          <FormCard number={5} label="Current smoker?" answered={smoking !== null}>
            <BinarySelector value={smoking} onChange={setSmoking} options={[{ value:false, label:'No' }, { value:true, label:'Yes' }]} />
          </FormCard>

          {/* 6 — Diabetes */}
          <FormCard number={6} label="Has diabetes?" answered={diabetes !== null}>
            {autoDiabetes ? (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                  <span style={{ padding:'9px 22px', borderRadius:'10px', backgroundColor:'#eff6ff', border:`2px solid ${BLUE}`, color:BLUE, fontWeight:600, fontSize:'0.9375rem', fontFamily:font }}>Yes</span>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'10px 12px', backgroundColor:'#fefce8', borderRadius:'8px', border:'1px solid #fde047' }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="#a16207" style={{ flexShrink:0, marginTop:'1px' }}>
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                  </svg>
                  <p style={{ margin:0, fontSize:'0.78rem', color:'#a16207', fontWeight:500, lineHeight:1.5 }}>
                    Auto-filled — FINDRISC score ≥ 15 indicates high diabetes risk
                  </p>
                </div>
              </div>
            ) : (
              <BinarySelector value={diabetes} onChange={setDiabetes} options={[{ value:false, label:'No' }, { value:true, label:'Yes' }]} />
            )}
          </FormCard>

          {/* Optional cholesterol section */}
          <div style={{ border:'2px dashed #cbd5e1', borderRadius:'16px', padding:'24px', backgroundColor:'#f8fafc' }}>
            <div style={{ marginBottom:'20px' }}>
              <p style={{ margin:'0 0 6px', fontSize:'0.8rem', fontWeight:700, color:'#475569', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                Optional — if cholesterol results available
              </p>
              <p style={{ margin:0, fontSize:'0.82rem', color:'#94a3b8', lineHeight:1.6 }}>
                Providing these values improves accuracy. If left blank, population average values are used and the result is marked as estimated.
              </p>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <FormCard number="A" label="Total Cholesterol" answered={totalChol !== '' && !tcErr}>
                <StyledNumberInput value={totalChol} onChange={setTotalChol} placeholder="e.g. 5.2" unit="mmol/L" />
                <FieldError msg={tcErr} />
              </FormCard>

              <FormCard number="B" label="HDL Cholesterol" hint="High-density lipoprotein" answered={hdlChol !== '' && !hdlErr}>
                <StyledNumberInput value={hdlChol} onChange={setHdlChol} placeholder="e.g. 1.3" unit="mmol/L" />
                <FieldError msg={hdlErr} />
              </FormCard>

              <p style={{ margin:'6px 0 0', fontSize:'0.78rem', color:'#94a3b8', lineHeight:1.6 }}>
                For best accuracy, enter both values together. If only one is available, leave both blank and we will use population estimates instead.
              </p>
            </div>
          </div>
        </div>

        {/* Calculate button */}
        <div style={{ marginTop:'32px' }}>
          {!canCalc && <p style={{ textAlign:'center', fontSize:'0.82rem', color:'#94a3b8', marginBottom:'12px' }}>Complete all required fields to calculate</p>}
          <button onClick={canCalc ? handleCalculate : undefined} onMouseOver={() => canCalc && setCalcHov(true)} onMouseOut={() => setCalcHov(false)} disabled={!canCalc}
            style={{ width:'100%', padding:'18px 24px', border:'none', borderRadius:'12px', backgroundColor: canCalc ? (calcHov ? '#15803d' : '#16a34a') : '#e2e8f0', color: canCalc ? '#ffffff' : '#94a3b8', fontSize:'1.0625rem', fontWeight:700, cursor: canCalc ? 'pointer' : 'not-allowed', boxShadow: canCalc ? (calcHov ? '0 6px 20px rgba(22,163,74,0.45)' : '0 4px 16px rgba(22,163,74,0.35)') : 'none', transition:'background-color 140ms ease, box-shadow 140ms ease', fontFamily:font }}>
            Calculate Heart Risk
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Framingham result ────────────────────────────────────────────────────────

function FraminghamResult({ result, onBack, onContinue }) {
  const { risk, estimated } = result;
  const cardio = getCardioRiskInfo(risk);

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="Framingham Heart Risk Assessment" onBack={onBack} />

      <div style={{ maxWidth:'620px', margin:'0 auto', padding:'40px 24px 64px' }}>

        {/* Score circle */}
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <p style={{ margin:'0 0 20px', fontSize:'0.8rem', fontWeight:600, letterSpacing:'0.08em', color:'#94a3b8', textTransform:'uppercase' }}>
            10-Year Cardiovascular Risk
          </p>
          <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'176px', height:'176px', borderRadius:'50%', backgroundColor:cardio.scoreBg, border:`4px solid ${cardio.scoreBorder}`, boxShadow:`0 8px 32px ${cardio.scoreBorder}80` }}>
            <span style={{ fontSize:'3.25rem', fontWeight:900, lineHeight:1, color:cardio.color, letterSpacing:'-0.04em' }}>{risk}%</span>
            <span style={{ fontSize:'0.8rem', fontWeight:500, color:cardio.color, opacity:0.75, marginTop:'4px' }}>10-year risk</span>
          </div>

          {/* Estimated notice */}
          {estimated && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', marginTop:'16px', padding:'6px 14px', backgroundColor:'#f1f5f9', borderRadius:'999px', border:'1px solid #e2e8f0' }}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="#64748b">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <span style={{ fontSize:'0.78rem', color:'#64748b', fontStyle:'italic' }}>Estimated result — cholesterol not entered</span>
            </div>
          )}
        </div>

        {/* Risk banner */}
        <RiskBanner risk={{ ...cardio, subtitle: `${risk}% estimated chance of a cardiovascular event within 10 years` }} />

        {/* Explanation card */}
        <div style={{ backgroundColor:'#ffffff', borderRadius:'16px', padding:'24px', border:'1px solid #e2e8f0', boxShadow:'0 2px 12px rgba(15,23,42,0.05)', marginBottom:'20px' }}>
          <p style={{ margin:'0 0 16px', fontSize:'0.9375rem', color:'#334155', lineHeight:1.7 }}>{cardio.description}</p>
          <div style={{ backgroundColor:'#f8fafc', borderRadius:'10px', padding:'14px 16px', borderLeft:`3px solid ${cardio.color}` }}>
            <p style={{ margin:'0 0 4px', fontSize:'0.75rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em', textTransform:'uppercase' }}>Clinical Recommendation</p>
            <p style={{ margin:0, fontSize:'0.9rem', color:'#1e293b', lineHeight:1.6 }}>{cardio.advice}</p>
          </div>

          {estimated && (
            <div style={{ marginTop:'14px', padding:'12px 14px', backgroundColor:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0' }}>
              <p style={{ margin:0, fontSize:'0.8rem', color:'#64748b', lineHeight:1.5 }}>
                <strong>Note:</strong> Population average cholesterol values were used (TC 5.0 mmol/L, HDL {result.sex === 'female' ? '1.4' : '1.2'} mmol/L). Enter the patient's actual values for a more precise estimate.
              </p>
            </div>
          )}
        </div>

        <ContinueButton onClick={onContinue}>Continue to Results →</ContinueButton>
        <p style={{ textAlign:'center', marginTop:'16px', fontSize:'0.78rem', color:'#94a3b8' }}>Next: Full screening summary</p>
      </div>
    </div>
  );
}

// ─── Results summary ─────────────────────────────────────────────────────────

function combinedNarrativeText(findriscScore, framinghamRisk) {
  const dHigh = findriscScore >= 15;
  const dMod  = findriscScore >= 12 && findriscScore < 15;
  const cHigh = framinghamRisk >= 20;
  const cInt  = framinghamRisk >= 10 && framinghamRisk < 20;

  if (dHigh && (cHigh || cInt))
    return `This patient has elevated risk on both assessments — a FINDRISC score of ${findriscScore} indicates high diabetes risk, and a ${framinghamRisk}% 10-year cardiovascular risk places them in the ${cHigh ? 'high' : 'intermediate'} range. These risk factors are closely linked and require coordinated physician referral.`;
  if (dHigh)
    return `This patient's FINDRISC score of ${findriscScore} indicates high diabetes risk. Cardiovascular risk is currently low, but uncontrolled diabetes is itself a major cardiovascular risk factor. Early intervention is essential.`;
  if (cHigh || cInt)
    return `This patient's 10-year cardiovascular risk of ${framinghamRisk}% falls in the ${cHigh ? 'high' : 'intermediate'} range. Diabetes risk is currently ${dMod ? 'moderate' : 'low'}. Cardiovascular risk factor review and physician referral are recommended.`;
  if (dMod)
    return `This patient's FINDRISC score of ${findriscScore} indicates moderate diabetes risk, which does not yet reach the referral threshold. Cardiovascular risk is low. Lifestyle modifications now can help prevent progression to type 2 diabetes.`;
  return `Both assessments indicate low risk at this time. This patient does not appear to be at elevated risk for type 2 diabetes or cardiovascular disease. Ongoing healthy habits and regular rescreening are recommended.`;
}

const LIFESTYLE_ADVICE = [
  'Maintain a balanced diet rich in vegetables, fruits, whole grains, and lean protein.',
  'Aim for at least 150 minutes of moderate-intensity physical activity per week.',
  'Maintain a healthy body weight (BMI 18.5–24.9 kg/m²).',
  'Avoid smoking and limit alcohol consumption.',
  'Have blood pressure and cholesterol checked at least annually.',
  'Rescreen for diabetes and cardiovascular risk in 1–2 years.',
];

function ResultsSummary({ findriscScore, framinghamResult, onStartNew, onGenerateReferral }) {
  const { risk: framinghamRisk, estimated, sex } = framinghamResult;
  const findriscInfo = getRiskInfo(findriscScore);
  const cardioInfo   = getCardioRiskInfo(framinghamRisk);
  const referralNeeded = findriscScore >= 15 || framinghamRisk >= 10;

  const referralReasons = [];
  if (findriscScore >= 15)
    referralReasons.push(`FINDRISC score of ${findriscScore}/26 (${findriscInfo.level}) — refer for fasting blood glucose or HbA1c testing and consideration of a diabetes prevention programme.`);
  if (framinghamRisk >= 20)
    referralReasons.push(`10-year cardiovascular risk of ${framinghamRisk}% (High Risk) — refer for full lipid profile and cardiovascular risk management, including consideration of statin therapy.`);
  else if (framinghamRisk >= 10)
    referralReasons.push(`10-year cardiovascular risk of ${framinghamRisk}% (Intermediate Risk) — refer for full lipid profile review and cardiovascular risk factor management.`);

  const [refHov, setRefHov]   = useState(false);
  const [newHov, setNewHov]   = useState(false);

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="Screening Complete" />

      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'36px 24px 72px' }}>

        {/* Title */}
        <div style={{ marginBottom:'28px' }}>
          <h2 style={{ margin:'0 0 6px', fontSize:'1.5rem', fontWeight:800, color:'#0f172a' }}>Screening Summary</h2>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#64748b' }}>Both assessments complete</p>
        </div>

        {/* Score cards — side by side */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>

          {/* FINDRISC card */}
          <div style={{ backgroundColor:'#ffffff', borderRadius:'16px', padding:'20px', border:`1px solid ${findriscInfo.bannerBorder}`, boxShadow:'0 2px 8px rgba(15,23,42,0.05)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', backgroundColor:findriscInfo.color, borderRadius:'16px 16px 0 0' }} />
            <p style={{ margin:'10px 0 10px', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.09em', textTransform:'uppercase' }}>FINDRISC</p>
            <p style={{ margin:0, fontSize:'2.75rem', fontWeight:900, color:findriscInfo.color, lineHeight:1, letterSpacing:'-0.03em' }}>{findriscScore}</p>
            <p style={{ margin:'3px 0 16px', fontSize:'0.75rem', color:'#94a3b8', fontWeight:500 }}>out of 26</p>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 10px', backgroundColor:findriscInfo.bannerBg, borderRadius:'8px', border:`1px solid ${findriscInfo.bannerBorder}` }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:findriscInfo.color, flexShrink:0 }} />
              <span style={{ fontSize:'0.72rem', fontWeight:700, color:findriscInfo.color }}>{findriscInfo.level}</span>
            </div>
          </div>

          {/* Framingham card */}
          <div style={{ backgroundColor:'#ffffff', borderRadius:'16px', padding:'20px', border:`1px solid ${cardioInfo.bannerBorder}`, boxShadow:'0 2px 8px rgba(15,23,42,0.05)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', backgroundColor:cardioInfo.color, borderRadius:'16px 16px 0 0' }} />
            <p style={{ margin:'10px 0 10px', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.09em', textTransform:'uppercase' }}>Cardiovascular</p>
            <p style={{ margin:0, fontSize:'2.75rem', fontWeight:900, color:cardioInfo.color, lineHeight:1, letterSpacing:'-0.03em' }}>{framinghamRisk}%</p>
            <p style={{ margin:'3px 0 16px', fontSize:'0.75rem', color:'#94a3b8', fontWeight:500 }}>10-year risk{estimated ? ' · estimated' : ''}</p>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 10px', backgroundColor:cardioInfo.bannerBg, borderRadius:'8px', border:`1px solid ${cardioInfo.bannerBorder}` }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:cardioInfo.color, flexShrink:0 }} />
              <span style={{ fontSize:'0.72rem', fontWeight:700, color:cardioInfo.color }}>{cardioInfo.level}</span>
            </div>
          </div>
        </div>

        {/* Combined clinical recommendation */}
        <div style={{ backgroundColor:'#ffffff', borderRadius:'16px', padding:'22px 24px', border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,23,42,0.04)', marginBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'28px', height:'28px', borderRadius:'8px', backgroundColor:'#eff6ff', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill={BLUE}>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <p style={{ margin:0, fontSize:'0.875rem', fontWeight:700, color:'#0f172a' }}>Combined Clinical Assessment</p>
          </div>
          <p style={{ margin:0, fontSize:'0.9rem', color:'#334155', lineHeight:1.75 }}>
            {combinedNarrativeText(findriscScore, framinghamRisk)}
          </p>
        </div>

        {/* Referral / no-referral section */}
        {referralNeeded ? (
          <>
            {/* Red referral banner */}
            <div style={{ backgroundColor:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'14px', padding:'20px 24px', marginBottom:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'32px', height:'32px', borderRadius:'8px', backgroundColor:'#dc2626', flexShrink:0 }}>
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="white">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                  </svg>
                </div>
                <p style={{ margin:0, fontSize:'1.0625rem', fontWeight:700, color:'#b91c1c' }}>Referral Recommended</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {referralReasons.map((reason, i) => (
                  <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                    <div style={{ width:'5px', height:'5px', borderRadius:'50%', backgroundColor:'#dc2626', flexShrink:0, marginTop:'8px' }} />
                    <p style={{ margin:0, fontSize:'0.875rem', color:'#7f1d1d', lineHeight:1.65 }}>{reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Referral Letter button */}
            <button
              onClick={onGenerateReferral}
              onMouseOver={() => setRefHov(true)}
              onMouseOut={() => setRefHov(false)}
              style={{ width:'100%', padding:'18px 24px', border:'none', borderRadius:'12px', backgroundColor: refHov ? '#1558a8' : BLUE, color:'#ffffff', fontSize:'1.0625rem', fontWeight:700, cursor:'pointer', boxShadow: refHov ? '0 6px 20px rgba(29,111,206,0.45)' : '0 4px 16px rgba(29,111,206,0.3)', transition:'background-color 140ms ease, box-shadow 140ms ease', fontFamily:font, marginBottom:'12px' }}>
              Generate Referral Letter
            </button>
          </>
        ) : (
          /* Green no-referral banner */
          <div style={{ backgroundColor:'#f0fdf4', border:'1px solid #86efac', borderRadius:'14px', padding:'20px 24px', marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'32px', height:'32px', borderRadius:'8px', backgroundColor:'#16a34a', flexShrink:0 }}>
                <svg width="15" height="15" viewBox="0 0 20 20" fill="white">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <p style={{ margin:0, fontSize:'1.0625rem', fontWeight:700, color:'#15803d' }}>No Referral Required</p>
            </div>
            <p style={{ margin:'0 0 14px', fontSize:'0.875rem', color:'#166534', lineHeight:1.65 }}>
              Both assessments are within the low-risk range. Share the following lifestyle advice with the patient.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {LIFESTYLE_ADVICE.map((advice, i) => (
                <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                  <div style={{ width:'5px', height:'5px', borderRadius:'50%', backgroundColor:'#16a34a', flexShrink:0, marginTop:'8px' }} />
                  <p style={{ margin:0, fontSize:'0.875rem', color:'#166534', lineHeight:1.65 }}>{advice}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start New Screening */}
        <button
          onClick={onStartNew}
          onMouseOver={() => setNewHov(true)}
          onMouseOut={() => setNewHov(false)}
          style={{ width:'100%', padding:'16px 24px', border:`2px solid ${newHov ? '#16a34a' : '#e2e8f0'}`, borderRadius:'12px', backgroundColor: newHov ? '#f0fdf4' : '#ffffff', color: newHov ? '#15803d' : '#475569', fontSize:'1rem', fontWeight:600, cursor:'pointer', transition:'border-color 140ms ease, background-color 140ms ease, color 140ms ease', fontFamily:font }}>
          Start New Screening
        </button>
      </div>
    </div>
  );
}

// ─── Referral letter ─────────────────────────────────────────────────────────

function getLetterRecommendations(findriscScore, framinghamRisk) {
  const recs = [];
  if (findriscScore >= 15) {
    recs.push('Fasting plasma glucose and/or HbA1c measurement to screen for type 2 diabetes or pre-diabetes.');
    recs.push('Referral for a structured diabetes prevention programme or intensive lifestyle intervention.');
    recs.push('Assessment of modifiable risk factors including dietary habits, physical activity level, and body weight.');
  }
  if (framinghamRisk >= 20) {
    recs.push('Urgent fasting lipid profile (total cholesterol, LDL-C, HDL-C, triglycerides).');
    recs.push('12-lead ECG and further cardiovascular investigation as clinically indicated.');
    recs.push('Consideration of statin therapy and/or optimisation of antihypertensive medication as clinically appropriate.');
    recs.push('Reinforcement of cardiovascular risk-reducing lifestyle modifications.');
  } else if (framinghamRisk >= 10) {
    recs.push('Fasting lipid profile to obtain precise cardiovascular risk data and guide management.');
    recs.push('Review of blood pressure control and treatment optimisation if indicated.');
    recs.push('Lifestyle counselling focused on diet, physical activity, and smoking cessation where applicable.');
  }
  return recs;
}

function ReferralLetter({ findriscScore, framinghamResult, onBack }) {
  const { risk: framinghamRisk, estimated } = framinghamResult;
  const findriscInfo = getRiskInfo(findriscScore);
  const cardioInfo   = getCardioRiskInfo(framinghamRisk);
  const recs         = getLetterRecommendations(findriscScore, framinghamRisk);

  const [pharmacyName,    setPharmacyName]    = useState('');
  const [pharmacistName,  setPharmacistName]  = useState('');
  const [emailHov,        setEmailHov]        = useState(false);
  const [printHov,        setPrintHov]        = useState(false);

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const displayPharmacy   = pharmacyName.trim()   || 'Community Pharmacy';
  const displayPharmacist = pharmacistName.trim() || 'Community Pharmacist';

  const handlePrint = () => window.print();

  const handleEmail = () => {
    const recsText = recs.map(r => `  • ${r}`).join('\n');
    const body = [
      `${displayPharmacy}`,
      `${today}`,
      '',
      'Re: Patient NCD Risk Screening Referral',
      '',
      'Dear Doctor,',
      '',
      `I am writing to refer a patient who attended ${displayPharmacy} on ${today} for a non-communicable disease (NCD) risk screening using the PharmaScan clinical decision support tool. The following validated published screening instruments were administered.`,
      '',
      `DIABETES RISK — FINDRISC Score: ${findriscScore}/26 (${findriscInfo.level})`,
      `The Finnish Diabetes Risk Score (FINDRISC) was calculated as ${findriscScore} out of a maximum of 26 points, placing this patient in the ${findriscInfo.level} category. This corresponds to an estimated ${findriscInfo.probability}.`,
      '',
      `CARDIOVASCULAR RISK — Framingham Risk Score: ${framinghamRisk}% (${cardioInfo.level})`,
      `Using the Framingham Risk Score (D'Agostino et al., 2008), this patient's estimated 10-year risk of a major cardiovascular event is ${framinghamRisk}%, placing them in the ${cardioInfo.level} category.${estimated ? ' Note: cholesterol values were unavailable; population average values were applied in this calculation.' : ''}`,
      '',
      'RECOMMENDATIONS',
      'Based on these findings, I would be grateful for your review and consideration of the following:',
      '',
      recsText,
      '',
      'I would be grateful for your review and further management of this patient in the context of a full clinical assessment.',
      '',
      'Yours sincerely,',
      '',
      displayPharmacist,
      'Community Pharmacist',
      displayPharmacy,
      '',
      '---',
      'Disclaimer: This screening was conducted using validated published risk assessment tools. Results are intended to support clinical decision-making and do not constitute a diagnosis. Please review findings in the context of a full clinical assessment.',
    ].join('\n');

    window.location.href = `mailto:?subject=${encodeURIComponent('Patient Referral — PharmaScan NCD Screening')}&body=${encodeURIComponent(body)}`;
  };

  const inputStyle = {
    padding: '9px 14px', border: '2px solid #e2e8f0', borderRadius: '8px',
    fontSize: '0.875rem', fontFamily: font, color: '#0f172a', outline: 'none',
    width: '100%', backgroundColor: '#ffffff',
  };
  const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '6px' };

  return (
    <>
      {/* Print stylesheet injected inline */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; }
          .letter-card { box-shadow: none !important; border: none !important; max-width: 100% !important; margin: 0 !important; border-radius: 0 !important; padding: 32px 48px !important; }
        }
      `}</style>

      {/* Screen chrome */}
      <div className="no-print" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 8px rgba(15,23,42,0.06)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LogoBadge />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: BLUE, lineHeight: 1.2 }}>PharmaScan</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>Referral Letter</div>
            </div>
          </div>
          <button onClick={onBack} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: font }}>
            ← Back
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: '#f1f5f9', minHeight: 'calc(100vh - 64px)', padding: '32px 24px 64px', fontFamily: font }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>

          {/* Configuration inputs */}
          <div className="no-print" style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.05)', marginBottom: '24px' }}>
            <p style={{ margin: '0 0 16px', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Letter Details</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Pharmacy Name</label>
                <input value={pharmacyName} onChange={e => setPharmacyName(e.target.value)} placeholder="e.g. Al Barsha Community Pharmacy" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Pharmacist Name</label>
                <input value={pharmacistName} onChange={e => setPharmacistName(e.target.value)} placeholder="e.g. Dr. Sara Al Mansouri" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* The letter */}
          <div className="letter-card" style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '48px 56px', boxShadow: '0 4px 32px rgba(15,23,42,0.10)', border: '1px solid #e2e8f0', marginBottom: '24px' }}>

            {/* Letterhead */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{displayPharmacy}</p>
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', whiteSpace: 'nowrap', paddingTop: '2px' }}>{today}</p>
            </div>

            {/* Blue rule */}
            <div style={{ height: '2px', backgroundColor: BLUE, marginBottom: '28px', borderRadius: '1px', opacity: 0.8 }} />

            {/* Subject */}
            <p style={{ margin: '0 0 20px', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.01em' }}>
              Re: Patient NCD Risk Screening Referral
            </p>

            <p style={{ margin: '0 0 20px', fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>Dear Doctor,</p>

            {/* Intro */}
            <p style={{ margin: '0 0 24px', fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>
              I am writing to refer a patient who attended <strong>{displayPharmacy}</strong> on {today} for a non-communicable disease (NCD) risk screening using the PharmaScan clinical decision support tool. The following validated published screening instruments were administered.
            </p>

            {/* FINDRISC section */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', fontWeight: 700, color: findriscInfo.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Diabetes Risk — FINDRISC Score: {findriscScore}/26
              </p>
              <div style={{ borderLeft: `3px solid ${findriscInfo.color}`, paddingLeft: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>
                  The Finnish Diabetes Risk Score (FINDRISC) was calculated as <strong>{findriscScore} out of 26</strong>, placing this patient in the <strong>{findriscInfo.level}</strong> category. This corresponds to an estimated <strong>{findriscInfo.probability}</strong>.
                </p>
              </div>
            </div>

            {/* Framingham section */}
            <div style={{ marginBottom: '28px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', fontWeight: 700, color: cardioInfo.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Cardiovascular Risk — Framingham Risk Score: {framinghamRisk}%
              </p>
              <div style={{ borderLeft: `3px solid ${cardioInfo.color}`, paddingLeft: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>
                  Using the Framingham Risk Score (D'Agostino <em>et al.</em>, 2008), this patient's estimated 10-year risk of a major cardiovascular event is <strong>{framinghamRisk}%</strong>, placing them in the <strong>{cardioInfo.level}</strong> category.{estimated && <> <em>Note: cholesterol values were unavailable at the time of screening; population average values were applied in this calculation.</em></>}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div style={{ marginBottom: '28px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recommendations</p>
              <p style={{ margin: '0 0 12px', fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>
                Based on these findings, I would be grateful for your review and consideration of the following:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recs.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.9375rem', color: '#475569', flexShrink: 0, marginTop: '2px' }}>•</span>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing */}
            <p style={{ margin: '0 0 28px', fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>
              I would be grateful for your review and further management of this patient in the context of a full clinical assessment.
            </p>

            <p style={{ margin: '0 0 4px', fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>Yours sincerely,</p>
            <div style={{ height: '36px' }} />
            <p style={{ margin: '0 0 2px', fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{displayPharmacist}</p>
            <p style={{ margin: '0 0 2px', fontSize: '0.875rem', color: '#475569' }}>Community Pharmacist</p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>{displayPharmacy}</p>

            {/* Divider + disclaimer */}
            <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '28px 0 20px' }} />
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.7, fontStyle: 'italic' }}>
              Disclaimer: This screening was conducted using validated published risk assessment tools. Results are intended to support clinical decision-making and do not constitute a diagnosis. Please review findings in the context of a full clinical assessment.
            </p>
          </div>

          {/* Action buttons */}
          <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={handlePrint}
              onMouseOver={() => setPrintHov(true)}
              onMouseOut={() => setPrintHov(false)}
              style={{ padding: '16px 24px', border: 'none', borderRadius: '12px', backgroundColor: printHov ? '#1558a8' : BLUE, color: '#ffffff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: printHov ? '0 6px 20px rgba(29,111,206,0.4)' : '0 4px 14px rgba(29,111,206,0.28)', transition: 'background-color 140ms ease, box-shadow 140ms ease', fontFamily: font }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h1v1a2 2 0 002 2h6a2 2 0 002-2v-1h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm2 0h6v3H7V4zm-1 9a1 1 0 100 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
              Print Letter
            </button>
            <button
              onClick={handleEmail}
              onMouseOver={() => setEmailHov(true)}
              onMouseOut={() => setEmailHov(false)}
              style={{ padding: '16px 24px', border: `2px solid ${emailHov ? BLUE : '#e2e8f0'}`, borderRadius: '12px', backgroundColor: emailHov ? '#eff6ff' : '#ffffff', color: emailHov ? BLUE : '#334155', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'border-color 140ms ease, background-color 140ms ease, color 140ms ease', fontFamily: font }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              Email Letter
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── App router ───────────────────────────────────────────────────────────────

export default function App() {
  const [screen,           setScreen]           = useState('home');
  const [findriscScore,    setFindriscScore]    = useState(null);
  const [framinghamResult, setFraminghamResult] = useState(null);

  switch (screen) {
    case 'findrisc':
      return <FindriscForm onBack={() => setScreen('home')} onResult={s => { setFindriscScore(s); setScreen('findrisc-result'); }} />;

    case 'findrisc-result':
      return <FindriscResult score={findriscScore} onBack={() => setScreen('findrisc')} onContinue={() => setScreen('framingham')} />;

    case 'framingham':
      return <FraminghamForm findriscScore={findriscScore} onBack={() => setScreen('findrisc-result')} onResult={r => { setFraminghamResult(r); setScreen('framingham-result'); }} />;

    case 'framingham-result':
      return <FraminghamResult result={framinghamResult} onBack={() => setScreen('framingham')} onContinue={() => setScreen('results')} />;

    case 'results':
      return (
        <ResultsSummary
          findriscScore={findriscScore}
          framinghamResult={framinghamResult}
          onStartNew={() => { setFindriscScore(null); setFraminghamResult(null); setScreen('home'); }}
          onGenerateReferral={() => setScreen('referral')}
        />
      );

    case 'referral':
      return (
        <ReferralLetter
          findriscScore={findriscScore}
          framinghamResult={framinghamResult}
          onBack={() => setScreen('results')}
        />
      );

    default:
      return <HomeScreen onStart={() => setScreen('findrisc')} />;
  }
}
