/**
 * Year 1 Foundation — tracking course definitions (Stanford-style labels).
 * Planner codes CS101–PHY101 map to these slugs; see docs/year1-curriculum.md.
 */
import type { Prisma } from '@prisma/client';
import { CS106A_LECTURE_RESOURCES, CS106A_LECTURES } from './year1-cs106a-lectures';
import { ENG101_LECTURES } from './year1-eng101-lectures';

export type Year1Milestone = {
  title: string;
  description: string;
  order: number;
  isFinal?: boolean;
};

export type Year1RubricItem = {
  criterion: string;
  maxScore: number;
};

export type Year1Section = {
  title: string;
  sortOrder: number;
};

export type Year1Assignment = {
  title: string;
  description: string;
  content: string;
  pointsPossible: number;
  sortOrder: number;
  dueAt: string;
};

export type Year1Lecture = {
  sectionTitle: string;
  sortOrder: number;
  youtubeId: string;
};

export type Year1ProjectDefinition = {
  subject: { slug: string; name: string };
  slug: string;
  name: string;
  description: string;
  level: number;
  rubric: Year1RubricItem[];
  milestones: Year1Milestone[];
  resourcesJson?: Array<{ label: string; url: string }>;
};

export type Year1CourseDefinition = {
  slug: string;
  courseCode: string;
  title: string;
  termLabel: string;
  description: string;
  syllabusJson?: Prisma.InputJsonValue;
  sequentialVideos?: boolean;
  sections: Year1Section[];
  assignments: Year1Assignment[];
  lectures?: Year1Lecture[];
  project: Year1ProjectDefinition;
};

const CS106B_LECTURES: Year1Lecture[] = [
  {
    sectionTitle: 'Lecture 1: C++ Welcome',
    sortOrder: 0,
    youtubeId: 'z8grKiZ4qsk',
  },
  {
    sectionTitle: 'Lecture 2: Recursion',
    sortOrder: 1,
    youtubeId: 'e0xtpdE2gtQ',
  },
  {
    sectionTitle: 'Lecture 3: ADTs and Classes',
    sortOrder: 2,
    youtubeId: 'RBSGKlAvoiM',
  },
  {
    sectionTitle: 'Lecture 4: Trees and Huffman',
    sortOrder: 3,
    youtubeId: '9hJmK2mF7Y4',
  },
];

const CS103_LECTURES: Year1Lecture[] = [
  {
    sectionTitle: 'Lecture 1: Propositional Logic',
    sortOrder: 0,
    youtubeId: '7Tft2vB8P1Q',
  },
  {
    sectionTitle: 'Lecture 2: Proof Techniques',
    sortOrder: 1,
    youtubeId: '8aGhZQkoFbQ',
  },
  {
    sectionTitle: 'Lecture 3: Finite Automata',
    sortOrder: 2,
    youtubeId: '9syvZr-9xwk',
  },
  {
    sectionTitle: 'Lecture 4: Computability',
    sortOrder: 3,
    youtubeId: 'RPbh5bLJqLg',
  },
];

export const YEAR1_COURSES: Year1CourseDefinition[] = [
  {
    slug: 'stanford-cs106a',
    courseCode: 'CS 106A',
    title: 'Programming Methodology',
    termLabel: 'Year 1 · Fall',
    description:
      'Introduction to programming using Python. Lecture videos from Stanford Code in Place 2020: Karel, control flow, functions, graphics, lists, and dictionaries.',
    syllabusJson: {
      schedule: 'Year 1 · Fall — introductory programming (Code in Place).',
      topics: ['Karel', 'Control flow', 'Functions', 'Graphics', 'Lists', 'Dictionaries'],
      plannerCode: 'CS101',
    },
    sequentialVideos: true,
    sections: [
      { title: 'Lecture 1: Welcome to Code in Place', sortOrder: 0 },
      { title: 'Lecture 2: Control Flow in Karel', sortOrder: 1 },
      { title: 'Lecture 3: Decomposition', sortOrder: 2 },
      { title: 'Lecture 4: Variables in Python', sortOrder: 3 },
      { title: 'Lecture 5: Expressions', sortOrder: 4 },
      { title: 'Lecture 6: Control Flow in Python', sortOrder: 5 },
      { title: 'Lecture 7: Functions Revisited', sortOrder: 6 },
      { title: 'Lecture 8: Functions — More Practice', sortOrder: 7 },
      { title: 'Lecture 9: Images', sortOrder: 8 },
      { title: 'Lecture 10: Graphics', sortOrder: 9 },
      { title: 'Lecture 11: Animations', sortOrder: 10 },
      { title: 'Lecture 12: Lists', sortOrder: 11 },
      { title: 'Lecture 13: Text Processing', sortOrder: 12 },
      { title: 'Lecture 14: Dictionaries', sortOrder: 13 },
    ],
    lectures: CS106A_LECTURES,
    assignments: [
      {
        title: 'A1: Karel and Control Flow',
        description: 'Karel exercises and basic Python control flow.',
        content: `# Assignment 1: Karel and Control Flow

Complete Karel worlds 1–5. Submit screenshots and your final \`main.py\` via the course hub.`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2026-10-15T23:59:59Z',
      },
      {
        title: 'A2: Functions and Graphics',
        description: 'Decomposition with functions and simple graphics.',
        content: `# Assignment 2: Functions

Implement three functions with docstrings and unit tests. Include one recursive drawing program.`,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2026-11-01T23:59:59Z',
      },
      {
        title: 'A3: Lists and Files',
        description: 'Work with lists, dictionaries, and file I/O.',
        content: `# Assignment 3: Data and Files

Parse a CSV log file and produce summary statistics. Handle malformed rows gracefully.`,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2026-11-15T23:59:59Z',
      },
      {
        title: 'A4: Object-Oriented Design',
        description: 'Classes, inheritance, and a small simulation.',
        content: `# Assignment 4: OOP

Design two related classes with inheritance. Submit a short design doc and working code.`,
        pointsPossible: 100,
        sortOrder: 3,
        dueAt: '2026-12-01T23:59:59Z',
      },
    ],
    project: {
      subject: { slug: 'cs106a', name: 'CS 106A' },
      slug: 'cs106a-main',
      name: 'CS 106A — Programming Methodology',
      description:
        'Introduction to programming using Python. Covers variables, control flow, functions, and object-oriented programming.',
      level: 1,
      rubric: [
        { criterion: 'Correctness', maxScore: 50 },
        { criterion: 'Code Quality & Decomposition', maxScore: 30 },
        { criterion: 'Write-up & Explanation', maxScore: 20 },
      ],
      milestones: [
        {
          title: 'Variables, Expressions & Control Flow',
          description:
            'Write Python programs using variables, arithmetic expressions, and control flow (if/while/for). Complete Karel exercises 1–5.',
          order: 0,
        },
        {
          title: 'Functions & Decomposition',
          description:
            'Implement recursive and iterative functions. Apply top-down decomposition to solve multi-step problems.',
          order: 1,
        },
        {
          title: 'Object-Oriented Programming',
          description:
            'Define classes, constructors, and methods. Implement inheritance and polymorphism in a simple class hierarchy.',
          order: 2,
        },
        {
          title: 'Final: Karel the Robot',
          description:
            'Build a fully-functional Karel world using all OOP principles learned. Submit your GitHub repo and a short write-up explaining your design.',
          order: 3,
          isFinal: true,
        },
      ],
      resourcesJson: CS106A_LECTURE_RESOURCES,
    },
  },
  {
    slug: 'year1-math111',
    courseCode: 'MATH 111',
    title: 'Calculus I',
    termLabel: 'Year 1 · Fall',
    description:
      'Limits, continuity, derivatives, and applications of differentiation for students in computing programs.',
    syllabusJson: {
      schedule: 'Year 1 · Fall — differential calculus.',
      topics: ['Limits', 'Derivatives', 'Applications'],
      plannerCode: 'MATH111',
    },
    sections: [
      { title: 'Limits and Continuity', sortOrder: 0 },
      { title: 'Derivatives', sortOrder: 1 },
      { title: 'Applications', sortOrder: 2 },
    ],
    assignments: [
      {
        title: 'PS1: Limits',
        description: 'Epsilon-delta and limit laws.',
        content: `# Problem Set 1

Prove or compute: (a) \\(\\lim_{x\\to 0} \\frac{\\sin x}{x}\\), (b) continuity of a piecewise function, (c) two squeeze-theorem examples.`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2026-10-20T23:59:59Z',
      },
      {
        title: 'PS2: Derivatives',
        description: 'Rules of differentiation and implicit differentiation.',
        content: `# Problem Set 2

Find derivatives using product, quotient, and chain rules. Include one related-rates word problem.`,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2026-11-05T23:59:59Z',
      },
      {
        title: 'PS3: Applications',
        description: 'Optimization and curve sketching.',
        content: `# Problem Set 3

Solve two optimization problems and sketch one function using first and second derivative tests.`,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2026-11-20T23:59:59Z',
      },
    ],
    project: {
      subject: { slug: 'math111', name: 'MATH 111' },
      slug: 'math111-main',
      name: 'MATH 111 — Calculus I Portfolio',
      description: 'Written problem sets demonstrating limits, derivatives, and applications.',
      level: 1,
      rubric: [
        { criterion: 'Mathematical Correctness', maxScore: 60 },
        { criterion: 'Clear Reasoning', maxScore: 25 },
        { criterion: 'Presentation', maxScore: 15 },
      ],
      milestones: [
        {
          title: 'Limits and Continuity',
          description: 'Submit PS1 with full proofs for limit exercises.',
          order: 0,
        },
        {
          title: 'Derivative Techniques',
          description: 'Submit PS2 with step-by-step derivative work.',
          order: 1,
        },
        {
          title: 'Final: Application Project',
          description:
            'Model a real-world rate-of-change problem (e.g. network throughput). Write a 3-page report with derivative analysis.',
          order: 2,
          isFinal: true,
        },
      ],
    },
  },
  {
    slug: 'year1-eng101',
    courseCode: 'ENG 101',
    title: 'Academic Writing',
    termLabel: 'Year 1 · Fall',
    description:
      'Foundations of academic writing: clarity, structure, evidence, and revision for technical students. Lecture videos from Stanford\'s open "Writing in the Sciences" course (Units 1–4, Kristin Sainani).',
    syllabusJson: {
      schedule: 'Year 1 · Fall — writing workshop with Stanford lecture series.',
      topics: [
        'Effective writing',
        'Active voice',
        'Paragraphs',
        'Revision',
        'Thesis',
        'Evidence',
      ],
      plannerCode: 'ENG101',
    },
    sequentialVideos: true,
    sections: [
      { title: 'Unit 1: Principles of Effective Writing', sortOrder: 0 },
      { title: 'Unit 2: Active Voice and Verbs', sortOrder: 1 },
      { title: 'Unit 3: Punctuation and Paragraphs', sortOrder: 2 },
      { title: 'Unit 4: The Writing Process', sortOrder: 3 },
    ],
    lectures: ENG101_LECTURES,
    assignments: [
      {
        title: 'Essay 1: Outline and Thesis',
        description: 'One-page outline with arguable thesis on a computing ethics topic.',
        content: `# Essay 1: Outline

Choose a computing ethics topic. Submit an outline with thesis, three supporting claims, and one counterargument.`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2026-10-25T23:59:59Z',
      },
      {
        title: 'Essay 2: Full Draft',
        description: '1200-word draft with citations.',
        content: `# Essay 2: Draft

Submit a 1200-word draft using at least three scholarly sources (APA or IEEE).`,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2026-11-10T23:59:59Z',
      },
      {
        title: 'Essay 3: Revision',
        description: 'Revised essay with reflection on changes.',
        content: `# Essay 3: Revision

Submit the revised essay plus a 300-word reflection describing substantive edits.`,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2026-12-05T23:59:59Z',
      },
    ],
    project: {
      subject: { slug: 'eng101', name: 'ENG 101' },
      slug: 'eng101-main',
      name: 'ENG 101 — Academic Writing Portfolio',
      description: 'Build a coherent argumentative essay through outline, draft, and revision.',
      level: 1,
      rubric: [
        { criterion: 'Thesis and Argument', maxScore: 40 },
        { criterion: 'Evidence and Citation', maxScore: 35 },
        { criterion: 'Clarity and Revision', maxScore: 25 },
      ],
      milestones: [
        {
          title: 'Thesis Workshop',
          description: 'Peer-reviewed thesis statement with instructor feedback incorporated.',
          order: 0,
        },
        {
          title: 'Draft with Evidence',
          description: 'Full draft integrating primary and secondary sources.',
          order: 1,
        },
        {
          title: 'Final: Polished Essay',
          description: 'Final 1500-word essay and revision memo.',
          order: 2,
          isFinal: true,
        },
      ],
      resourcesJson: [
        {
          label: 'Writing in the Sciences (Stanford) — YouTube playlist',
          url: 'https://www.youtube.com/playlist?list=PL8yeejfiNxNBT2rTomRjmWNlgh4DBmHST',
        },
      ],
    },
  },
  {
    slug: 'stanford-cs106b',
    courseCode: 'CS 106B',
    title: 'Programming Abstractions',
    termLabel: 'Year 1 · Spring',
    description:
      'C++ programming with abstraction, recursion, and fundamental data structures: stacks, queues, sets, maps, trees, and graphs.',
    syllabusJson: {
      schedule: 'Year 1 · Spring — data structures in C++.',
      topics: ['Recursion', 'ADTs', 'Trees', 'Graphs'],
      plannerCode: 'CS102',
    },
    sequentialVideos: true,
    sections: [
      { title: 'Welcome & C++ Basics', sortOrder: 0 },
      { title: 'Recursion', sortOrder: 1 },
      { title: 'Data Structures: Stacks & Queues', sortOrder: 2 },
      { title: 'Trees & Graphs', sortOrder: 3 },
    ],
    lectures: CS106B_LECTURES,
    assignments: [
      {
        title: 'A1: Welcome to C++',
        description: 'Simple C++ programs and tooling.',
        content: `# Assignment 1: Welcome to C++

Implement perfect-number check, a small Grid simulation, and Flesch-Kincaid grade level for a text file.`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2027-02-15T23:59:59Z',
      },
      {
        title: 'A2: Recursion',
        description: 'Recursive problem solving and backtracking.',
        content: `# Assignment 2: Recursion

Towers of Hanoi, Sierpinski triangle, and Boggle backtracking.`,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2027-03-01T23:59:59Z',
      },
      {
        title: 'A3: Stacks, Queues & Linked Lists',
        description: 'Custom ADTs from scratch.',
        content: `# Assignment 3: ADTs

Implement \`MyStack\` and \`MyQueue\` without STL containers internally.`,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2027-03-15T23:59:59Z',
      },
      {
        title: 'A4: Trees & Huffman',
        description: 'BST and Huffman encoding.',
        content: `# Assignment 4: Trees

BST with insert/contains/remove and a Huffman encode/decode pipeline.`,
        pointsPossible: 100,
        sortOrder: 3,
        dueAt: '2027-04-01T23:59:59Z',
      },
    ],
    project: {
      subject: { slug: 'cs106b', name: 'CS 106B' },
      slug: 'cs106b-main',
      name: 'CS 106B — Programming Abstractions',
      description:
        'C++ programming with a focus on abstraction, recursion, and fundamental data structures.',
      level: 1,
      rubric: [
        { criterion: 'Correctness & Edge Cases', maxScore: 50 },
        { criterion: 'Algorithm Efficiency', maxScore: 30 },
        { criterion: 'Code Clarity', maxScore: 20 },
      ],
      resourcesJson: [
        {
          label: 'Optional: CS106L Standard C++ (CLI projects)',
          url: '/catalog/cs106l',
        },
      ],
      milestones: [
        {
          title: 'Recursion Fundamentals',
          description:
            'Solve classic recursive problems: permutations, Towers of Hanoi, fractal drawing. Implement backtracking search.',
          order: 0,
        },
        {
          title: 'Abstract Data Types (Stack, Queue, Map, Set)',
          description:
            'Implement and use Stack, Queue, Set, and Map. Analyse time complexity of each operation.',
          order: 1,
        },
        {
          title: 'Trees & Priority Queues',
          description:
            'Implement a binary search tree with insert, search, and delete. Build a min-heap and use it for Huffman encoding.',
          order: 2,
        },
        {
          title: 'Final: Huffman Encoder/Decoder',
          description:
            'Build a complete file compression tool using Huffman coding. Benchmark compression ratio vs. gzip on a test corpus.',
          order: 3,
          isFinal: true,
        },
      ],
    },
  },
  {
    slug: 'stanford-cs103',
    courseCode: 'CS 103',
    title: 'Mathematical Foundations of Computing',
    termLabel: 'Year 1 · Spring',
    description:
      'Logic, proofs, sets, functions, relations, finite automata, regular languages, and computability.',
    syllabusJson: {
      schedule: 'Year 1 · Spring — discrete math for CS.',
      topics: ['Logic', 'Proofs', 'Automata', 'Complexity'],
      plannerCode: 'CS103',
    },
    sequentialVideos: true,
    sections: [
      { title: 'Logic and Proofs', sortOrder: 0 },
      { title: 'Sets and Relations', sortOrder: 1 },
      { title: 'Automata', sortOrder: 2 },
      { title: 'Computability', sortOrder: 3 },
    ],
    lectures: CS103_LECTURES,
    assignments: [
      {
        title: 'A1: Propositional Logic',
        description: 'Truth tables and formal proofs.',
        content: `# Assignment 1: Logic

Ten propositional logic exercises with written proofs.`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2027-02-20T23:59:59Z',
      },
      {
        title: 'A2: Induction',
        description: 'Proofs by induction.',
        content: `# Assignment 2: Induction

Four induction proofs on sequences and sets.`,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2027-03-05T23:59:59Z',
      },
      {
        title: 'A3: Automata',
        description: 'DFA/NFA constructions.',
        content: `# Assignment 3: Automata

Design automata for three languages and prove one non-regular language.`,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2027-03-20T23:59:59Z',
      },
      {
        title: 'A4: Complexity',
        description: 'Reductions and NP-completeness sketches.',
        content: `# Assignment 4: Complexity

Three NP-completeness reduction outlines with justification.`,
        pointsPossible: 100,
        sortOrder: 3,
        dueAt: '2027-04-10T23:59:59Z',
      },
    ],
    project: {
      subject: { slug: 'cs103', name: 'CS 103' },
      slug: 'cs103-main',
      name: 'CS 103 — Mathematical Foundations of Computing',
      description:
        'Logic, proofs, sets, functions, relations, finite automata, regular languages, and computability.',
      level: 1,
      rubric: [
        { criterion: 'Proof Correctness & Rigour', maxScore: 60 },
        { criterion: 'Formal Notation', maxScore: 20 },
        { criterion: 'Clarity of Argument', maxScore: 20 },
      ],
      milestones: [
        {
          title: 'Propositional Logic & Proof Techniques',
          description:
            'Write formal proofs using direct proof, contradiction, and induction. Solve 10 logic puzzles and submit proofs.',
          order: 0,
        },
        {
          title: 'Sets, Functions & Relations',
          description:
            'Prove properties of sets and functions (injective, surjective, bijective). Solve problems on equivalence relations.',
          order: 1,
        },
        {
          title: 'Finite Automata & Regular Languages',
          description:
            'Construct DFAs and NFAs. Convert NFA→DFA. Prove languages non-regular using the Pumping Lemma.',
          order: 2,
        },
        {
          title: 'Final: Computability & Complexity',
          description:
            'Prove a language is undecidable via reduction. Solve 3 NP-completeness reductions. Write a 4-page proof report.',
          order: 3,
          isFinal: true,
        },
      ],
    },
  },
  {
    slug: 'year1-math112',
    courseCode: 'MATH 112',
    title: 'Calculus II',
    termLabel: 'Year 1 · Spring',
    description: 'Integration techniques, applications, sequences, and series.',
    syllabusJson: {
      schedule: 'Year 1 · Spring — integral calculus.',
      topics: ['Integration', 'Applications', 'Series'],
      plannerCode: 'MATH112',
    },
    sections: [
      { title: 'Integration Techniques', sortOrder: 0 },
      { title: 'Applications of Integration', sortOrder: 1 },
      { title: 'Sequences and Series', sortOrder: 2 },
    ],
    assignments: [
      {
        title: 'PS1: Integration',
        description: 'Substitution and integration by parts.',
        content: `# Problem Set 1

Evaluate six integrals using substitution, parts, or partial fractions.`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2027-02-25T23:59:59Z',
      },
      {
        title: 'PS2: Applications',
        description: 'Area, volume, and work problems.',
        content: `# Problem Set 2

Two area/volume problems and one work integral.`,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2027-03-10T23:59:59Z',
      },
      {
        title: 'PS3: Series',
        description: 'Convergence tests and power series.',
        content: `# Problem Set 3

Determine convergence of four series and find the radius of convergence for one power series.`,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2027-03-25T23:59:59Z',
      },
    ],
    project: {
      subject: { slug: 'math112', name: 'MATH 112' },
      slug: 'math112-main',
      name: 'MATH 112 — Calculus II Portfolio',
      description: 'Integration and series problem sets with applications.',
      level: 1,
      rubric: [
        { criterion: 'Mathematical Correctness', maxScore: 60 },
        { criterion: 'Method Justification', maxScore: 25 },
        { criterion: 'Presentation', maxScore: 15 },
      ],
      milestones: [
        {
          title: 'Integration Methods',
          description: 'Submit PS1 with clear method labels for each integral.',
          order: 0,
        },
        {
          title: 'Applied Integration',
          description: 'Submit PS2 including at least one physical interpretation.',
          order: 1,
        },
        {
          title: 'Final: Series Analysis',
          description: 'Submit PS3 plus a one-page summary of convergence tests used.',
          order: 2,
          isFinal: true,
        },
      ],
    },
  },
  {
    slug: 'year1-phy101',
    courseCode: 'PHY 101',
    title: 'Physics for Computing',
    termLabel: 'Year 1 · Spring',
    description:
      'Mechanics and introductory E&M with emphasis on vectors, units, and modeling for computing students.',
    syllabusJson: {
      schedule: 'Year 1 · Spring — mechanics and E&M intro.',
      topics: ['Kinematics', 'Forces', 'Energy', 'E&M basics'],
      plannerCode: 'PHY101',
    },
    sections: [
      { title: 'Kinematics', sortOrder: 0 },
      { title: 'Forces and Newton’s Laws', sortOrder: 1 },
      { title: 'Energy and E&M Intro', sortOrder: 2 },
    ],
    assignments: [
      {
        title: 'Lab 1: Measurement and Uncertainty',
        description: 'Error analysis lab report.',
        content: `# Lab 1

Perform five measurements. Report mean, standard deviation, and propagated error.`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2027-02-28T23:59:59Z',
      },
      {
        title: 'Lab 2: Forces and Vectors',
        description: 'Force table or simulation lab.',
        content: `# Lab 2

Analyze forces in equilibrium. Include vector diagrams and component decomposition.`,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2027-03-12T23:59:59Z',
      },
      {
        title: 'Lab 3: Energy and Circuits',
        description: 'Energy conservation and basic circuits.',
        content: `# Lab 3

One mechanics energy problem and one simple RC circuit analysis.`,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2027-03-28T23:59:59Z',
      },
    ],
    project: {
      subject: { slug: 'phy101', name: 'PHY 101' },
      slug: 'phy101-main',
      name: 'PHY 101 — Physics for Computing',
      description: 'Lab reports and modeling exercises connecting physics to computation.',
      level: 1,
      rubric: [
        { criterion: 'Experimental Method', maxScore: 35 },
        { criterion: 'Analysis and Units', maxScore: 40 },
        { criterion: 'Communication', maxScore: 25 },
      ],
      milestones: [
        {
          title: 'Measurement and Data',
          description: 'Submit Lab 1 with uncertainty propagation.',
          order: 0,
        },
        {
          title: 'Vector Mechanics',
          description: 'Submit Lab 2 with free-body diagrams.',
          order: 1,
        },
        {
          title: 'Final: Integrated Lab Report',
          description:
            'Combine Labs 1–3 into a 5-page report linking measurement to a simple simulation.',
          order: 2,
          isFinal: true,
        },
      ],
    },
  },
];

export const YEAR1_COURSE_SLUGS = YEAR1_COURSES.map((c) => c.slug);
