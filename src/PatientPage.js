import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const FONT  = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const BLUE  = '#1d6fce';
const GREEN = '#00a651'; // Aster brand green

// ─── helpers ──────────────────────────────────────────────────────────────────

function findriscMeta(score) {
  if (score === null || score === undefined) return null;
  if (score < 7)  return { label:'Low Risk',            color:'#15803d', bg:'#f0fdf4', desc:'Your diabetes risk is low. Keeping a healthy lifestyle will help you stay that way.' };
  if (score < 12) return { label:'Slightly Elevated',   color:'#b45309', bg:'#fffbeb', desc:'You have a slightly elevated risk of developing Type 2 diabetes. Small lifestyle changes can make a real difference.' };
  if (score < 15) return { label:'Moderate Risk',       color:'#c2410c', bg:'#fff7ed', desc:'Your diabetes risk is moderate. Talking to a doctor about prevention is a good idea.' };
  if (score <= 20)return { label:'High Risk',           color:'#dc2626', bg:'#fef2f2', desc:'Your risk of developing Type 2 diabetes in the next 10 years is high. Please speak with a doctor.' };
  return           { label:'Very High Risk',            color:'#7f1d1d', bg:'#fef2f2', desc:'Your risk of developing Type 2 diabetes is very high. Please see a doctor as soon as possible.' };
}

function cvdMeta(risk) {
  if (risk === null || risk === undefined) return null;
  if (risk < 10)  return { label:'Low Risk',            color:'#15803d', bg:'#f0fdf4', desc:'Your 10-year cardiovascular risk is low. Maintaining a healthy lifestyle will help keep it that way.' };
  if (risk < 20)  return { label:'Intermediate Risk',   color:'#c2410c', bg:'#fff7ed', desc:'Your 10-year cardiovascular risk is intermediate. Your doctor can advise on steps to lower it.' };
  return           { label:'High Risk',                 color:'#dc2626', bg:'#fef2f2', desc:'Your 10-year cardiovascular risk is high. Prompt review by a doctor is important.' };
}

// ─── shared atoms ─────────────────────────────────────────────────────────────

function RiskPill({ label, color, bg }) {
  return (
    <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:'999px', backgroundColor:bg, color, fontSize:'0.78rem', fontWeight:700, letterSpacing:'0.01em' }}>
      {label}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ backgroundColor:'#fff', borderRadius:'16px', padding:'20px', marginBottom:'12px', boxShadow:'0 2px 10px rgba(15,23,42,0.06)', border:'1px solid #e2e8f0', ...style }}>
      {children}
    </div>
  );
}

function CardTitle({ emoji, title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
      <span style={{ fontSize:'1.375rem' }}>{emoji}</span>
      <p style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>{title}</p>
    </div>
  );
}

function Accordion({ title, emoji, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ backgroundColor:'#fff', borderRadius:'16px', marginBottom:'12px', overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,23,42,0.04)' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', padding:'18px 20px', background:'none', border:'none', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', textAlign:'left', fontFamily:FONT }}>
        <span style={{ fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>{emoji} {title}</span>
        <span style={{ fontSize:'0.9rem', color:'#94a3b8', display:'inline-block', transition:'transform 150ms ease', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {open && <div style={{ padding:'0 20px 20px', borderTop:'1px solid #f1f5f9' }}>{children}</div>}
    </div>
  );
}

function Divider() {
  return <div style={{ height:'1px', backgroundColor:'#f1f5f9', margin:'14px 0' }} />;
}

function Disclaimer() {
  return (
    <p style={{ margin:'16px 0 0', padding:'12px 14px', backgroundColor:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0', fontSize:'0.76rem', color:'#64748b', lineHeight:1.6, fontStyle:'italic' }}>
      This is general health education information. Always consult your doctor for personalised medical advice.
    </p>
  );
}

function TipList({ tips, color }) {
  return (
    <ul style={{ margin:0, padding:0, listStyle:'none' }}>
      {tips.map((t, i) => (
        <li key={i} style={{ display:'flex', gap:'8px', marginBottom:'8px', fontSize:'0.9rem', color:'#334155', lineHeight:1.65 }}>
          <span style={{ color: color || BLUE, flexShrink:0, marginTop:'1px' }}>•</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function SubHeading({ children }) {
  return <p style={{ margin:'14px 0 8px', fontSize:'0.875rem', fontWeight:700, color:'#0f172a' }}>{children}</p>;
}

function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display:'inline-flex', alignItems:'center', gap:'6px', marginTop:'14px', padding:'10px 16px', backgroundColor:'#eff6ff', borderRadius:'10px', border:'1px solid #bfdbfe', color:BLUE, fontSize:'0.875rem', fontWeight:600, textDecoration:'none' }}>
      ▶ {children}
    </a>
  );
}

// ─── Tab 1 — Results ──────────────────────────────────────────────────────────

function ResultsTab({ data }) {
  const fr  = findriscMeta(data.findrisc_score);
  const cv  = cvdMeta(data.cvd_risk);
  const bpHigh    = data.systolic_bp !== null && data.systolic_bp >= 140;
  const diabGaps  = Array.isArray(data.diabetes_gaps) ? data.diabetes_gaps : [];
  const cvdResult = data.cvd_result || null;

  return (
    <div style={{ padding:'20px 16px' }}>
      <p style={{ margin:'0 0 20px', fontSize:'0.82rem', color:'#94a3b8' }}>
        Screened {new Date(data.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
      </p>

      {/* FINDRISC */}
      {fr && (
        <Card>
          <CardTitle emoji="🩺" title="Diabetes Risk (FINDRISC)" />
          <div style={{ display:'flex', alignItems:'flex-start', gap:'14px' }}>
            <div style={{ minWidth:'52px', height:'52px', borderRadius:'14px', backgroundColor:fr.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'1.375rem', fontWeight:900, color:fr.color, lineHeight:1 }}>{data.findrisc_score}</span>
            </div>
            <div>
              <RiskPill label={fr.label} color={fr.color} bg={fr.bg} />
              <p style={{ margin:'8px 0 0', fontSize:'0.875rem', color:'#334155', lineHeight:1.65 }}>{fr.desc}</p>
            </div>
          </div>
        </Card>
      )}

      {/* CVD (non-CVD path) */}
      {cv && !data.known_cvd && (
        <Card>
          <CardTitle emoji="❤️" title="Heart Risk (10-year)" />
          <div style={{ display:'flex', alignItems:'flex-start', gap:'14px' }}>
            <div style={{ minWidth:'52px', height:'52px', borderRadius:'14px', backgroundColor:cv.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'1.125rem', fontWeight:900, color:cv.color, lineHeight:1 }}>{data.cvd_risk}%</span>
            </div>
            <div>
              <RiskPill label={cv.label} color={cv.color} bg={cv.bg} />
              <p style={{ margin:'8px 0 0', fontSize:'0.875rem', color:'#334155', lineHeight:1.65 }}>{cv.desc}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Known CVD */}
      {data.known_cvd && cvdResult && (
        <Card>
          <CardTitle emoji="❤️" title="Heart Condition" />
          {cvdResult.urgent ? (
            <div style={{ backgroundColor:'#fef2f2', borderRadius:'10px', padding:'12px 14px', border:'1px solid #fca5a5' }}>
              <p style={{ margin:0, fontSize:'0.875rem', color:'#b91c1c', fontWeight:700, lineHeight:1.6 }}>
                ⚠️ You reported new or worsening symptoms. Please see a doctor promptly.
              </p>
            </div>
          ) : cvdResult.gaps && cvdResult.gaps.length > 0 ? (
            <>
              <p style={{ margin:'0 0 10px', fontSize:'0.875rem', color:'#64748b' }}>
                {cvdResult.gaps.length} care gap{cvdResult.gaps.length > 1 ? 's' : ''} identified during your screening:
              </p>
              {cvdResult.gaps.map((g, i) => (
                <div key={i} style={{ backgroundColor:'#fff7ed', borderRadius:'10px', padding:'12px 14px', marginBottom:'8px', border:'1px solid #fdba74' }}>
                  <p style={{ margin:0, fontSize:'0.875rem', fontWeight:600, color:'#c2410c', lineHeight:1.6 }}>{g.title}</p>
                </div>
              ))}
            </>
          ) : (
            <p style={{ margin:0, fontSize:'0.875rem', color:'#15803d', lineHeight:1.65 }}>
              ✓ Your cardiovascular management appears well maintained — no gaps identified.
            </p>
          )}
        </Card>
      )}

      {/* BP alert */}
      {bpHigh && (
        <div style={{ backgroundColor:'#fefce8', border:'1px solid #fde047', borderRadius:'16px', padding:'18px 20px', marginBottom:'12px' }}>
          <p style={{ margin:'0 0 6px', fontSize:'1rem', fontWeight:700, color:'#713f12' }}>⚠️ Blood Pressure Alert</p>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#713f12', lineHeight:1.65 }}>
            Your blood pressure reading of <strong>{data.systolic_bp} mmHg</strong> is in the high range (140 mmHg or above). A review with your doctor is recommended.
          </p>
        </div>
      )}

      {/* Diabetes care gaps */}
      {data.known_diabetic && (
        <Card>
          <CardTitle emoji="🩸" title="Diabetes Management Check" />
          {diabGaps.length > 0 ? (
            <>
              <p style={{ margin:'0 0 10px', fontSize:'0.875rem', color:'#64748b' }}>
                {diabGaps.length} area{diabGaps.length > 1 ? 's' : ''} to discuss with your doctor:
              </p>
              {diabGaps.map((g, i) => (
                <div key={i} style={{ backgroundColor:'#fff7ed', borderRadius:'10px', padding:'12px 14px', marginBottom:'8px', border:'1px solid #fdba74' }}>
                  <p style={{ margin:'0 0 4px', fontSize:'0.875rem', fontWeight:700, color:'#c2410c' }}>{g.title}</p>
                  <p style={{ margin:0, fontSize:'0.8rem', color:'#7c2d12', lineHeight:1.6 }}>{g.recommendation}</p>
                </div>
              ))}
            </>
          ) : (
            <p style={{ margin:0, fontSize:'0.875rem', color:'#15803d', lineHeight:1.65 }}>
              ✓ No diabetes care gaps identified — well done on managing your condition.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Tab 2 — Learn ────────────────────────────────────────────────────────────

function LearnTab({ data }) {
  const showDiabetes = (data.findrisc_score !== null && data.findrisc_score >= 12) || !!data.known_diabetic;
  const showHeart    = (data.cvd_risk !== null && data.cvd_risk >= 10) || (data.systolic_bp !== null && data.systolic_bp >= 140) || !!data.known_cvd;
  const showHealthy  = !showDiabetes && !showHeart;

  return (
    <div style={{ padding:'20px 16px' }}>
      <p style={{ margin:'0 0 20px', fontSize:'0.9rem', color:'#64748b', lineHeight:1.65 }}>
        Learn about your results and what you can do to protect your health.
      </p>

      {showDiabetes && (
        <Accordion title="Understanding Your Diabetes Risk" emoji="🍎" defaultOpen={showDiabetes && !showHeart}>
          <p style={{ margin:'16px 0 12px', fontSize:'0.9rem', color:'#334155', lineHeight:1.75 }}>
            Type 2 diabetes develops when your body cannot use insulin properly. In the UAE, 64% of people with diabetes do not know they have it. A high FINDRISC score means you have several risk factors that increase your chance of developing Type 2 diabetes in the next 10 years. The good news is that lifestyle changes can reduce your risk significantly — research shows that losing 5–7% of body weight and increasing physical activity can reduce diabetes risk by up to 58%.
          </p>
          <Divider />
          <SubHeading>🥗 Simple food swaps that help:</SubHeading>
          <TipList color={BLUE} tips={[
            'Choose brown rice or quinoa instead of white rice',
            'Limit bread to 1–2 slices per day, choose wholegrain',
            'Limit dates to 2–3 per day',
            'Replace sugary drinks with water or unsweetened drinks',
            'Fill half your plate with vegetables at each meal',
            'Choose grilled or baked over fried',
          ]} />
          <SubHeading>🏃 Get moving:</SubHeading>
          <p style={{ margin:'0 0 4px', fontSize:'0.9rem', color:'#334155', lineHeight:1.75 }}>
            Aim for 150 minutes of moderate activity per week — that is 30 minutes, five days a week. Walking, swimming, and cycling all count.
          </p>
          <ExternalLink href="https://www.nhs.uk/live-well/exercise/exercise-videos/">Watch beginner workout videos</ExternalLink>
          <Disclaimer />
        </Accordion>
      )}

      {showHeart && (
        <Accordion title="Understanding Your Heart Health" emoji="❤️" defaultOpen={showHeart && !showDiabetes}>
          <p style={{ margin:'16px 0 12px', fontSize:'0.9rem', color:'#334155', lineHeight:1.75 }}>
            Cardiovascular disease affects the heart and blood vessels and is the leading cause of death in the UAE. High blood pressure is called the "silent killer" because it usually has no symptoms but damages your heart, arteries, kidneys, and brain over time. Your Framingham score estimates your chance of having a major cardiovascular event — heart attack or stroke — in the next 10 years.
          </p>
          <Divider />
          <SubHeading>🥑 Heart-healthy eating:</SubHeading>
          <TipList color="#dc2626" tips={[
            'Reduce salt — avoid adding salt at the table and choose low-sodium options',
            'Eat oily fish twice a week — salmon, sardines, mackerel',
            'Choose olive oil over other cooking oils',
            'Eat plenty of fruits, vegetables, and whole grains',
            'Limit red meat to once or twice a week',
            'Avoid processed and fast food',
          ]} />
          <SubHeading>🚶 Stay active:</SubHeading>
          <p style={{ margin:'0 0 4px', fontSize:'0.9rem', color:'#334155', lineHeight:1.75 }}>
            Regular cardiovascular exercise helps lower blood pressure and reduces heart disease risk. Aim for 30 minutes of brisk walking, swimming, or cycling most days.
          </p>
          <ExternalLink href="https://www.bhf.org.uk/informationsupport/support/healthy-living/staying-active">Heart-healthy exercise videos</ExternalLink>
          <Disclaimer />
        </Accordion>
      )}

      {showHealthy && (
        <Accordion title="Your Results Look Good — Here Is How To Stay That Way" emoji="✨" defaultOpen>
          <p style={{ margin:'16px 0 12px', fontSize:'0.9rem', color:'#334155', lineHeight:1.75 }}>
            Your results today suggest a lower risk of diabetes and cardiovascular disease. The best time to protect your health is before problems develop. Small consistent habits make a big difference over time.
          </p>
          <TipList color={BLUE} tips={[
            'Stay active with at least 150 minutes of moderate exercise per week',
            'Eat plenty of vegetables, fruits, and whole grains',
            'Maintain a healthy weight',
            'Do not smoke',
            'Get your blood pressure and blood sugar checked every 1–2 years',
          ]} />
          <ExternalLink href="https://www.who.int/news-room/fact-sheets/detail/healthy-diet">WHO healthy living guide</ExternalLink>
          <Disclaimer />
        </Accordion>
      )}
    </div>
  );
}

// ─── Tab 3 — Next Steps ───────────────────────────────────────────────────────

function TrackerSection({ id, originalSbp, originalHba1c }) {
  const [entries,  setEntries]  = useState([]);
  const [hba1c,    setHba1c]    = useState('');
  const [bp,       setBp]       = useState('');
  const [weight,   setWeight]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [flash,    setFlash]    = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('tracker_entries')
      .select('*').eq('patient_id', id)
      .order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setEntries(data); });
  }, [id]);

  const handleSave = async () => {
    if (!supabase || (!hba1c && !bp && !weight)) return;
    setSaving(true);
    const entry = {
      patient_id: id,
      hba1c:      hba1c  ? parseFloat(hba1c)     : null,
      systolic_bp: bp    ? parseInt(bp, 10)       : null,
      weight:     weight ? parseFloat(weight)     : null,
    };
    const { data: saved, error } = await supabase.from('tracker_entries').insert(entry).select().single();
    if (!error && saved) {
      setEntries(prev => [saved, ...prev]);
      setHba1c(''); setBp(''); setWeight('');
      setFlash(true);
      setTimeout(() => setFlash(false), 3000);
    }
    setSaving(false);
  };

  const hasInput = hba1c || bp || weight;
  const fieldStyle = { width:'100%', padding:'11px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'1rem', color:'#0f172a', fontFamily:FONT, boxSizing:'border-box', backgroundColor:'#fff' };
  const labelStyle = { display:'block', marginBottom:'5px', fontSize:'0.8125rem', fontWeight:600, color:'#374151' };

  return (
    <div style={{ backgroundColor:'#fff', borderRadius:'16px', padding:'20px', border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,23,42,0.04)' }}>
      <p style={{ margin:'0 0 4px', fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>📊 Track Your Progress</p>
      <p style={{ margin:'0 0 16px', fontSize:'0.78rem', color:'#94a3b8', lineHeight:1.6 }}>
        These values are stored anonymously and are not linked to your personal identity.
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'16px' }}>
        <div>
          <label style={labelStyle}>
            HbA1c (%)
            {originalHba1c && <span style={{ color:'#94a3b8', fontWeight:400 }}> — screening: {originalHba1c}</span>}
          </label>
          <input type="number" value={hba1c} onChange={e => setHba1c(e.target.value)} placeholder="e.g. 6.8" step="0.1" min="4" max="20" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>
            Blood Pressure — Systolic (mmHg)
            {originalSbp && <span style={{ color:'#94a3b8', fontWeight:400 }}> — screening: {originalSbp}</span>}
          </label>
          <input type="number" value={bp} onChange={e => setBp(e.target.value)} placeholder="e.g. 128" min="70" max="250" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Weight (kg)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 78" step="0.1" min="30" max="300" style={fieldStyle} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving || !hasInput}
        style={{ width:'100%', padding:'14px', border:'none', borderRadius:'12px', backgroundColor: flash ? '#15803d' : !hasInput ? '#e2e8f0' : BLUE, color: !hasInput ? '#94a3b8' : '#fff', fontSize:'0.9375rem', fontWeight:700, cursor: !hasInput ? 'not-allowed' : 'pointer', fontFamily:FONT, transition:'background-color 150ms' }}>
        {saving ? 'Saving…' : flash ? '✓ Saved!' : 'Save Entry'}
      </button>

      {entries.length > 0 && (
        <div style={{ marginTop:'20px' }}>
          <p style={{ margin:'0 0 10px', fontSize:'0.8125rem', fontWeight:700, color:'#0f172a' }}>Past entries</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {entries.map((e, i) => (
              <div key={i} style={{ backgroundColor:'#f8fafc', borderRadius:'10px', padding:'10px 12px' }}>
                <p style={{ margin:'0 0 4px', fontSize:'0.75rem', color:'#94a3b8' }}>
                  {new Date(e.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                </p>
                <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
                  {e.hba1c      && <span style={{ fontSize:'0.875rem', color:'#0f172a' }}>HbA1c: <strong>{e.hba1c}%</strong></span>}
                  {e.systolic_bp && <span style={{ fontSize:'0.875rem', color:'#0f172a' }}>BP: <strong>{e.systolic_bp} mmHg</strong></span>}
                  {e.weight     && <span style={{ fontSize:'0.875rem', color:'#0f172a' }}>Weight: <strong>{e.weight} kg</strong></span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NextStepsTab({ data, id }) {
  const highFindrisc  = data.findrisc_score !== null && data.findrisc_score >= 15;
  const bpAlert       = data.systolic_bp !== null && data.systolic_bp >= 140;
  const cvdIntermediate = data.cvd_risk !== null && data.cvd_risk >= 10;
  const allLowRisk    = !highFindrisc && !bpAlert && !cvdIntermediate && !data.known_cvd && !data.known_diabetic;

  const tips = [];
  if (highFindrisc || data.known_diabetic)
    tips.push({ icon:'🩸', text:'Ask your doctor for a fasting blood glucose or HbA1c test at your next visit.' });
  if (bpAlert)
    tips.push({ icon:'💓', text:'Monitor your blood pressure regularly and discuss the result with your doctor.' });
  if (cvdIntermediate)
    tips.push({ icon:'🔬', text:'Ask your doctor about getting a full lipid profile (cholesterol test).' });
  if (allLowRisk)
    tips.push({ icon:'📅', text:'Rescreen in 1–2 years, or sooner if your health changes.' });

  return (
    <div style={{ padding:'20px 16px' }}>

      {/* Book appointment */}
      <div style={{ marginBottom:'28px' }}>
        <p style={{ margin:'0 0 12px', fontSize:'0.9375rem', color:'#334155', lineHeight:1.65 }}>
          Based on your results, we recommend discussing your health risk with a doctor.
        </p>
        <a href="https://www.asterpharmacy.ae" target="_blank" rel="noopener noreferrer"
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'18px 24px', backgroundColor:GREEN, borderRadius:'14px', color:'#fff', textDecoration:'none', fontSize:'1.0625rem', fontWeight:700, boxShadow:'0 4px 16px rgba(0,166,81,0.32)', letterSpacing:'-0.01em' }}>
          📅 Book Your Appointment
        </a>
      </div>

      {/* Action tips */}
      <div style={{ marginBottom:'28px' }}>
        <p style={{ margin:'0 0 12px', fontSize:'0.9375rem', fontWeight:700, color:'#0f172a' }}>Your action steps:</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {tips.map((t, i) => (
            <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start', backgroundColor:'#fff', borderRadius:'12px', padding:'14px 16px', border:'1px solid #e2e8f0', boxShadow:'0 2px 6px rgba(15,23,42,0.04)' }}>
              <span style={{ fontSize:'1.25rem', flexShrink:0 }}>{t.icon}</span>
              <p style={{ margin:0, fontSize:'0.9rem', color:'#334155', lineHeight:1.65 }}>{t.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tracker */}
      <TrackerSection id={id} originalSbp={data.systolic_bp || null} originalHba1c={data.hba1c_display || null} />
    </div>
  );
}

// ─── Main patient page ────────────────────────────────────────────────────────

const TABS = [
  { id:'results', label:'Results',    emoji:'📋' },
  { id:'learn',   label:'Learn',      emoji:'📚' },
  { id:'next',    label:'Next Steps', emoji:'✅' },
];

export default function PatientPage({ id }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [notFound,  setNotFound]  = useState(false);
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => {
    if (!supabase) { setNotFound(true); setLoading(false); return; }
    supabase.from('patient_records').select('*').eq('id', id).single()
      .then(({ data: record, error }) => {
        if (error || !record) setNotFound(true);
        else setData(record);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#f0f7ff', fontFamily:FONT }}>
        <p style={{ color:'#64748b', fontSize:'1rem' }}>Loading your results…</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'#f0f7ff', fontFamily:FONT, padding:'32px 24px', textAlign:'center' }}>
        <span style={{ fontSize:'3rem', marginBottom:'16px' }}>🔍</span>
        <p style={{ fontSize:'1.125rem', fontWeight:700, color:'#0f172a', margin:'0 0 8px' }}>Results not found</p>
        <p style={{ fontSize:'0.9rem', color:'#64748b', margin:0, lineHeight:1.65 }}>This link may be invalid or the record may not be available yet. Please ask your pharmacist for assistance.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f0f7ff', fontFamily:FONT, color:'#1e293b' }}>
      <div style={{ maxWidth:'480px', margin:'0 auto', minHeight:'100vh', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ backgroundColor:BLUE, padding:'20px 16px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'8px', backgroundColor:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
                <rect x="14" y="6"  width="8"  height="24" rx="2" fill="white"/>
                <rect x="6"  y="14" width="24" height="8"  rx="2" fill="white"/>
              </svg>
            </div>
            <span style={{ fontSize:'1.125rem', fontWeight:800, letterSpacing:'-0.02em', color:'#fff' }}>PharmaScan</span>
          </div>
          <p style={{ margin:0, fontSize:'0.8rem', color:'rgba(255,255,255,0.75)' }}>Your personal health results</p>
        </div>

        {/* Tab bar (sticky) */}
        <div style={{ backgroundColor:'#fff', borderBottom:'1px solid #e2e8f0', display:'flex', position:'sticky', top:0, zIndex:10, boxShadow:'0 1px 4px rgba(15,23,42,0.06)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ flex:1, padding:'12px 6px', border:'none', background:'none', cursor:'pointer', fontFamily:FONT, fontSize:'0.76rem', fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? BLUE : '#94a3b8', borderBottom: `2.5px solid ${activeTab === t.id ? BLUE : 'transparent'}`, transition:'color 120ms', lineHeight:1.3 }}>
              <span style={{ display:'block', fontSize:'1.1rem', marginBottom:'3px' }}>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex:1 }}>
          {activeTab === 'results' && <ResultsTab data={data} />}
          {activeTab === 'learn'   && <LearnTab   data={data} />}
          {activeTab === 'next'    && <NextStepsTab data={data} id={id} />}
        </div>

        {/* Footer */}
        <div style={{ backgroundColor:'#fff', borderTop:'1px solid #e2e8f0', padding:'16px', textAlign:'center' }}>
          <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8', lineHeight:1.65 }}>
            PharmaScan is a clinical decision support tool. This page provides general health education only and does not constitute medical advice.{' '}
            <strong style={{ color:'#dc2626' }}>In an emergency call 998.</strong>
          </p>
        </div>

      </div>
    </div>
  );
}
