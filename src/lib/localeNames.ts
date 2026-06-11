// Display-only auto-translation to Uzbek (UZ mode). Two layers:
//  1) Curated dictionary (Category/Account/Entity nameUz) — instant, exact match.
//  2) AI fallback for any other Cyrillic text via /api/translate, cached
//     (client localStorage + server TranslationCache).
// SAFE: display-only, never touches numbers/inputs/textarea/code, reverts on RU,
// fully wrapped in try/catch so it can never crash the app.
import i18n from '../i18n';
import { useFinanceStore } from '../modules/finance/financeStore';

const SKIP = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'NOSCRIPT']);
const CYR = /[А-Яа-яЁё]/;
const GLOSSARY = new Set(['БОК', 'МЧЖ', 'Asia Best', 'INN', 'ИНН']);
const CACHE_KEY = 'manor_uz_cache_v1';

let touched: { node: Text; original: string }[] = [];
let observer: MutationObserver | null = null;
let active = false;

const aiCache = new Map<string, string>();
const queue: string[] = [];
const waiting = new Map<string, Set<Text>>();
let timer: ReturnType<typeof setTimeout> | null = null;
let processing = false;

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) for (const [k, v] of Object.entries(JSON.parse(raw))) aiCache.set(k, v as string);
  } catch { /* ignore */ }
}
function saveCache() {
  try {
    const obj: Record<string, string> = {};
    aiCache.forEach((v, k) => { obj[k] = v; });
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch { /* ignore */ }
}

function buildDict(): Map<string, string> {
  const d = new Map<string, string>();
  try {
    const st = useFinanceStore.getState() as { categories?: { name: string; nameUz?: string }[]; accounts?: { name: string; nameUz?: string }[] };
    for (const c of st.categories || []) if (c?.nameUz) d.set(c.name, c.nameUz);
    for (const a of st.accounts || []) if (a?.nameUz) d.set(a.name, a.nameUz);
  } catch { /* store not ready */ }
  d.set('«Бекобод Овқатланиш комбинати» МЧЖ', '«Bekobod Ovqatlanish kombinati» MChJ');
  return d;
}

function applyToNode(node: Text, key: string, uz: string) {
  const raw = node.nodeValue ?? '';
  if (!raw.includes(key) || !uz || uz === key) return;
  touched.push({ node, original: raw });
  node.nodeValue = raw.replace(key, uz);
}

async function aiTranslate(text: string): Promise<string | null> {
  try {
    const res = await fetch('/api/translate', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ text, sourceLang: 'ru', targetLang: 'uz' }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data && data.translatedText) || null;
  } catch { return null; }
}

async function processQueue() {
  if (processing) return;
  processing = true;
  try {
    while (active && queue.length) {
      const batch = queue.splice(0, 6);
      await Promise.all(batch.map(async (text) => {
        const uz = await aiTranslate(text);
        if (uz && uz !== text) {
          aiCache.set(text, uz);
          const nodes = waiting.get(text);
          if (nodes) nodes.forEach((n) => { if (n.isConnected) applyToNode(n, text, uz); });
        }
        waiting.delete(text);
      }));
    }
    saveCache();
  } catch { /* ignore */ } finally { processing = false; }
}

function enqueue(text: string, node: Text) {
  let set = waiting.get(text);
  if (!set) { set = new Set(); waiting.set(text, set); queue.push(text); }
  set.add(node);
  if (timer) clearTimeout(timer);
  timer = setTimeout(processQueue, 250);
}

function translateNode(node: Text, dict: Map<string, string>) {
  const raw = node.nodeValue ?? '';
  const key = raw.trim();
  if (!key || key.length < 2 || !CYR.test(key)) return;
  if (GLOSSARY.has(key)) return;
  const uz = dict.get(key);
  if (uz) { applyToNode(node, key, uz); return; }
  const cached = aiCache.get(key);
  if (cached) { applyToNode(node, key, cached); return; }
  enqueue(key, node);
}

function walk(root: Node, dict: Map<string, string>) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = (n as Text).parentElement;
      if (!p || SKIP.has(p.tagName) || p.isContentEditable) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = w.nextNode())) translateNode(n as Text, dict);
}

export function applyUz() {
  try {
    active = true;
    const dict = buildDict();
    walk(document.body, dict);
    if (!observer) {
      observer = new MutationObserver((muts) => {
        if (!active) return;
        const d = buildDict();
        for (const m of muts) {
          m.addedNodes.forEach((nd) => {
            if (nd.nodeType === 1) walk(nd, d);
            else if (nd.nodeType === 3) translateNode(nd as Text, d);
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  } catch { /* never break the app over translation */ }
}

export function restoreRu() {
  try {
    active = false;
    observer?.disconnect();
    observer = null;
    queue.length = 0; waiting.clear();
    for (const { node, original } of touched) if (node.isConnected) node.nodeValue = original;
    touched = [];
  } catch { /* ignore */ }
}

export function initLocaleNames() {
  loadCache();
  const onLang = (lng: string) => {
    if (lng && lng.startsWith('uz')) setTimeout(applyUz, 0);
    else restoreRu();
  };
  i18n.on('languageChanged', onLang);
  if (i18n.language && i18n.language.startsWith('uz')) setTimeout(applyUz, 300);
}
