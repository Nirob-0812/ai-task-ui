// Simple client for the AI Task API
const $ = (sel) => document.querySelector(sel);

const els = {
  apiBase: $('#apiBase'),
  pingBtn: $('#pingBtn'),
  pingMsg: $('#pingMsg'),
  form: $('#taskForm'),
  task: $('#task'),
  userId: $('#userId'),
  useMcp: $('#useMcp'),
  prompt: $('#prompt'),
  platform: $('#platform'),
  imgSize: $('#imgSize'),
  submitBtn: $('#submitBtn'),
  status: $('#status'),
  result: $('#result'),
  textResult: $('#textResult'),
  qaSources: $('#qaSources'),
  sourcesList: $('#sourcesList'),
  imageBox: $('#imageBox'),
  imageLink: $('#imageLink'),
  imageEl: $('#imageEl'),
  rawBox: $('#rawBox'),
  rawJson: $('#rawJson')
};

function setTaskVisibility() {
  const t = els.task.value;
  for (const node of document.querySelectorAll('.only-qa')) {
    node.classList.toggle('hidden', t !== 'qa');
  }
  for (const node of document.querySelectorAll('.only-image')) {
    node.classList.toggle('hidden', t !== 'image');
  }
  for (const node of document.querySelectorAll('.only-content')) {
    node.classList.toggle('hidden', t !== 'content');
  }
  const needsPrompt = (t === 'qa' || t === 'image' || t === 'content');
  for (const node of document.querySelectorAll('.only-has-prompt')) {
    node.classList.toggle('hidden', !needsPrompt);
  }
  if (t === 'qa') els.prompt.placeholder = 'Ask a question...';
  if (t === 'content') els.prompt.placeholder = 'Topic for platform content...';
  if (t === 'image') els.prompt.placeholder = 'Describe the image you want...';
}
els.task.addEventListener('change', setTaskVisibility);
setTaskVisibility();

els.pingBtn.addEventListener('click', async () => {
  els.pingMsg.textContent = 'Pinging...';
  try {
    const res = await fetch(els.apiBase.value.replace(/\/$/, '') + '/ai-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'qa', prompt: 'ping', use_mcp: false })
    });
    els.pingMsg.textContent = res.ok ? 'OK' : `Error: ${res.status}`;
    els.pingMsg.style.color = res.ok ? 'var(--good)' : 'var(--bad)';
  } catch (e) {
    els.pingMsg.textContent = 'Network error';
    els.pingMsg.style.color = 'var(--bad)';
  }
});

function buildBody() {
  const t = els.task.value;
  const body = { task: t };
  const userId = els.userId.value.trim();
  if (userId) body.user_id = userId;
  if (t === 'qa' || t === 'content' || t === 'image') {
    const p = els.prompt.value.trim();
    if (!p) throw new Error('prompt is required');
    body.prompt = p;
  }
  if (t === 'qa') body.use_mcp = els.useMcp.checked;
  if (t === 'content') body.platform = els.platform.value;
  if (t === 'image') body.image_size = (els.imgSize.value.trim() || '1024x1024');
  return body;
}

function absoluteUrl(base, maybePath) {
  try {
    if (!maybePath) return '';
    if (/^https?:\/\//i.test(maybePath)) return maybePath;
    const origin = new URL(base).origin.replace(/\/$/, '');
    return origin + (maybePath.startsWith('/') ? maybePath : '/' + maybePath);
  } catch { return maybePath; }
}

function setImageSizeStyle(imgEl, sizeStr) {
  const m = /^\s*(\d+)x(\d+)\s*$/i.exec(sizeStr || '');
  if (!m) { imgEl.removeAttribute('style'); return; }
  const w = parseInt(m[1], 10), h = parseInt(m[2], 10);
  imgEl.style.width = w + 'px';
  imgEl.style.height = h + 'px';
}

function resetResult() {
  els.result.classList.add('hidden');
  els.textResult.classList.add('hidden');
  els.qaSources.classList.add('hidden');
  els.imageBox.classList.add('hidden');
  els.sourcesList.innerHTML = '';
  els.rawJson.textContent = '';
}

els.form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  resetResult();
  els.submitBtn.disabled = true;
  els.status.textContent = 'Sending...';

  try {
    const body = buildBody();
    const res = await fetch(els.apiBase.value.replace(/\/$/, '') + '/ai-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    els.status.textContent = res.ok ? 'Done' : `Error: ${res.status}`;
    els.status.style.color = res.ok ? 'var(--good)' : 'var(--bad)';

    els.rawJson.textContent = JSON.stringify(data, null, 2);
    els.result.classList.remove('hidden');

    if (!res.ok) return;

    const task = data.task;
    const payload = data.data || {};

    if (task === 'qa') {
      els.textResult.textContent = payload.answer || '(no answer)';
      els.textResult.classList.remove('hidden');
      if (Array.isArray(payload.sources) && payload.sources.length) {
        els.qaSources.classList.remove('hidden');
        els.sourcesList.innerHTML = payload.sources.map(s => {
          const t = (s.title || '').replace(/</g,'&lt;');
          const u = (s.url || '#');
          return `<li><a href="${u}" target="_blank" rel="noopener">${t || u}</a></li>`;
        }).join('');
      }
    } else if (task === 'content') {
      els.textResult.textContent = payload.content || '(no content)';
      els.textResult.classList.remove('hidden');
    } else if (task === 'latest_answer') {
      const txt = `Prompt: ${payload.prompt || ''}\n\nAnswer:\n${payload.answer || ''}\n\nCreated at: ${payload.created_at || ''}`;
      els.textResult.textContent = txt;
      els.textResult.classList.remove('hidden');
    } else if (task === 'image') {
      const full = absoluteUrl(els.apiBase.value, payload.image_url);
      els.imageLink.textContent = full;
      els.imageLink.href = full || '#';
      const imgSrc = full || (payload.base64 ? ('data:image/png;base64,' + payload.base64) : '');
      els.imageEl.src = imgSrc;
      setImageSizeStyle(els.imageEl, document.getElementById('imgSize').value);
      els.imageBox.classList.remove('hidden');
    }
  } catch (e) {
    els.status.textContent = 'Network error';
    els.status.style.color = 'var(--bad)';
  } finally {
    els.submitBtn.disabled = false;
  }
});
