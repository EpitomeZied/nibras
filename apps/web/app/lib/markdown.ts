const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
}

function renderInline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  out = out.replace(
    /(^|[\s(])(https?:\/\/[^\s<)]+)(?=[\s).,!?]|$)/g,
    '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>'
  );
  return out;
}

const PLAYGROUND_MAP: Record<string, (code: string) => string | null> = {
  python: (c) => `https://ideone.com/fork?lang=python3&code=${enc(c)}`,
  py: (c) => `https://ideone.com/fork?lang=python3&code=${enc(c)}`,
  javascript: (c) => `https://codepen.io/pen?js=${enc(c)}`,
  js: (c) => `https://codepen.io/pen?js=${enc(c)}`,
  typescript: (c) => `https://www.typescriptlang.org/play?#code/${enc(c)}`,
  ts: (c) => `https://www.typescriptlang.org/play?#code/${enc(c)}`,
  c: (c) =>
    `https://godbolt.org/#g:!((g:!((g:!((h:codeEditor,i:(filename:'1',fontScale:14,fontUsePx:'0',j:1,lang:___c,selection:(endColumn:1,endLineNumber:1,positionColumn:1,positionLineNumber:1,selectionStartColumn:1,selectionStartLineNumber:1,startColumn:1,startLineNumber:1),source:'${enc(c)}'),l:'5',n:'1',o:'C+source+%231',t:'0')),header:(),s:0)),version:4)`,
  cpp: (c) =>
    `https://godbolt.org/#g:!((g:!((g:!((h:codeEditor,i:(filename:'1',fontScale:14,fontUsePx:'0',j:1,lang:c%2B%2B,selection:(endColumn:1,endLineNumber:1,positionColumn:1,positionLineNumber:1,selectionStartColumn:1,selectionStartLineNumber:1,startColumn:1,startLineNumber:1),source:'${enc(c)}'),l:'5',n:'1',o:'C%2B%2B+source+%231',t:'0')),header:(),s:0)),version:4)`,
  java: (c) => `https://ideone.com/fork?lang=java&code=${enc(c)}`,
  sql: () => `https://sqlfiddle.com/`,
};

function enc(code: string): string {
  const encoded = encodeURIComponent(code);
  return encoded.length > 2000 ? '' : encoded;
}

function playgroundUrl(lang: string, code: string): string | null {
  const builder = PLAYGROUND_MAP[lang.toLowerCase()];
  if (!builder) return null;
  const url = builder(code);
  if (!url || url.endsWith('=')) return null;
  return url;
}

const LANG_DISPLAY: Record<string, string> = {
  python: 'Python',
  py: 'Python',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  java: 'Java',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  bash: 'Bash',
  sh: 'Shell',
  json: 'JSON',
  yaml: 'YAML',
  go: 'Go',
  rust: 'Rust',
  ruby: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  r: 'R',
  matlab: 'MATLAB',
  pseudo: 'Pseudocode',
};

export function renderMarkdown(source: string): string {
  if (!source) return '';
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim().toLowerCase();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      const code = codeLines.join('\n');
      const langLabel = lang && LANG_DISPLAY[lang] ? LANG_DISPLAY[lang] : lang;
      const tryItUrl = lang ? playgroundUrl(lang, code) : null;

      let header = '';
      if (langLabel || tryItUrl) {
        header = '<div class="codeBlockHeader">';
        if (langLabel) {
          header += `<span class="codeLang">${escapeHtml(langLabel)}</span>`;
        }
        if (tryItUrl) {
          header += `<a class="tryItLink" href="${escapeHtml(tryItUrl)}" target="_blank" rel="noopener noreferrer">Try it &rarr;</a>`;
        }
        header += '</div>';
      }

      blocks.push(
        `<div class="codeBlockWrapper">${header}<pre><code>${escapeHtml(code)}</code></pre></div>`
      );
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length + 2;
      blocks.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      i += 1;
      continue;
    }

    // List
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*]\s+/, '');
        items.push(`<li>${renderInline(itemText)}</li>`);
        i += 1;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i += 1;
      continue;
    }

    // Paragraph
    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('```') &&
      !/^(#{1,3}|\s*[-*])\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push(`<p>${renderInline(para.join('\n'))}</p>`);
  }

  return blocks.join('');
}
