/**
 * Year 2 Shared CS Core — tracking course definitions (Stanford-style labels).
 * Planner codes CS201–CS206 map to these slugs; see docs/year2-curriculum.md.
 */
import type { Prisma } from '@prisma/client';
import type { Year1CourseDefinition } from './year1-curriculum';
import { curriculumAssignments as assignments, curriculumProject as project } from './curriculum-helpers';

const CS107: Year1CourseDefinition = {
  slug: 'stanford-cs107',
  courseCode: 'CS 107',
  title: 'Computer Organization & Systems',
  termLabel: 'Year 2 · Fall',
  description:
    'C programming, data representation, memory layout, x86-64 assembly, caching, and the toolchain (gcc, gdb, valgrind, make).',
  syllabusJson: {
    schedule: 'Year 2 · Fall — systems programming spine.',
    topics: ['C and pointers', 'Memory representation', 'Assembly', 'Allocators'],
    plannerCode: 'CS201',
  },
  sections: [
    { title: 'C Programming & Pointers', sortOrder: 0 },
    { title: 'Bits, Bytes & Memory', sortOrder: 1 },
    { title: 'x86-64 Assembly', sortOrder: 2 },
    { title: 'Caching & Performance', sortOrder: 3 },
  ],
  assignments: assignments([
    {
      title: 'A1: C Basics and Valgrind',
      description: 'Linked list in C with a clean valgrind report.',
      content: `# Assignment 1: C Basics

Implement a singly-linked list in C with insert, remove, and print. Submit a valgrind log showing zero leaks.`,
      dueAt: '2027-09-15T23:59:59Z',
    },
    {
      title: 'A2: Bit Manipulation',
      description: "Two's complement and floating-point bit patterns.",
      content: `# Assignment 2: Bits and Bytes

Write functions to inspect integer and float bit representations. Document endianness on your machine.`,
      dueAt: '2027-10-01T23:59:59Z',
    },
    {
      title: 'A3: Assembly Tracing',
      description: 'Hand-trace compiled assembly for small C functions.',
      content: `# Assignment 3: Assembly

Compile three C functions with \`-O0\` and \`-O2\`. Annotate the assembly for stack frames and register use.`,
      dueAt: '2027-10-15T23:59:59Z',
    },
    {
      title: 'A4: Allocator Design',
      description: 'Design document for a custom malloc implementation.',
      content: `# Assignment 4: Allocator

Submit a 2-page design for an explicit free-list allocator with coalescing.`,
      dueAt: '2027-11-01T23:59:59Z',
    },
  ]),
  project: project(
    { slug: 'cs107', name: 'CS 107' },
    'cs107-main',
    'CS 107 — Computer Organization & Systems',
    'C programming, data representation, memory layout, x86-64 assembly, caching, and the toolchain.',
    2,
    [
      { criterion: 'Memory Safety (Valgrind-clean)', maxScore: 40 },
      { criterion: 'Correctness', maxScore: 40 },
      { criterion: 'Performance', maxScore: 20 },
    ],
    [
      {
        title: 'C Programming & Pointers',
        description:
          'Write C programs using pointers, arrays, and structs. Debug memory errors with valgrind. Implement a linked list and hash table in C.',
        order: 0,
      },
      {
        title: 'Bits, Bytes & Memory',
        description:
          "Implement integer encoding (two's complement), floating-point bit manipulation, and a bitset. Analyse memory alignment and padding.",
        order: 1,
      },
      {
        title: 'x86-64 Assembly',
        description:
          'Read and hand-trace x86-64 assembly from compiled C. Implement 3 functions in inline assembly. Optimise a hot loop using SIMD intrinsics.',
        order: 2,
      },
      {
        title: 'Final: Custom Memory Allocator',
        description:
          'Implement malloc, realloc, and free using an explicit free-list with coalescing. Achieve ≥ 60% memory utilisation on the trace files provided.',
        order: 3,
        isFinal: true,
      },
    ]
  ),
};

const CS109: Year1CourseDefinition = {
  slug: 'stanford-cs109',
  courseCode: 'CS 109',
  title: 'Probability for Computer Scientists',
  termLabel: 'Year 2 · Fall',
  description:
    'Probability, counting, random variables, distributions, Bayesian inference, MLE, and Markov chains.',
  syllabusJson: {
    schedule: 'Year 2 · Fall — probability for CS.',
    topics: ['Counting', 'Random variables', 'Bayesian inference', 'Markov chains'],
    plannerCode: 'CS109',
  },
  sections: [
    { title: 'Counting & Probability Axioms', sortOrder: 0 },
    { title: 'Random Variables & Distributions', sortOrder: 1 },
    { title: 'Bayesian Inference & MLE', sortOrder: 2 },
    { title: 'Markov Chains', sortOrder: 3 },
  ],
  assignments: assignments([
    {
      title: 'PS1: Counting and Axioms',
      description: 'Combinatorics and basic probability proofs.',
      content: `# Problem Set 1

Solve 10 counting problems and prove two probability axioms applications.`,
      dueAt: '2027-09-20T23:59:59Z',
    },
    {
      title: 'PS2: Distributions',
      description: 'PMFs, PDFs, and expectation.',
      content: `# Problem Set 2

Derive expectations for Binomial, Geometric, and Poisson variables. Implement a CLT simulator.`,
      dueAt: '2027-10-05T23:59:59Z',
    },
    {
      title: 'PS3: Bayesian Inference',
      description: 'Naïve Bayes and MLE.',
      content: `# Problem Set 3

Build a spam classifier with Naïve Bayes. Compare MLE vs. MAP on a small dataset.`,
      dueAt: '2027-10-20T23:59:59Z',
    },
    {
      title: 'PS4: Markov Chains',
      description: 'Stationary distributions and PageRank sketch.',
      content: `# Problem Set 4

Model a two-state Markov chain and compute its stationary distribution.`,
      dueAt: '2027-11-05T23:59:59Z',
    },
  ]),
  project: project(
    { slug: 'cs109', name: 'CS 109' },
    'cs109-main',
    'CS 109 — Probability for Computer Scientists',
    'Probability, counting, random variables, distributions, Bayesian inference, MLE, and Markov chains.',
    2,
    [
      { criterion: 'Mathematical Derivations', maxScore: 50 },
      { criterion: 'Implementation Correctness', maxScore: 30 },
      { criterion: 'Analysis & Interpretation', maxScore: 20 },
    ],
    [
      {
        title: 'Counting & Probability Axioms',
        description:
          'Solve 20 counting problems. Prove basic probability theorems. Implement a Monte Carlo estimator of π.',
        order: 0,
      },
      {
        title: 'Random Variables & Distributions',
        description:
          'Derive PMFs/PDFs for Binomial, Geometric, Poisson, and Gaussian distributions. Implement a central-limit-theorem simulator.',
        order: 1,
      },
      {
        title: 'Bayesian Networks & MLE',
        description:
          'Build a Naïve Bayes spam classifier. Derive and implement MLE for Gaussian and Bernoulli distributions.',
        order: 2,
      },
      {
        title: 'Final: Probabilistic Inference Engine',
        description:
          'Implement variable-elimination for exact inference in a Bayesian network with 10+ nodes.',
        order: 3,
        isFinal: true,
      },
    ]
  ),
};

const CS161: Year1CourseDefinition = {
  slug: 'stanford-cs161',
  courseCode: 'CS 161',
  title: 'Design & Analysis of Algorithms',
  termLabel: 'Year 2 · Fall',
  description:
    'Asymptotic analysis, divide-and-conquer, dynamic programming, greedy algorithms, graph algorithms, and NP-completeness.',
  syllabusJson: {
    schedule: 'Year 2 · Fall — algorithms core.',
    topics: ['Divide & conquer', 'Dynamic programming', 'Graphs', 'NP-completeness'],
    plannerCode: 'CS202',
  },
  sections: [
    { title: 'Divide & Conquer', sortOrder: 0 },
    { title: 'Dynamic Programming', sortOrder: 1 },
    { title: 'Graph Algorithms', sortOrder: 2 },
    { title: 'NP-Completeness', sortOrder: 3 },
  ],
  assignments: assignments([
    {
      title: 'A1: Recurrences',
      description: 'Master theorem and recursion trees.',
      content: `# Assignment 1

Solve five recurrence relations and implement MergeSort with a stable in-place variant discussion.`,
      dueAt: '2027-09-25T23:59:59Z',
    },
    {
      title: 'A2: Dynamic Programming',
      description: 'Edit distance and knapsack.',
      content: `# Assignment 2

Implement LCS and 0/1 knapsack with traceback.`,
      dueAt: '2027-10-10T23:59:59Z',
    },
    {
      title: 'A3: Graphs',
      description: 'Shortest paths and spanning trees.',
      content: `# Assignment 3

Implement Dijkstra, Bellman-Ford, and Kruskal on a provided road network.`,
      dueAt: '2027-10-25T23:59:59Z',
    },
    {
      title: 'A4: Reductions',
      description: 'NP-completeness sketches.',
      content: `# Assignment 4

Write reduction proofs for three classic NP-complete problems.`,
      dueAt: '2027-11-10T23:59:59Z',
    },
  ]),
  project: project(
    { slug: 'cs161-algo', name: 'CS 161 Algorithms' },
    'cs161-main',
    'CS 161 — Design & Analysis of Algorithms',
    'Asymptotic analysis, divide-and-conquer, dynamic programming, greedy algorithms, graph algorithms, and NP-completeness.',
    2,
    [
      { criterion: 'Correctness Proofs', maxScore: 40 },
      { criterion: 'Algorithm Implementation', maxScore: 40 },
      { criterion: 'Complexity Analysis', maxScore: 20 },
    ],
    [
      {
        title: 'Divide & Conquer',
        description:
          'Implement MergeSort, QuickSort, and Strassen matrix multiplication. Solve 5 recurrence relations using the Master Theorem.',
        order: 0,
      },
      {
        title: 'Dynamic Programming',
        description:
          'Solve Edit Distance, LCS, Matrix Chain, and 0/1 Knapsack with traceback and space optimisations.',
        order: 1,
      },
      {
        title: 'Graph Algorithms',
        description:
          'Implement BFS, DFS, Dijkstra, Bellman-Ford, Kruskal, and Prim. Benchmark on large sparse graphs.',
        order: 2,
      },
      {
        title: 'Final: NP-Completeness & Approximation',
        description:
          'Prove 3-SAT ≤_p Independent Set. Implement a 2-approximation for Vertex Cover.',
        order: 3,
        isFinal: true,
      },
    ]
  ),
};

const CS203: Year1CourseDefinition = {
  slug: 'year2-cs203',
  courseCode: 'CS 203',
  title: 'Databases',
  termLabel: 'Year 2 · Fall',
  description:
    'Relational model, SQL, schema design, normalization, transactions, indexing, and query optimization.',
  syllabusJson: {
    schedule: 'Year 2 · Fall — data management.',
    topics: ['Relational model', 'SQL', 'Normalization', 'Transactions'],
    plannerCode: 'CS203',
  },
  sections: [
    { title: 'Relational Model & SQL', sortOrder: 0 },
    { title: 'Schema Design & Normalization', sortOrder: 1 },
    { title: 'Transactions & Indexing', sortOrder: 2 },
    { title: 'Query Optimization', sortOrder: 3 },
  ],
  assignments: assignments([
    {
      title: 'Lab 1: SQL Queries',
      description: 'SELECT, JOIN, aggregation on a sample schema.',
      content: `# Lab 1

Write 15 SQL queries over the course enrollment schema. Include at least three nested subqueries.`,
      dueAt: '2027-09-22T23:59:59Z',
    },
    {
      title: 'Lab 2: Schema Design',
      description: 'ER diagram to BCNF schema.',
      content: `# Lab 2

Design a normalized schema for a library system. Document functional dependencies.`,
      dueAt: '2027-10-08T23:59:59Z',
    },
    {
      title: 'Lab 3: Transactions',
      description: 'Isolation levels and concurrency.',
      content: `# Lab 3

Demonstrate a lost-update anomaly and fix it with appropriate isolation. Write a short report.`,
      dueAt: '2027-10-22T23:59:59Z',
    },
    {
      title: 'Lab 4: Indexing',
      description: 'B-tree indexes and query plans.',
      content: `# Lab 4

Compare query plans with and without indexes on a 1M-row table. Paste EXPLAIN output.`,
      dueAt: '2027-11-08T23:59:59Z',
    },
  ]),
  project: project(
    { slug: 'cs203', name: 'CS 203' },
    'cs203-main',
    'CS 203 — Databases',
    'Design and implement a small relational application with SQL, migrations, and transactional updates.',
    2,
    [
      { criterion: 'Schema Quality', maxScore: 35 },
      { criterion: 'Query Correctness', maxScore: 40 },
      { criterion: 'Documentation', maxScore: 25 },
    ],
    [
      {
        title: 'Schema & Migrations',
        description:
          'Submit ER diagram, normalized DDL, and seed data for a course-registration system.',
        order: 0,
      },
      {
        title: 'Core Queries & API',
        description: 'Implement enrollment, waitlist, and grade-report queries with tests.',
        order: 1,
      },
      {
        title: 'Final: Transactional Application',
        description:
          'Build a mini app with concurrent enrollment handling and index-backed search.',
        order: 2,
        isFinal: true,
      },
    ]
  ),
};

const CS110: Year1CourseDefinition = {
  slug: 'stanford-cs110',
  courseCode: 'CS 110',
  title: 'Principles of Computer Systems',
  termLabel: 'Year 2 · Spring',
  description:
    'Filesystems, processes, signals, IPC, multithreading, synchronisation, and introductory network programming in C/C++.',
  syllabusJson: {
    schedule: 'Year 2 · Spring — systems principles.',
    topics: ['Filesystems', 'Processes', 'Threads', 'Networking'],
    plannerCode: 'CS204',
  },
  sections: [
    { title: 'Filesystems & I/O', sortOrder: 0 },
    { title: 'Processes & Signals', sortOrder: 1 },
    { title: 'Multithreading', sortOrder: 2 },
    { title: 'Network Programming', sortOrder: 3 },
  ],
  assignments: assignments([
    {
      title: 'A1: POSIX I/O',
      description: 'Low-level directory listing.',
      content: `# Assignment 1

Implement an \`ls\`-like tool using opendir/stat/readlink.`,
      dueAt: '2028-02-15T23:59:59Z',
    },
    {
      title: 'A2: Job Control Shell',
      description: 'Pipes and signal handling.',
      content: `# Assignment 2

Extend a shell with foreground/background jobs and SIGCHLD handling.`,
      dueAt: '2028-03-01T23:59:59Z',
    },
    {
      title: 'A3: Thread Pool',
      description: 'pthread synchronisation.',
      content: `# Assignment 3

Build a thread pool with mutex/condvar. Verify with ThreadSanitizer.`,
      dueAt: '2028-03-15T23:59:59Z',
    },
    {
      title: 'A4: HTTP Server Design',
      description: 'Concurrent server architecture.',
      content: `# Assignment 4

Submit a design doc for a multithreaded HTTP/1.1 server.`,
      dueAt: '2028-04-01T23:59:59Z',
    },
  ]),
  project: project(
    { slug: 'cs110', name: 'CS 110' },
    'cs110-main',
    'CS 110 — Principles of Computer Systems',
    'Filesystems, processes, signals, IPC, multithreading, synchronisation, and network programming.',
    2,
    [
      { criterion: 'Correctness under Concurrency', maxScore: 45 },
      { criterion: 'Resource Management', maxScore: 35 },
      { criterion: 'Performance Benchmarks', maxScore: 20 },
    ],
    [
      {
        title: 'Filesystems & I/O',
        description:
          'Implement a shell built-in that mirrors GNU ls using POSIX calls. Handle symlinks and hidden files.',
        order: 0,
      },
      {
        title: 'Processes & Signals',
        description:
          'Build a job-control shell with pipes using fork/exec/pipe and signal handling.',
        order: 1,
      },
      {
        title: 'Multithreading & Synchronisation',
        description:
          'Implement a thread pool using pthreads. Demonstrate absence of data races with ThreadSanitizer.',
        order: 2,
      },
      {
        title: 'Final: Multithreaded HTTP/1.1 Server',
        description:
          'Build a concurrent HTTP/1.1 server with keep-alive and directory listing. Sustain 500 req/s under load test.',
        order: 3,
        isFinal: true,
      },
    ]
  ),
};

const CS205: Year1CourseDefinition = {
  slug: 'year2-cs205',
  courseCode: 'CS 205',
  title: 'Software Engineering Studio',
  termLabel: 'Year 2 · Spring',
  description:
    'Team software development: requirements, design, testing, CI/CD, code review, and agile delivery.',
  syllabusJson: {
    schedule: 'Year 2 · Spring — software studio.',
    topics: ['Requirements', 'Design', 'Testing', 'CI/CD'],
    plannerCode: 'CS205',
  },
  sections: [
    { title: 'Requirements & Design', sortOrder: 0 },
    { title: 'Testing & Quality', sortOrder: 1 },
    { title: 'Team Delivery', sortOrder: 2 },
  ],
  assignments: assignments([
    {
      title: 'S1: Requirements Document',
      description: 'User stories and acceptance criteria.',
      content: `# Studio 1

Write user stories and acceptance tests for a team project idea.`,
      dueAt: '2028-02-20T23:59:59Z',
    },
    {
      title: 'S2: Design Review',
      description: 'Architecture and API sketch.',
      content: `# Studio 2

Submit component diagram, API spec, and test plan.`,
      dueAt: '2028-03-10T23:59:59Z',
    },
    {
      title: 'S3: CI Pipeline',
      description: 'Automated build and test.',
      content: `# Studio 3

Configure GitHub Actions (or equivalent) with lint, unit tests, and coverage report.`,
      dueAt: '2028-03-25T23:59:59Z',
    },
    {
      title: 'S4: Sprint Demo',
      description: 'Working increment and retrospective.',
      content: `# Studio 4

Demo a vertical slice. Submit retrospective notes and code review examples.`,
      dueAt: '2028-04-15T23:59:59Z',
    },
  ]),
  project: project(
    { slug: 'cs205', name: 'CS 205' },
    'cs205-main',
    'CS 205 — Software Engineering Studio',
    'Deliver a team software product with documented requirements, tests, and CI.',
    2,
    [
      { criterion: 'Team Process', maxScore: 30 },
      { criterion: 'Working Software', maxScore: 45 },
      { criterion: 'Testing & CI', maxScore: 25 },
    ],
    [
      {
        title: 'Milestone 1: MVP Spec',
        description: 'Approved requirements and initial repository with CI skeleton.',
        order: 0,
      },
      {
        title: 'Milestone 2: Alpha Release',
        description: 'Core features with unit tests and peer code reviews.',
        order: 1,
      },
      {
        title: 'Final: Beta + Retrospective',
        description: 'Shipped increment, demo video, and team retrospective write-up.',
        order: 2,
        isFinal: true,
      },
    ]
  ),
};

const CS206: Year1CourseDefinition = {
  slug: 'year2-cs206',
  courseCode: 'CS 206',
  title: 'Networks and Security',
  termLabel: 'Year 2 · Spring',
  description:
    'Internet protocols, socket programming, cryptography basics, authentication, and common vulnerabilities.',
  syllabusJson: {
    schedule: 'Year 2 · Spring — networks & security.',
    topics: ['TCP/IP', 'Sockets', 'Crypto', 'Web security'],
    plannerCode: 'CS206',
  },
  sections: [
    { title: 'Network Stack', sortOrder: 0 },
    { title: 'Application Protocols', sortOrder: 1 },
    { title: 'Cryptography Basics', sortOrder: 2 },
    { title: 'Security Engineering', sortOrder: 3 },
  ],
  assignments: assignments([
    {
      title: 'N1: Packet Analysis',
      description: 'Wireshark lab report.',
      content: `# Network Lab 1

Capture and explain a TCP handshake and HTTP request/response.`,
      dueAt: '2028-02-18T23:59:59Z',
    },
    {
      title: 'N2: Socket Chat',
      description: 'Client/server messaging.',
      content: `# Network Lab 2

Implement a multi-client chat server with select/poll or threads.`,
      dueAt: '2028-03-05T23:59:59Z',
    },
    {
      title: 'S1: Crypto Exercises',
      description: 'Hashes, MACs, and TLS concepts.',
      content: `# Security Lab 1

Implement HMAC verification and document TLS certificate chain for a public site.`,
      dueAt: '2028-03-20T23:59:59Z',
    },
    {
      title: 'S2: Threat Model',
      description: 'STRIDE analysis for a web app.',
      content: `# Security Lab 2

Produce a STRIDE threat model and mitigations for your studio project.`,
      dueAt: '2028-04-05T23:59:59Z',
    },
  ]),
  project: project(
    { slug: 'cs206', name: 'CS 206' },
    'cs206-main',
    'CS 206 — Networks and Security',
    'Build a small networked service and document its security properties.',
    2,
    [
      { criterion: 'Protocol Correctness', maxScore: 40 },
      { criterion: 'Security Analysis', maxScore: 35 },
      { criterion: 'Documentation', maxScore: 25 },
    ],
    [
      {
        title: 'Network Service',
        description: 'Working client/server protocol with error handling and tests.',
        order: 0,
      },
      {
        title: 'Security Hardening',
        description: 'Add authentication or encryption layer with written threat model.',
        order: 1,
      },
      {
        title: 'Final: Secure Service Report',
        description: 'Deployable service plus security audit checklist and demo.',
        order: 2,
        isFinal: true,
      },
    ]
  ),
};

const CS143: Year1CourseDefinition = {
  slug: 'stanford-cs143',
  courseCode: 'CS 143',
  title: 'Compilers',
  termLabel: 'Year 2 · Spring',
  description:
    'Complete compiler construction for COOL: lexing, parsing, semantic analysis, type checking, and code generation.',
  syllabusJson: {
    schedule: 'Year 2 · Spring — compiler construction.',
    topics: ['Lexing', 'Parsing', 'Semantics', 'Code generation'],
    plannerCode: 'CS372',
  },
  sections: [
    { title: 'Lexical Analysis', sortOrder: 0 },
    { title: 'Syntax Analysis', sortOrder: 1 },
    { title: 'Semantic Analysis', sortOrder: 2 },
    { title: 'Code Generation', sortOrder: 3 },
  ],
  assignments: assignments([
    {
      title: 'P1: Lexer',
      description: 'COOL flex specification.',
      content: `# Project phase 1

Implement the COOL lexer. Pass the provided lexer test suite.`,
      dueAt: '2028-02-22T23:59:59Z',
    },
    {
      title: 'P2: Parser',
      description: 'LALR grammar in bison.',
      content: `# Project phase 2

Write the COOL parser and resolve shift/reduce conflicts.`,
      dueAt: '2028-03-12T23:59:59Z',
    },
    {
      title: 'P3: Semantics',
      description: 'Type checking and symbol tables.',
      content: `# Project phase 3

Implement scope analysis and the COOL type system.`,
      dueAt: '2028-04-02T23:59:59Z',
    },
    {
      title: 'P4: Codegen Plan',
      description: 'MIPS layout and runtime.',
      content: `# Project phase 4

Submit object layout and dispatch table design before final codegen.`,
      dueAt: '2028-04-20T23:59:59Z',
    },
  ]),
  project: project(
    { slug: 'cs143', name: 'CS 143' },
    'cs143-main',
    'CS 143 — Compilers',
    'Complete compiler construction for COOL: lexing, parsing, semantic analysis, type checking, and code generation to MIPS.',
    2,
    [
      { criterion: 'Test Suite Pass Rate', maxScore: 60 },
      { criterion: 'Error Recovery & Messages', maxScore: 25 },
      { criterion: 'Code Quality', maxScore: 15 },
    ],
    [
      {
        title: 'Lexical Analysis (flex)',
        description: 'Implement the COOL lexer using flex. Pass ≥ 95% of the lexer test suite.',
        order: 0,
      },
      {
        title: 'Syntax Analysis (bison LALR)',
        description: 'Write the COOL LALR(1) grammar in bison. Resolve shift/reduce conflicts.',
        order: 1,
      },
      {
        title: 'Semantic Analysis & Type Checking',
        description: 'Build the symbol table and COOL type system with meaningful error messages.',
        order: 2,
      },
      {
        title: 'Final: Full COOL Compiler → MIPS',
        description:
          'Implement code generation to MIPS assembly. Pass all reference compiler tests.',
        order: 3,
        isFinal: true,
      },
    ]
  ),
};

export const YEAR2_COURSES: Year1CourseDefinition[] = [
  CS107,
  CS109,
  CS161,
  CS203,
  CS110,
  CS205,
  CS206,
  CS143,
];

export const YEAR2_COURSE_SLUGS = YEAR2_COURSES.map((c) => c.slug);

/** @deprecated Use YEAR2_COURSES entry for stanford-cs107 */
export const YEAR2_CS107_COURSE = CS107;

export type Year2CourseDefinition = Year1CourseDefinition;

export type Year2SyllabusJson = Prisma.InputJsonValue;
