// Display-only substitution of reference names (Category/Account/Entity) to Uzbek.
// SAFE by design: only replaces text nodes whose FULL trimmed text exactly equals a
// known Russian name; never touches inputs, numbers, free text or partial strings.
// Active only in UZ; restoreRu() reverts. Audit: bilingual reference names.
import i18n from '../i18n';
import { useFinanceStore } from '../modules/finance/financeStore';

const SKIP = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'SCRIPT', 'STYLE', 'CODE', 'PRE']);
let touched: { node: Text; original: string }[] = [];
let observer: MutationObserver | null = null;

function buildDict(): Map<string, string> {
  const d = new Map<string, string>();
  try {
    const st: any = useFinanceStore.getState();
    for (const c of st.categories || []) if (c?.nameUz) d.set(c.name, c.nameUz);
    for (const a of st.accounts || []) if (a?.nameUz) d.set(a.name, a.nameUz);
  } catch { /* store not ready */ }
  d.set('«Бекобод Овқатланиш комбинати» МЧЖ', '«Bekobod Ovqatlanish kombinati» MChJ');
  return d;
}

function translateNode(node: Text, dict: Map<string, string>) {
  const raw = node.nodeValue ?? '';
  const key = raw.trim();
  if (!key) return;
  const uz = dict.get(key);
  if (uz && uz !== key) {
    touched.push({ node, original: raw });
    node.nodeValue = raw.replace(key, uz);
  }
}

function walk(root: Node, dict: Map<string, string>) {
  if (dict.size === 0) return;
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
    const dict = buildDict();
    walk(document.body, dict);
    if (!observer) {
      observer = new MutationObserver((muts) => {
        const dict2 = buildDict();
        for (const m of muts) {
          m.addedNodes.forEach((nd) => {
            if (nd.nodeType === 1) walk(nd, dict2);
            else if (nd.nodeType === 3) translateNode(nd as Text, dict2);
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  } catch { /* never break the app over translation */ }
}

export function restoreRu() {
  try {
    observer?.disconnect();
    observer = null;
    for (const { node, original } of touched) {
      if (node.isConnected) node.nodeValue = original;
    }
    touched = [];
  } catch { /* ignore */ }
}

export function initLocaleNames() {
  const onLang = (lng: string) => {
    if (lng && lng.startsWith('uz')) setTimeout(applyUz, 0);
    else restoreRu();
  };
  i18n.on('languageChanged', onLang);
  if (i18n.language && i18n.language.startsWith('uz')) setTimeout(applyUz, 300);
}
