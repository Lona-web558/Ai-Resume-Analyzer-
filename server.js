const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL || 'claude-sonnet-5-5';

app.use(express.json({ limit: '200kb' }));
app.use(express.static(path.join(__dirname)));

const SYSTEM = `You are an expert recruiter and resume coach. Analyze the resume (and the job description if given).
Reply with ONLY a JSON object, no markdown, in this exact shape:
{"score": number 0-100, "summary": string, "strengths": [string], "weaknesses": [string], "missingKeywords": [string], "suggestions": [string]}
Be specific, honest and concise. Max 5 items per list. missingKeywords is empty if no job description is given.`;

const STOP = new Set('the and for with that this you your are will our have from they their about into more than work team able such using use must can who all any not but has was were been being per etc job role'.split(' '));
const VERBS = ['led','built','created','designed','developed','managed','improved','increased','reduced','launched','delivered','implemented','owned','optimized','automated','trained','negotiated','analyzed'];

// Offline fallback: simple rule-based analysis
function localAnalysis(resume, jd) {
  const t = resume.toLowerCase();
  const words = t.split(/\s+/).filter(Boolean).length;
  const has = (re) => re.test(t);
  const sections = { experience: has(/experience|employment/), education: has(/education|qualification/), skills: has(/skills/), summary: has(/summary|profile|objective/) };
  const email = /[\w.+-]+@[\w-]+\.[\w.]+/.test(resume);
  const verbs = VERBS.filter(v => t.includes(v)).length;
  const metrics = (resume.match(/\d+%|\$\s?\d+|\b\d{2,}\b/g) || []).length;

  let score = 30;
  const strengths = [], weaknesses = [], suggestions = [];
  Object.entries(sections).forEach(([k, ok]) => {
    if (ok) { score += 7; strengths.push(`Includes a ${k} section.`); }
    else { weaknesses.push(`No clear ${k} section found.`); suggestions.push(`Add a labelled ${k} section.`); }
  });
  if (email) score += 5; else { weaknesses.push('No email address found.'); suggestions.push('Add an email address at the top.'); }
  if (verbs >= 4) { score += 10; strengths.push('Uses strong action verbs.'); }
  else { weaknesses.push('Few action verbs.'); suggestions.push('Start bullets with verbs like led, built, improved.'); }
  if (metrics >= 3) { score += 10; strengths.push('Includes measurable results.'); }
  else { weaknesses.push('Few numbers or measurable results.'); suggestions.push('Add numbers: percentages, revenue, users, time saved.'); }
  if (words < 150) { weaknesses.push('Resume looks very short.'); suggestions.push('Expand on your roles and projects.'); }
  else if (words > 900) { weaknesses.push('Resume looks long.'); suggestions.push('Trim to the most relevant 1-2 pages.'); }
  else score += 8;

  let missingKeywords = [];
  if (jd) {
    const freq = {};
    (jd.toLowerCase().match(/[a-z+#.]{3,}/g) || []).forEach(w => { if (!STOP.has(w)) freq[w] = (freq[w] || 0) + 1; });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(e => e[0]);
    missingKeywords = top.filter(k => !t.includes(k)).slice(0, 10);
    const matched = top.length - missingKeywords.length;
    score += Math.round((matched / Math.max(top.length, 1)) * 10);
    if (missingKeywords.length) suggestions.push('Work the missing keywords into your experience where they are true.');
  }
  return {
    score: Math.min(score, 100),
    summary: 'Offline rule-based review. Set ANTHROPIC_API_KEY for a deeper AI analysis.',
    strengths: strengths.slice(0, 5), weaknesses: weaknesses.slice(0, 5),
    missingKeywords, suggestions: suggestions.slice(0, 5)
  };
}

function parseJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : text);
}

app.post('/api/analyze', async (req, res) => {
  const resume = String(req.body.resume || '').trim();
  const jd = String(req.body.jobDescription || '').trim();
  if (resume.length < 80) return res.status(400).json({ error: 'Paste at least a few lines of your resume.' });
  if (!API_KEY) return res.json(localAnalysis(resume, jd));

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL, max_tokens: 1500, system: SYSTEM,
        messages: [{ role: 'user', content: `RESUME:\n${resume.slice(0, 15000)}\n\nJOB DESCRIPTION:\n${jd.slice(0, 6000) || '(none)'}` }]
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data.error?.message || 'AI service error.' });
    const out = parseJson(data.content.filter(b => b.type === 'text').map(b => b.text).join(''));
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'Could not get an analysis. Please try again.' });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));



app.listen(PORT, () => console.log('Resume analyzer running at http://localhost:' + PORT));
