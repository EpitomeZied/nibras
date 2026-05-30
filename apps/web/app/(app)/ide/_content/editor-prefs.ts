export type IdeEditorPrefs = {
  fontSize: number;
  wordWrap: boolean;
};

export const IDE_EDITOR_PREFS_KEY = 'nibras.ide.editorPrefs.v1';

const DEFAULT_PREFS: IdeEditorPrefs = {
  fontSize: 14,
  wordWrap: false,
};

export function readEditorPrefs(): IdeEditorPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(IDE_EDITOR_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<IdeEditorPrefs>;
    const fontSize =
      typeof parsed.fontSize === 'number' && parsed.fontSize >= 12 && parsed.fontSize <= 22
        ? parsed.fontSize
        : DEFAULT_PREFS.fontSize;
    return {
      fontSize,
      wordWrap: Boolean(parsed.wordWrap),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writeEditorPrefs(prefs: IdeEditorPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(IDE_EDITOR_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
