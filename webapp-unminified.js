

​​​​​​​​​​​​​​​​​​​​​​​​​​SimpleMarkdown v1.0.0 - Markdown parsing based on CommonMark spec version 0.30: https://spec.commonmark.org/0.30/
document.addEventListener('DOMContentLoaded', () => {
  const defaultStyles = `body{font-family:Arial,sans-serif;margin:20px}h1{font-size:2em;color:#333}h2{font-size:1.5em;color:#555}p{line-height:1.6}ul,ol{margin:0 0 20px 20px}li{margin:5px 0}code{background:#f0f0f0;padding:2px 5px}pre{background:#f0f0f0;padding:10px;overflow:auto}a{color:#0066cc;text-decoration:none}a:hover{text-decoration:underline}blockquote{border-left:4px solid #ccc;padding:0 15px;color:#666}img{max-width:100%}`;
  const scriptTag = document.querySelector('script[src="webapp.js"]');
  const cssFile = scriptTag.getAttribute('data-css') || 'style.css';
  const noHeader = scriptTag.hasAttribute('data-no-header');
  const noFooter = scriptTag.hasAttribute('data-no-footer');

  fetch(cssFile).then(r => r.text()).then(c => {
    const s = document.createElement('style');
    s.textContent = c;
    document.head.appendChild(s);
  }).catch(() => {
    const s = document.createElement('style');
    s.textContent = defaultStyles;
    document.head.appendChild(s);
  });

  const rawContent = scriptTag.nextSibling.textContent.trim();

  const parseMarkdown = (text) => {
    let html = '', lines = text.split('\n'), inCodeBlock = false, listStack = [], buffer = '';
    
    const flushBuffer = () => {
      if (buffer.trim()) {
        let p = buffer;
        p = p.replace(/\\([*`[])/g, '$1');
        p = p.replace(/\*\*(.*?)\*\*/g, (_, t) => `<strong>${t.replace(/\*(.*?)\*/g, '<em>$1</em>')}</strong>`);
        p = p.replace(/\*(.*?)\*/g, '<em>$1</em>');
        p = p.replace(/`([^`]+)`/g, '<code>$1</code>');
        p = p.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
        p = p.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        html += `<p>${p}</p>`;
      }
      buffer = '';
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trimEnd(), indent = line.match(/^\s*/)[0].length;

      if (inCodeBlock && line === '```') {
        inCodeBlock = false;
        html += `<pre><code>${buffer}</code></pre>`;
        buffer = '';
        continue;
      }
      if (inCodeBlock) {
        buffer += line + '\n';
        continue;
      }

      if (line === '```') {
        flushBuffer();
        inCodeBlock = true;
        continue;
      }

      if (line.startsWith('#')) {
        flushBuffer();
        const level = line.match(/^#+/)?.[0].length || 1;
        if (level <= 6) {
          const text = line.replace(/^#+/, '').trim();
          html += `<h${level} id="${text.toLowerCase().replace(/\s+/g, '-')}">${text}</h${level}>`;
          continue;
        }
      }

      if (line.startsWith('>')) {
        flushBuffer();
        html += `<blockquote>${line.replace(/^>\s*/, '')}</blockquote>`;
        continue;
      }

      if (line.match(/^\s*[-*+]\s/) || line.match(/^\s*\d+\.\s/)) {
        flushBuffer();
        const isOrdered = !!line.match(/^\s*\d+\.\s/), type = isOrdered ? 'ol' : 'ul';
        const itemText = line.replace(/^\s*[-*+]?\s*\d*\.?\s/, '');

        while (listStack.length && indent <= listStack[listStack.length - 1].indent) {
          html += `</${listStack.pop().type}>`;
        }
        if (!listStack.length || indent > listStack[listStack.length - 1].indent) {
          listStack.push({ type, indent });
          html += `<${type}>`;
        }
        html += `<li>${itemText}</li>`;
        continue;
      }

      while (listStack.length) html += `</${listStack.pop().type}>`;
      if (line.trim()) buffer += line + ' ';
      else if (buffer) flushBuffer(); else html += '<br>';
    }

    while (listStack.length) html += `</${listStack.pop().type}>`;
    if (inCodeBlock) html += `<pre><code>${buffer}</code></pre>`; else flushBuffer();

    return html;
  };

  const mainContent = parseMarkdown(rawContent);

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.onclick = e => {
      e.preventDefault();
      document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    };
  });

  Promise.all([
    noHeader ? Promise.resolve('') : fetch('header.html').then(r => r.text()),
    noFooter ? Promise.resolve('') : fetch('footer.html').then(r => r.text())
  ]).then(([header, footer]) => {
    document.body.innerHTML = `${header || ''}${mainContent}${footer || ''}`;
  }).catch(() => {
    document.body.innerHTML = mainContent;
  });
});
​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​
