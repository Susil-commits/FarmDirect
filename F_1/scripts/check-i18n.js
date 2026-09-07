import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/locales');
const enPath = path.join(localesDir, 'en/translation.json');
const hiPath = path.join(localesDir, 'hi/translation.json');

function loadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to load ${filePath}:`, err.message);
    process.exit(1);
  }
}

function getFlattenedKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getFlattenedKeys(v, fullKey));
    } else {
      keys.push({ key: fullKey, val: v });
    }
  }
  return keys;
}

const en = loadJson(enPath);
const hi = loadJson(hiPath);

const enKeys = getFlattenedKeys(en);
const hiKeys = getFlattenedKeys(hi);

const enKeyMap = new Map(enKeys.map((item) => [item.key, item.val]));
const hiKeyMap = new Map(hiKeys.map((item) => [item.key, item.val]));

let errors = 0;

// Keys in EN missing from HI
for (const key of enKeyMap.keys()) {
  if (!hiKeyMap.has(key)) {
    console.error(`❌ Missing in Hindi (hi): ${key}`);
    errors++;
  } else if (typeof hiKeyMap.get(key) === 'string' && hiKeyMap.get(key).trim() === '') {
    console.error(`❌ Empty Hindi translation for: ${key}`);
    errors++;
  }
}

// Keys in HI missing from EN
for (const [key] of hiKeyMap.entries()) {
  if (!enKeyMap.has(key)) {
    console.error(`❌ Extra in Hindi (not in EN): ${key}`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\nFound ${errors} i18n parity issues.`);
  process.exit(1);
} else {
  console.log(`✅ i18n key parity check passed (${enKeyMap.size} keys verified across EN and HI).`);
  process.exit(0);
}
