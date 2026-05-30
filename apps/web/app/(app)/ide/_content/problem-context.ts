import type { LanguageTemplate } from './templates';
import { templateForLanguage } from './templates';
import type { IdeProblemSource } from './ide-links';

export type IdeProblemContext = {
  source: IdeProblemSource;
  slug: string;
  title: string;
  description: string;
  sampleStdin?: string;
  externalUrl?: string;
};

type ProblemStarter = {
  title: string;
  description: string;
  sampleStdin?: string;
};

const NIBRAS_75_STARTERS: Record<string, ProblemStarter> = {
  'two-sum': {
    title: 'Two Sum',
    description: 'Find two numbers that add up to a target and return their indices.',
    sampleStdin: '4\n2 7 11 15\n9',
  },
  'valid-parentheses': {
    title: 'Valid Parentheses',
    description: 'Check if brackets are opened and closed in valid order.',
    sampleStdin: '()[]{}',
  },
  'best-time-to-buy-and-sell-stock': {
    title: 'Best Time to Buy and Sell Stock',
    description: 'Maximize profit with one buy and one sell.',
    sampleStdin: '6\n7 1 5 3 6 4',
  },
  'longest-substring-without-repeating-characters': {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Longest contiguous substring with all unique characters.',
    sampleStdin: 'abcabcbb',
  },
  'merge-intervals': {
    title: 'Merge Intervals',
    description: 'Merge all overlapping intervals in a collection.',
    sampleStdin: '3\n1 3\n2 6\n8 10\n15 18',
  },
  'number-of-islands': {
    title: 'Number of Islands',
    description: 'Count connected land regions in a grid.',
    sampleStdin: '4 5\n11110\n11010\n11000\n00000',
  },
};

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
