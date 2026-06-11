const STORAGE_KEY = "iheadiary-headache-records-v1";
const REMINDER_KEY = "iheadiary-reminders-v1";

const triggers = [
  "睡眠不足",
  "壓力",
  "咖啡因",
  "天氣變化",
  "螢幕時間",
  "生理期",
  "脫水",
  "噪音",
  "飲食",
  "運動後"
];

const severityWords = [
  "無痛",
  "非常輕微",
  "輕微",
  "可忍受",
  "偏輕",
  "中度",
  "明顯",
  "偏強",
  "強烈",
  "非常強烈",
  "劇烈"
];

const dom = {
  form: document.querySelector("#entry-form"),
  date: document.querySelector("#entry-date"),
  time: document.querySelector("#entry-time"),
  severity: document.querySelector("#severity"),
  severityValue: document.querySelector("#severity-value"),
  severityWord: document.querySelector("#severity-word"),
  duration: document.querySelector("#duration"),
  location: document.querySelector("#location"),
  triggerTags: document.querySelector("#trigger-tags"),
  medication: document.querySelector("#medication"),
  sleep: document.querySelector("#sleep"),
  stress: document.querySelector("#stress"),
  stressValue: document.querySelector("#stress-value"),
  water: document.querySelector("#water"),
  waterValue: document.querySelector("#water-value"),
  notes: document.querySelector("#notes"),
  metrics: document.querySelector("#metrics"),
  rangeFilter: document.querySelector("#range-filter"),
  chart: document.querySelector("#trend-chart"),
  triggerBars: document.querySelector("#trigger-bars"),
  rhythmCard: document.querySelector("#rhythm-card"),
  summary: document.querySelector("#doctor-summary"),
  history: document.querySelector("#history-list"),
  toast: document.querySelector("#toast"),
  clearForm: document.querySelector("#clear-form"),
  clearData: document.querySelector("#clear-data"),
  resetDemo: document.querySelector("#reset-demo"),
  copySummary: document.querySelector("#copy-summary"),
  diaryReminder: document.querySelector("#diary-reminder"),
  waterReminder: document.querySelector("#water-reminder"),
  reminderCopy: document.querySelector("#reminder-copy")
};

let records = loadRecords();
let reminders = loadReminders();

function loadRecords() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return makeSeedRecords();
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : makeSeedRecords();
  } catch {
    return makeSeedRecords();
  }
}

function loadReminders() {
  const stored = localStorage.getItem(REMINDER_KEY);
  if (!stored) {
    return { diary: "21:30", water: "每 3 小時" };
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      diary: parsed.diary || "21:30",
      water: parsed.water || "關閉"
    };
  } catch {
    return { diary: "21:30", water: "每 3 小時" };
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function saveReminders() {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
}

function makeSeedRecords() {
  const today = startOfDay(new Date());
  const seed = [
    { offset: 1, time: "15:20", severity: 4, duration: 60, location: "太陽穴", triggers: ["螢幕時間", "壓力"], medication: "未用藥", sleep: 6.5, stress: 3, water: 1500, notes: "會議後出現悶痛，休息後緩解。" },
    { offset: 3, time: "08:10", severity: 7, duration: 180, location: "單側", triggers: ["睡眠不足", "咖啡因", "壓力"], medication: "偏頭痛急性用藥", sleep: 5, stress: 5, water: 1000, notes: "畏光，服藥後約一小時下降。" },
    { offset: 6, time: "19:40", severity: 5, duration: 180, location: "前額", triggers: ["天氣變化", "脫水"], medication: "NSAID 止痛藥", sleep: 7, stress: 2, water: 900, notes: "下雨前悶脹，補水與晚餐後改善。" },
    { offset: 9, time: "13:00", severity: 3, duration: 30, location: "眼窩周圍", triggers: ["螢幕時間"], medication: "未用藥", sleep: 7.5, stress: 2, water: 1600, notes: "午休後消退。" },
    { offset: 12, time: "22:15", severity: 8, duration: 360, location: "全頭", triggers: ["睡眠不足", "噪音", "壓力"], medication: "偏頭痛急性用藥", sleep: 4.5, stress: 5, water: 1200, notes: "伴隨噁心，隔天早上仍有殘痛。" },
    { offset: 17, time: "10:30", severity: 6, duration: 180, location: "後腦", triggers: ["天氣變化", "飲食"], medication: "普拿疼/乙醯胺酚", sleep: 6, stress: 3, water: 1300, notes: "早餐較晚，後頸緊繃。" },
    { offset: 24, time: "16:05", severity: 5, duration: 60, location: "太陽穴", triggers: ["咖啡因", "螢幕時間"], medication: "未用藥", sleep: 6.5, stress: 3, water: 1700, notes: "咖啡後心悸，傍晚頭痛。" }
  ];

  return seed.map((item, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - item.offset);
    return {
      id: `seed-${index}-${date.getTime()}`,
      date: toDateInput(date),
      time: item.time,
      severity: item.severity,
      duration: item.duration,
      location: item.location,
      triggers: item.triggers,
      medication: item.medication,
      sleep: item.sleep,
      stress: item.stress,
      water: item.water,
      notes: item.notes
    };
  });
}

function init() {
  buildTriggerControls();
  setDefaultDateTime();
  dom.diaryReminder.value = reminders.diary;
  dom.waterReminder.value = reminders.water;
  updateScale();
  updateStress();
  updateWater();
  bindEvents();
  persistSeedIfNeeded();
  render();
}

function persistSeedIfNeeded() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    saveRecords();
  }
}

function bindEvents() {
  dom.severity.addEventListener("input", updateScale);
  dom.stress.addEventListener("input", updateStress);
  dom.water.addEventListener("input", updateWater);
  dom.rangeFilter.addEventListener("change", render);
  dom.form.addEventListener("submit", handleSubmit);
  dom.clearForm.addEventListener("click", resetForm);
  dom.clearData.addEventListener("click", clearAllRecords);
  dom.resetDemo.addEventListener("click", resetDemoData);
  dom.copySummary.addEventListener("click", copySummary);
  dom.diaryReminder.addEventListener("change", updateReminders);
  dom.waterReminder.addEventListener("change", updateReminders);
  window.addEventListener("resize", () => drawTrendChart(getFilteredRecords()));
}

function buildTriggerControls() {
  dom.triggerTags.innerHTML = triggers
    .map((trigger) => {
      const id = `trigger-${trigger}`;
      return `
        <label class="tag-check" for="${id}">
          <input type="checkbox" id="${id}" value="${trigger}" name="triggers">
          <span>${trigger}</span>
        </label>
      `;
    })
    .join("");
}

function setDefaultDateTime() {
  const now = new Date();
  dom.date.value = toDateInput(now);
  dom.time.value = now.toTimeString().slice(0, 5);
}

function updateScale() {
  const value = Number(dom.severity.value);
  dom.severityValue.textContent = value;
  dom.severityWord.textContent = severityWords[value];
}

function updateStress() {
  dom.stressValue.textContent = dom.stress.value;
}

function updateWater() {
  dom.waterValue.textContent = `${dom.water.value} ml`;
}

function handleSubmit(event) {
  event.preventDefault();
  const selectedTriggers = Array.from(document.querySelectorAll("input[name='triggers']:checked")).map((input) => input.value);
  const record = {
    id: `record-${Date.now()}`,
    date: dom.date.value,
    time: dom.time.value,
    severity: Number(dom.severity.value),
    duration: Number(dom.duration.value),
    location: dom.location.value,
    triggers: selectedTriggers,
    medication: dom.medication.value,
    sleep: Number(dom.sleep.value),
    stress: Number(dom.stress.value),
    water: Number(dom.water.value),
    notes: dom.notes.value.trim()
  };

  records = [record, ...records].sort(sortByDateDesc);
  saveRecords();
  resetForm(false);
  render();
  showToast("已儲存新的頭痛日誌。");
}

function resetForm(showMessage = true) {
  dom.form.reset();
  setDefaultDateTime();
  dom.severity.value = 5;
  dom.sleep.value = 6.5;
  dom.stress.value = 3;
  dom.water.value = 1500;
  updateScale();
  updateStress();
  updateWater();
  if (showMessage) {
    showToast("表單已清空。");
  }
}

function clearAllRecords() {
  if (!window.confirm("確定要清除所有頭痛紀錄？此動作只會影響本機瀏覽器資料。")) {
    return;
  }

  records = [];
  saveRecords();
  render();
  showToast("所有紀錄已清除。");
}

function resetDemoData() {
  records = makeSeedRecords();
  saveRecords();
  render();
  showToast("已載入範例資料。");
}

function updateReminders() {
  reminders = {
    diary: dom.diaryReminder.value,
    water: dom.waterReminder.value
  };
  saveReminders();
  renderReminder();
  showToast("提醒設定已更新。");
}

function getFilteredRecords() {
  const days = Number(dom.rangeFilter.value);
  const cutoff = startOfDay(new Date());
  cutoff.setDate(cutoff.getDate() - days + 1);
  return records
    .filter((record) => new Date(`${record.date}T00:00:00`) >= cutoff)
    .sort(sortByDateAsc);
}

function render() {
  const filtered = getFilteredRecords();
  renderMetrics(filtered);
  drawTrendChart(filtered);
  renderTriggerBars(filtered);
  renderRhythm(filtered);
  renderSummary(filtered);
  renderReminder();
  renderHistory();
}

function renderMetrics(filtered) {
  const avgSeverity = average(filtered.map((record) => record.severity));
  const attackDays = new Set(filtered.map((record) => record.date)).size;
  const highPain = filtered.filter((record) => record.severity >= 7).length;
  const medicationCount = filtered.filter((record) => record.medication !== "未用藥").length;
  const metrics = [
    { label: "平均痛感", value: filtered.length ? avgSeverity.toFixed(1) : "0", note: `期間內 ${filtered.length} 筆紀錄` },
    { label: "發作天數", value: attackDays, note: `${dom.rangeFilter.value} 天視窗` },
    { label: "高痛感紀錄", value: highPain, note: "痛感 7 分以上" },
    { label: "用藥次數", value: medicationCount, note: "依日誌自行紀錄" }
  ];

  dom.metrics.innerHTML = metrics
    .map((metric) => `
      <article class="metric">
        <span>${metric.label}</span>
        <strong>${metric.value}</strong>
        <small>${metric.note}</small>
      </article>
    `)
    .join("");
}

function drawTrendChart(filtered) {
  const canvas = dom.chart;
  const parent = canvas.parentElement;
  const ratio = window.devicePixelRatio || 1;
  const width = parent.clientWidth;
  const height = 270;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const padding = { top: 24, right: 24, bottom: 42, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  ctx.strokeStyle = "rgba(23, 51, 49, 0.13)";
  ctx.lineWidth = 1;
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#667672";

  for (let i = 0; i <= 5; i += 1) {
    const y = padding.top + (plotHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    const label = String(10 - i * 2);
    ctx.fillText(label, 12, y + 4);
  }

  if (!filtered.length) {
    ctx.fillStyle = "#667672";
    ctx.font = "15px sans-serif";
    ctx.fillText("目前期間沒有紀錄", padding.left, height / 2);
    return;
  }

  const points = filtered.map((record, index) => {
    const x = filtered.length === 1
      ? padding.left + plotWidth / 2
      : padding.left + (plotWidth / (filtered.length - 1)) * index;
    const y = padding.top + plotHeight - (record.severity / 10) * plotHeight;
    return { x, y, record };
  });

  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.strokeStyle = "#0f6762";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.stroke();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.record.severity >= 7 ? 6 : 5, 0, Math.PI * 2);
    ctx.fillStyle = point.record.severity >= 7 ? "#d85c52" : "#1b8f86";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fffffb";
    ctx.stroke();
  });

  const first = filtered[0];
  const last = filtered[filtered.length - 1];
  ctx.fillStyle = "#667672";
  ctx.font = "12px sans-serif";
  ctx.fillText(formatShortDate(first.date), padding.left, height - 14);
  const lastLabel = formatShortDate(last.date);
  const lastWidth = ctx.measureText(lastLabel).width;
  ctx.fillText(lastLabel, width - padding.right - lastWidth, height - 14);
}

function renderTriggerBars(filtered) {
  const counts = countTriggers(filtered);
  const entries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (!entries.length) {
    dom.triggerBars.innerHTML = `<p class="empty-state">尚無誘因標籤。新增紀錄後會自動更新排行。</p>`;
    return;
  }

  const max = Math.max(...entries.map((entry) => entry[1]));
  dom.triggerBars.innerHTML = entries
    .map(([label, count]) => {
      const width = Math.max(8, Math.round((count / max) * 100));
      return `
        <div class="bar-item">
          <span>${label}</span>
          <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width: ${width}%"></div></div>
          <strong class="bar-count">${count} 次</strong>
        </div>
      `;
    })
    .join("");
}

function renderRhythm(filtered) {
  const avgSleep = average(filtered.map((record) => record.sleep));
  const avgStress = average(filtered.map((record) => record.stress));
  const avgWater = average(filtered.map((record) => record.water));
  const medRate = filtered.length
    ? filtered.filter((record) => record.medication !== "未用藥").length / filtered.length
    : 0;
  const sleepWidth = clamp((avgSleep / 9) * 100, 0, 100);
  const stressWidth = clamp((avgStress / 5) * 100, 0, 100);
  const waterWidth = clamp((avgWater / 2500) * 100, 0, 100);
  const medWidth = clamp(medRate * 100, 0, 100);
  const note = buildRhythmNote(avgSleep, avgStress, avgWater, filtered.length);

  dom.rhythmCard.innerHTML = `
    ${rhythmLine("平均睡眠", filtered.length ? `${avgSleep.toFixed(1)} 小時` : "0 小時", sleepWidth, "#55745c")}
    ${rhythmLine("平均壓力", filtered.length ? `${avgStress.toFixed(1)} / 5` : "0 / 5", stressWidth, "#b9822e")}
    ${rhythmLine("平均飲水", filtered.length ? `${Math.round(avgWater)} ml` : "0 ml", waterWidth, "#1b8f86")}
    ${rhythmLine("用藥比例", filtered.length ? `${Math.round(medRate * 100)}%` : "0%", medWidth, "#d85c52")}
    <p class="rhythm-note">${note}</p>
  `;
}

function rhythmLine(label, value, width, color) {
  return `
    <div class="rhythm-line">
      <strong>${label}<br>${value}</strong>
      <div class="rhythm-meter" aria-hidden="true"><span style="width: ${width}%; background: ${color}"></span></div>
    </div>
  `;
}

function buildRhythmNote(avgSleep, avgStress, avgWater, count) {
  if (!count) {
    return "新增幾筆紀錄後，這裡會整理生活狀態與頭痛日誌的關聯線索。";
  }
  const notes = [];
  if (avgSleep < 6) notes.push("睡眠偏少");
  if (avgStress >= 4) notes.push("壓力偏高");
  if (avgWater < 1400) notes.push("飲水偏低");
  if (!notes.length) {
    return "目前生活指標相對穩定，可持續觀察誘因標籤與痛感變化。";
  }
  return `${notes.join("、")}，建議在就醫或自我管理時一併回顧。`;
}

function renderSummary(filtered) {
  const sorted = [...filtered].sort(sortByDateDesc);
  const topTriggers = Object.entries(countTriggers(filtered))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => `${label} ${count} 次`)
    .join("、") || "尚無";
  const severeRecords = filtered.filter((record) => record.severity >= 7);
  const medicationUsed = filtered
    .filter((record) => record.medication !== "未用藥")
    .map((record) => record.medication);
  const medicationSummary = unique(medicationUsed).join("、") || "未記錄用藥";
  const avgSeverity = average(filtered.map((record) => record.severity));
  const avgSleep = average(filtered.map((record) => record.sleep));
  const recentNotes = sorted
    .filter((record) => record.notes)
    .slice(0, 2)
    .map((record) => `${formatDate(record.date)}：${record.notes}`)
    .join("\n");

  dom.summary.textContent = [
    `iHeaDiary 就醫摘要（近 ${dom.rangeFilter.value} 天）`,
    `紀錄筆數：${filtered.length} 筆，發作天數：${new Set(filtered.map((record) => record.date)).size} 天`,
    `平均痛感：${filtered.length ? avgSeverity.toFixed(1) : "0"} / 10，高痛感（7 分以上）：${severeRecords.length} 筆`,
    `常見誘因：${topTriggers}`,
    `用藥紀錄：${medicationSummary}`,
    `平均睡眠：${filtered.length ? avgSleep.toFixed(1) : "0"} 小時`,
    `最近備註：${recentNotes || "尚無備註"}`,
    "提醒：此摘要僅整理自我紀錄，不能取代醫療診斷。"
  ].join("\n");
}

function renderReminder() {
  const diary = reminders.diary ? `每日 ${reminders.diary}` : "尚未設定";
  const water = reminders.water || "關閉";
  dom.reminderCopy.textContent = `日誌提醒：${diary}。補水提醒：${water}。設定會保存在這台裝置的瀏覽器中。`;
}

function renderHistory() {
  const sorted = [...records].sort(sortByDateDesc).slice(0, 12);
  if (!sorted.length) {
    dom.history.innerHTML = `<p class="empty-state">目前沒有日誌。新增紀錄後，最近資料會顯示在這裡。</p>`;
    return;
  }

  dom.history.innerHTML = sorted
    .map((record) => `
      <article class="history-item">
        <div class="history-date">${formatDate(record.date)}<br>${record.time}</div>
        <div class="history-main">
          <strong>${record.location} · ${durationText(record.duration)}</strong>
          <span>${record.triggers.length ? record.triggers.join("、") : "未標記誘因"}</span>
        </div>
        <div class="history-meta">
          <span class="severity-pill">${record.severity} / 10</span><br>
          ${record.medication} · 睡眠 ${record.sleep} 小時
        </div>
        <button class="delete-entry" type="button" aria-label="刪除 ${formatDate(record.date)} 紀錄" data-id="${record.id}">×</button>
      </article>
    `)
    .join("");

  dom.history.querySelectorAll(".delete-entry").forEach((button) => {
    button.addEventListener("click", () => {
      records = records.filter((record) => record.id !== button.dataset.id);
      saveRecords();
      render();
      showToast("已刪除該筆紀錄。");
    });
  });
}

async function copySummary() {
  const text = dom.summary.textContent;
  try {
    await navigator.clipboard.writeText(text);
    showToast("就醫摘要已複製。");
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(dom.summary);
    selection.removeAllRanges();
    selection.addRange(range);
    showToast("已選取摘要文字，可手動複製。");
  }
}

function countTriggers(items) {
  return items.reduce((acc, record) => {
    record.triggers.forEach((trigger) => {
      acc[trigger] = (acc[trigger] || 0) + 1;
    });
    return acc;
  }, {});
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function unique(values) {
  return Array.from(new Set(values));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatShortDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function durationText(minutes) {
  if (minutes < 60) return `${minutes} 分鐘`;
  if (minutes === 60) return "約 1 小時";
  return `${Math.round(minutes / 60)} 小時`;
}

function sortByDateDesc(a, b) {
  return `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`);
}

function sortByDateAsc(a, b) {
  return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    dom.toast.classList.remove("is-visible");
  }, 2400);
}

init();
