// Quora Markdown Renderer

function applyInline(text) {
  const parts = [];
  const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~)/g;
  let match;
  let lastIndex = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    let el;
    if (match[2] !== undefined) {
      // ***太字イタリック***
      const strong = document.createElement('strong');
      const em = document.createElement('em');
      em.textContent = match[2];
      strong.appendChild(em);
      el = strong;
    } else if (match[3] !== undefined) {
      el = document.createElement('strong');
      el.textContent = match[3];
    } else if (match[4] !== undefined) {
      el = document.createElement('em');
      el.textContent = match[4];
    } else if (match[5] !== undefined) {
      el = document.createElement('span');
      el.style.textDecoration = 'line-through';
      el.textContent = match[5];
    }
    if (el) parts.push(el);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(document.createTextNode(text.slice(lastIndex)));
  }
  return parts;
}

function processTextNode(node) {
  const text = node.textContent;
  const parent = node.parentNode;
  if (!parent) return;

  // 見出し
  const headingMatch = text.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const el = document.createElement('h' + level);
    el.style.cssText = `margin:12px 0 6px;font-weight:bold;font-size:${1.6 - (level - 1) * 0.15}em`;
    applyInline(headingMatch[2]).forEach(n => el.appendChild(n));
    parent.replaceChild(el, node);
    return;
  }

  // インライン記法
  if (!/\*\*\*|\*\*|~~|\*/.test(text)) return;

  const parts = applyInline(text);
  if (parts.length === 1 && parts[0].nodeType === Node.TEXT_NODE) return;

  const fragment = document.createDocumentFragment();
  parts.forEach(p => fragment.appendChild(p));
  parent.replaceChild(fragment, node);
}

function walkTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach(processTextNode);
}

walkTextNodes(document.body);

const observer = new MutationObserver(mutations => {
  mutations.forEach(m => {
    m.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) walkTextNodes(node);
      else if (node.nodeType === Node.TEXT_NODE) processTextNode(node);
    });
  });
});
observer.observe(document.body, { childList: true, subtree: true });