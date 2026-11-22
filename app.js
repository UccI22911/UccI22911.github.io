'use strict';
(() => {
  const data = window.REGRASP_DATA;
  if (!data) return;
  const $ = selector => document.querySelector(selector);
  let oneStepObject = 'bottle', objective = 'sum', trajectoryObject = 'big_screwer';
  let syncing = false;
  const objectives = {sum:'ordinary', jh:'truncated', reg:'balanced'};
  function objectTabs(container, selected, callback) {
    const parent = $(container);
    data.objects.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.role = 'tab'; button.textContent = item.label;
      button.id = parent.id + '-' + item.id; button.dataset.object = item.id; button.setAttribute('aria-controls', parent.id === 'one-step-tabs' ? 'one-step-gallery' : 'trajectory-gallery'); button.setAttribute('aria-selected', String(item.id === selected));
      button.tabIndex = item.id === selected ? 0 : -1;
      button.addEventListener('click', () => {
        parent.querySelectorAll('button').forEach(b => {b.setAttribute('aria-selected', String(b === button)); b.tabIndex = b === button ? 0 : -1;});
        document.getElementById(parent.id === 'one-step-tabs' ? 'one-step-gallery' : 'trajectory-gallery').setAttribute('aria-labelledby',button.id); callback(item.id);
      });
      button.addEventListener('keydown', event => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % data.objects.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + data.objects.length) % data.objects.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = data.objects.length - 1;
        else return;
        event.preventDefault(); const target = parent.children[next]; target.focus(); target.click();
      });
      parent.appendChild(button);
    });
  }
  function setVideo(video, src, poster, label) {
    video.pause(); video.poster = poster; video.setAttribute('aria-label', label);
    video.src = src; video.replaceChildren();
    const captions = document.createElement('track'); captions.kind = 'captions'; captions.srclang = 'en'; captions.label = 'English scene descriptions'; captions.src = src.replace(/\.mp4$/, '.vtt'); video.appendChild(captions); video.load();
  }
  function updateOneStep(id) {
    oneStepObject = id; const item = data.objects.find(o => o.id === id);
    $('#one-step-object-title').textContent = item.label;
    setVideo($('#one-step-video'), item.oneStep.video, item.oneStep.poster, `${item.label} Jseq pose optimization, updates zero to twenty`);
    $('#one-step-download').href = item.oneStep.video; updateObjective();
  }
  function updateObjective() {
    const item = data.objects.find(o => o.id === oneStepObject);
    $('#one-step-result').src = item.oneStep.images[objective];
    $('#one-step-result').alt = `${item.label}: analytical reference and ${objectives[objective]}-objective final poses, separated by stable mode`;
  }
  document.querySelectorAll('[data-objective]').forEach((button, index, list) => {
    button.tabIndex = index === 0 ? 0 : -1;
    button.addEventListener('click', () => {
      objective = button.dataset.objective; document.getElementById('objective-result-panel').setAttribute('aria-labelledby',button.id);
      list.forEach(b => {b.setAttribute('aria-selected', String(b === button)); b.tabIndex = b === button ? 0 : -1;}); updateObjective();
    });
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index+1)%list.length;
      else if (event.key === 'ArrowLeft') next = (index-1+list.length)%list.length;
      else return;
      event.preventDefault();list[next].focus();list[next].click();
    });
  });
  const dialog = $('#figure-dialog'); let lastFigureTrigger = null;
  function showFigure(all, trigger) {
    lastFigureTrigger = trigger; const item = data.objects.find(o => o.id === oneStepObject);
    const src = item.oneStep.images[all ? 'comparison' : objective];
    $('#figure-dialog-title').textContent = `${item.label} · ${all ? 'All generating objectives' : objectives[objective] + ' generation'}`;
    $('#expanded-figure').src = src; $('#original-figure-link').href = src;
    $('#expanded-figure').alt = `${item.label} analytical reference and final distributions`;
    dialog.showModal();
  }
  $('#open-comparison').addEventListener('click', event => showFigure(true, event.currentTarget));
  $('#expand-current-result').addEventListener('click', event => showFigure(false, event.currentTarget));
  $('#close-figure').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {if (event.target === dialog) dialog.close();});
  dialog.addEventListener('close', () => lastFigureTrigger?.focus());
  function formatLength(value) {return Number(value).toFixed(3) + ' m';}
  function updateTrajectory(id) {
    trajectoryObject = id; const item = data.objects.find(o => o.id === id);
    $('#trajectory-object-title').textContent = item.label; $('#playback-status').textContent = '';
    for (const condition of ['Cold','Warm']) {
      const row = data.trajectory.find(r => r.object === id && r.condition === condition);
      const key = condition.toLowerCase();
      setVideo($('#'+key+'-video'), row.video, row.poster, `${item.label} ${condition}-start trajectory optimization and final motion replay`);
      $('#'+key+'-download').href = row.video;
      $('#'+key+'-summary').textContent = condition === 'Cold'
        ? `No supplied path. Final selected verified TCP length: ${formatLength(row.finalLength)}.`
        : `Common initial path: ${formatLength(row.initialLength)}. Final selected verified TCP length: ${formatLength(row.finalLength)}.`;
    }
    $('#play-together').textContent = 'Play together'; drawLengthChart();
  }
  function drawLengthChart() {
    const cold = data.trajectory.find(r => r.object === trajectoryObject && r.condition === 'Cold');
    const warm = data.trajectory.find(r => r.object === trajectoryObject && r.condition === 'Warm');
    const item = data.objects.find(o => o.id === trajectoryObject);
    const values = [...cold.checkpoints,...warm.checkpoints].filter(p => p.length != null).map(p => p.length);
    const min = Math.max(0, Math.min(...values)*.88), max = Math.max(...values)*1.07;
    const width=550,height=265,left=58,right=16,top=23,bottom=40;
    const x = k => left+(width-left-right)*k/20;
    const y = value => height-bottom-(height-top-bottom)*(value-min)/(max-min || 1);
    let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="length-title length-desc"><title id="length-title">${item.label} verified TCP lengths</title><desc id="length-desc">Cold and Warm selected path lengths at the saved motion checks. The Cold initialization has no path.</desc>`;
    for (let i=0;i<4;i++) {
      const value=min+(max-min)*i/3, yy=y(value);
      svg += `<line x1="${left}" y1="${yy}" x2="${width-right}" y2="${yy}" stroke="#e4e9f0" stroke-width="1"/><text x="${left-10}" y="${yy+4}" text-anchor="end" fill="#647185" font-family="Arial,sans-serif" font-size="12">${value.toFixed(1)}</text>`;
    }
    svg += `<path d="M${left} ${top}V${height-bottom}H${width-right}" fill="none" stroke="#9daabc" stroke-width="1"/>`;
    for (const step of [0,5,10,15,20]) svg += `<text x="${x(step)}" y="${height-bottom+22}" text-anchor="middle" fill="#647185" font-family="Arial,sans-serif" font-size="12">${step}</text>`;
    for (const [row,color] of [[cold,'#345c91'],[warm,'#b16540']]) {
      const pts=row.checkpoints.filter(p => p.length != null);
      const path=pts.map((p,i)=>`${i?'L':'M'}${x(p.step).toFixed(2)},${y(p.length).toFixed(2)}`).join(' ');
      svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${row.condition==='Cold'?3.5:2}"/>`;
      for (const p of pts) {
        if (row.condition==='Cold') svg += `<circle cx="${x(p.step)}" cy="${y(p.length)}" r="4" fill="white" stroke="${color}" stroke-width="2"><title>Cold update ${p.step}: ${p.length.toFixed(3)} m</title></circle>`;
        else svg += `<rect x="${x(p.step)-3}" y="${y(p.length)-3}" width="6" height="6" fill="${color}"><title>Warm update ${p.step}: ${p.length.toFixed(3)} m</title></rect>`;
      }
    }
    svg += `<text x="${left}" y="13" fill="#647185" font-family="Arial,sans-serif" font-size="12">TCP length (m)</text><text x="${(width+left-right)/2}" y="${height-3}" text-anchor="middle" fill="#647185" font-family="Arial,sans-serif" font-size="12">Update step</text></svg>`;
    $('#length-chart').innerHTML=svg;
  }
  const pair = [$('#cold-video'),$('#warm-video')];
  function updatePlayButton() {$('#play-together').textContent = pair.some(v => !v.paused) ? 'Pause together' : 'Play together';}
  $('#play-together').addEventListener('click', async () => {
    if (pair.some(v => !v.paused)) {pair.forEach(v => v.pause());return;}
    if (pair.every(v => v.ended)) pair.forEach(v => {v.currentTime=0;});
    try {await Promise.all(pair.map(v => v.play()));$('#playback-status').textContent='';}
    catch {$('#playback-status').textContent='Use the video controls to start playback.';}
    updatePlayButton();
  });
  $('#reset-pair').addEventListener('click', () => {pair.forEach(v => {v.pause();v.currentTime=0;});$('#playback-status').textContent='';updatePlayButton();});
  pair.forEach((video, index) => {
    const other=pair[1-index];
    video.addEventListener('play', () => {if ($('#sync-playback').checked && other.paused) other.play().catch(()=>{});updatePlayButton();});
    video.addEventListener('pause', () => {if ($('#sync-playback').checked && !other.paused) other.pause();updatePlayButton();});
    video.addEventListener('ended', updatePlayButton);
    video.addEventListener('seeking', () => {
      if (!$('#sync-playback').checked || syncing || Math.abs(video.currentTime-other.currentTime)<.15) return;
      syncing=true;other.currentTime=video.currentTime;setTimeout(()=>{syncing=false;},180);
    });
    video.addEventListener('error', () => {$('#playback-status').textContent='Video unavailable. Try the download link.';});
  });
  // Pause offscreen media instead of keeping multiple renderings running.
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {if (!entry.isIntersecting && !pair.includes(entry.target)) entry.target.pause();}),{threshold:.02});
  document.querySelectorAll('video').forEach(v => observer.observe(v));
  objectTabs('#one-step-tabs',oneStepObject,updateOneStep);
  objectTabs('#trajectory-tabs',trajectoryObject,updateTrajectory);
  updateOneStep(oneStepObject);updateTrajectory(trajectoryObject);
})();
