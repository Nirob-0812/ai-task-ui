// AI Task UI – client for single-route API
// Changes: better error handling (show one-line message from API detail)

const $ = (sel) => document.querySelector(sel);

const els = {
  apiBase: $('#apiBase'),
  pingBtn: $('#pingBtn'),
  pingMsg: $('#pingMsg'),
  form:    $('#taskForm'),
  task:    $('#task'),
  userId:  $('#userId'),
  useMcp:  $('#useMcp'),
  prompt:  $('#prompt'),
  platform:$('#platform'),
  imgSize: $('#imgSize'),
  submitBtn: $('#submitBtn'),
  status:  $('#status'),

  result:      $('#result'),
  textResult:  $('#textResult'),
  qaSources:   $('#qaSources'),
  sourcesList: $('#sourcesList'),
  imageBox:    $('#imageBox'),
  imageLink:   $('#imageLink'),
  imageEl:     $('#imageEl'),
  rawBox:      $('#rawBox'),
  rawJson:     $('#rawJson')
};

function setTaskVisibility() {
  const t = els.task.value;
  for (const node of document.querySelectorAll('.only-qa')) node.classList.toggle('hidden', t !== 'qa');
  for (const node of document.querySelectorAll('.only-image')) node.classList.toggle('hidden', t !== 'image');
  for (const node of document.querySelectorAll('.only-content')) node.classList.toggle('hidden', t !== 'content');
  const needsPrompt = (t === 'qa' || t === 'image' || t === 'content');
  for (const node of document.querySelectorAll('.only-has-prompt')) node.classList.toggle('hidden', !needsPrompt);
  els.prompt.placeholder =
    t === 'qa'     ? 'Ask a question…' :
    t === 'image'  ? 'Describe the image you want…' :
    t === 'content'? 'Topic for platform content…' : '';
}
els.task.addEventListener('change', setTaskVisibility);
setTaskVisibility();

els.pingBtn.addEventListener('click', async () => {
  els.pingMsg.textContent = 'Pinging…';
  try {
    const res = await fetch(els.apiBase.value.replace(/\/$/, '') + '/ai-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'qa', prompt: 'ping', use_mcp: false })
    });
    els.pingMsg.textContent = res.ok ? 'OK' : `Error: ${res.status}`;
    els.pingMsg.style.color = res.ok ? 'var(--good)' : 'var(--bad)';
  } catch {
    els.pingMsg.textContent = 'Network error';
    els.pingMsg.style.color = 'var(--bad)';
  }
});

function buildBody() {
  const t = els.task.value;
  const body = { task: t };
  const userId = els.userId.value.trim();
  if (userId) body.user_id = userId;
  if (t === 'qa' || t === 'image' || t === 'content') {
    const p = els.prompt.value.trim();
    if (!p) throw new Error('prompt is required');
    body.prompt = p;
  }
  if (t === 'qa') body.use_mcp = els.useMcp.checked;
  if (t === 'content') body.platform = els.platform.value;
  if (t === 'image') body.image_size = els.imgSize.value.trim() || '1024x1024';
  return body;
}

function absoluteUrl(base, p) {
  try {
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;
    const origin = new URL(base).origin.replace(/\/$/, '');
    return origin + (p.startsWith('/') ? p : '/' + p);
  } catch { return p; }
}

function setImageSizeStyle(el, sizeStr) {
  const m = /^\s*(\d+)x(\d+)\s*$/i.exec(sizeStr || '');
  if (!m) { el.removeAttribute('style'); return; }
  el.style.width  = parseInt(m[1], 10) + 'px';
  el.style.height = parseInt(m[2], 10) + 'px';
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
  els.status.textContent = 'Sending…';
  els.status.style.color = 'var(--muted)';

  try {
    const body = buildBody();
    const res  = await fetch(els.apiBase.value.replace(/\/$/, '') + '/ai-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // Try to parse JSON always; if it fails, fabricate a minimal object
    let data;
    try { data = await res.json(); } catch { data = { ok: false, detail: 'Invalid JSON' }; }

    // One-line status message
    if (res.ok) {
      els.status.textContent = 'Done';
      els.status.style.color = 'var(--good)';
    } else {
      const detail = (typeof data.detail === 'string')
        ? data.detail
        : (data.detail ? JSON.stringify(data.detail) : `Error ${res.status}`);
      els.status.textContent = detail;
      els.status.style.color = 'var(--bad)';
    }

    // Raw JSON (collapsible)
    els.rawJson.textContent = JSON.stringify(data, null, 2);
    els.result.classList.remove('hidden');

    if (!res.ok) {
      // Also show the one-line message in the result area
      els.textResult.textContent = els.status.textContent;
      els.textResult.classList.remove('hidden');
      return;
    }

    // Success path: render by task
    const task = data.task;
    const payload = data.data || {};

    if (task === 'qa') {
      els.textResult.textContent = payload.answer || '(no answer)';
      els.textResult.classList.remove('hidden');
      if (Array.isArray(payload.sources) && payload.sources.length) {
        els.qaSources.classList.remove('hidden');
        els.sourcesList.innerHTML = payload.sources.map(s => {
          const t = (s.title || '').replace(/</g,'&lt;');
          const u = s.url || '#';
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
      setImageSizeStyle(els.imageEl, els.imgSize.value);
      els.imageBox.classList.remove('hidden');
    }
  } catch (e) {
    els.status.textContent = 'Network error';
    els.status.style.color = 'var(--bad)';
    els.textResult.textContent = 'Network error';
    els.textResult.classList.remove('hidden');
    els.result.classList.remove('hidden');
  } finally {
    els.submitBtn.disabled = false;
  }
});
