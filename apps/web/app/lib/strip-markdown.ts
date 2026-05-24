export function stripMarkdown(source: string): string {
  return (
    source
      // fenced code blocks
      .replace(/```[\s\S]*?```/g, '')
      // headings
      .replace(/^#{1,6}\s+/gm, '')
      // bold/italic
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
      // strikethrough
      .replace(/~~([^~]+)~~/g, '$1')
      // inline code
      .replace(/`([^`]+)`/g, '$1')
      // links [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // list markers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // blockquotes
      .replace(/^\s*>\s?/gm, '')
      // horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // collapse whitespace
      .replace(/\n{2,}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}
