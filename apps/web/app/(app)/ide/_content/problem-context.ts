import type { LanguageTemplate } from './templates';
import { templateForLanguage } from './templates';
import type { IdeProblemSource } from './ide-links';
import { NIBRAS_75_STARTERS, type Nibras75Starter } from './nibras75-starters';

export type IdeProblemContext = {
  source: IdeProblemSource;
  slug: string;
  title: string;
  description: string;
  sampleStdin?: string;
  externalUrl?: string;
};

type ProblemStarter = Nibras75Starter;

function cppStarter(title: string, description: string): string {
  return `// ${title}
// ${description}
//
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`;
}

function pythonStarter(title: string, description: string): string {
  return `"""${title}
${description}
"""
import sys


def main() -> None:
    data = sys.stdin.read().strip()
    print(data)


if __name__ == "__main__":
    main()
`;
}

export function starterForProblem(
  languageName: string,
  context: IdeProblemContext
): LanguageTemplate {
  const base = templateForLanguage(languageName);
  if (matchesLanguage(languageName, [/^C\+\+ \(GCC/i])) {
    return { monacoLanguage: 'cpp', source: cppStarter(context.title, context.description) };
  }
  if (matchesLanguage(languageName, [/^Python \(3/i])) {
    return { monacoLanguage: 'python', source: pythonStarter(context.title, context.description) };
  }
  if (matchesLanguage(languageName, [/^Java \(OpenJDK/i])) {
    return {
      monacoLanguage: 'java',
      source: `// ${context.title}\n// ${context.description}\n\n${base.source}`,
    };
  }
  if (matchesLanguage(languageName, [/^C \(GCC/i])) {
    return {
      monacoLanguage: 'c',
      source: `/* ${context.title} */\n/* ${context.description} */\n\n${base.source}`,
    };
  }
  if (matchesLanguage(languageName, [/^JavaScript \(Node\.js/i])) {
    return {
      monacoLanguage: 'javascript',
      source: `// ${context.title}\n// ${context.description}\n\n${base.source}`,
    };
  }
  return base;
}

function matchesLanguage(name: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(name));
}

export function resolveProblemContext(searchParams: URLSearchParams): IdeProblemContext | null {
  const source = searchParams.get('source');
  const slug = searchParams.get('problem')?.trim();
  if ((source !== 'nibras75' && source !== 'daily') || !slug) return null;

  const curated = source === 'nibras75' ? NIBRAS_75_STARTERS[slug] : null;
  const title = searchParams.get('title')?.trim() || curated?.title || slug.replace(/-/g, ' ');
  const description =
    searchParams.get('desc')?.trim() ||
    curated?.description ||
    'Practice this problem in the Nibras IDE.';
  const externalUrl = searchParams.get('url')?.trim() || undefined;

  return {
    source,
    slug,
    title,
    description,
    sampleStdin: curated?.sampleStdin,
    externalUrl,
  };
}

export function lookupNibras75Starter(slug: string): ProblemStarter | undefined {
  return NIBRAS_75_STARTERS[slug];
}
