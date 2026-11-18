const cache = new Map();

function compactPlace(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function officeRows(offices) {
  return (Array.isArray(offices) ? offices : [])
    .map((office) => ({
      name: String(office?.Name || "").trim(),
      district: String(office?.District || "").trim(),
      state: String(office?.State || "").trim(),
      branch: String(office?.BranchType || "").trim(),
      pin: String(office?.Pincode || "").replace(/\D/g, "")
    }))
    .filter((office) => office.pin.length === 6);
}

function nameScore(office, cityKey) {
  if (!cityKey) return 0;
  const name = compactPlace(office.name);
  if (!name) return 0;
  if (name === cityKey) return 100;
  if (name.startsWith(cityKey) || cityKey.startsWith(name)) return 70;
  if (name.includes(cityKey) || cityKey.includes(name)) return 40;
  return 0;
}

function branchScore(office) {
  if (/head/i.test(office.branch)) return 15;
  if (/sub/i.test(office.branch)) return 8;
  return 0;
}

/** Pick one 6-digit PIN for a state, district, and city. Empty string when nothing matches. */
function choosePinCode(offices, { state = "", district = "", city = "" } = {}) {
  const stateKey = compactPlace(state);
  const districtKey = compactPlace(district);
  const cityKey = compactPlace(city);
  const rows = officeRows(offices);
  const sameState = rows.filter((office) => !stateKey || compactPlace(office.state) === stateKey);
  const pool = sameState.length ? sameState : rows;
  const sameDistrict = pool.filter((office) => !districtKey || compactPlace(office.district) === districtKey);
  const local = sameDistrict.length ? sameDistrict : [];
  if (!local.length) return "";

  const ranked = local
    .map((office) => ({
      office,
      place: nameScore(office, cityKey),
      total: nameScore(office, cityKey) + branchScore(office)
    }))
    .sort((a, b) => b.total - a.total);
  const best = ranked[0];
  if (!best) return "";
  if (best.place <= 0 && cityKey && cityKey !== districtKey) return "";
  return best.office.pin;
}

async function fetchPostOffices(name) {
  const query = String(name || "").trim();
  if (query.length < 3) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) return [];
    const payload = await response.json().catch(() => null);
    const row = Array.isArray(payload) ? payload[0] : null;
    if (!row || String(row.Status || "").toLowerCase() !== "success") return [];
    return Array.isArray(row.PostOffice) ? row.PostOffice : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function lookupPostalPin({ state, district, city }) {
  const key = [state, district, city].map((part) => compactPlace(part)).join("|");
  if (!key || key === "||") return "";
  if (cache.has(key)) return cache.get(key);
  const cityOffices = await fetchPostOffices(city);
  let pin = choosePinCode(cityOffices, { state, district, city });
  if (!pin && compactPlace(district) && compactPlace(district) !== compactPlace(city)) {
    const districtOffices = await fetchPostOffices(district);
    pin = choosePinCode(districtOffices, { state, district, city });
  }
  if (pin) cache.set(key, pin);
  return pin || "";
}

module.exports = { choosePinCode, lookupPostalPin };
