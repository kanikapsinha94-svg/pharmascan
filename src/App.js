import { useState, useEffect } from 'react';
import './App.css';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from './supabase';
import PatientPage from './PatientPage';

function generateId() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

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
      { label: 'Men < 94 cm  /  Women < 80 cm',    subLabel: 'approximately 37 inches or less for men, 31 inches or less for women',    score: 0 },
      { label: 'Men 94–102 cm  /  Women 80–88 cm', subLabel: 'approximately 37–40 inches for men, 32–35 inches for women',              score: 3 },
      { label: 'Men > 102 cm  /  Women > 88 cm',   subLabel: 'approximately 40 inches or more for men, 35 inches or more for women',    score: 4 },
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

function getHba1cLabel(hba1cPct) {
  const h = Math.round(hba1cPct * 10) / 10;
  if (h > 9)   return 'Significantly above target — urgent review recommended';
  if (h > 7)   return 'Above target — review recommended';
  if (h === 7) return 'Borderline';
  return 'At target';
}

function getDiabetesCareGaps({ hba1cKnown, hba1cPct, lastSeen, medication, complications }) {
  const gaps = [];
  if (hba1cKnown && hba1cPct !== null) {
    const label = getHba1cLabel(hba1cPct);
    if (label === 'Significantly above target — urgent review recommended')
      gaps.push({ title: 'HbA1c — significantly above target', recommendation: 'Urgent referral to GP or diabetes team. Medication review and intensification is likely required.' });
    else if (label === 'Above target — review recommended')
      gaps.push({ title: 'HbA1c — above target', recommendation: 'Diabetes review with GP or diabetes nurse recommended to optimise blood glucose control.' });
    else if (label === 'Borderline')
      gaps.push({ title: 'HbA1c — borderline', recommendation: 'HbA1c is at the borderline threshold. Recommend discussing with treating physician at next visit.' });
  } else if (!hba1cKnown) {
    gaps.push({ title: 'HbA1c result unknown to patient', recommendation: 'Encourage the patient to have a blood test and ask their care team for their result. Regular HbA1c monitoring is essential.' });
  }
  const noMeds     = medication === 'none';
  const longOverdue = lastSeen === 'over12mo';
  if (noMeds && longOverdue) {
    gaps.push({ title: 'No diabetes medication and no review in over 12 months', recommendation: 'Urgent GP referral recommended — patient is overdue for a diabetes review and is not currently on any diabetes medication.' });
  } else {
    if (longOverdue)
      gaps.push({ title: 'No diabetes review in over 12 months', recommendation: 'This patient is overdue for a diabetes review. A GP or diabetes nurse appointment is recommended.' });
    else if (lastSeen === '6to12mo')
      gaps.push({ title: 'Diabetes review overdue (6–12 months since last appointment)', recommendation: 'Patient should book a diabetes review with their GP or diabetes nurse soon.' });
    if (noMeds)
      gaps.push({ title: 'Not currently on diabetes medication', recommendation: 'A GP review can confirm whether medication is appropriate. Diet-controlled diabetes still requires regular monitoring.' });
  }
  if (complications)
    gaps.push({ title: 'Known diabetes complications present', recommendation: 'Ensure the patient is under appropriate specialist care. Regular monitoring of affected organ systems is important.' });
  return gaps;
}

function getCVDCareGaps({ lastSeen, aspirin, statin, bpMeds, symptoms }) {
  if (symptoms) return { urgent: true, gaps: [] };
  const gaps = [];
  if (lastSeen === 'over12mo')
    gaps.push({ title: 'No cardiology or GP review in over 12 months', recommendation: 'This patient is overdue for a cardiology or GP review. An appointment should be arranged promptly.' });
  else if (lastSeen === '6to12mo')
    gaps.push({ title: 'Cardiology or GP review overdue (6–12 months)', recommendation: 'Patient should book a review with their cardiologist or GP soon.' });
  if (!aspirin)
    gaps.push({ title: 'Not currently on aspirin or antiplatelet therapy', recommendation: 'Antiplatelet therapy is a cornerstone of secondary CVD prevention. Review with prescribing physician is recommended.' });
  if (!statin)
    gaps.push({ title: 'Not currently on a statin', recommendation: 'Statin therapy is recommended for all patients with established CVD. Review with prescribing physician is recommended.' });
  if (!bpMeds)
    gaps.push({ title: 'Not currently on blood pressure medication', recommendation: 'Blood pressure management is important in CVD secondary prevention. Review with prescribing physician is recommended.' });
  return { urgent: false, gaps };
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
function OptionButton({ label, subLabel, score, selected, onClick }) {
  return (
    <button onClick={onClick} style={{ width:'100%', padding:'14px 18px', border:`2px solid ${selected ? BLUE : '#e2e8f0'}`, borderRadius:'10px', backgroundColor: selected ? '#eff6ff' : '#ffffff', color: selected ? BLUE : '#334155', fontSize:'0.9375rem', fontWeight: selected ? 600 : 400, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', transition:'border-color 120ms ease, background-color 120ms ease', fontFamily:font }}>
      <span style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <span style={{ width:'18px', height:'18px', borderRadius:'50%', flexShrink:0, border:`2px solid ${selected ? BLUE : '#cbd5e1'}`, backgroundColor: selected ? BLUE : 'transparent', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
          {selected && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3" fill="white"/></svg>}
        </span>
        <span>
          <span style={{ display:'block' }}>{label}</span>
          {subLabel && <span style={{ display:'block', fontSize:'0.72rem', fontWeight:400, color: selected ? '#60a5fa' : '#94a3b8', marginTop:'2px' }}>{subLabel}</span>}
        </span>
      </span>
      <span style={{ fontSize:'0.75rem', fontWeight:700, color: selected ? BLUE : '#94a3b8', whiteSpace:'nowrap', backgroundColor: selected ? '#dbeafe' : '#f1f5f9', padding:'2px 8px', borderRadius:'999px', flexShrink:0 }}>+{score} pts</span>
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

// ─── Pharmacy setup screen (shown once per session) ──────────────────────────

function PharmacySetupScreen({ onStart }) {
  const [pharmacyName,    setPharmacyName]    = useState('');
  const [pharmacistName,  setPharmacistName]  = useState('');
  const [hov,             setHov]             = useState(false);

  const canStart = pharmacyName.trim().length > 0;
  const submit   = () => { if (canStart) onStart({ pharmacyName: pharmacyName.trim(), pharmacistName: pharmacistName.trim() }); };

  const fieldStyle = { width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'0.9375rem', color:'#0f172a', fontFamily:font, outline:'none', boxSizing:'border-box', backgroundColor:'#fff' };
  const labelStyle = { display:'block', marginBottom:'6px', fontSize:'0.8125rem', fontWeight:600, color:'#374151' };

  return (
    <main style={{ minHeight:'100vh', backgroundColor:'#f8fafc', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'32px 24px', fontFamily:font, color:'#1e293b' }}>
      <div style={{ maxWidth:'480px', width:'100%', textAlign:'center' }}>

        <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'72px', height:'72px', borderRadius:'20px', backgroundColor:BLUE, marginBottom:'24px', boxShadow:'0 8px 24px rgba(29,111,206,0.28)' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="14" y="6"  width="8"  height="24" rx="2" fill="white"/>
            <rect x="6"  y="14" width="24" height="8"  rx="2" fill="white"/>
          </svg>
        </div>
        <h1 style={{ margin:'0 0 8px', fontSize:'2.75rem', fontWeight:800, letterSpacing:'-0.04em', color:BLUE, lineHeight:1 }}>PharmaScan</h1>
        <p style={{ margin:'0 0 32px', fontSize:'1rem', color:'#64748b', fontWeight:500 }}>NCD Risk Screening Tool</p>

        <div style={{ backgroundColor:'#ffffff', borderRadius:'20px', padding:'36px 32px', boxShadow:'0 4px 32px rgba(15,23,42,0.08)', border:'1px solid #e2e8f0', textAlign:'left' }}>
          <h2 style={{ margin:'0 0 6px', fontSize:'1.25rem', fontWeight:800, color:'#0f172a' }}>Welcome</h2>
          <p style={{ margin:'0 0 28px', fontSize:'0.875rem', color:'#64748b', lineHeight:1.65 }}>Enter your pharmacy details before you begin. These will appear on all referral letters generated this session.</p>

          <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginBottom:'28px' }}>
            <div>
              <label style={labelStyle}>Pharmacy Name <span style={{ color:'#dc2626' }}>*</span></label>
              <input value={pharmacyName} onChange={e => setPharmacyName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="e.g. Al Barsha Community Pharmacy" autoFocus style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Pharmacist Name</label>
              <input value={pharmacistName} onChange={e => setPharmacistName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="e.g. Dr. Sara Al Mansouri" style={fieldStyle} />
            </div>
          </div>

          <button onClick={submit} onMouseOver={() => canStart && setHov(true)} onMouseOut={() => setHov(false)} disabled={!canStart}
            style={{ width:'100%', padding:'16px 24px', border:'none', borderRadius:'12px', backgroundColor: canStart ? (hov ? '#1558a8' : BLUE) : '#e2e8f0', color: canStart ? '#ffffff' : '#94a3b8', fontSize:'1rem', fontWeight:700, cursor: canStart ? 'pointer' : 'not-allowed', boxShadow: canStart ? '0 4px 16px rgba(29,111,206,0.3)' : 'none', transition:'background-color 140ms ease', fontFamily:font }}>
            Start →
          </button>
          {!canStart && <p style={{ textAlign:'center', margin:'10px 0 0', fontSize:'0.78rem', color:'#94a3b8' }}>Enter pharmacy name to continue</p>}
        </div>

        <p style={{ marginTop:'24px', fontSize:'0.78rem', color:'#94a3b8' }}>For use by licensed pharmacists in the UAE only.</p>
      </div>
    </main>
  );
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
  const [answers,  setAnswers]  = useState({});
  const [calcHov,  setCalcHov]  = useState(false);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  const answered = Object.keys(answers).length;
  const total    = FINDRISC_QUESTIONS.length;
  const allDone  = answered === total;

  const autoSelectBMI = (h, w) => {
    const hN = parseFloat(h), wN = parseFloat(w);
    if (hN > 0 && wN > 0) {
      const bmi = wN / Math.pow(hN / 100, 2);
      setAnswers(p => ({ ...p, bmi: bmi < 25 ? 0 : bmi <= 30 ? 1 : 2 }));
    }
  };
  const handleHeightChange = v => { setHeightCm(v); autoSelectBMI(v, weightKg); };
  const handleWeightChange = v => { setWeightKg(v); autoSelectBMI(heightCm, v); };

  const bmiVal = (() => {
    const hN = parseFloat(heightCm), wN = parseFloat(weightKg);
    return hN > 0 && wN > 0 ? (wN / Math.pow(hN / 100, 2)).toFixed(1) : null;
  })();

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
                  <OptionButton key={oi} label={opt.label} subLabel={opt.subLabel} score={opt.score} selected={answers[q.id] === oi} onClick={() => setAnswers(p => ({ ...p, [q.id]: oi }))} />
                ))}

                {q.id === 'bmi' && (
                  <div style={{ marginTop:'10px', padding:'14px 16px', backgroundColor:'#f8fafc', borderRadius:'10px', border:'1px solid #e2e8f0' }}>
                    <p style={{ margin:'0 0 10px', fontSize:'0.72rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>BMI Calculator (optional)</p>
                    <div style={{ display:'flex', gap:'12px', alignItems:'flex-end', flexWrap:'wrap' }}>
                      <div>
                        <p style={{ margin:'0 0 4px', fontSize:'0.75rem', color:'#64748b' }}>Height</p>
                        <StyledNumberInput value={heightCm} onChange={handleHeightChange} placeholder="e.g. 170" min={100} max={250} unit="cm" />
                      </div>
                      <div>
                        <p style={{ margin:'0 0 4px', fontSize:'0.75rem', color:'#64748b' }}>Weight</p>
                        <StyledNumberInput value={weightKg} onChange={handleWeightChange} placeholder="e.g. 75" min={20} max={300} unit="kg" />
                      </div>
                      {bmiVal && (
                        <div style={{ padding:'9px 16px', backgroundColor:'#eff6ff', borderRadius:'8px', border:`1px solid ${BLUE}`, textAlign:'center' }}>
                          <p style={{ margin:'0 0 2px', fontSize:'0.72rem', color:'#64748b' }}>BMI</p>
                          <p style={{ margin:0, fontSize:'1.25rem', fontWeight:800, color:BLUE, lineHeight:1 }}>{bmiVal}</p>
                        </div>
                      )}
                    </div>
                    {bmiVal && <p style={{ margin:'8px 0 0', fontSize:'0.72rem', color:'#94a3b8' }}>BMI {bmiVal} kg/m² — option auto-selected above</p>}
                  </div>
                )}

                {q.id === 'waist' && (
                  <p style={{ margin:'10px 0 0', fontSize:'0.78rem', color:'#94a3b8', lineHeight:1.6 }}>
                    Waist is measured at navel level. If the patient is unsure of their measurement, trouser or pant size can be used as a rough estimate using the inch values shown above.
                  </p>
                )}
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
      sex, sbp: sbpN, bpTreated,
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

function FraminghamResult({ result, knownDiabetic, onBack, onContinue }) {
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

        {result.sbp >= 140 && (
          <div style={{ display:'flex', gap:'10px', alignItems:'flex-start', backgroundColor:'#fefce8', border:'1px solid #fde047', borderRadius:'12px', padding:'14px 16px', marginBottom:'20px' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#ca8a04" style={{ flexShrink:0, marginTop:'1px' }}>
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            <p style={{ margin:0, fontSize:'0.8rem', color:'#713f12', lineHeight:1.6 }}>
              <strong>Elevated Blood Pressure Noted:</strong> This patient's systolic BP reading of <strong>{result.sbp} mmHg</strong> is above the normal range (below 120 mmHg is optimal, 120–139 mmHg is elevated, 140 mmHg and above is high). Blood pressure review is recommended.
            </p>
          </div>
        )}

        {knownDiabetic && (
          <div style={{ display:'flex', gap:'10px', alignItems:'flex-start', backgroundColor:'#fffbeb', border:'1px solid #fcd34d', borderRadius:'12px', padding:'14px 16px', marginBottom:'20px' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#b45309" style={{ flexShrink:0, marginTop:'1px' }}>
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            <p style={{ margin:0, fontSize:'0.8rem', color:'#92400e', lineHeight:1.6 }}>
              <strong>Note:</strong> The Framingham Risk Score may underestimate cardiovascular risk in patients with established diabetes. This result should be interpreted with caution and reviewed by a treating physician.
            </p>
          </div>
        )}

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

function PatientCard({ patientId, saveData }) {
  const qrUrl = `${window.location.origin}/patient/${patientId}`;

  useEffect(() => {
    if (!supabase) return;
    supabase.from('patient_records').upsert({ id: patientId, ...saveData }, { onConflict: 'id' })
      .then(({ error }) => { if (error) console.warn('PharmaScan: patient record save failed', error); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  return (
    <div style={{ backgroundColor:'#eff6ff', borderRadius:'16px', padding:'24px', border:'1px solid #bfdbfe', textAlign:'center', marginTop:'20px' }}>
      <p style={{ margin:'0 0 4px', fontSize:'0.875rem', fontWeight:700, color:BLUE }}>Patient Health Information</p>
      <p style={{ margin:'0 0 16px', fontSize:'0.8rem', color:'#64748b' }}>Share this QR code with your patient</p>
      <div style={{ display:'inline-block', backgroundColor:'#fff', padding:'12px', borderRadius:'12px', boxShadow:'0 2px 8px rgba(15,23,42,0.08)', marginBottom:'14px' }}>
        <QRCodeSVG value={qrUrl} size={148} />
      </div>
      <p style={{ margin:'0 0 14px', fontSize:'0.875rem', color:'#334155', lineHeight:1.65 }}>
        Scan this QR code to get your personalised health information on your phone.
      </p>
      <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'8px 16px', backgroundColor:'#fff', borderRadius:'10px', border:'1px solid #bfdbfe' }}>
        <span style={{ fontSize:'0.72rem', color:'#94a3b8', letterSpacing:'0.04em', textTransform:'uppercase' }}>ID</span>
        <span style={{ fontSize:'0.9375rem', fontWeight:700, color:BLUE, fontFamily:'monospace', letterSpacing:'0.12em' }}>{patientId}</span>
      </div>
    </div>
  );
}

function ResultsSummary({ findriscScore, framinghamResult, knownDiabetic, diabetesControl, knownCVD, cvdMeds, patientId, onStartNew, onGenerateReferral }) {
  const [refHov, setRefHov] = useState(false);
  const [newHov, setNewHov] = useState(false);

  // Diabetes info
  const findriscInfo = !knownDiabetic && findriscScore !== null ? getRiskInfo(findriscScore) : null;
  const careGaps     = knownDiabetic && diabetesControl ? getDiabetesCareGaps(diabetesControl) : null;

  // CVD info
  const framinghamRisk = !knownCVD && framinghamResult ? framinghamResult.risk : null;
  const estimated      = !knownCVD && framinghamResult ? framinghamResult.estimated : false;
  const sex            = !knownCVD && framinghamResult ? framinghamResult.sex : null;
  const sbp            = !knownCVD && framinghamResult ? framinghamResult.sbp : null;

  // Patient record payload for Supabase / QR page
  const patientSaveData = {
    findrisc_score: findriscScore,
    findrisc_level: findriscInfo ? findriscInfo.level : null,
    cvd_risk:       framinghamRisk,
    systolic_bp:    sbp,
    known_diabetic: knownDiabetic,
    known_cvd:      knownCVD,
    diabetes_gaps:  careGaps,
    cvd_result:     knownCVD && cvdMeds ? getCVDCareGaps(cvdMeds) : null,
    hba1c_display:  diabetesControl ? diabetesControl.hba1cDisplay || null : null,
  };
  const cardioInfo     = framinghamRisk !== null ? getCardioRiskInfo(framinghamRisk) : { level:'High Risk', color:'#b91c1c', bannerBg:'#fee2e2', bannerBorder:'#fca5a5', bg:'#fee2e2', border:'#fca5a5' };

  // Referral logic
  const cvdResult        = knownCVD && cvdMeds ? getCVDCareGaps(cvdMeds) : null;
  const diabetesReferral = knownDiabetic ? (careGaps && careGaps.length > 0) : (findriscScore !== null && findriscScore >= 15);
  const cvdReferral      = knownCVD ? (cvdResult && (cvdResult.urgent || cvdResult.gaps.length > 0)) : (framinghamRisk !== null && framinghamRisk >= 10);
  const bpReferral       = !knownCVD && sbp !== null && sbp >= 140;
  const referralNeeded   = diabetesReferral || cvdReferral || bpReferral;

  const referralReasons = [];
  if (knownDiabetic && careGaps && careGaps.length > 0)
    referralReasons.push(`${careGaps.length} diabetes care gap${careGaps.length > 1 ? 's' : ''} identified — see Care Gap Summary for details and recommendations.`);
  else if (!knownDiabetic && findriscScore !== null && findriscScore >= 15)
    referralReasons.push(`FINDRISC score of ${findriscScore}/26 (${findriscInfo.level}) — refer for fasting blood glucose or HbA1c testing and consideration of a diabetes prevention programme.`);
  if (knownCVD && cvdResult) {
    if (cvdResult.urgent)
      referralReasons.push('Known CVD — new or worsening symptoms reported (chest pain, breathlessness, or palpitations). Urgent physician assessment is required.');
    else if (cvdResult.gaps.length > 0)
      referralReasons.push(`Known CVD — ${cvdResult.gaps.length} care gap${cvdResult.gaps.length > 1 ? 's' : ''} identified: ${cvdResult.gaps.map(g => g.title).join('; ')}.`);
  } else if (!knownCVD) {
    if (framinghamRisk !== null && framinghamRisk >= 20)
      referralReasons.push(`10-year cardiovascular risk of ${framinghamRisk}% (High Risk) — refer for cardiovascular risk management.`);
    else if (framinghamRisk !== null && framinghamRisk >= 10)
      referralReasons.push(`10-year cardiovascular risk of ${framinghamRisk}% (Intermediate Risk) — refer for cardiovascular risk factor management.`);
    if (bpReferral)
      referralReasons.push(`Elevated systolic BP of ${sbp} mmHg recorded — blood pressure review and clinical assessment recommended.`);
  }

  // Narrative text
  const narrativeText = (() => {
    if (knownCVD && cvdResult) {
      const cvdSuffix = knownDiabetic ? ' This patient also has confirmed diabetes.' : '';
      if (cvdResult.urgent)
        return `This patient has known cardiovascular disease and has reported new or worsening symptoms. Urgent physician assessment is required.${cvdSuffix}`;
      if (cvdResult.gaps.length === 0)
        return `This patient has known cardiovascular disease that appears well managed — all key secondary prevention medications are in place and review is up to date.${cvdSuffix} Encourage continued adherence and regular follow-up.`;
      return `This patient has known cardiovascular disease. ${cvdResult.gaps.length} care gap${cvdResult.gaps.length > 1 ? 's were' : ' was'} identified. Physician review is recommended.${cvdSuffix}`;
    }
    if (knownDiabetic && framinghamRisk !== null)
      return `This patient has confirmed diabetes. Their 10-year cardiovascular risk is ${framinghamRisk}% (${cardioInfo.level}). These conditions are closely linked and require coordinated physician management.`;
    if (findriscScore !== null && framinghamRisk !== null)
      return combinedNarrativeText(findriscScore, framinghamRisk);
    return 'Screening complete. Please review the results above and advise the patient accordingly.';
  })();

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="Screening Complete" />
      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'36px 24px 72px' }}>
        <div style={{ marginBottom:'28px' }}>
          <h2 style={{ margin:'0 0 6px', fontSize:'1.5rem', fontWeight:800, color:'#0f172a' }}>Screening Summary</h2>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#64748b' }}>Assessments complete</p>
        </div>

        {/* Score cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>

          {/* Diabetes card */}
          {knownDiabetic && careGaps !== null ? (
            <div style={{ backgroundColor:'#ffffff', borderRadius:'16px', padding:'20px', border:`1px solid ${careGaps.length > 0 ? '#fdba74' : '#86efac'}`, boxShadow:'0 2px 8px rgba(15,23,42,0.05)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', backgroundColor: careGaps.length > 0 ? '#c2410c' : '#15803d', borderRadius:'16px 16px 0 0' }} />
              <p style={{ margin:'10px 0 10px', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.09em', textTransform:'uppercase' }}>Diabetes</p>
              <p style={{ margin:'0 0 4px', fontSize:'2rem', fontWeight:900, color: careGaps.length > 0 ? '#c2410c' : '#15803d', lineHeight:1 }}>{careGaps.length}</p>
              <p style={{ margin:'0 0 12px', fontSize:'0.75rem', color:'#94a3b8', fontWeight:500 }}>care gap{careGaps.length !== 1 ? 's' : ''} identified</p>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 10px', backgroundColor: careGaps.length > 0 ? '#fff7ed' : '#f0fdf4', borderRadius:'8px', border:`1px solid ${careGaps.length > 0 ? '#fdba74' : '#86efac'}` }}>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor: careGaps.length > 0 ? '#c2410c' : '#15803d', flexShrink:0 }} />
                <span style={{ fontSize:'0.72rem', fontWeight:700, color: careGaps.length > 0 ? '#c2410c' : '#15803d' }}>Known Diabetic</span>
              </div>
            </div>
          ) : (
            findriscInfo && (
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
            )
          )}

          {/* CVD card */}
          {knownCVD && cvdResult ? (() => {
            const urgent  = cvdResult.urgent;
            const hasGaps = !urgent && cvdResult.gaps.length > 0;
            const cardBorder = urgent ? '#fca5a5' : hasGaps ? '#fdba74' : '#86efac';
            const barColor   = urgent ? '#b91c1c' : hasGaps ? '#c2410c' : '#15803d';
            const chipBg     = urgent ? '#fee2e2' : hasGaps ? '#fff7ed' : '#f0fdf4';
            const chipBorder = urgent ? '#fca5a5' : hasGaps ? '#fdba74' : '#86efac';
            const chipText   = urgent ? '#b91c1c' : hasGaps ? '#c2410c' : '#15803d';
            const chipLabel  = urgent ? 'Urgent Referral' : hasGaps ? `${cvdResult.gaps.length} gap${cvdResult.gaps.length > 1 ? 's' : ''} found` : 'Well Managed';
            return (
              <div style={{ backgroundColor:'#ffffff', borderRadius:'16px', padding:'20px', border:`1px solid ${cardBorder}`, boxShadow:'0 2px 8px rgba(15,23,42,0.05)', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', backgroundColor:barColor, borderRadius:'16px 16px 0 0' }} />
                <p style={{ margin:'10px 0 10px', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.09em', textTransform:'uppercase' }}>Cardiovascular</p>
                <p style={{ margin:'0 0 16px', fontSize:'1.0625rem', fontWeight:800, color:barColor, lineHeight:1.3 }}>Known CVD</p>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 10px', backgroundColor:chipBg, borderRadius:'8px', border:`1px solid ${chipBorder}` }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:chipText, flexShrink:0 }} />
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:chipText }}>{chipLabel}</span>
                </div>
              </div>
            );
          })() : (
            framinghamRisk !== null && (
              <div style={{ backgroundColor:'#ffffff', borderRadius:'16px', padding:'20px', border:`1px solid ${cardioInfo.bannerBorder}`, boxShadow:'0 2px 8px rgba(15,23,42,0.05)', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', backgroundColor:cardioInfo.color, borderRadius:'16px 16px 0 0' }} />
                <p style={{ margin:'10px 0 10px', fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', letterSpacing:'0.09em', textTransform:'uppercase' }}>Cardiovascular</p>
                <p style={{ margin:0, fontSize:'2.75rem', fontWeight:900, color:cardioInfo.color, lineHeight:1, letterSpacing:'-0.03em' }}>{framinghamRisk}%</p>
                <p style={{ margin:'3px 0 16px', fontSize:'0.75rem', color:'#94a3b8', fontWeight:500 }}>10-year risk · {sex === 'male' ? 'Male' : 'Female'}{estimated ? ' · estimated' : ''}</p>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 10px', backgroundColor:cardioInfo.bannerBg, borderRadius:'8px', border:`1px solid ${cardioInfo.bannerBorder}` }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:cardioInfo.color, flexShrink:0 }} />
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:cardioInfo.color }}>{cardioInfo.level}</span>
                </div>
              </div>
            )
          )}
        </div>

        {/* Combined narrative */}
        <div style={{ backgroundColor:'#ffffff', borderRadius:'16px', padding:'22px 24px', border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,23,42,0.04)', marginBottom:'20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'28px', height:'28px', borderRadius:'8px', backgroundColor:'#eff6ff', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill={BLUE}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
            </div>
            <p style={{ margin:0, fontSize:'0.875rem', fontWeight:700, color:'#0f172a' }}>Combined Clinical Assessment</p>
          </div>
          <p style={{ margin:0, fontSize:'0.9rem', color:'#334155', lineHeight:1.75 }}>{narrativeText}</p>
        </div>

        {/* Referral / no-referral */}
        {referralNeeded ? (
          <>
            <div style={{ backgroundColor:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'14px', padding:'20px 24px', marginBottom:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'32px', height:'32px', borderRadius:'8px', backgroundColor:'#dc2626', flexShrink:0 }}>
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="white"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
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
            <button onClick={onGenerateReferral} onMouseOver={() => setRefHov(true)} onMouseOut={() => setRefHov(false)}
              style={{ width:'100%', padding:'18px 24px', border:'none', borderRadius:'12px', backgroundColor: refHov ? '#1558a8' : BLUE, color:'#ffffff', fontSize:'1.0625rem', fontWeight:700, cursor:'pointer', boxShadow: refHov ? '0 6px 20px rgba(29,111,206,0.45)' : '0 4px 16px rgba(29,111,206,0.3)', transition:'background-color 140ms ease, box-shadow 140ms ease', fontFamily:font, marginBottom:'12px' }}>
              Generate Referral Letter
            </button>
          </>
        ) : (
          <div style={{ backgroundColor:'#f0fdf4', border:'1px solid #86efac', borderRadius:'14px', padding:'20px 24px', marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'32px', height:'32px', borderRadius:'8px', backgroundColor:'#16a34a', flexShrink:0 }}>
                <svg width="15" height="15" viewBox="0 0 20 20" fill="white"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              </div>
              <p style={{ margin:0, fontSize:'1.0625rem', fontWeight:700, color:'#15803d' }}>No Referral Required</p>
            </div>
            {knownCVD && cvdResult && !cvdResult.urgent && cvdResult.gaps.length === 0 ? (
              <p style={{ margin:0, fontSize:'0.875rem', color:'#166534', lineHeight:1.65 }}>Cardiovascular management appears well maintained. Encourage this patient to continue their current medications, keep regular appointments, and contact their doctor promptly if any new symptoms develop.</p>
            ) : (
              <>
                <p style={{ margin:'0 0 14px', fontSize:'0.875rem', color:'#166534', lineHeight:1.65 }}>Both assessments are within the low-risk range. Share the following lifestyle advice with the patient.</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {LIFESTYLE_ADVICE.map((advice, i) => (
                    <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                      <div style={{ width:'5px', height:'5px', borderRadius:'50%', backgroundColor:'#16a34a', flexShrink:0, marginTop:'8px' }} />
                      <p style={{ margin:0, fontSize:'0.875rem', color:'#166534', lineHeight:1.65 }}>{advice}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <button onClick={onStartNew} onMouseOver={() => setNewHov(true)} onMouseOut={() => setNewHov(false)}
          style={{ width:'100%', padding:'16px 24px', border:`2px solid ${newHov ? '#16a34a' : '#e2e8f0'}`, borderRadius:'12px', backgroundColor: newHov ? '#f0fdf4' : '#ffffff', color: newHov ? '#15803d' : '#475569', fontSize:'1rem', fontWeight:600, cursor:'pointer', transition:'border-color 140ms ease, background-color 140ms ease, color 140ms ease', fontFamily:font }}>
          Start New Screening
        </button>

        {patientId && <PatientCard patientId={patientId} saveData={patientSaveData} />}
      </div>
    </div>
  );
}

// ─── Referral letter ─────────────────────────────────────────────────────────

function getLetterRecommendations({ findriscScore, framinghamRisk, estimated, sbp, bpTreated, knownDiabetic, diabetesControl, knownCVD, cvdMeds, medicationReview }) {
  const recs = [];
  if (knownDiabetic && diabetesControl) {
    const gaps = getDiabetesCareGaps(diabetesControl);
    if (gaps.length === 0) {
      recs.push('Diabetes appears well managed. Continued adherence to management plan and annual GP review recommended.');
    } else {
      gaps.forEach(g => recs.push(g.recommendation));
    }
  } else if (!knownDiabetic && findriscScore !== null && findriscScore >= 15) {
    recs.push('Fasting plasma glucose and/or HbA1c measurement to screen for type 2 diabetes or pre-diabetes.');
    recs.push('Referral for a structured diabetes prevention programme or intensive lifestyle intervention.');
    recs.push('Assessment of modifiable risk factors including dietary habits, physical activity level, and body weight.');
  }
  if (knownCVD && cvdMeds) {
    const cvdResult = getCVDCareGaps(cvdMeds);
    if (cvdResult.urgent) {
      recs.push('URGENT: This patient has reported new or worsening cardiovascular symptoms (chest pain, breathlessness, or palpitations). Prompt physician assessment is required.');
    } else if (cvdResult.gaps.length === 0) {
      recs.push('Cardiovascular management appears well maintained. Encourage continued adherence to current treatment plan and regular review with their cardiologist or GP.');
    } else {
      cvdResult.gaps.forEach(g => recs.push(g.recommendation));
      recs.push('Consider cardiovascular assessment and review of risk factor management with their treating physician.');
    }
  } else if (!knownCVD && framinghamRisk !== null) {
    if (framinghamRisk >= 20) {
      if (estimated) recs.push('Urgent fasting lipid profile (total cholesterol, LDL-C, HDL-C, triglycerides) — cholesterol values were unavailable at the time of screening.');
      recs.push('Consider cardiovascular assessment and review of risk factor management with their treating physician.');
      if (!medicationReview || !medicationReview.onStatin)
        recs.push('Consideration of statin therapy as clinically appropriate — patient is not currently taking a statin.');
      recs.push('Reinforcement of cardiovascular risk-reducing lifestyle modifications.');
    } else if (framinghamRisk >= 10) {
      if (estimated) recs.push('Fasting lipid profile (total cholesterol, LDL-C, HDL-C, triglycerides) — cholesterol values were unavailable at the time of screening and are needed to guide management.');
      if (bpTreated && !(sbp !== null && sbp >= 140)) recs.push('Review of blood pressure control and treatment optimisation if indicated.');
      if (!medicationReview || !medicationReview.onStatin)
        recs.push('Discussion of statin therapy for cardiovascular risk reduction — patient is not currently taking a statin.');
      recs.push('Lifestyle counselling focused on diet, physical activity, and smoking cessation where applicable.');
    }
  }
  if (!knownCVD && sbp !== null && sbp >= 140)
    recs.push(`Blood pressure review recommended — a systolic BP of ${sbp} mmHg was recorded at screening. A reading of 140 mmHg or above warrants clinical assessment and management.`);
  return recs;
}

function ReferralLetter({ findriscScore, framinghamResult, knownDiabetic, diabetesControl, knownCVD, cvdMeds, medicationReview, pharmacyName: pharmacyNameProp, pharmacistName: pharmacistNameProp, onBack }) {
  const framinghamRisk = !knownCVD && framinghamResult ? framinghamResult.risk      : null;
  const estimated      = !knownCVD && framinghamResult ? framinghamResult.estimated : false;
  const sbp            = !knownCVD && framinghamResult ? framinghamResult.sbp       : null;
  const bpTreated      = !knownCVD && framinghamResult ? framinghamResult.bpTreated : null;
  const findriscInfo   = !knownDiabetic && findriscScore !== null ? getRiskInfo(findriscScore) : null;
  const cardioInfo     = framinghamRisk !== null ? getCardioRiskInfo(framinghamRisk) : null;
  const careGaps       = knownDiabetic && diabetesControl ? getDiabetesCareGaps(diabetesControl) : null;
  const recs           = getLetterRecommendations({ findriscScore, framinghamRisk, estimated, sbp, bpTreated, knownDiabetic, diabetesControl, knownCVD, cvdMeds, medicationReview });

  const [pharmacyName,    setPharmacyName]    = useState(pharmacyNameProp   || '');
  const [pharmacistName,  setPharmacistName]  = useState(pharmacistNameProp || '');
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

            {/* Diabetes section */}
            <div style={{ marginBottom: '24px' }}>
              {knownDiabetic && careGaps !== null ? (
                <>
                  <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Diabetes — Care Gap Assessment
                  </p>
                  <div style={{ borderLeft: '3px solid #475569', paddingLeft: '16px' }}>
                    <p style={{ margin: '0 0 10px', fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>
                      This patient has a confirmed diagnosis of diabetes. A care gap assessment was conducted covering HbA1c status, last clinical review, current medication, and known complications.
                      {diabetesControl.hba1cDisplay && <> The patient's most recent HbA1c was recorded as <strong>{diabetesControl.hba1cDisplay}</strong>{diabetesControl.hba1cPct !== null && ` — ${getHba1cLabel(diabetesControl.hba1cPct)}`}.</>}
                      {careGaps.length === 0 && ' No care gaps were identified.'}
                    </p>
                    {careGaps.length > 0 && (
                      <p style={{ margin: 0, fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>
                        <strong>{careGaps.length} care gap{careGaps.length > 1 ? 's' : ''} identified:</strong> {careGaps.map(g => g.title).join('; ')}.
                      </p>
                    )}
                  </div>
                </>
              ) : findriscInfo && findriscScore !== null && (
                <>
                  <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', fontWeight: 700, color: findriscInfo.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Diabetes Risk — FINDRISC Score: {findriscScore}/26
                  </p>
                  <div style={{ borderLeft: `3px solid ${findriscInfo.color}`, paddingLeft: '16px' }}>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>
                      The Finnish Diabetes Risk Score (FINDRISC) was calculated as <strong>{findriscScore} out of 26</strong>, placing this patient in the <strong>{findriscInfo.level}</strong> category. This corresponds to an estimated <strong>{findriscInfo.probability}</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* CVD section */}
            <div style={{ marginBottom: '28px' }}>
              {knownCVD && cvdMeds ? (() => {
                const cvdResult  = getCVDCareGaps(cvdMeds);
                const accentColor = cvdResult.urgent ? '#b91c1c' : cvdResult.gaps.length > 0 ? '#c2410c' : '#15803d';
                const heading     = cvdResult.urgent ? 'Cardiovascular — Known Heart Disease (Urgent)'
                  : cvdResult.gaps.length > 0 ? 'Cardiovascular — Known Heart Disease (Care Gaps Identified)'
                  : 'Cardiovascular — Known Heart Disease (Well Managed)';
                return (
                  <>
                    <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', fontWeight: 700, color: accentColor, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {heading}
                    </p>
                    <div style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: '16px' }}>
                      <p style={{ margin: 0, fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>
                        {cvdResult.urgent
                          ? 'This patient has a known history of cardiovascular disease and has reported new or worsening symptoms including chest pain, breathlessness, or palpitations. Urgent clinical assessment is required.'
                          : cvdResult.gaps.length === 0
                            ? 'This patient has a known history of cardiovascular disease. A care gap assessment was conducted and no gaps were identified — the patient is on all key secondary prevention medications and review is up to date.'
                            : `This patient has a known history of cardiovascular disease. A care gap assessment identified ${cvdResult.gaps.length} gap${cvdResult.gaps.length > 1 ? 's' : ''}: ${cvdResult.gaps.map(g => g.title).join('; ')}.`
                        }
                      </p>
                    </div>
                  </>
                );
              })() : cardioInfo && framinghamRisk !== null && (
                <>
                  <p style={{ margin: '0 0 10px', fontSize: '0.8125rem', fontWeight: 700, color: cardioInfo.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Cardiovascular Risk — Framingham Risk Score: {framinghamRisk}%
                  </p>
                  <div style={{ borderLeft: `3px solid ${cardioInfo.color}`, paddingLeft: '16px' }}>
                    <p style={{ margin: 0, fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8 }}>
                      Using the Framingham Risk Score (D'Agostino <em>et al.</em>, 2008), this patient's estimated 10-year risk of a major cardiovascular event is <strong>{framinghamRisk}%</strong>, placing them in the <strong>{cardioInfo.level}</strong> category.{estimated && <> <em>Note: cholesterol values were unavailable at the time of screening; population average values were applied in this calculation.</em></>}
                    </p>
                    {estimated && medicationReview && medicationReview.onStatin && (
                      <p style={{ margin: '12px 0 0', fontSize: '0.9375rem', color: '#1e293b', lineHeight: 1.8, fontStyle: 'italic' }}>
                        Note: The Framingham score was calculated using population average cholesterol values as individual results were unavailable. The patient is currently on statin therapy — actual cardiovascular risk may be lower than estimated.
                      </p>
                    )}
                  </div>
                </>
              )}
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
              {!knownCVD && framinghamRisk !== null && <> Cardiovascular risk was estimated using the Framingham General CVD Risk Score (D'Agostino <em>et al.</em>, 2008). This tool has not been specifically validated for UAE or Gulf Arab populations. Results should be interpreted in the context of a full clinical assessment by a qualified healthcare professional.</>}
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

// ─── Pre-screen (known diabetic?) ────────────────────────────────────────────

function PreScreen({ onBack, onKnownDiabetic, onNotDiabetic }) {
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="Pre-Screening Check" onBack={onBack} />
      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'48px 24px' }}>
        <div style={{ backgroundColor:'#ffffff', borderRadius:'20px', padding:'36px 32px', boxShadow:'0 4px 24px rgba(15,23,42,0.08)', border:'1px solid #e2e8f0' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'48px', height:'48px', borderRadius:'14px', backgroundColor:'#eff6ff', marginBottom:'20px' }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill={BLUE}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
          </div>
          <h2 style={{ margin:'0 0 10px', fontSize:'1.375rem', fontWeight:800, color:'#0f172a' }}>Pre-Screening Check</h2>
          <p style={{ margin:'0 0 28px', fontSize:'1rem', fontWeight:600, color:'#334155', lineHeight:1.6 }}>Has this patient been diagnosed with diabetes?</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <button onClick={onKnownDiabetic} style={{ width:'100%', padding:'16px 24px', border:'2px solid #e2e8f0', borderRadius:'12px', backgroundColor:'#ffffff', color:'#334155', fontSize:'1rem', fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:font }}
              onMouseOver={e => { e.currentTarget.style.borderColor=BLUE; e.currentTarget.style.backgroundColor='#eff6ff'; e.currentTarget.style.color=BLUE; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.backgroundColor='#ffffff'; e.currentTarget.style.color='#334155'; }}>
              Yes — this patient has diabetes
            </button>
            <button onClick={onNotDiabetic} style={{ width:'100%', padding:'16px 24px', border:'2px solid #e2e8f0', borderRadius:'12px', backgroundColor:'#ffffff', color:'#334155', fontSize:'1rem', fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:font }}
              onMouseOver={e => { e.currentTarget.style.borderColor='#16a34a'; e.currentTarget.style.backgroundColor='#f0fdf4'; e.currentTarget.style.color='#15803d'; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.backgroundColor='#ffffff'; e.currentTarget.style.color='#334155'; }}>
              No — screening for diabetes risk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Diabetes care gap identifier ────────────────────────────────────────────

function DiabetesControlScreen({ onBack, onResult }) {
  const [hba1cKnown,    setHba1cKnown]    = useState(null);
  const [hba1cRaw,      setHba1cRaw]      = useState('');
  const [hba1cUnit,     setHba1cUnit]     = useState('pct');
  const [lastSeen,      setLastSeen]      = useState(null);
  const [medication,    setMedication]    = useState(null);
  const [complications, setComplications] = useState(null);
  const [calcHov,       setCalcHov]       = useState(false);

  const hba1cN   = hba1cRaw ? parseFloat(hba1cRaw) : null;
  const hba1cPct = hba1cN !== null ? (hba1cUnit === 'mmol' ? hba1cN / 10.929 + 2.15 : hba1cN) : null;
  const hba1cErr = hba1cRaw && hba1cN !== null
    ? ((hba1cUnit === 'mmol' ? (hba1cN < 20 || hba1cN > 220) : (hba1cN < 4 || hba1cN > 20))
      ? (hba1cUnit === 'mmol' ? 'Enter a value between 20 and 220 mmol/mol' : 'Enter a value between 4 and 20%')
      : null)
    : null;

  const hba1cAnswered = hba1cKnown === false || (hba1cKnown === true && hba1cRaw !== '' && !hba1cErr);
  const hba1cDisplay  = hba1cKnown && hba1cRaw ? `${hba1cRaw} ${hba1cUnit === 'mmol' ? 'mmol/mol' : '%'}` : null;
  const answeredCount = [hba1cAnswered, lastSeen !== null, medication !== null, complications !== null].filter(Boolean).length;
  const canContinue   = answeredCount === 4;

  const mkRadio = (opts, val, setter) => (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      {opts.map(opt => (
        <button key={opt.value} onClick={() => setter(opt.value)}
          style={{ width:'100%', padding:'12px 16px', border:`2px solid ${val === opt.value ? BLUE : '#e2e8f0'}`, borderRadius:'10px', backgroundColor: val === opt.value ? '#eff6ff' : '#ffffff', color: val === opt.value ? BLUE : '#334155', fontWeight: val === opt.value ? 600 : 400, fontSize:'0.9375rem', cursor:'pointer', textAlign:'left', fontFamily:font, transition:'border-color 120ms ease, background-color 120ms ease' }}>
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="Care Gap Identifier" onBack={onBack} />
      <ProgressBar pct={Math.round(answeredCount / 4 * 100)} />
      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'32px 24px 48px' }}>
        <div style={{ marginBottom:'28px' }}>
          <h2 style={{ margin:'0 0 6px', fontSize:'1.5rem', fontWeight:800, color:'#0f172a' }}>Diabetes Care Gap Identifier</h2>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#64748b' }}>Four quick questions — {answeredCount} of 4 answered</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

          {/* Q1 — HbA1c */}
          <FormCard number={1} label="Does this patient know their most recent HbA1c result?" answered={hba1cAnswered}>
            <BinarySelector value={hba1cKnown} onChange={v => { setHba1cKnown(v); if (!v) setHba1cRaw(''); }} options={[{ value:true, label:'Yes' }, { value:false, label:'No / not sure' }]} />
            {hba1cKnown === true && (
              <div style={{ marginTop:'14px', padding:'16px', backgroundColor:'#f8fafc', borderRadius:'10px', border:'1px solid #e2e8f0' }}>
                <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
                  {[{ v:'pct', label:'% (NGSP)' }, { v:'mmol', label:'mmol/mol (IFCC)' }].map(u => (
                    <button key={u.v} onClick={() => { setHba1cUnit(u.v); setHba1cRaw(''); }}
                      style={{ padding:'6px 14px', border:`2px solid ${hba1cUnit === u.v ? BLUE : '#e2e8f0'}`, borderRadius:'8px', backgroundColor: hba1cUnit === u.v ? '#eff6ff' : '#fff', color: hba1cUnit === u.v ? BLUE : '#64748b', fontWeight: hba1cUnit === u.v ? 700 : 400, fontSize:'0.82rem', cursor:'pointer', fontFamily:font }}>
                      {u.label}
                    </button>
                  ))}
                </div>
                <StyledNumberInput value={hba1cRaw} onChange={setHba1cRaw}
                  placeholder={hba1cUnit === 'pct' ? 'e.g. 7.2' : 'e.g. 55'}
                  unit={hba1cUnit === 'pct' ? '%' : 'mmol/mol'}
                  min={hba1cUnit === 'pct' ? 4 : 20} max={hba1cUnit === 'pct' ? 20 : 220} />
                <FieldError msg={hba1cErr} />
                {hba1cPct !== null && !hba1cErr && (() => {
                  const lbl = getHba1cLabel(hba1cPct);
                  const color = lbl === 'Significantly above target — urgent review recommended' ? '#b91c1c'
                    : lbl === 'Above target — review recommended' ? '#c2410c'
                    : lbl === 'Borderline' ? '#b45309'
                    : '#15803d';
                  return <p style={{ margin:'8px 0 0', fontSize:'0.78rem', fontWeight:600, color }}>{lbl}</p>;
                })()}
              </div>
            )}
            {hba1cKnown === false && (
              <p style={{ margin:'10px 0 0', fontSize:'0.78rem', color:'#94a3b8', lineHeight:1.5 }}>This will be noted as a care gap — knowing HbA1c is important for monitoring diabetes control.</p>
            )}
          </FormCard>

          {/* Q2 — Last seen */}
          <FormCard number={2} label="When did this patient last see a doctor or diabetes nurse?" answered={lastSeen !== null}>
            {mkRadio([
              { value:'under6mo', label:'Within the last 6 months' },
              { value:'6to12mo',  label:'6–12 months ago' },
              { value:'over12mo', label:'More than 12 months ago' },
            ], lastSeen, setLastSeen)}
          </FormCard>

          {/* Q3 — Medication */}
          <FormCard number={3} label="Is this patient currently on diabetes medication?" answered={medication !== null}>
            {mkRadio([
              { value:'tablets', label:'Yes — tablets (e.g. metformin, glipizide)' },
              { value:'insulin', label:'Yes — insulin' },
              { value:'both',    label:'Yes — both tablets and insulin' },
              { value:'none',    label:'No — not currently on medication' },
            ], medication, setMedication)}
            {medication === 'none' && (
              <p style={{ margin:'10px 0 0', fontSize:'0.78rem', color:'#94a3b8', lineHeight:1.5 }}>Diet-controlled diabetes may be appropriate. This will be flagged for GP review.</p>
            )}
          </FormCard>

          {/* Q4 — Complications */}
          <FormCard number={4} label="Any known diabetes complications?" hint="e.g. eye, kidney, nerve, or foot problems" answered={complications !== null}>
            <BinarySelector value={complications} onChange={setComplications} options={[{ value:false, label:'No' }, { value:true, label:'Yes' }]} />
          </FormCard>

        </div>

        <div style={{ marginTop:'32px' }}>
          {!canContinue && <p style={{ textAlign:'center', fontSize:'0.82rem', color:'#94a3b8', marginBottom:'12px' }}>Answer all 4 questions to continue</p>}
          <button onClick={canContinue ? () => onResult({ hba1cKnown, hba1cPct, hba1cDisplay, lastSeen, medication, complications }) : undefined}
            onMouseOver={() => canContinue && setCalcHov(true)} onMouseOut={() => setCalcHov(false)} disabled={!canContinue}
            style={{ width:'100%', padding:'18px 24px', border:'none', borderRadius:'12px', backgroundColor: canContinue ? (calcHov ? '#15803d' : '#16a34a') : '#e2e8f0', color: canContinue ? '#ffffff' : '#94a3b8', fontSize:'1.0625rem', fontWeight:700, cursor: canContinue ? 'pointer' : 'not-allowed', boxShadow: canContinue ? '0 4px 16px rgba(22,163,74,0.35)' : 'none', fontFamily:font }}>
            View Care Gap Summary →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Diabetes care gap summary ────────────────────────────────────────────────

function DiabetesControlResult({ diabetesControl, onBack, onContinue }) {
  const gaps = getDiabetesCareGaps(diabetesControl);
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="Care Gap Identifier" onBack={onBack} />
      <div style={{ maxWidth:'620px', margin:'0 auto', padding:'40px 24px 64px' }}>
        <div style={{ marginBottom:'28px' }}>
          <h2 style={{ margin:'0 0 6px', fontSize:'1.5rem', fontWeight:800, color:'#0f172a' }}>Care Gap Summary</h2>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#64748b' }}>
            {gaps.length === 0 ? 'No care gaps identified' : `${gaps.length} care gap${gaps.length > 1 ? 's' : ''} identified`}
          </p>
        </div>

        {gaps.length === 0 ? (
          <div style={{ backgroundColor:'#f0fdf4', border:'1px solid #86efac', borderRadius:'16px', padding:'24px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'14px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'32px', height:'32px', borderRadius:'8px', backgroundColor:'#16a34a', flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="white"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
            </div>
            <div>
              <p style={{ margin:'0 0 2px', fontSize:'1rem', fontWeight:700, color:'#15803d' }}>No care gaps identified</p>
              <p style={{ margin:0, fontSize:'0.875rem', color:'#166534', lineHeight:1.5 }}>This patient's diabetes management appears to be on track. Encourage continued adherence and annual GP review.</p>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'20px' }}>
            {gaps.map((gap, i) => (
              <div key={i} style={{ backgroundColor:'#ffffff', borderRadius:'14px', padding:'18px 20px', border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,23,42,0.04)' }}>
                <div style={{ display:'flex', gap:'10px', alignItems:'flex-start', marginBottom:'10px' }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="#c2410c" style={{ flexShrink:0, marginTop:'2px' }}>
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                  </svg>
                  <p style={{ margin:0, fontSize:'0.9375rem', fontWeight:700, color:'#0f172a' }}>{gap.title}</p>
                </div>
                <div style={{ paddingLeft:'26px' }}>
                  <p style={{ margin:'0 0 4px', fontSize:'0.72rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em', textTransform:'uppercase' }}>Recommendation</p>
                  <p style={{ margin:0, fontSize:'0.875rem', color:'#334155', lineHeight:1.65 }}>{gap.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {diabetesControl.hba1cDisplay && (
          <div style={{ backgroundColor:'#f8fafc', borderRadius:'10px', padding:'12px 16px', border:'1px solid #e2e8f0', marginBottom:'20px' }}>
            <p style={{ margin:0, fontSize:'0.82rem', color:'#64748b' }}>
              HbA1c recorded: <strong style={{ color:'#0f172a' }}>{diabetesControl.hba1cDisplay}</strong>
              {diabetesControl.hba1cPct !== null && <> · <span style={{ color:'#475569' }}>{getHba1cLabel(diabetesControl.hba1cPct)}</span></>}
            </p>
          </div>
        )}

        <ContinueButton onClick={onContinue}>Continue to Heart Risk Assessment →</ContinueButton>
        <p style={{ textAlign:'center', marginTop:'16px', fontSize:'0.78rem', color:'#94a3b8' }}>Next: Cardiovascular Risk Assessment</p>
      </div>
    </div>
  );
}

// ─── Framingham pre-screen (known CVD?) ───────────────────────────────────────

function FraminghamPreScreen({ onBack, onKnownCVD, onNoCVD }) {
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="Cardiovascular Pre-Screening" onBack={onBack} />
      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'48px 24px' }}>
        <div style={{ backgroundColor:'#ffffff', borderRadius:'20px', padding:'36px 32px', boxShadow:'0 4px 24px rgba(15,23,42,0.08)', border:'1px solid #e2e8f0' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'48px', height:'48px', borderRadius:'14px', backgroundColor:'#fee2e2', marginBottom:'20px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#b91c1c"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
          </div>
          <h2 style={{ margin:'0 0 10px', fontSize:'1.375rem', fontWeight:800, color:'#0f172a' }}>Heart Disease Check</h2>
          <p style={{ margin:'0 0 28px', fontSize:'1rem', fontWeight:600, color:'#334155', lineHeight:1.6 }}>Has this patient had a previous heart attack or been diagnosed with heart disease?</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <button onClick={onKnownCVD} style={{ width:'100%', padding:'16px 24px', border:'2px solid #e2e8f0', borderRadius:'12px', backgroundColor:'#ffffff', color:'#334155', fontSize:'1rem', fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:font }}
              onMouseOver={e => { e.currentTarget.style.borderColor='#b91c1c'; e.currentTarget.style.backgroundColor='#fff1f2'; e.currentTarget.style.color='#b91c1c'; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.backgroundColor='#ffffff'; e.currentTarget.style.color='#334155'; }}>
              Yes — known heart disease or previous heart attack
            </button>
            <button onClick={onNoCVD} style={{ width:'100%', padding:'16px 24px', border:'2px solid #e2e8f0', borderRadius:'12px', backgroundColor:'#ffffff', color:'#334155', fontSize:'1rem', fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:font }}
              onMouseOver={e => { e.currentTarget.style.borderColor='#16a34a'; e.currentTarget.style.backgroundColor='#f0fdf4'; e.currentTarget.style.color='#15803d'; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.backgroundColor='#ffffff'; e.currentTarget.style.color='#334155'; }}>
              No — assess cardiovascular risk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Known CVD medication review ─────────────────────────────────────────────

function CVDCareGapScreen({ onBack, onContinue }) {
  const [lastSeen,  setLastSeen]  = useState(null);
  const [aspirin,   setAspirin]   = useState(null);
  const [statin,    setStatin]    = useState(null);
  const [bpMeds,    setBpMeds]    = useState(null);
  const [symptoms,  setSymptoms]  = useState(null);
  const [contHov,   setContHov]   = useState(false);

  const canContinue = lastSeen !== null && aspirin !== null && statin !== null && bpMeds !== null && symptoms !== null;
  const cvdResult   = canContinue ? getCVDCareGaps({ lastSeen, aspirin, statin, bpMeds, symptoms }) : null;

  const lastSeenOpts = [
    { value: 'within6mo', label: 'Within the last 6 months' },
    { value: '6to12mo',   label: '6 to 12 months ago'       },
    { value: 'over12mo',  label: 'More than 12 months ago'  },
  ];

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="Known Cardiovascular Disease" onBack={onBack} />
      <div style={{ maxWidth:'620px', margin:'0 auto', padding:'32px 24px 48px' }}>

        <div style={{ marginBottom:'24px' }}>
          <h2 style={{ margin:'0 0 6px', fontSize:'1.375rem', fontWeight:800, color:'#0f172a' }}>CVD Care Gap Identifier</h2>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#64748b' }}>Five quick questions to assess current cardiovascular management</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginBottom:'24px' }}>

          {/* Q1 — Last review */}
          <FormCard number={1} label="When did you last see your cardiologist or GP for your heart condition?" answered={lastSeen !== null}>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {lastSeenOpts.map(o => (
                <button key={o.value} onClick={() => setLastSeen(o.value)}
                  style={{ padding:'10px 16px', border:`2px solid ${lastSeen === o.value ? BLUE : '#e2e8f0'}`, borderRadius:'10px', backgroundColor: lastSeen === o.value ? '#eff6ff' : '#fff', color: lastSeen === o.value ? BLUE : '#334155', fontWeight: lastSeen === o.value ? 700 : 500, fontSize:'0.9rem', cursor:'pointer', textAlign:'left', fontFamily:font }}>
                  {o.label}
                </button>
              ))}
            </div>
          </FormCard>

          {/* Q2 — Aspirin */}
          <FormCard number={2} label="Are you currently on aspirin or a blood thinner?" hint="e.g. aspirin, clopidogrel, warfarin, rivaroxaban" answered={aspirin !== null}>
            <BinarySelector value={aspirin} onChange={setAspirin} options={[{ value:true, label:'Yes' }, { value:false, label:'No' }]} />
          </FormCard>

          {/* Q3 — Statin */}
          <FormCard number={3} label="Are you currently on a statin?" hint="e.g. atorvastatin, rosuvastatin, simvastatin" answered={statin !== null}>
            <BinarySelector value={statin} onChange={setStatin} options={[{ value:true, label:'Yes' }, { value:false, label:'No' }]} />
          </FormCard>

          {/* Q4 — BP meds */}
          <FormCard number={4} label="Are you currently on a blood pressure medication?" answered={bpMeds !== null}>
            <BinarySelector value={bpMeds} onChange={setBpMeds} options={[{ value:true, label:'Yes' }, { value:false, label:'No' }]} />
          </FormCard>

          {/* Q5 — Symptoms */}
          <FormCard number={5} label="Do you have any new or worsening symptoms?" hint="such as chest pain, breathlessness, or palpitations" answered={symptoms !== null}>
            <BinarySelector value={symptoms} onChange={setSymptoms} options={[{ value:true, label:'Yes' }, { value:false, label:'No' }]} />
          </FormCard>
        </div>

        {/* Outcome preview */}
        {cvdResult && (
          cvdResult.urgent ? (
            <div style={{ display:'flex', gap:'12px', alignItems:'flex-start', backgroundColor:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'14px', padding:'18px 20px', marginBottom:'24px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'30px', height:'30px', borderRadius:'8px', backgroundColor:'#dc2626', flexShrink:0 }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="white"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
              </div>
              <div>
                <p style={{ margin:'0 0 4px', fontSize:'0.9375rem', fontWeight:700, color:'#b91c1c' }}>Urgent Referral Required</p>
                <p style={{ margin:0, fontSize:'0.875rem', color:'#7f1d1d', lineHeight:1.6 }}>New or worsening cardiovascular symptoms have been reported. This patient requires prompt physician assessment.</p>
              </div>
            </div>
          ) : cvdResult.gaps.length === 0 ? (
            <div style={{ display:'flex', gap:'12px', alignItems:'flex-start', backgroundColor:'#f0fdf4', border:'1px solid #86efac', borderRadius:'14px', padding:'18px 20px', marginBottom:'24px' }}>
              <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'30px', height:'30px', borderRadius:'8px', backgroundColor:'#16a34a', flexShrink:0 }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="white"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              </div>
              <div>
                <p style={{ margin:'0 0 4px', fontSize:'0.9375rem', fontWeight:700, color:'#15803d' }}>No Referral Required</p>
                <p style={{ margin:0, fontSize:'0.875rem', color:'#166534', lineHeight:1.6 }}>Cardiovascular management appears well maintained. Encourage continued adherence and regular follow-up.</p>
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor:'#fff7ed', border:'1px solid #fdba74', borderRadius:'14px', padding:'18px 20px', marginBottom:'24px' }}>
              <p style={{ margin:'0 0 12px', fontSize:'0.9375rem', fontWeight:700, color:'#c2410c' }}>Referral Recommended — {cvdResult.gaps.length} care gap{cvdResult.gaps.length > 1 ? 's' : ''} identified</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {cvdResult.gaps.map((g, i) => (
                  <div key={i} style={{ display:'flex', gap:'8px', alignItems:'flex-start' }}>
                    <div style={{ width:'5px', height:'5px', borderRadius:'50%', backgroundColor:'#c2410c', flexShrink:0, marginTop:'7px' }} />
                    <p style={{ margin:0, fontSize:'0.875rem', color:'#7c2d12', lineHeight:1.6 }}>{g.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {!canContinue && <p style={{ textAlign:'center', fontSize:'0.82rem', color:'#94a3b8', marginBottom:'12px' }}>Answer all five questions to continue</p>}
        <button onClick={canContinue ? () => onContinue({ lastSeen, aspirin, statin, bpMeds, symptoms }) : undefined}
          onMouseOver={() => canContinue && setContHov(true)} onMouseOut={() => setContHov(false)} disabled={!canContinue}
          style={{ width:'100%', padding:'18px 24px', border:'none', borderRadius:'12px', backgroundColor: canContinue ? (contHov ? '#1558a8' : BLUE) : '#e2e8f0', color: canContinue ? '#ffffff' : '#94a3b8', fontSize:'1.0625rem', fontWeight:700, cursor: canContinue ? 'pointer' : 'not-allowed', boxShadow: canContinue ? '0 4px 16px rgba(29,111,206,0.3)' : 'none', fontFamily:font }}>
          Continue to Summary →
        </button>
      </div>
    </div>
  );
}

// ─── Medication review (post-Framingham, risk ≥ 10%) ─────────────────────────

function MedicationReviewScreen({ framinghamRisk, onBack, onContinue }) {
  const [onStatin, setOnStatin] = useState(null);
  const [contHov,  setContHov]  = useState(false);

  const canContinue = onStatin !== null;

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:font, color:'#1e293b' }}>
      <PageHeader subtitle="Medication Review" onBack={onBack} />
      <div style={{ maxWidth:'620px', margin:'0 auto', padding:'32px 24px 48px' }}>

        <div style={{ backgroundColor:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'14px', padding:'16px 20px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill={BLUE} style={{ flexShrink:0 }}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
          <p style={{ margin:0, fontSize:'0.875rem', color:BLUE, lineHeight:1.5 }}>
            10-year cardiovascular risk of <strong>{framinghamRisk}%</strong> — checking current medications before generating the referral helps personalise the recommendations.
          </p>
        </div>

        <div style={{ marginBottom:'24px' }}>
          <h2 style={{ margin:'0 0 6px', fontSize:'1.375rem', fontWeight:800, color:'#0f172a' }}>Current Medication Check</h2>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#64748b' }}>One quick question before generating the referral</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginBottom:'28px' }}>
          <FormCard number={1} label="Is this patient currently taking a statin?" hint="e.g. atorvastatin, rosuvastatin, simvastatin" answered={onStatin !== null}>
            <BinarySelector value={onStatin} onChange={setOnStatin} options={[{ value:true, label:'Yes' }, { value:false, label:'No' }]} />
          </FormCard>
        </div>

        {!canContinue && <p style={{ textAlign:'center', fontSize:'0.82rem', color:'#94a3b8', marginBottom:'12px' }}>Answer the question to continue</p>}
        <button onClick={canContinue ? () => onContinue({ onStatin }) : undefined}
          onMouseOver={() => canContinue && setContHov(true)} onMouseOut={() => setContHov(false)} disabled={!canContinue}
          style={{ width:'100%', padding:'18px 24px', border:'none', borderRadius:'12px', backgroundColor: canContinue ? (contHov ? '#1558a8' : BLUE) : '#e2e8f0', color: canContinue ? '#ffffff' : '#94a3b8', fontSize:'1.0625rem', fontWeight:700, cursor: canContinue ? 'pointer' : 'not-allowed', boxShadow: canContinue ? '0 4px 16px rgba(29,111,206,0.3)' : 'none', fontFamily:font }}>
          Continue to Summary →
        </button>
      </div>
    </div>
  );
}

// ─── App router ───────────────────────────────────────────────────────────────

function App() {
  const [screen,            setScreen]            = useState('setup');
  const [pharmacyName,      setPharmacyName]      = useState('');
  const [pharmacistName,    setPharmacistName]    = useState('');
  const [patientId,         setPatientId]         = useState(() => generateId());
  const [findriscScore,     setFindriscScore]      = useState(null);
  const [framinghamResult,  setFraminghamResult]   = useState(null);
  const [knownDiabetic,     setKnownDiabetic]      = useState(false);
  const [diabetesControl,   setDiabetesControl]    = useState(null);
  const [knownCVD,          setKnownCVD]           = useState(false);
  const [cvdMeds,           setCvdMeds]            = useState(null);
  const [medicationReview,  setMedicationReview]   = useState(null);

  const resetAll = () => {
    setFindriscScore(null); setFraminghamResult(null);
    setKnownDiabetic(false); setDiabetesControl(null);
    setKnownCVD(false); setCvdMeds(null);
    setMedicationReview(null);
    setPatientId(generateId());
    setScreen('home');
  };

  const sharedResultsProps = { findriscScore, framinghamResult, knownDiabetic, diabetesControl, knownCVD, cvdMeds, medicationReview };

  switch (screen) {
    case 'pre-screen':
      return (
        <PreScreen
          onBack={() => setScreen('home')}
          onKnownDiabetic={() => { setKnownDiabetic(true); setScreen('diabetes-control'); }}
          onNotDiabetic={() => { setKnownDiabetic(false); setScreen('findrisc'); }}
        />
      );

    case 'findrisc':
      return <FindriscForm onBack={() => setScreen('pre-screen')} onResult={s => { setFindriscScore(s); setScreen('findrisc-result'); }} />;

    case 'findrisc-result':
      return <FindriscResult score={findriscScore} onBack={() => setScreen('findrisc')} onContinue={() => setScreen('framingham-pre')} />;

    case 'diabetes-control':
      return <DiabetesControlScreen onBack={() => setScreen('pre-screen')} onResult={d => { setDiabetesControl(d); setScreen('diabetes-control-result'); }} />;

    case 'diabetes-control-result':
      return <DiabetesControlResult diabetesControl={diabetesControl} onBack={() => setScreen('diabetes-control')} onContinue={() => setScreen('framingham-pre')} />;

    case 'framingham-pre':
      return (
        <FraminghamPreScreen
          onBack={() => setScreen(knownDiabetic ? 'diabetes-control-result' : 'findrisc-result')}
          onKnownCVD={() => { setKnownCVD(true); setScreen('known-cvd-meds'); }}
          onNoCVD={() => { setKnownCVD(false); setScreen('framingham'); }}
        />
      );

    case 'known-cvd-meds':
      return <CVDCareGapScreen onBack={() => setScreen('framingham-pre')} onContinue={m => { setCvdMeds(m); setScreen('results'); }} />;

    case 'framingham':
      return <FraminghamForm findriscScore={findriscScore} onBack={() => setScreen('framingham-pre')} onResult={r => { setFraminghamResult(r); setScreen('framingham-result'); }} />;

    case 'framingham-result':
      return <FraminghamResult result={framinghamResult} knownDiabetic={knownDiabetic} onBack={() => setScreen('framingham')} onContinue={() => setScreen(framinghamResult.risk >= 10 ? 'medication-review' : 'results')} />;

    case 'medication-review':
      return <MedicationReviewScreen framinghamRisk={framinghamResult.risk} onBack={() => setScreen('framingham-result')} onContinue={m => { setMedicationReview(m); setScreen('results'); }} />;

    case 'results':
      return (
        <ResultsSummary
          {...sharedResultsProps}
          patientId={patientId}
          onStartNew={resetAll}
          onGenerateReferral={() => setScreen('referral')}
        />
      );

    case 'referral':
      return (
        <ReferralLetter
          {...sharedResultsProps}
          pharmacyName={pharmacyName}
          pharmacistName={pharmacistName}
          onBack={() => setScreen('results')}
        />
      );

    case 'setup':
      return (
        <PharmacySetupScreen
          onStart={({ pharmacyName: pn, pharmacistName: ph }) => {
            setPharmacyName(pn);
            setPharmacistName(ph);
            setScreen('home');
          }}
        />
      );

    default:
      return <HomeScreen onStart={() => setScreen('pre-screen')} />;
  }
}

export default function Root() {
  const path = window.location.pathname;
  if (path.startsWith('/patient/')) {
    const id = path.slice(9).split('/')[0];
    if (id) return <PatientPage id={id} />;
  }
  return <App />;
}
