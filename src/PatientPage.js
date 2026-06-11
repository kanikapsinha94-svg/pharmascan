import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const FONT  = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const BLUE  = '#1d6fce';
const GREEN = '#00a651';

function findriscMeta(score) {
  if (score === null || score === undefined) return null;
  if (score < 7)  return { label:'Low Risk',          color:'#15803d', bg:'#f0fdf4', headline:'Your diabetes risk is low.', body:'Keeping active and eating well will help you stay this way.' };
  if (score < 12) return { label:'Slightly Elevated', color:'#b45309', bg:'#fffbeb', headline:'You have a slightly elevated diabetes risk.', body:'Small lifestyle changes now can make a real difference to your future health.' };
  if (score < 15) return { label:'Moderate Risk',     color:'#c2410c', bg:'#fff7ed', headline:'Your diabetes risk is moderate.', body:'Speaking with a doctor about prevention steps is a good idea.' };
  if (score <= 20)return { label:'Elevated Risk',     color:'#c2410c', bg:'#fff7ed', headline:'Your results suggest an elevated diabetes risk.', body:'This is important to discuss with a doctor. With the right support, risk can often be reduced significantly.' };
  return           { label:'High Risk',               color:'#b91c1c', bg:'#fef2f2', headline:'Your results indicate a high diabetes risk.', body:'Please see a doctor soon. Early action makes a real difference.' };
}

function cvdMeta(risk) {
  if (risk === null || risk === undefined) return null;
  if (risk < 10)  return { label:'Low Risk',      color:'#15803d', bg:'#f0fdf4', headline:'Your 10-year heart risk is low.', body:'Maintaining a healthy lifestyle will help keep it that way.' };
  if (risk < 20)  return { label:'Moderate Risk', color:'#b45309', bg:'#fffbeb', headline:'Your 10-year heart risk is moderate.', body:'Your doctor can advise on steps to reduce it.' };
  return           { label:'Elevated Risk',       color:'#c2410c', bg:'#fff7ed', headline:'Your 10-year heart risk is elevated.', body:'A prompt review by a doctor is recommended.' };
}

function StatusBadge({ label, color, bg }) {
  return (
    <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:'999px', backgroundColor:bg, color, fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.02em', textTransform:'uppercase' }}>
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

function SectionTitle({ icon, title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
      <div style={{ width:'32px', height:'32px', borderRadius:'8px', backgroundColor:'#f0f7ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {icon}
      </div>
      <p style={{ margin:0, fontSize:'0.9375rem', fontWeight:700, color:'#0f172a' }}>{title}</p>
    </div>
  );
}

function Accordion({ title, icon, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ backgroundColor:'#fff', borderRadius:'16px', marginBottom:'12px', overflow:'hidden', border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(15,23,42,0.04)' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', padding:'18px 20px', background:'none', border:'none', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', textAlign:'left', fontFamily:FONT }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {icon && <span style={{ fontSize:'1.1rem' }}>{icon}</span>}
          <span style={{ fontSize:'0.9375rem', fontWeight:700, color:'#0f172a' }}>{title}</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, transition:'transform 150ms', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M4 6l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && <div style={{ padding:'0 20px 20px', borderTop:'1px solid #f1f5f9' }}>{children}</div>}
    </div>
  );
}

function InfoRow({ children }) {
  return (
    <div style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'12px 0', borderBottom:'1px solid #f1f5f9' }}>
      {children}
    </div>
  );
}

function LearnLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display:'inline-flex', alignItems:'center', gap:'6px', marginTop:'12px', marginRight:'8px', padding:'10px 16px', backgroundColor:'#f0f7ff', borderRadius:'10px', border:'1px solid #bfdbfe', color:BLUE, fontSize:'0.84rem', fontWeight:600, textDecoration:'none' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1h6v6M13 1L6 8M4 3H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-2" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {children}
    </a>
  );
}

function PlateGraphic({ variant }) {
  const veg   = variant === 'heart' ? '#4ade80' : '#22c55e';
  const grain = variant === 'heart' ? '#fbbf24' : '#86efac';
  const prot  = variant === 'heart' ? '#f97316' : '#60a5fa';
  const labels = variant === 'heart'
    ? ['Vegetables & fruit', 'Wholegrains', 'Lean protein & oily fish']
    : ['Vegetables', 'Wholegrains & legumes', 'Lean protein'];
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', margin:'16px 0' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="76" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
        <path d="M80 80 L80 8 A72 72 0 0 0 8 80 Z" fill={veg} opacity="0.85"/>
        <path d="M80 80 L80 8 A72 72 0 0 1 152 80 Z" fill={grain} opacity="0.85"/>
        <path d="M80 80 L152 80 A72 72 0 0 1 8 80 Z" fill={prot} opacity="0.85"/>
        <line x1="80" y1="8" x2="80" y2="80" stroke="#fff" strokeWidth="2"/>
        <line x1="8" y1="80" x2="152" y2="80" stroke="#fff" strokeWidth="2"/>
        <circle cx="80" cy="80" r="8" fill="#fff"/>
      </svg>
      <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'center', marginTop:'10px' }}>
        {[veg, grain, prot].map((c, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <div style={{ width:'10px', height:'10px', borderRadius:'3px', backgroundColor:c, opacity:0.85 }}/>
            <span style={{ fontSize:'0.72rem', color:'#64748b' }}>{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsTab({ data }) {
  const fr  = findriscMeta(data.findrisc_score);
  const cv  = cvdMeta(data.cvd_risk);
  const bpHigh   = data.systolic_bp !== null && data.systolic_bp >= 140;
  const diabGaps = Array.isArray(data.diabetes_gaps) ? data.diabetes_gaps : [];
  const cvdResult = data.cvd_result || null;
  const screenDate = new Date(data.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });

  return (
    <div style={{ padding:'20px 16px' }}>
      <p style={{ margin:'0 0 20px', fontSize:'0.8rem', color:'#94a3b8' }}>Screened {screenDate}</p>

      {fr && (
        <Card>
          <SectionTitle
            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke={BLUE} strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round"/></svg>}
            title="Diabetes Risk"
          />
          <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'12px' }}>
            <div style={{ minWidth:'52px', height:'52px', borderRadius:'12px', backgroundColor:fr.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'1.375rem', fontWeight:900, color:fr.color }}>{data.findrisc_score}</span>
            </div>
            <div>
              <StatusBadge label={fr.label} color={fr.color} bg={fr.bg} />
              <p style={{ margin:'8px 0 0', fontSize:'0.875rem', fontWeight:600, color:'#0f172a' }}>{fr.headline}</p>
            </div>
          </div>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#475569', lineHeight:1.7, padding:'12px 14px', backgroundColor:'#f8fafc', borderRadius:'10px' }}>{fr.body}</p>
        </Card>
      )}

      {cv && !data.known_cvd && (
        <Card>
          <SectionTitle
            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 13.5S2 9.5 2 5.5A3.5 3.5 0 018 3a3.5 3.5 0 016 2c0 4-6 8.5-6 8.5z" stroke="#e11d48" strokeWidth="1.5" fill="none"/></svg>}
            title="Heart Risk — next 10 years"
          />
          <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'12px' }}>
            <div style={{ minWidth:'52px', height:'52px', borderRadius:'12px', backgroundColor:cv.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'1.125rem', fontWeight:900, color:cv.color }}>{data.cvd_risk}%</span>
            </div>
            <div>
              <StatusBadge label={cv.label} color={cv.color} bg={cv.bg} />
              <p style={{ margin:'8px 0 0', fontSize:'0.875rem', fontWeight:600, color:'#0f172a' }}>{cv.headline}</p>
            </div>
          </div>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#475569', lineHeight:1.7, padding:'12px 14px', backgroundColor:'#f8fafc', borderRadius:'10px' }}>{cv.body}</p>
        </Card>
      )}

      {data.known_cvd && cvdResult && (
        <Card>
          <SectionTitle
            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 13.5S2 9.5 2 5.5A3.5 3.5 0 018 3a3.5 3.5 0 016 2c0 4-6 8.5-6 8.5z" stroke="#e11d48" strokeWidth="1.5" fill="none"/></svg>}
            title="Heart Condition Review"
          />
          {cvdResult.urgent ? (
            <div style={{ backgroundColor:'#fef2f2', borderRadius:'10px', padding:'14px', border:'1px solid #fca5a5' }}>
              <p style={{ margin:0, fontSize:'0.875rem', color:'#b91c1c', fontWeight:700, lineHeight:1.65 }}>
                You reported new or worsening symptoms. Please see a doctor promptly.
              </p>
            </div>
          ) : cvdResult.gaps && cvdResult.gaps.length > 0 ? (
            <>
              <p style={{ margin:'0 0 10px', fontSize:'0.875rem', color:'#64748b' }}>
                {cvdResult.gaps.length} area{cvdResult.gaps.length > 1 ? 's' : ''} to discuss with your doctor:
              </p>
              {cvdResult.gaps.map((g, i) => (
                <div key={i} style={{ backgroundColor:'#fffbeb', borderRadius:'10px', padding:'12px 14px', marginBottom:'8px', border:'1px solid #fde68a' }}>
                  <p style={{ margin:0, fontSize:'0.875rem', fontWeight:600, color:'#92400e', lineHeight:1.6 }}>{g.title}</p>
                </div>
              ))}
            </>
          ) : (
            <p style={{ margin:0, fontSize:'0.875rem', color:'#15803d', lineHeight:1.65 }}>
              Your cardiovascular management appears well maintained — no gaps identified.
            </p>
          )}
        </Card>
      )}

      {bpHigh && (
        <div style={{ backgroundColor:'#fefce8', border:'1px solid #fde047', borderRadius:'16px', padding:'18px 20px', marginBottom:'12px' }}>
          <p style={{ margin:'0 0 6px', fontSize:'0.9375rem', fontWeight:700, color:'#713f12', display:'flex', alignItems:'center', gap:'6px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L1 13h14L8 1z" stroke="#92400e" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 6v3M8 11v.5" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Blood Pressure
          </p>
          <p style={{ margin:0, fontSize:'0.875rem', color:'#713f12', lineHeight:1.7 }}>
            Your reading of <strong>{data.systolic_bp} mmHg</strong> is above the recommended range. A review with your doctor is advised.
          </p>
        </div>
      )}

      {data.known_diabetic && (
        <Card>
          <SectionTitle
            icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#dc2626" strokeWidth="1.5"/><path d="M8 5v4M8 11v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            title="Diabetes Management Check"
          />
          {diabGaps.length > 0 ? (
            <>
              <p style={{ margin:'0 0 12px', fontSize:'0.875rem', color:'#64748b' }}>
                {diabGaps.length} area{diabGaps.length > 1 ? 's' : ''} to discuss at your next appointment:
              </p>
              {diabGaps.map((g, i) => (
                <div key={i} style={{ backgroundColor:'#fffbeb', borderRadius:'10px', padding:'12px 14px', marginBottom:'8px', border:'1px solid #fde68a' }}>
                  <p style={{ margin:'0 0 4px', fontSize:'0.875rem', fontWeight:700, color:'#92400e' }}>{g.title}</p>
                  <p style={{ margin:0, fontSize:'0.8rem', color:'#78350f', lineHeight:1.65 }}>{g.recommendation}</p>
                </div>
              ))}
            </>
          ) : (
            <p style={{ margin:0, fontSize:'0.875rem', color:'#15803d', lineHeight:1.65 }}>
              No diabetes care gaps identified — well done on managing your condition.
            </p>
          )}
        </Card>
      )}

      <p style={{ margin:'8px 0 0', fontSize:'0.76rem', color:'#94a3b8', lineHeight:1.65, textAlign:'center' }}>
        These results are a risk assessment, not a diagnosis. Your pharmacist and doctor can help you understand them.
      </p>
    </div>
  );
}

function LearnTab({ data }) {
  const showDiabetes = (data.findrisc_score !== null && data.findrisc_score >= 12) || !!data.known_diabetic;
  const showHeart    = (data.cvd_risk !== null && data.cvd_risk >= 10) || (data.systolic_bp !== null && data.systolic_bp >= 140) || !!data.known_cvd;
  const showHealthy  = !showDiabetes && !showHeart;

  return (
    <div style={{ padding:'20px 16px' }}>
      <p style={{ margin:'0 0 20px', fontSize:'0.875rem', color:'#64748b', lineHeight:1.65 }}>
        Practical steps to protect your health, based on your results.
      </p>

      {showDiabetes && (
        <>
          <Accordion title="Understanding your diabetes risk" icon="🩺" defaultOpen={true}>
            <p style={{ margin:'16px 0', fontSize:'0.875rem', color:'#334155', lineHeight:1.8 }}>
              Type 2 diabetes develops when the body cannot use insulin properly. In the UAE, 64% of people living with diabetes don't know they have it. The encouraging news: losing just 5–7% of body weight and moving more can reduce diabetes risk by up to 58%.
            </p>
          </Accordion>
          <Accordion title="What to eat" icon="🥗" defaultOpen={false}>
            <PlateGraphic variant="diabetes" />
            {[
              ['Fill half your plate with vegetables', 'Non-starchy vegetables at every meal.'],
              ['Choose wholegrains', 'Brown rice, wholegrain bread, oats, quinoa instead of white versions.'],
              ['Limit dates and sugary drinks', 'Aim for no more than 2–3 dates a day. Replace juices and sodas with water.'],
              ['Choose grilled or baked over fried', 'Small change, significant impact on blood sugar.'],
              ['Include legumes', 'Lentils, chickpeas, and beans help stabilise blood sugar.'],
            ].map(([title, desc], i) => (
              <InfoRow key={i}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:'2px' }}><circle cx="8" cy="8" r="7" fill="#dcfce7"/><path d="M5 8l2 2 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <p style={{ margin:'0 0 2px', fontSize:'0.875rem', fontWeight:600, color:'#0f172a' }}>{title}</p>
                  <p style={{ margin:0, fontSize:'0.8rem', color:'#64748b', lineHeight:1.6 }}>{desc}</p>
                </div>
              </InfoRow>
            ))}
          </Accordion>
          <Accordion title="How to get moving" icon="🏃" defaultOpen={false}>
            {[
              ['30 minutes, 5 days a week', 'Brisk walking, cycling, or swimming all count. You can split it into shorter sessions.'],
              ['Strength training twice a week', 'Lifting weights or bodyweight exercises like squats help your body use insulin more effectively.'],
              ['Break up long sitting periods', 'Stand and move for a few minutes every 30 minutes — even at work.'],
            ].map(([title, desc], i) => (
              <InfoRow key={i}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:'2px' }}><circle cx="8" cy="8" r="7" fill="#dbeafe"/><path d="M8 4v4l3 3" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round"/></svg>
                <div>
                  <p style={{ margin:'0 0 2px', fontSize:'0.875rem', fontWeight:600, color:'#0f172a' }}>{title}</p>
                  <p style={{ margin:0, fontSize:'0.8rem', color:'#64748b', lineHeight:1.6 }}>{desc}</p>
                </div>
              </InfoRow>
            ))}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'4px' }}>
              <LearnLink href="https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/">NHS activity guidelines</LearnLink>
              <LearnLink href="https://www.nhs.uk/live-well/exercise/strength-exercises/">NHS strength exercises</LearnLink>
            </div>
          </Accordion>
        </>
      )}

      {showHeart && (
        <>
          <Accordion title="Understanding your heart risk" icon="❤️" defaultOpen={true}>
            <p style={{ margin:'16px 0', fontSize:'0.875rem', color:'#334155', lineHeight:1.8 }}>
              Cardiovascular disease is the leading cause of death in the UAE. High blood pressure is often called the "silent killer" because it causes no symptoms but steadily damages the heart, arteries, and kidneys over time. Your Framingham score estimates the chance of a major heart event — heart attack or stroke — over the next 10 years.
            </p>
          </Accordion>
          <Accordion title="Heart-healthy eating" icon="🥑" defaultOpen={false}>
            <PlateGraphic variant="heart" />
            {[
              ['Reduce salt', 'Avoid adding salt at the table. Choose low-sodium options where possible.'],
              ['Eat oily fish twice a week', 'Salmon, sardines, and mackerel are excellent for heart health.'],
              ['Use olive oil', 'Replace other cooking oils with extra virgin olive oil.'],
              ['Limit red and processed meat', 'Once or twice a week maximum. Avoid processed meats.'],
              ['Eat more fruits and vegetables', 'Aim for a variety of colours across the day.'],
            ].map(([title, desc], i) => (
              <InfoRow key={i}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:'2px' }}><circle cx="8" cy="8" r="7" fill="#fee2e2"/><path d="M5 8l2 2 4-4" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <p style={{ margin:'0 0 2px', fontSize:'0.875rem', fontWeight:600, color:'#0f172a' }}>{title}</p>
                  <p style={{ margin:0, fontSize:'0.8rem', color:'#64748b', lineHeight:1.6 }}>{desc}</p>
                </div>
              </InfoRow>
            ))}
          </Accordion>
          <Accordion title="Exercise for your heart" icon="🚶" defaultOpen={false}>
            {[
              ['150 minutes of moderate activity per week', 'Brisk walking, swimming, or cycling. Even 10-minute sessions throughout the day count.'],
              ['Strength training twice a week', 'Resistance exercise helps lower blood pressure and improves heart health.'],
              ['Consistency over intensity', 'Regular moderate activity is more beneficial than occasional intense bursts.'],
            ].map(([title, desc], i) => (
              <InfoRow key={i}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:'2px' }}><circle cx="8" cy="8" r="7" fill="#fee2e2"/><path d="M8 4v4l3 3" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <div>
                  <p style={{ margin:'0 0 2px', fontSize:'0.875rem', fontWeight:600, color:'#0f172a' }}>{title}</p>
                  <p style={{ margin:0, fontSize:'0.8rem', color:'#64748b', lineHeight:1.6 }}>{desc}</p>
                </div>
              </InfoRow>
            ))}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'4px' }}>
              <LearnLink href="https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/">NHS activity guidelines</LearnLink>
              <LearnLink href="https://www.nhs.uk/live-well/exercise/strength-exercises/">NHS strength exercises</LearnLink>
            </div>
          </Accordion>
        </>
      )}

      {showHealthy && (
        <Accordion title="Staying healthy — your results look good" icon="✨" defaultOpen={true}>
          <p style={{ margin:'16px 0', fontSize:'0.875rem', color:'#334155', lineHeight:1.8 }}>
            Your results today suggest a lower risk of diabetes and cardiovascular disease. The best time to protect your health is before problems develop.
          </p>
          {[
            ['Stay active', '150 minutes of moderate exercise per week — walking, swimming, cycling.'],
            ['Eat well', 'Plenty of vegetables, wholegrains, and lean protein.'],
            ['Maintain a healthy weight', 'Even modest weight loss reduces future disease risk significantly.'],
            ['Get regular check-ups', 'Blood pressure and blood sugar check every 1–2 years.'],
          ].map(([title, desc], i) => (
            <InfoRow key={i}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:'2px' }}><circle cx="8" cy="8" r="7" fill="#dcfce7"/><path d="M5 8l2 2 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:'0.875rem', fontWeight:600, color:'#0f172a' }}>{title}</p>
                <p style={{ margin:0, fontSize:'0.8rem', color:'#64748b', lineHeight:1.6 }}>{desc}</p>
              </div>
            </InfoRow>
          ))}
          <LearnLink href="https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/">NHS activity guidelines</LearnLink>
        </Accordion>
      )}
    </div>
  );
}

function FeedbackWidget({ id }) {
  const [answer, setAnswer] = useState(null);
  const [saved,  setSaved]  = useState(false);

  const handleAnswer = async (val) => {
    setAnswer(val);
    if (!supabase) { setSaved(true); return; }
    await supabase.from('patient_records').update({ screening_helpful: val === 'yes' }).eq('id', id);
    setSaved(true);
  };

  return (
    <div style={{ backgroundColor:'#f8fafc', borderRadius:'14px', padding:'18px 20px', border:'1px solid #e2e8f0', marginTop:'28px' }}>
      {!saved ? (
        <>
          <p style={{ margin:'0 0 14px', fontSize:'0.875rem', fontWeight:600, color:'#0f172a', textAlign:'center' }}>
            Did you find this health screening helpful?
          </p>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => handleAnswer('yes')}
              style={{ flex:1, padding:'12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', backgroundColor:'#fff', cursor:'pointer', fontFamily:FONT, fontSize:'0.9rem', fontWeight:600, color:'#334155', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 9l2 2 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="9" r="8" stroke="#16a34a" strokeWidth="1.5"/></svg>
              Yes
            </button>
            <button onClick={() => handleAnswer('no')}
              style={{ flex:1, padding:'12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', backgroundColor:'#fff', cursor:'pointer', fontFamily:FONT, fontSize:'0.9rem', fontWeight:600, color:'#334155', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 12l6-6M12 12L6 6" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="9" r="8" stroke="#dc2626" strokeWidth="1.5"/></svg>
              No
            </button>
          </div>
        </>
      ) : (
        <p style={{ margin:0, fontSize:'0.875rem', color:'#64748b', textAlign:'center', lineHeight:1.65 }}>
          {answer === 'yes' ? '✓ Thank you for your feedback.' : 'Thank you — your feedback helps us improve.'}
        </p>
      )}
    </div>
  );
}

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
      patient_id:  id,
      hba1c:       hba1c  ? parseFloat(hba1c)  : null,
      systolic_bp: bp     ? parseInt(bp, 10)   : null,
      weight:      weight ? parseFloat(weight) : null,
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
      <p style={{ margin:'0 0 4px', fontSize:'0.9375rem', fontWeight:700, color:'#0f172a' }}>Track your numbers</p>
      <p style={{ margin:'0 0 16px', fontSize:'0.78rem', color:'#94a3b8', lineHeight:1.6 }}>Stored anonymously — not linked to your identity.</p>
      <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'16px' }}>
        <div>
          <label style={labelStyle}>HbA1c (%)
            {originalHba1c && <span style={{ color:'#94a3b8', fontWeight:400 }}> · at screening: {originalHba1c}</span>}
          </label>
          <input type="number" value={hba1c} onChange={e => setHba1c(e.target.value)} placeholder="e.g. 6.8" step="0.1" min="4" max="20" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Blood Pressure — Systolic (mmHg)
            {originalSbp && <span style={{ color:'#94a3b8', fontWeight:400 }}> · at screening: {originalSbp}</span>}
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
        {saving ? 'Saving…' : flash ? '✓ Saved' : 'Save entry'}
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
                  {e.hba1c       && <span style={{ fontSize:'0.875rem', color:'#0f172a' }}>HbA1c: <strong>{e.hba1c}%</strong></span>}
                  {e.systolic_bp && <span style={{ fontSize:'0.875rem', color:'#0f172a' }}>BP: <strong>{e.systolic_bp} mmHg</strong></span>}
                  {e.weight      && <span style={{ fontSize:'0.875rem', color:'#0f172a' }}>Weight: <strong>{e.weight} kg</strong></span>}
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
  const highFindrisc    = data.findrisc_score !== null && data.findrisc_score >= 15;
  const bpAlert         = data.systolic_bp !== null && data.systolic_bp >= 140;
  const cvdIntermediate = data.cvd_risk !== null && data.cvd_risk >= 10;
  const allLowRisk      = !highFindrisc && !bpAlert && !cvdIntermediate && !data.known_cvd && !data.known_diabetic;

  const tips = [];
  if (highFindrisc || data.known_diabetic)
    tips.push({ icon:'🩸', text:'Ask your doctor for a fasting blood glucose or HbA1c test at your next visit.' });
  if (bpAlert)
    tips.push({ icon:'💓', text:'Monitor your blood pressure regularly and discuss the reading with your doctor.' });
  if (cvdIntermediate)
    tips.push({ icon:'🔬', text:'Ask your doctor about a full cholesterol (lipid profile) test.' });
  if (allLowRisk)
    tips.push({ icon:'📅', text:'Rescreen in 1–2 years, or sooner if your health changes.' });

  return (
    <div style={{ padding:'20px 16px' }}>
      <div style={{ marginBottom:'28px' }}>
        <p style={{ margin:'0 0 12px', fontSize:'0.9rem', color:'#475569', lineHeight:1.7 }}>
          Based on your results, speaking with a doctor is recommended.
        </p>
        <a href="https://www.asterpharmacy.ae" target="_blank" rel="noopener noreferrer"
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'18px 24px', backgroundColor:GREEN, borderRadius:'14px', color:'#fff', textDecoration:'none', fontSize:'1rem', fontWeight:700, boxShadow:'0 4px 16px rgba(0,166,81,0.28)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="4" width="12" height="12" rx="2" stroke="white" strokeWidth="1.5"/><path d="M6 2v3M12 2v3M3 8h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Book your appointment
        </a>
      </div>

      {tips.length > 0 && (
        <div style={{ marginBottom:'28px' }}>
          <p style={{ margin:'0 0 12px', fontSize:'0.9rem', fontWeight:700, color:'#0f172a' }}>Your action steps</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {tips.map((t, i) => (
              <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start', backgroundColor:'#fff', borderRadius:'12px', padding:'14px 16px', border:'1px solid #e2e8f0', boxShadow:'0 2px 6px rgba(15,23,42,0.04)' }}>
                <span style={{ fontSize:'1.25rem', flexShrink:0 }}>{t.icon}</span>
                <p style={{ margin:0, fontSize:'0.875rem', color:'#334155', lineHeight:1.7 }}>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <TrackerSection id={id} originalSbp={data.systolic_bp || null} originalHba1c={data.hba1c_display || null} />
      <FeedbackWidget id={id} />
    </div>
  );
}

function TabIcon({ id, active }) {
  const color = active ? BLUE : '#94a3b8';
  if (id === 'results') return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="2" width="12" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M6 6h6M6 9h6M6 12h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (id === 'learn') return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 3L2 7l7 4 7-4-7-4z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M5 8.5v4.5a7 3 0 008 0V8.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (id === 'next') return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke={color} strokeWidth="1.5"/>
      <path d="M6 9l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return null;
}

const TABS = [
  { id:'results', label:'Results'    },
  { id:'learn',   label:'Learn'      },
  { id:'next',    label:'Next Steps' },
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

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#f8fafc', fontFamily:FONT }}>
      <p style={{ color:'#94a3b8', fontSize:'0.9rem' }}>Loading your results…</p>
    </div>
  );

  if (notFound || !data) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'#f8fafc', fontFamily:FONT, padding:'32px 24px', textAlign:'center' }}>
      <p style={{ fontSize:'1.125rem', fontWeight:700, color:'#0f172a', margin:'0 0 8px' }}>Results not found</p>
      <p style={{ fontSize:'0.875rem', color:'#64748b', margin:0, lineHeight:1.7 }}>This link may be invalid or expired. Please ask your pharmacist for assistance.</p>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f8fafc', fontFamily:FONT, color:'#1e293b' }}>
      <div style={{ maxWidth:'480px', margin:'0 auto', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <div style={{ background:'linear-gradient(135deg, #1d6fce 0%, #1558a8 100%)', padding:'22px 20px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
            <div style={{ width:'30px', height:'30px', borderRadius:'8px', backgroundColor:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 36 36" fill="none">
                <rect x="14" y="6"  width="8"  height="24" rx="2" fill="white"/>
                <rect x="6"  y="14" width="24" height="8"  rx="2" fill="white"/>
              </svg>
            </div>
            <span style={{ fontSize:'1.0625rem', fontWeight:800, letterSpacing:'-0.02em', color:'#fff' }}>PharmaScan</span>
          </div>
          <p style={{ margin:0, fontSize:'0.8rem', color:'rgba(255,255,255,0.7)' }}>Your personal health results</p>
        </div>

        <div style={{ backgroundColor:'#fff', borderBottom:'1px solid #e2e8f0', display:'flex', position:'sticky', top:0, zIndex:10, boxShadow:'0 1px 4px rgba(15,23,42,0.06)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ flex:1, padding:'12px 6px 10px', border:'none', background:'none', cursor:'pointer', fontFamily:FONT, fontSize:'0.72rem', fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? BLUE : '#94a3b8', borderBottom: `2.5px solid ${activeTab === t.id ? BLUE : 'transparent'}`, transition:'color 120ms', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
              <TabIcon id={t.id} active={activeTab === t.id} />
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex:1 }}>
          {activeTab === 'results' && <ResultsTab data={data} />}
          {activeTab === 'learn'   && <LearnTab   data={data} />}
          {activeTab === 'next'    && <NextStepsTab data={data} id={id} />}
        </div>

        <div style={{ backgroundColor:'#fff', borderTop:'1px solid #e2e8f0', padding:'16px', textAlign:'center' }}>
          <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8', lineHeight:1.7 }}>
            PharmaScan provides health education only and does not constitute medical advice.{' '}
            <strong style={{ color:'#dc2626' }}>In an emergency call 998.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}