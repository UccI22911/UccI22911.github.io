'use strict';
(() => {
  const data = window.REGRASP_DATA;
  if (!data) return;
  const allVideos = [...document.querySelectorAll('video')];
  const pairControllers = new Map();
  function pauseOutside(card, active) {
    allVideos.forEach(video => {
      if (video === active || (card && card.contains(video))) return;
      if (!video.paused) video.pause();
    });
  }
  allVideos.forEach(video => {
    video.addEventListener('play', () => {
      const card = video.closest('.trajectory-card');
      const controller = card && pairControllers.get(card);
      pauseOutside(controller && (controller.linked.checked || controller.starting) ? card : null, video);
    });
  });
  function drawLengthChart(container) {
    const id = container.dataset.chart;
    const object = data.objects.find(row => row.id === id);
    const rows = ['Cold', 'Warm'].map(condition => data.trajectory.find(row => row.object === id && row.condition === condition));
    const values = rows.flatMap(row => row.checkpoints).filter(point => point.length != null).map(point => point.length);
    const min = Math.max(0, Math.min(...values) * .86), max = Math.max(...values) * 1.07;
    const width = 600, height = 190, left = 50, right = 12, top = 22, bottom = 36;
    const x = k => left + (width - left - right) * k / 20;
    const y = length => height - bottom - (height - top - bottom) * (length - min) / (max - min || 1);
    const prefix = `length-${id}`;
    let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${prefix}-title ${prefix}-description"><title id="${prefix}-title">${object.label}: verified TCP path length</title><desc id="${prefix}-description">Saved Cold and Warm path lengths at updates zero, five, ten, fifteen and twenty. Missing lengths have no plotted value. Cold has no initial path.</desc>`;
    for (let i = 0; i < 3; i++) {
      const value = min + (max - min) * i / 2;
      svg += `<line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}" stroke="#e3e7ec"/><text x="${left - 9}" y="${y(value) + 5}" text-anchor="end">${value.toFixed(1)}</text>`;
    }
    svg += `<path d="M${left} ${top}V${height - bottom}H${width - right}" fill="none" stroke="#8c98a8"/>`;
    for (const k of [0, 5, 10, 15, 20]) svg += `<text x="${x(k)}" y="${height - bottom + 22}" text-anchor="middle">${k}</text>`;
    for (const row of rows) {
      const cold = row.condition === 'Cold', color = cold ? '#345c91' : '#b16540';
      let path = '', continuous = false;
      for (const point of row.checkpoints) {
        if (point.length == null) { continuous = false; continue; }
        path += `${continuous ? 'L' : 'M'}${x(point.step)},${y(point.length)} `;
        continuous = true;
      }
      svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${cold ? 3.7 : 2.2}"/>`;
      for (const point of row.checkpoints.filter(point => point.length != null)) {
        const title = `${row.condition}, update ${point.step}: ${point.length.toFixed(3)} m`;
        svg += cold
          ? `<circle cx="${x(point.step)}" cy="${y(point.length)}" r="3.4" fill="white" stroke="${color}" stroke-width="1.8"><title>${title}</title></circle>`
          : `<rect x="${x(point.step) - 2.6}" y="${y(point.length) - 2.6}" width="5.2" height="5.2" fill="${color}"><title>${title}</title></rect>`;
      }
    }
    svg += `<text x="${left}" y="14">Length (m)</text><text x="${width - right}" y="${height - 1}" text-anchor="end">Update</text></svg>`;
    container.innerHTML = svg;
  }
  document.querySelectorAll('[data-chart]').forEach(drawLengthChart);
  document.querySelectorAll('.trajectory-card').forEach(card => {
    const videos = [...card.querySelectorAll('video')];
    const button = card.querySelector('[data-play-pair]'), reset = card.querySelector('[data-reset-pair]');
    const linked = card.querySelector('[data-link-pair]'), status = card.querySelector('.playback-status');
    let seeking = false;
    const controller = {linked, starting: false};
    pairControllers.set(card, controller);
    const updateButton = () => { button.textContent = videos.some(video => !video.paused) ? 'Pause pair' : 'Play pair'; };
    button.addEventListener('click', async () => {
      if (videos.some(video => !video.paused)) { videos.forEach(video => video.pause()); return; }
      pauseOutside(card);
      if (videos.every(video => video.ended)) videos.forEach(video => { video.currentTime = 0; });
      controller.starting = true;
      try { await Promise.all(videos.map(video => video.play())); status.textContent = ''; }
      catch { status.textContent = 'Use the native video controls to start playback.'; }
      finally { controller.starting = false; }
      updateButton();
    });
    reset.addEventListener('click', () => {
      videos.forEach(video => { video.pause(); if (video.readyState) video.currentTime = 0; });
      status.textContent = ''; updateButton();
    });
    videos.forEach((video, index) => {
      const other = videos[1 - index];
      video.addEventListener('play', () => { if (linked.checked && other.paused) other.play().catch(() => {}); updateButton(); });
      video.addEventListener('pause', () => { if (linked.checked && !other.paused) other.pause(); updateButton(); });
      video.addEventListener('ended', updateButton);
      video.addEventListener('seeking', () => {
        if (!linked.checked || seeking || !other.readyState || Math.abs(video.currentTime - other.currentTime) < .15) return;
        seeking = true; other.currentTime = video.currentTime; setTimeout(() => { seeking = false; }, 180);
      });
      video.addEventListener('error', () => { status.textContent = 'Try the MP4 download link if this video is unavailable.'; });
    });
  });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting && !entry.target.paused) entry.target.pause();
  }), {threshold: .02});
  allVideos.forEach(video => observer.observe(video));
  const dialog = document.getElementById('figure-dialog');
  let trigger;
  document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
    trigger = button;
    document.getElementById('figure-dialog-title').textContent = button.dataset.title;
    const image = document.getElementById('expanded-figure');
    image.src = button.dataset.image; image.alt = button.dataset.title;
    document.getElementById('original-figure-link').href = button.dataset.image;
    dialog.showModal();
  }));
  document.getElementById('close-figure').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => trigger?.focus());
})();
