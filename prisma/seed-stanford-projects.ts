/**
 * Stanford Projects Seed
 * Adds published Projects, ProjectReleases, and Milestones to the 5 Stanford courses.
 * Run: npm run seed:stanford-projects
 */
import { DeliveryMode, PrismaClient, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'https://nibras-api.fly.dev';
const RELEASE = '2026-05-25-stanford-v1';

// ── Project definitions per course slug ─────────────────────────────────────

const PROJECTS: Record<
  string,
  {
    key: string;
    name: string;
    description: string;
    task: string;
    milestone: string;
    dueAt: string | null;
  }[]
> = {
  cs106b: [
    {
      key: 'cs106b/wordladder',
      name: 'Word Ladder',
      description: 'Use BFS to find the shortest chain of single-letter changes between two words.',
      task: `# Project: Word Ladder

## Overview
A **word ladder** is a sequence of words where each step changes exactly one letter, e.g.:
\`cat → bat → bad → bed\`

## Your Task
Implement \`wordLadder(start, end, lexicon)\` using **Breadth-First Search** so it always returns the shortest ladder.

## Requirements
- Return an empty vector if no ladder exists
- Each intermediate word must be in the provided lexicon
- Run \`make && ./test_wordladder\` — all tests must pass

## Starter Files
- \`wordladder.cpp\` — implement here
- \`wordladder.h\`
- \`test_wordladder.cpp\` — do not modify`,
      milestone: 'Implement BFS-based word ladder and pass all 20 automated tests.',
      dueAt: '2025-04-17T23:59:59Z',
    },
    {
      key: 'cs106b/huffman',
      name: 'Huffman Encoding',
      description: 'Build a Huffman tree to compress and decompress text files losslessly.',
      task: `# Project: Huffman Encoding

## Overview
Implement a lossless file compressor using Huffman coding.

## Steps
1. **Count frequencies** of each character in the input file
2. **Build the Huffman tree** using a priority queue (min-heap)
3. **Generate the encoding table** by traversing the tree
4. **Encode** the input to a binary bitstream
5. **Decode** a bitstream back to the original text

## Files
- \`huffman.cpp\` — fill in all TODO functions
- \`huffman.h\`
- \`bits.h\` — provided bit I/O utilities

## Grading
- Encode correctness: 40 pts
- Decode round-trip: 40 pts
- Edge cases (empty file, single char): 20 pts`,
      milestone: 'Compress and round-trip decompress a 1 MB sample file with ≥ 40% size reduction.',
      dueAt: '2025-05-01T23:59:59Z',
    },
    {
      key: 'cs106b/boggle',
      name: 'Boggle',
      description:
        'Recursive backtracking search for all valid English words on a 4×4 Boggle board.',
      task: `# Project: Boggle

## Overview
Find **all words** on a 4×4 Boggle board using recursive backtracking.

## Rules
- Adjacent includes diagonal neighbors
- Each die can be used at most once per word
- Words must be ≥ 4 letters and exist in the provided lexicon

## Requirements
- Implement \`findAllWords(board, lexicon)\` returning a sorted set of words
- Use a **trie-based** early termination to prune the search tree
- Pass all automated correctness tests and the performance benchmark

## Files
- \`boggle.cpp\`
- \`boggle.h\``,
      milestone: 'Find all valid words on 10 test boards within 200 ms each.',
      dueAt: '2025-05-15T23:59:59Z',
    },
    {
      key: 'cs106b/trailblazer',
      name: 'Trailblazer (Graph Algorithms)',
      description:
        'Implement Dijkstra, A*, and Kruskal on a terrain map to find paths and spanning trees.',
      task: `# Project: Trailblazer

## Overview
Navigate a 2D terrain grid as a weighted graph. Implement four classic graph algorithms.

## Algorithms to implement
1. **BFS** — shortest path by number of steps
2. **Dijkstra's** — shortest path by elevation cost
3. **A*** — shortest path with a heuristic
4. **Kruskal's** — minimum spanning tree (for road network)

## Files
- \`trailblazer.cpp\` — implement all four functions
- \`trailblazer.h\`
- Terrain map data is provided as a \`Grid<double>\`

## Grading
Each algorithm: 20 pts | Style: 20 pts`,
      milestone: 'All four algorithms pass automated tests on 5 terrain maps.',
      dueAt: '2025-05-29T23:59:59Z',
    },
    {
      key: 'cs106b/linkedlist',
      name: 'Linked List (Your Own Vector)',
      description: 'Implement a templated dynamic array backed by a heap-allocated linked list.',
      task: `# Project: MyVector (Linked List)

## Overview
Build \`MyVector<T>\` — a resizable array backed by a singly-linked list of nodes.

## Required Operations
| Method | Description |
|--------|-------------|
| \`push_back(val)\` | Append to end, O(1) amortized |
| \`pop_back()\` | Remove last element |
| \`operator[](i)\` | Index access, O(n) |
| \`insert(i, val)\` | Insert before index i |
| \`remove(i)\` | Remove element at index i |
| \`size()\` / \`isEmpty()\` | Query size |

## Memory
- No memory leaks (Valgrind clean)
- Implement a proper copy constructor and assignment operator`,
      milestone: 'Pass 35 correctness tests and achieve zero Valgrind errors.',
      dueAt: '2025-04-10T23:59:59Z',
    },
  ],

  cs107: [
    {
      key: 'cs107/reassemble',
      name: 'Reassemble (File Recovery)',
      description:
        'Recover a shredded document by reassembling character fragments using string algorithms.',
      task: `# Project: Reassemble

## Overview
A document was "shredded" into overlapping fragments. Reconstruct the original by finding the best overlap order.

## Your Task
Implement \`reassemble(fragments)\` in C:
1. Find the pair of fragments with maximum overlap
2. Merge them into one
3. Repeat until one fragment remains

## Requirements
- Handle duplicate fragments
- \`O(n² × L)\` is acceptable (n = number of fragments, L = max length)
- No memory leaks

## Files
- \`reassemble.c\` — implement here
- \`reassemble.h\`
- \`test_reassemble.c\` — do not modify`,
      milestone: 'Reassemble 5 test documents correctly with zero memory errors.',
      dueAt: '2025-10-16T23:59:59Z',
    },
    {
      key: 'cs107/myalloc',
      name: 'Heap Allocator (myalloc)',
      description: 'Implement malloc/realloc/free with an explicit free list and block coalescing.',
      task: `# Project: Heap Allocator

## Overview
Build a general-purpose heap allocator in C.

## API
\`\`\`c
void *mymalloc(size_t size);
void *myrealloc(void *ptr, size_t new_size);
void  myfree(void *ptr);
\`\`\`

## Design Requirements
- **Explicit free list** (doubly-linked)
- **Header + footer** tags for O(1) coalescing
- **First-fit** placement policy
- Thread-unsafe is fine

## Benchmarks
| Metric | Target |
|--------|--------|
| Heap utilization | ≥ 60% |
| Throughput | ≥ 10 000 ops/s |

## Files
- \`myalloc.c\`
- \`myalloc.h\`
- \`allocator_test.c\` — do not modify`,
      milestone: 'Pass correctness harness, achieve ≥ 60% utilization and ≥ 10k ops/s throughput.',
      dueAt: '2025-11-13T23:59:59Z',
    },
    {
      key: 'cs107/mysh',
      name: 'Custom Unix Shell (mysh)',
      description:
        'Build a mini Unix shell that supports pipelines, redirection, and built-in commands.',
      task: `# Project: mysh — Custom Unix Shell

## Overview
Implement a simplified Unix shell in C.

## Required Features
- **Built-ins**: \`cd\`, \`pwd\`, \`exit\`, \`history\`
- **Pipeline**: \`ls | grep foo | wc -l\`
- **Redirection**: \`cmd < in.txt > out.txt\`
- **Background jobs**: \`sleep 10 &\`
- **Signal handling**: Ctrl-C kills foreground job, not shell

## Implementation Notes
- Use \`fork()\`, \`execvp()\`, \`pipe()\`, \`dup2()\`
- Tokenize input with a proper lexer (handle quoted strings)
- Reap zombie processes with \`waitpid(WNOHANG)\`

## Files
- \`mysh.c\` — main shell loop
- \`parse.c\` / \`parse.h\` — tokenizer`,
      milestone: 'Pass all 30 shell integration tests including pipelines and redirection.',
      dueAt: '2025-12-04T23:59:59Z',
    },
    {
      key: 'cs107/vector-hashset',
      name: 'Generic Vector & Hashset',
      description:
        'Implement type-generic vector and hash set in C using void* and function pointers.',
      task: `# Project: Generic Vector & Hashset

## Overview
Build reusable, type-generic data structures in C (no C++ templates).

## Part 1 — Generic Vector
\`\`\`c
void  vector_init(vector *v, int elem_size, free_fn cleanup);
void  vector_append(vector *v, const void *elem);
void *vector_nth(const vector *v, int index);
void  vector_dispose(vector *v);
\`\`\`

## Part 2 — Generic Hashset
\`\`\`c
void  hashset_init(hashset *hs, int elem_size, hash_fn hash, cmp_fn cmp, free_fn cleanup);
void  hashset_add(hashset *hs, const void *elem);
bool  hashset_lookup(const hashset *hs, const void *elem);
void  hashset_dispose(hashset *hs);
\`\`\`

## Requirements
- Must work with \`int\`, \`char *\`, and custom structs
- Valgrind-clean`,
      milestone: 'Pass all 45 tests for vector and hashset with zero memory errors.',
      dueAt: '2025-10-30T23:59:59Z',
    },
  ],

  cs221: [
    {
      key: 'cs221/pacman-search',
      name: 'Pac-Man Search',
      description:
        'Implement DFS, BFS, UCS, and A* to navigate Pac-Man through various maze configurations.',
      task: `# Project: Pac-Man Search

## Overview
Agent must find paths through a Pac-Man maze using classic search algorithms.

## Tasks
1. **DFS** — \`depthFirstSearch(problem)\`
2. **BFS** — \`breadthFirstSearch(problem)\`
3. **UCS** — \`uniformCostSearch(problem)\`
4. **A*** — \`aStarSearch(problem, heuristic)\`
5. **Corners heuristic** — admissible heuristic for visiting all 4 corners
6. **Food heuristic** — admissible heuristic for eating all food

## Files to edit
- \`search.py\`
- \`searchAgents.py\`

## Autograder
\`\`\`bash
python autograder.py
\`\`\`
Target: 25/25 points`,
      milestone: 'Score 25/25 on the autograder for all 6 search tasks.',
      dueAt: '2025-04-14T23:59:59Z',
    },
    {
      key: 'cs221/pacman-multiagent',
      name: 'Pac-Man Multi-Agent (Minimax)',
      description: 'Build adversarial agents using minimax, alpha-beta pruning, and expectimax.',
      task: `# Project: Multi-Agent Pac-Man

## Overview
Pac-Man must compete against ghost agents using adversarial search.

## Agents to implement
1. **ReflexAgent** — simple evaluation function
2. **MinimaxAgent** — full game tree to depth d
3. **AlphaBetaAgent** — minimax with α-β pruning
4. **ExpectimaxAgent** — ghosts move randomly (expectation)
5. **Better evaluation function** — design your own

## Files to edit
- \`multiAgents.py\`

## Autograder
\`\`\`bash
python autograder.py
\`\`\`
Target: 25/25 points`,
      milestone: 'Score 25/25 on the autograder including the custom evaluation function.',
      dueAt: '2025-04-28T23:59:59Z',
    },
    {
      key: 'cs221/pacman-rl',
      name: 'Pac-Man Reinforcement Learning',
      description:
        'Train a Pac-Man agent with Q-learning and approximate Q-learning using feature-based Q-functions.',
      task: `# Project: Reinforcement Learning

## Overview
Train Pac-Man to play without knowing the rules — only through rewards.

## Tasks
1. **Value Iteration** — compute V* for GridWorld MDP
2. **Q-Learning** — temporal-difference learning on GridWorld
3. **Epsilon-Greedy** — exploration vs exploitation
4. **Approximate Q-Learning** — linear Q-function with features
5. **Pac-Man Q-Learning** — apply to full Pac-Man

## Files to edit
- \`valueIterationAgents.py\`
- \`qlearningAgents.py\`
- \`featureExtractors.py\``,
      milestone: 'Score 25/25 on the autograder. Pac-Man agent must win ≥ 80% of smallGrid games.',
      dueAt: '2025-05-12T23:59:59Z',
    },
    {
      key: 'cs221/sentiment',
      name: 'Sentiment Analysis (ML)',
      description:
        'Build a sentiment classifier for movie reviews using stochastic gradient descent.',
      task: `# Project: Sentiment Analysis

## Overview
Classify movie reviews as positive or negative using a linear classifier trained with SGD.

## Parts
1. **Feature extraction** — bag-of-words, bigrams, character n-grams
2. **SGD training** — implement \`learnPredictor(trainExamples, featureExtractor, numEpochs, eta)\`
3. **Regularization** — L2 weight decay
4. **Error analysis** — identify 5 false positives and 5 false negatives, explain

## Files to edit
- \`sentiment.py\`

## Target
≥ 80% accuracy on the held-out test set`,
      milestone: 'Achieve ≥ 80% test accuracy and submit written error analysis.',
      dueAt: '2025-05-26T23:59:59Z',
    },
    {
      key: 'cs221/scheduling-csp',
      name: 'Course Scheduling (CSP)',
      description:
        'Model university course scheduling as a CSP and solve with backtracking + AC-3.',
      task: `# Project: Course Scheduling CSP

## Overview
Given courses, rooms, time slots, and constraints, produce a valid schedule using CSP solving.

## Tasks
1. **Variable & domain definition** — course→(room, timeslot)
2. **Constraint encoding** — no room conflicts, no instructor double-booking, prerequisites
3. **AC-3 arc consistency** — prune domains before search
4. **Backtracking** — with MRV and LCV heuristics
5. **Analysis** — report how many backtracks each heuristic saves

## Files to edit
- \`csp.py\`
- \`submission.py\``,
      milestone: 'Solve provided scheduling benchmarks in < 30 seconds each.',
      dueAt: '2025-06-02T23:59:59Z',
    },
  ],

  cs224n: [
    {
      key: 'cs224n/word2vec',
      name: 'word2vec from Scratch',
      description: 'Implement skip-gram word2vec with negative sampling using only NumPy.',
      task: `# Project: word2vec from Scratch

## Overview
Implement the skip-gram model with negative sampling — no deep learning frameworks allowed.

## Tasks
1. **Sigmoid & softmax** — implement numerically stable versions
2. **Naive softmax loss** — gradient w.r.t. center & context vectors
3. **Negative sampling loss** — implement \`negSamplingLoss\`
4. **Skip-gram model** — sum loss over context window
5. **SGD training** — train on Stanford Sentiment Treebank

## Files to edit
- \`word2vec.py\`
- \`sgd.py\`

## Deliverable
Report cosine similarity for 10 analogy pairs (king - man + woman ≈ queen)`,
      milestone: 'Gradient checks pass. Analogy accuracy ≥ 15% on word2vec-google-news subset.',
      dueAt: '2025-01-30T23:59:59Z',
    },
    {
      key: 'cs224n/dep-parser',
      name: 'Neural Dependency Parser',
      description:
        'Train a transition-based dependency parser with a feed-forward neural network in PyTorch.',
      task: `# Project: Neural Dependency Parser

## Overview
Build a transition-based parser using an arc-standard system and a neural classifier.

## Architecture
- **Input**: top-3 stack tokens + top-3 buffer tokens (word + POS embeddings)
- **Hidden**: 200-dim ReLU layer with dropout
- **Output**: softmax over {SHIFT, LEFT-ARC-X, RIGHT-ARC-X} transitions

## Tasks
1. Implement transition system (\`parser_transitions.py\`)
2. Build the neural model (\`parser_model.py\`)
3. Train with Adam, learning rate decay
4. Evaluate UAS/LAS on Penn Treebank dev set

## Target
UAS ≥ 88% on PTB dev set`,
      milestone: 'Achieve UAS ≥ 88% on PTB dev. Pass all transition system unit tests.',
      dueAt: '2025-02-13T23:59:59Z',
    },
    {
      key: 'cs224n/nmt',
      name: 'Neural Machine Translation',
      description:
        'Implement a seq2seq NMT system with multiplicative attention for Cherokee→English.',
      task: `# Project: Neural Machine Translation

## Architecture
- **Encoder**: bidirectional LSTM over source word embeddings
- **Decoder**: unidirectional LSTM with multiplicative (dot-product) attention
- **Output**: linear projection + softmax over target vocabulary

## Tasks
1. Implement \`ModelEmbeddings\` class
2. Implement encoder \`forward\`
3. Implement attention \`step\`
4. Implement beam search (beam size = 5)
5. Train on Cherokee→English and evaluate with BLEU

## Files
- \`model_embeddings.py\`
- \`nmt_model.py\`

## Target
BLEU ≥ 10 on Cherokee→English test set`,
      milestone: 'BLEU ≥ 10 on test set. Beam search must outperform greedy by ≥ 1 BLEU point.',
      dueAt: '2025-02-27T23:59:59Z',
    },
    {
      key: 'cs224n/minbert',
      name: 'minBERT Fine-tuning',
      description:
        'Fine-tune a minimal BERT implementation on sentiment, paraphrase, and STS tasks.',
      task: `# Project: minBERT Fine-tuning

## Overview
You are given a minimal BERT implementation. Fine-tune it on three downstream tasks.

## Tasks
1. **Implement multi-head self-attention** (\`bert.py\`)
2. **Sentiment Analysis** — SST-5, target ≥ 52% accuracy
3. **Paraphrase Detection** — Quora pairs, target ≥ 85% accuracy
4. **Semantic Textual Similarity** — STS-B, target Pearson r ≥ 0.85
5. **Multi-task learning** — share BERT encoder across all three heads

## Files
- \`bert.py\`
- \`classifier.py\`
- \`multitask_classifier.py\``,
      milestone:
        'All three tasks meet target metrics. Multi-task model improves average over single-task.',
      dueAt: '2025-03-13T23:59:59Z',
    },
  ],

  cs231n: [
    {
      key: 'cs231n/image-classification',
      name: 'Image Classification (kNN → Neural Net)',
      description: 'Implement and compare kNN, SVM, softmax, and a 2-layer neural net on CIFAR-10.',
      task: `# Project: Image Classification

## Overview
Build and compare four classifiers on CIFAR-10 (60k 32×32 RGB images, 10 classes).

## Parts
1. **k-NN classifier** — vectorized L2 distance matrix, cross-validate k
2. **SVM loss** — multi-class hinge loss + analytic gradient, verify numerically
3. **Softmax loss** — cross-entropy + gradient
4. **Two-layer neural net** — ReLU hidden layer, SGD with momentum

## Files (Jupyter notebooks)
- \`knn.ipynb\`
- \`svm.ipynb\`
- \`softmax.ipynb\`
- \`two_layer_net.ipynb\`

## Targets
| Classifier | Test Accuracy |
|------------|--------------|
| kNN | ≥ 28% |
| SVM | ≥ 40% |
| Softmax | ≥ 40% |
| 2-layer net | ≥ 52% |`,
      milestone: 'All four classifiers meet accuracy targets. Gradient checks pass.',
      dueAt: '2025-04-17T23:59:59Z',
    },
    {
      key: 'cs231n/fully-connected-cnn',
      name: 'Fully-Connected Nets & ConvNets',
      description:
        'Build a modular deep learning library from scratch: BatchNorm, Dropout, Conv, Pool.',
      task: `# Project: Deeper Networks

## Overview
Implement a modular neural network library with a clean forward/backward API.

## Modules to implement
| Module | File |
|--------|------|
| Affine (FC) layer | \`layers.py\` |
| ReLU | \`layers.py\` |
| Batch Normalization | \`layers.py\` |
| Dropout | \`layers.py\` |
| Conv (naive + fast) | \`layers.py\` |
| Max Pool | \`layers.py\` |
| ConvNet | \`classifiers/cnn.py\` |
| Deep FC Net | \`classifiers/fc_net.py\` |

## PyTorch Part
Train a ConvNet in PyTorch achieving ≥ 70% accuracy on CIFAR-10.

## Gradient checks
All layers must pass numeric gradient checks.`,
      milestone: 'All gradient checks pass. PyTorch ConvNet achieves ≥ 70% CIFAR-10 test accuracy.',
      dueAt: '2025-05-08T23:59:59Z',
    },
    {
      key: 'cs231n/rnn-transformers',
      name: 'RNNs, Transformers & Image Captioning',
      description: 'Implement vanilla RNN, LSTM, and Transformer for image captioning on MS-COCO.',
      task: `# Project: Image Captioning

## Overview
Generate natural language captions for images using sequence models over CNN features.

## Parts
1. **Vanilla RNN** — implement \`rnn_step_forward/backward\`, \`rnn_forward/backward\`
2. **LSTM** — implement all gates, train on COCO captions
3. **Transformer decoder** — multi-head attention, positional encoding
4. **Evaluation** — compute BLEU-4 on validation set

## Architectures
- Features: pretrained VGG-16 (provided)
- Decoder: RNN / LSTM / Transformer

## Files
- \`rnn_layers.py\`
- \`classifiers/rnn.py\`
- \`transformer_layers.py\``,
      milestone: 'LSTM captioning BLEU-4 ≥ 0.4. Transformer matches or beats LSTM.',
      dueAt: '2025-05-22T23:59:59Z',
    },
    {
      key: 'cs231n/generative-models',
      name: 'Generative Models (GAN & VAE)',
      description: 'Implement and train a DCGAN and a VAE on CIFAR-10; analyze generated samples.',
      task: `# Project: Generative Models

## Part 1 — GAN
Implement a **DCGAN** (Deep Convolutional GAN):
- Generator: ConvTranspose layers, BatchNorm, ReLU → Tanh
- Discriminator: Conv layers, LeakyReLU → sigmoid
- Loss: original GAN loss + least-squares variant
- Train 50 epochs on CIFAR-10; visualize a grid of 64 generated images

## Part 2 — VAE
Implement a **Variational Autoencoder**:
- Encoder outputs μ and log σ²
- Reparameterization trick: z = μ + ε·σ
- Decoder reconstructs x from z
- Loss: reconstruction (BCE) + KL divergence
- Visualize latent space interpolation

## Files
- \`gan.ipynb\`
- \`vae.ipynb\``,
      milestone: 'GAN produces recognizable CIFAR-10 samples. VAE reconstruction loss < 0.15.',
      dueAt: '2025-05-29T23:59:59Z',
    },
  ],
};

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Seeding Stanford projects...\n');

  let totalProjects = 0;

  for (const [courseSlug, projects] of Object.entries(PROJECTS)) {
    // Look up the course
    const course = await prisma.course.findUnique({ where: { slug: courseSlug } });
    if (!course) {
      console.warn(`⚠️  Course not found: ${courseSlug} — skipping`);
      continue;
    }

    // Upsert subject
    const subject = await prisma.subject.upsert({
      where: { slug: courseSlug },
      update: { name: course.courseCode },
      create: { slug: courseSlug, name: course.courseCode },
    });

    console.log(`📚 ${course.courseCode} (${projects.length} projects)`);

    for (const def of projects) {
      // Upsert project
      const project = await prisma.project.upsert({
        where: { slug: def.key },
        update: {
          name: def.name,
          description: def.description,
          status: ProjectStatus.published,
          deliveryMode: DeliveryMode.individual,
        },
        create: {
          subjectId: subject.id,
          courseId: course.id,
          slug: def.key,
          name: def.name,
          description: def.description,
          status: ProjectStatus.published,
          deliveryMode: DeliveryMode.individual,
          defaultBranch: 'main',
        },
      });

      // Upsert project release
      const manifest = {
        projectKey: def.key,
        releaseVersion: RELEASE,
        apiBaseUrl: API_BASE,
        defaultBranch: 'main',
        buildpack: { node: '20' },
        test: {
          mode: 'manual',
          supportsPrevious: false,
        },
        submission: {
          allowedPaths: ['.nibras/**', 'src/**', '*.py', '*.cpp', '*.h', '*.c', 'README.md'],
          waitForVerificationSeconds: 60,
        },
      };

      await prisma.projectRelease.upsert({
        where: { projectId_version: { projectId: project.id, version: RELEASE } },
        update: { taskText: def.task, manifestJson: manifest },
        create: {
          projectId: project.id,
          version: RELEASE,
          taskText: def.task,
          manifestJson: manifest,
          publicAssetRef: 'public://stanford-seed',
          privateAssetRef: 'private://stanford-seed',
        },
      });

      // Upsert milestone
      await prisma.milestone.upsert({
        where: { projectId_order: { projectId: project.id, order: 1 } },
        update: {
          title: 'Final Submission',
          description: def.milestone,
          dueAt: def.dueAt ? new Date(def.dueAt) : null,
          isFinal: true,
        },
        create: {
          projectId: project.id,
          title: 'Final Submission',
          description: def.milestone,
          order: 1,
          dueAt: def.dueAt ? new Date(def.dueAt) : null,
          isFinal: true,
        },
      });

      console.log(`   ✅ ${def.name}`);
      totalProjects++;
    }

    console.log('');
  }

  console.log(
    `🎉 Done! ${totalProjects} projects seeded across ${Object.keys(PROJECTS).length} courses.`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
