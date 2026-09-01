const api = {
  async get(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    return res.json();
  },
  async post(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  },
};

let merchants = [];
const STORAGE_KEY = "kard.studentId";

async function loadMerchants() {
  merchants = await api.get("/api/merchants");
  const grid = document.getElementById("merchants");
  grid.innerHTML = "";
  for (const m of merchants) {
    const card = document.createElement("div");
    card.className = "merchant-card";
    card.innerHTML = `
      <h3>${m.name}</h3>
      <div class="cat">${m.category}</div>
      <div class="rate">${m.rewardRate}× points per $1</div>
      <ul>${m.rewards
        .map((r) => `<li><span>${r.title}</span><span class="cost">${r.cost} pts</span></li>`)
        .join("")}</ul>`;
    grid.appendChild(card);
  }
}

function renderCard(student) {
  const wrap = document.getElementById("cardWrap");
  const tpl = document.getElementById("cardTemplate").content.cloneNode(true);

  const set = (field, value) => {
    const el = tpl.querySelector(`[data-field="${field}"]`);
    if (el) el.textContent = value;
  };
  set("cardNumber", student.cardNumber);
  set("name", student.name);
  set("points", student.points);

  const earnSelect = tpl.querySelector('[data-field="earnMerchant"]');
  earnSelect.innerHTML = merchants
    .map((m) => `<option value="${m.id}">${m.name}</option>`)
    .join("");

  const redeemSelect = tpl.querySelector('[data-field="redeemReward"]');
  redeemSelect.innerHTML = merchants
    .flatMap((m) => m.rewards.map((r) => ({ ...r, merchant: m.name })))
    .map((r) => `<option value="${r.id}">${r.title} — ${r.cost} pts (${r.merchant})</option>`)
    .join("");

  const flash = tpl.querySelector('[data-field="flash"]');
  const showFlash = (msg, bad = false) => {
    flash.textContent = msg;
    flash.hidden = false;
    flash.classList.toggle("bad", bad);
  };

  const history = tpl.querySelector('[data-field="history"]');
  history.innerHTML = (student.transactions || [])
    .map((t) => {
      const cls = t.points >= 0 ? "pts-earn" : "pts-redeem";
      const sign = t.points >= 0 ? "+" : "";
      return `<li><span>${t.description}</span><span class="${cls}">${sign}${t.points}</span></li>`;
    })
    .join("");

  tpl.querySelector('[data-action="earn"]').addEventListener("click", async () => {
    try {
      const merchantId = Number(earnSelect.value);
      const amount = Number(tpl && document.querySelector('[data-field="earnAmount"]')?.value);
      const r = await api.post(`/api/students/${student.id}/earn`, { merchantId, amount });
      showFlash(`Earned ${r.earned} points! New balance: ${r.balance}`);
      await refresh(student.id);
    } catch (e) {
      showFlash(e.message, true);
    }
  });

  tpl.querySelector('[data-action="redeem"]').addEventListener("click", async () => {
    try {
      const rewardId = Number(redeemSelect.value);
      const r = await api.post(`/api/students/${student.id}/redeem`, { rewardId });
      showFlash(`Redeemed "${r.redeemed}". Balance: ${r.balance}`);
      await refresh(student.id);
    } catch (e) {
      showFlash(e.message, true);
    }
  });

  tpl.querySelector('[data-action="reset"]').addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  wrap.innerHTML = "";
  wrap.appendChild(tpl);
}

async function refresh(id) {
  const student = await api.get(`/api/students/${id}`);
  renderCard(student);
}

document.getElementById("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = document.getElementById("createError");
  err.hidden = true;
  try {
    const student = await api.post("/api/students", {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
    });
    localStorage.setItem(STORAGE_KEY, student.id);
    await refresh(student.id);
  } catch (e2) {
    err.textContent = e2.message;
    err.hidden = false;
  }
});

async function init() {
  await loadMerchants();
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      await refresh(Number(saved));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

init();
