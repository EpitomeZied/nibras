export type LanguageTemplate = {
  monacoLanguage: string;
  source: string;
};

function matchesLanguage(name: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(name));
}

export function templateForLanguage(languageName: string): LanguageTemplate {
  if (matchesLanguage(languageName, [/^C\+\+ \(GCC/i])) {
    return {
      monacoLanguage: 'cpp',
      source: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`,
    };
  }

  if (matchesLanguage(languageName, [/^Python \(3/i])) {
    return {
      monacoLanguage: 'python',
      source: `import sys

def main() -> None:
    data = sys.stdin.read().strip()
    print(data)

if __name__ == "__main__":
    main()
`,
    };
  }

  if (matchesLanguage(languageName, [/^Java \(OpenJDK/i])) {
    return {
      monacoLanguage: 'java',
      source: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        if (line != null) {
            System.out.println(line);
        }
    }
}
`,
    };
  }

  if (matchesLanguage(languageName, [/^C \(GCC/i])) {
    return {
      monacoLanguage: 'c',
      source: `#include <stdio.h>

int main(void) {
    int value = 0;
    if (scanf("%d", &value) == 1) {
        printf("%d\\n", value);
    }
    return 0;
}
`,
    };
  }

  if (matchesLanguage(languageName, [/^JavaScript \(Node\.js/i])) {
    return {
      monacoLanguage: 'javascript',
      source: `'use strict';

const fs = require('fs');

const input = fs.readFileSync(0, 'utf8').trim();
console.log(input);
`,
    };
  }

  return {
    monacoLanguage: 'plaintext',
    source: '',
  };
}

export function pickDefaultLanguageId(
  languages: Array<{ id: number; name: string }>
): number | null {
  if (languages.length === 0) return null;
  const preferred =
    languages.find((language) => /C\+\+ \(GCC 9/i.test(language.name)) ??
    languages.find((language) => /^C\+\+ \(GCC/i.test(language.name));
  return (preferred ?? languages[0]).id;
}

export const IDE_STORAGE_KEY = 'nibras.ide.playground.v1';

export type IdePersistedState = {
  languageId: number;
  sourceCode: string;
  stdin: string;
};

export function readPersistedState(): IdePersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(IDE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<IdePersistedState>;
    if (typeof parsed.languageId !== 'number' || typeof parsed.sourceCode !== 'string') {
      return null;
    }
    return {
      languageId: parsed.languageId,
      sourceCode: parsed.sourceCode,
      stdin: typeof parsed.stdin === 'string' ? parsed.stdin : '',
    };
  } catch {
    return null;
  }
}

export function writePersistedState(state: IdePersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(IDE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private-mode errors */
  }
}
