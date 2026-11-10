const states = require("./data/indiaStatesDistricts.json");
const citiesByState = require("./data/indiaStateCities.json");
const citiesByDistrict = require("./data/indiaDistrictCities.json");

function cleanCity(value) {
  return String(value || "").replace(/\*+$/g, "").trim();
}

function listStates() {
  return states
    .map((state) => ({ code: state.code, name: state.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function findState(stateName) {
  const key = String(stateName || "").trim().toLowerCase();
  if (!key) return null;
  return states.find((state) => state.name.toLowerCase() === key || state.code.toLowerCase() === key) || null;
}

function listDistricts(stateName) {
  const state = findState(stateName);
  if (!state) return [];
  return state.districts.map((district) => district.name).sort((a, b) => a.localeCompare(b));
}

const PLACE_SKIP = new Set(["and", "the", "rural", "urban", "city", "town", "north", "south", "east", "west", "new"]);

function placeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\*+/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function placeTokens(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\*+/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !PLACE_SKIP.has(token));
}

function districtScore(city, district) {
  const cityKey = placeKey(city);
  const districtKey = placeKey(district);
  if (!cityKey || !districtKey) return 0;
  if (cityKey === districtKey) return 100;
  if (cityKey.includes(districtKey) || districtKey.includes(cityKey)) return 80;
  const shared = placeTokens(city).filter((token) => placeTokens(district).includes(token));
  if (shared.length) return 50 + shared.join("").length;
  return 0;
}

function stateCityMap(stateLabel) {
  const key = Object.keys(citiesByDistrict).find((name) => name.toLowerCase() === stateLabel.toLowerCase());
  return key ? citiesByDistrict[key] : null;
}

function citiesForDistrict(stateLabel, district) {
  const map = stateCityMap(stateLabel);
  if (!map) return [];
  const wanted = placeKey(district);
  const names = Object.keys(map);
  const exact = names.find((name) => placeKey(name) === wanted);
  if (exact) return map[exact].map(cleanCity).filter(Boolean);
  const partial = names
    .filter((name) => {
      const key = placeKey(name);
      return key.length >= 5 && (wanted.includes(key) || key.includes(wanted));
    })
    .sort((a, b) => placeKey(b).length - placeKey(a).length);
  return partial[0] ? map[partial[0]].map(cleanCity).filter(Boolean) : [];
}

function listCities(stateName, districtName) {
  const state = findState(stateName);
  const stateLabel = state?.name || String(stateName || "").trim();
  const district = String(districtName || "").trim();
  if (!district) return [];

  const cityKey = Object.keys(citiesByState).find((name) => name.toLowerCase() === stateLabel.toLowerCase());
  const stateCities = cityKey ? citiesByState[cityKey].map(cleanCity).filter(Boolean) : [];
  const districtNames = state ? state.districts.map((item) => item.name) : [district];
  const owned = stateCities.filter((city) => {
    let bestName = "";
    let bestScore = 0;
    for (const name of districtNames) {
      const score = districtScore(city, name);
      if (score > bestScore) {
        bestScore = score;
        bestName = name;
      }
    }
    return bestScore >= 50 && bestName.toLowerCase() === district.toLowerCase();
  });

  const unique = [...new Set([...citiesForDistrict(stateLabel, district), ...owned])];
  if (!unique.some((city) => city.toLowerCase() === district.toLowerCase())) {
    unique.unshift(district);
  }
  return unique.sort((a, b) => a.localeCompare(b));
}

module.exports = { listStates, listDistricts, listCities };
