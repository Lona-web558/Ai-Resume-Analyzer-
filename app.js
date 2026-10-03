const $ = id => document.getElementById(id);

$('file').addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => { $('resume').value = reader.result; };
  reader.readAsText(f);
});

function fill(id, items, empty) {
  const el = $(id);
  el.innerHTML = '';
  (items && items.length ? items : [empty]).forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    el.appendChild(li);
  });
}

function show(data) {
  const score = Math.max(0, Math.min(100, Math.round(Number(data.score) || 0)));
  const ring = $('ring');
  ring.style.setProperty('--p', score);
  ring.style.setProperty('--c', score >= 75 ? 'var(--good)' : score >= 50 ? 'var(--accent)' : 'var(--warn)');
  $('score').textContent = score;
  $('summary').textContent = data.summary || '';
  fill('strengths', data.strengths, 'Nothing stood out yet.');
  fill('weaknesses', data.weaknesses, 'No major issues found.');
  fill('suggestions', data.suggestions, 'No suggestions.');
  const kw = $('keywords');
  kw.innerHTML = '';
  if (data.missingKeywords && data.missingKeywords.length) {
    data.missingKeywords.forEach(k => {
      const s = document.createElement('span');
      s.className = 'kw';
      s.textContent = k;
      kw.appendChild(s);
    });
  } else {
    kw.textContent = 'None found, or no job description was added.';
  }
  $('empty').classList.add('d-none');
  $('result').classList.remove('d-none');
}

$('form').addEventListener('submit', async e => {
  e.preventDefault();
  $('error').classList.add('d-none');
  $('btn').disabled = true;
  $('btn').textContent = 'Analyzing...';
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume: $('resume').value, jobDescription: $('jd').value })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    show(data);
  } catch (err) {
    $('error').textContent = err.message;
    $('error').classList.remove('d-none');
  } finally {
    $('btn').disabled = false;
    $('btn').textContent = 'Analyze resume';
  }
});
