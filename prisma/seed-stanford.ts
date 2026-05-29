/**
 * Stanford Courses Seed
 * Adds real Stanford courses, sections, and assignments to the database.
 * Run: npx tsx prisma/seed-stanford.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Course definitions ──────────────────────────────────────────────────────

const STANFORD_COURSES = [
  {
    slug: 'cs106b',
    courseCode: 'CS106B',
    title: 'CS106B — Programming Abstractions',
    termLabel: 'Spring 2025',
    description:
      "The second course in Stanford's introductory sequence. Covers C++, recursion, algorithmic analysis, and classic data structures: stacks, queues, trees, and graphs.",
    sections: [
      { title: 'Welcome & C++ Basics', sortOrder: 0 },
      { title: 'Recursion', sortOrder: 1 },
      { title: 'Data Structures: Stacks & Queues', sortOrder: 2 },
      { title: 'Trees & Graphs', sortOrder: 3 },
      { title: 'Sorting & Searching', sortOrder: 4 },
    ],
    assignments: [
      {
        title: 'A1: Welcome to C++',
        description: 'Write simple C++ programs to get comfortable with the language and tools.',
        content: `# Assignment 1: Welcome to C++

## Overview
This assignment gets you comfortable with C++ syntax, compilation, and the Stanford C++ library.

## Parts

### Part 1 — Perfect Numbers
Write a function \`isPerfect(int n)\` that returns true if n is a perfect number (equals the sum of its proper divisors).

### Part 2 — Game of Life
Implement Conway's Game of Life on a 2D grid. Read an initial state from a file and simulate N generations.

### Part 3 — Flesch-Kincaid Grade Level
Calculate the readability score of a text file using the Flesch-Kincaid formula.

## Grading
- Correctness: 70 pts
- Style & documentation: 30 pts

Submit via \`nibras submit\`.`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2025-04-10T23:59:59Z',
      },
      {
        title: 'A2: Recursion',
        description:
          'Solve problems using recursive thinking: towers of Hanoi, fractals, and backtracking.',
        content: `# Assignment 2: Recursion

## Overview
Practice decomposing problems into recursive sub-problems.

## Parts

### Part 1 — Towers of Hanoi
Implement and animate the classic Towers of Hanoi puzzle for N disks.

### Part 2 — Sierpinski Triangle
Draw a Sierpinski triangle fractal to a given recursion depth using the graphics library.

### Part 3 — Boggle
Implement the board game Boggle. Use recursive backtracking to find all valid words on a 4×4 letter grid.

## Grading
- Correctness: 60 pts
- Recursion structure (no loops where recursion expected): 20 pts
- Style: 20 pts`,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2025-04-24T23:59:59Z',
      },
      {
        title: 'A3: Stacks, Queues & Linked Lists',
        description: 'Implement custom Stack and Queue classes backed by a linked list.',
        content: `# Assignment 3: Stacks, Queues & Linked Lists

## Overview
Build your own stack and queue from scratch using a singly-linked list.

## Requirements
- \`MyStack<T>\`: push, pop, peek, isEmpty, size
- \`MyQueue<T>\`: enqueue, dequeue, peek, isEmpty, size
- No use of STL containers internally

## Testing
A full CTest suite is provided. Run \`cmake -S . -B build && ctest --test-dir build\`.`,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2025-05-08T23:59:59Z',
      },
      {
        title: 'A4: Trees & Priority Queues',
        description: 'Implement a binary search tree and a heap-based priority queue.',
        content: `# Assignment 4: Trees & Priority Queues

## Parts

### Part 1 — Binary Search Tree
Implement \`BST<T>\` with insert, contains, remove, and an in-order iterator.

### Part 2 — Huffman Encoding
Build a Huffman encoding tree to compress a text file. Implement both encode and decode.

## Grading
- BST correctness: 50 pts
- Huffman correctness: 30 pts
- Style: 20 pts`,
        pointsPossible: 100,
        sortOrder: 3,
        dueAt: '2025-05-22T23:59:59Z',
      },
      {
        title: 'A5: Graphs',
        description: "Implement graph traversal algorithms BFS and Dijkstra's shortest path.",
        content: `# Assignment 5: Graphs

## Overview
Work with a road-network dataset to implement graph search algorithms.

## Parts

### Part 1 — Breadth-First Search
Find the shortest path (by hops) between two cities.

### Part 2 — Dijkstra's Algorithm
Find the shortest path by total road distance using a priority queue.

### Part 3 — Minimum Spanning Tree
Implement Kruskal's algorithm to find the MST of the network.`,
        pointsPossible: 100,
        sortOrder: 4,
        dueAt: '2025-06-05T23:59:59Z',
      },
    ],
  },

  {
    slug: 'cs107',
    courseCode: 'CS107',
    title: 'CS107 — Computer Organization & Systems',
    termLabel: 'Fall 2025',
    description:
      'De-mystifies how computers execute programs. Covers C, bitwise operations, pointers, memory management, assembly (x86-64), and performance optimization.',
    sections: [
      { title: 'C Programming & Unix Tools', sortOrder: 0 },
      { title: 'Bits, Bytes & Integers', sortOrder: 1 },
      { title: 'Pointers & Memory', sortOrder: 2 },
      { title: 'Heap Allocation', sortOrder: 3 },
      { title: 'x86-64 Assembly', sortOrder: 4 },
      { title: 'Performance & Caches', sortOrder: 5 },
    ],
    assignments: [
      {
        title: 'A1: C Strings & Arrays',
        description: 'Implement standard C string utilities without using <string.h>.',
        content: `# Assignment 1: C Strings & Arrays

## Overview
Re-implement several \`<string.h>\` functions to build intuition for C memory and pointers.

## Functions to implement
- \`mystrlen(const char *s)\`
- \`mystrcpy(char *dst, const char *src)\`
- \`mystrcat(char *dst, const char *src)\`
- \`mystrstr(const char *haystack, const char *needle)\`
- \`mymemmove(void *dst, const void *src, size_t n)\`

## Testing
Run \`make && ./test_strings\`. All 40 tests must pass.`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2025-10-09T23:59:59Z',
      },
      {
        title: 'A2: Bitwise Puzzles',
        description: 'Solve 15 bit-manipulation puzzles using only bitwise operators.',
        content: `# Assignment 2: Bitwise Puzzles

## Rules
- Only allowed operators: \`! ~ & ^ | + << >>\`
- No conditionals, loops, or function calls
- Each puzzle has a maximum operator count

## Sample Puzzles
- \`bitAnd(x, y)\` — return x & y using only | and ~
- \`getByte(x, n)\` — extract byte n from x
- \`isNegative(x)\` — return 1 if x < 0
- \`floatScale2(uf)\` — return bit-level equivalent of 2 * f`,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2025-10-23T23:59:59Z',
      },
      {
        title: 'A3: Heap Allocator',
        description: 'Implement malloc, realloc, and free using an explicit free list.',
        content: `# Assignment 3: Heap Allocator

## Overview
Build a dynamic memory allocator in C that implements \`mymalloc\`, \`myrealloc\`, and \`myfree\`.

## Requirements
- Use an **explicit free list** with first-fit or best-fit policy
- Coalesce adjacent free blocks on free
- Must pass all correctness and utilization benchmarks
- Target ≥ 60% heap utilization

## Grading
- Correctness (passes harness): 60 pts
- Utilization: 25 pts
- Throughput: 15 pts`,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2025-11-06T23:59:59Z',
      },
      {
        title: 'A4: Assembly & GDB',
        description: 'Reverse-engineer a "bomb" binary using GDB and x86-64 assembly analysis.',
        content: `# Assignment 4: Binary Bomb

## Overview
A "bomb" program has 6 phases. Each phase reads a string from stdin. Wrong input → BOOM (penalty). Use GDB and \`objdump\` to disassemble and understand the code.

## Phases
1. String comparison
2. Number sequence
3. Switch statement
4. Recursion
5. Pointer arithmetic
6. Linked list sort

## Tips
- \`gdb bomb\`, set breakpoints, \`disas phase_1\`
- \`x/s\` to examine strings in memory`,
        pointsPossible: 100,
        sortOrder: 3,
        dueAt: '2025-11-20T23:59:59Z',
      },
    ],
  },

  {
    slug: 'cs221',
    courseCode: 'CS221',
    title: 'CS221 — Artificial Intelligence: Principles & Techniques',
    termLabel: 'Spring 2025',
    description:
      'Foundational AI course covering search, constraint satisfaction, MDPs, game playing, graphical models, machine learning, and logic-based reasoning.',
    sections: [
      { title: 'Introduction & Reflex Models', sortOrder: 0 },
      { title: 'Search & Optimization', sortOrder: 1 },
      { title: 'Markov Decision Processes', sortOrder: 2 },
      { title: 'Game Playing & Adversarial Search', sortOrder: 3 },
      { title: 'Constraint Satisfaction', sortOrder: 4 },
      { title: 'Bayesian Networks', sortOrder: 5 },
      { title: 'Machine Learning Basics', sortOrder: 6 },
    ],
    assignments: [
      {
        title: 'HW1: Foundations',
        description:
          'Math and probability warm-up: linear algebra, calculus, and probability review.',
        content: `# Homework 1: Foundations

## Overview
Build the mathematical toolkit for the rest of the course.

## Topics
- Linear algebra: matrix operations, eigenvalues
- Probability: Bayes' rule, conditional independence
- Calculus: gradients, chain rule
- Python/NumPy warm-up exercises`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2025-04-07T23:59:59Z',
      },
      {
        title: 'HW2: Search (Pac-Man)',
        description: 'Implement DFS, BFS, A* and a heuristic to navigate a Pac-Man maze.',
        content: `# Homework 2: Search

## Overview
Implement search algorithms in a Pac-Man environment.

## Parts
1. **Depth-First Search** — find any path to the goal
2. **Breadth-First Search** — find shortest path by steps
3. **Uniform-Cost Search** — find cheapest path
4. **A* Search** — implement an admissible heuristic
5. **Corners Problem** — formulate as a search problem

## Files to edit
- \`search.py\`
- \`searchAgents.py\``,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2025-04-21T23:59:59Z',
      },
      {
        title: 'HW3: MDPs & Reinforcement Learning',
        description: 'Implement value iteration and Q-learning for grid-world and Pac-Man.',
        content: `# Homework 3: MDPs & RL

## Parts
1. **Value Iteration** — compute optimal policy for GridWorld
2. **Policy Extraction** — derive greedy policy from V*
3. **Q-Learning** — implement temporal-difference learning
4. **Approximate Q-Learning** — use feature-based Q-function

## Files to edit
- \`valueIterationAgents.py\`
- \`qlearningAgents.py\``,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2025-05-05T23:59:59Z',
      },
      {
        title: 'HW4: Constraint Satisfaction',
        description: 'Implement backtracking search with AC-3 arc consistency for Sudoku.',
        content: `# Homework 4: CSPs

## Parts
1. **AC-3 Arc Consistency** — reduce domains before search
2. **Backtracking** — implement with forward checking
3. **Sudoku Solver** — apply CSP framework to Sudoku
4. **Map Coloring** — generalize to arbitrary graphs`,
        pointsPossible: 100,
        sortOrder: 3,
        dueAt: '2025-05-19T23:59:59Z',
      },
      {
        title: 'HW5: Machine Learning',
        description: 'Implement logistic regression, neural networks, and perceptron from scratch.',
        content: `# Homework 5: Machine Learning

## Parts
1. **Perceptron** — binary linear classifier
2. **Logistic Regression** — gradient descent training
3. **Neural Network** — implement forward & back-prop for digit classification
4. **Sentiment Analysis** — classify movie reviews (positive/negative)`,
        pointsPossible: 100,
        sortOrder: 4,
        dueAt: '2025-06-02T23:59:59Z',
      },
    ],
  },

  {
    slug: 'cs224n',
    courseCode: 'CS224N',
    title: 'CS224N — Natural Language Processing with Deep Learning',
    termLabel: 'Winter 2025',
    description:
      'Introduction to deep learning for NLP. Covers word embeddings, RNNs, LSTMs, Transformers, attention, and large language models (LLMs) using PyTorch.',
    sections: [
      { title: 'Word Vectors & Neural Classifiers', sortOrder: 0 },
      { title: 'Dependency Parsing', sortOrder: 1 },
      { title: 'Recurrent Networks & Language Models', sortOrder: 2 },
      { title: 'Attention & Transformers', sortOrder: 3 },
      { title: 'Pretraining & Fine-tuning LLMs', sortOrder: 4 },
      { title: 'Question Answering & NLU', sortOrder: 5 },
    ],
    assignments: [
      {
        title: 'A1: Exploring Word Vectors',
        description:
          'Analyze co-occurrence matrices and train word2vec. Visualize embeddings with PCA.',
        content: `# Assignment 1: Word Vectors

## Parts
1. **Co-occurrence Matrix** — build from a text corpus, apply PPMI weighting
2. **SVD Reduction** — reduce to 50-dim and visualize with PCA
3. **word2vec** — train skip-gram with negative sampling on text8
4. **Analysis** — compare co-occurrence vs. word2vec analogies`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2025-01-23T23:59:59Z',
      },
      {
        title: 'A2: Neural Transition-Based Dependency Parsing',
        description:
          'Implement a neural dependency parser using a feed-forward network in PyTorch.',
        content: `# Assignment 2: Dependency Parsing

## Parts
1. **Transition System** — implement SHIFT, LEFT-ARC, RIGHT-ARC
2. **Neural Model** — embed tokens + POS tags, train MLP classifier
3. **Training Loop** — mini-batch SGD with dropout
4. **Evaluation** — compute UAS and LAS on Penn Treebank dev set

## Files to edit
- \`parser_transitions.py\`
- \`parser_model.py\`
- \`run.py\``,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2025-02-06T23:59:59Z',
      },
      {
        title: 'A3: Neural Machine Translation (seq2seq + attention)',
        description: 'Build a character-level NMT model with dot-product attention.',
        content: `# Assignment 3: Neural Machine Translation

## Parts
1. **Encoder** — bidirectional LSTM over source characters
2. **Decoder** — LSTM + multiplicative attention over encoder outputs
3. **Training** — teacher forcing, cross-entropy loss
4. **Beam Search** — decode with beam size 5
5. **Evaluation** — report BLEU score on Cherokee→English dev set`,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2025-02-27T23:59:59Z',
      },
      {
        title: 'A4: Self-Attention & Transformers',
        description:
          'Implement multi-head self-attention and pre-train a mini GPT on birth-place data.',
        content: `# Assignment 4: Transformers

## Parts
1. **Self-Attention** — implement scaled dot-product attention
2. **Multi-Head Attention** — split into H heads, concatenate outputs
3. **Transformer Block** — add LayerNorm and feed-forward sublayer
4. **Pre-training** — train a 6-layer GPT-mini on a city/birthplace dataset
5. **Fine-tuning** — adapt to a QA task, report exact-match accuracy`,
        pointsPossible: 100,
        sortOrder: 3,
        dueAt: '2025-03-13T23:59:59Z',
      },
    ],
  },

  {
    slug: 'cs231n',
    courseCode: 'CS231N',
    title: 'CS231N — Deep Learning for Computer Vision',
    termLabel: 'Spring 2025',
    description:
      'Deep dive into CNNs, RNNs, Transformers, and generative models for visual recognition. Covers image classification, detection, segmentation, and generation.',
    sections: [
      { title: 'Image Classification & Linear Models', sortOrder: 0 },
      { title: 'Neural Networks & Back-propagation', sortOrder: 1 },
      { title: 'Convolutional Neural Networks', sortOrder: 2 },
      { title: 'Training & Optimization', sortOrder: 3 },
      { title: 'Vision Transformers', sortOrder: 4 },
      { title: 'Generative Models (GANs & VAEs)', sortOrder: 5 },
    ],
    assignments: [
      {
        title: 'A1: Image Classification (kNN, SVM, Softmax)',
        description: 'Implement and compare kNN, SVM, and softmax classifiers on CIFAR-10.',
        content: `# Assignment 1: Image Classification

## Parts
1. **k-Nearest Neighbor Classifier** — vectorized L2 distance, cross-validate k
2. **SVM Loss** — implement multi-class SVM hinge loss + gradient
3. **Softmax Classifier** — implement cross-entropy loss + gradient
4. **Two-Layer Neural Net** — train a fully-connected net on CIFAR-10

## Deliverable
Report test accuracy of each classifier in the Jupyter notebook.`,
        pointsPossible: 100,
        sortOrder: 0,
        dueAt: '2025-04-17T23:59:59Z',
      },
      {
        title: 'A2: Backprop, BatchNorm & Dropout',
        description:
          'Implement arbitrary-depth nets with batch normalization, dropout, and ConvNet layers.',
        content: `# Assignment 2: Deeper Networks

## Parts
1. **Fully Connected Nets** — modular forward/backward API
2. **Batch Normalization** — train/test mode, gradient check
3. **Dropout** — inverted dropout, regularization effects
4. **ConvNet** — implement conv_forward, conv_backward, max_pool
5. **PyTorch CIFAR-10** — train a ConvNet, target ≥ 70% accuracy`,
        pointsPossible: 100,
        sortOrder: 1,
        dueAt: '2025-05-08T23:59:59Z',
      },
      {
        title: 'A3: Vision Transformers & Generative Models',
        description: 'Implement image captioning (RNN/Transformer), style transfer, GANs and VAEs.',
        content: `# Assignment 3: Attention & Generation

## Parts
1. **Image Captioning (RNN)** — LSTM decoder with spatial features
2. **Image Captioning (Transformer)** — multi-head self-attention decoder
3. **Network Visualization** — saliency maps, class activation mapping
4. **GAN** — train a DCGAN on CIFAR-10; visualize generated images
5. **VAE** — implement reparameterization trick, report reconstruction loss`,
        pointsPossible: 100,
        sortOrder: 2,
        dueAt: '2025-05-29T23:59:59Z',
      },
    ],
  },
];

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Stanford courses...\n');

  for (const def of STANFORD_COURSES) {
    // Upsert course
    const course = await prisma.course.upsert({
      where: { slug: def.slug },
      update: {
        title: def.title,
        termLabel: def.termLabel,
        courseCode: def.courseCode,
        description: def.description,
        isActive: true,
        isPublic: true,
      },
      create: {
        slug: def.slug,
        title: def.title,
        termLabel: def.termLabel,
        courseCode: def.courseCode,
        description: def.description,
        isActive: true,
        isPublic: true,
      },
    });
    console.log(`✅ Course: ${def.courseCode} — ${def.title}`);

    // Upsert sections
    for (const sec of def.sections) {
      const existing = await prisma.courseSection.findFirst({
        where: { courseId: course.id, title: sec.title },
      });
      if (!existing) {
        await prisma.courseSection.create({
          data: {
            courseId: course.id,
            title: sec.title,
            sortOrder: sec.sortOrder,
          },
        });
      }
      console.log(`   📁 Section: ${sec.title}`);
    }

    // Upsert assignments
    for (const asgn of def.assignments) {
      const existing = await prisma.courseAssignment.findFirst({
        where: { courseId: course.id, title: asgn.title },
      });
      if (!existing) {
        await prisma.courseAssignment.create({
          data: {
            courseId: course.id,
            title: asgn.title,
            description: asgn.description,
            content: asgn.content,
            pointsPossible: asgn.pointsPossible,
            sortOrder: asgn.sortOrder,
            dueAt: asgn.dueAt ? new Date(asgn.dueAt) : null,
            published: true,
          },
        });
        console.log(`   📝 Assignment: ${asgn.title}`);
      } else {
        await prisma.courseAssignment.update({
          where: { id: existing.id },
          data: {
            description: asgn.description,
            content: asgn.content,
            pointsPossible: asgn.pointsPossible,
            sortOrder: asgn.sortOrder,
            dueAt: asgn.dueAt ? new Date(asgn.dueAt) : null,
            published: true,
          },
        });
        console.log(`   🔄 Updated: ${asgn.title}`);
      }
    }

    console.log('');
  }

  console.log('🎉 Stanford courses seed complete!');
  console.log('');
  console.log('Courses added:');
  STANFORD_COURSES.forEach((c) =>
    console.log(
      `  • ${c.courseCode}: ${c.assignments.length} assignments, ${c.sections.length} sections`
    )
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
