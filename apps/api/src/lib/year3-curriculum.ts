/**
 * Year 3 Junior — tracking course definitions.
 * See docs/year3-curriculum.md.
 */
import type { Year1CourseDefinition } from './year1-curriculum';
import {
  curriculumAssignments as assignments,
  curriculumProject as project,
  standardSections,
} from './curriculum-helpers';

export const YEAR3_COURSES: Year1CourseDefinition[] = [
  {
    slug: 'stanford-cs221',
    courseCode: 'CS 221',
    title: 'Artificial Intelligence: Principles & Techniques',
    termLabel: 'Year 3 · Fall',
    description:
      'Search, CSP, MDPs, game trees, Bayesian networks, HMMs, machine learning basics, and logic-based AI.',
    syllabusJson: {
      schedule: 'Year 3 · Fall — AI foundations.',
      topics: ['Search', 'CSP', 'MDPs', 'Game trees'],
      plannerCode: 'CS311',
    },
    sections: standardSections([
      'Search & Constraint Satisfaction',
      'MDPs & Reinforcement Learning',
      'Game Trees & Adversarial Search',
      'Integrated AI Agents',
    ]),
    assignments: assignments([
      {
        title: 'A1: Search',
        description: 'A* and heuristics.',
        content: '# Assignment 1\n\nImplement A* with a custom admissible heuristic on a grid world.',
        dueAt: '2028-09-15T23:59:59Z',
      },
      {
        title: 'A2: CSP',
        description: 'Arc consistency and backtracking.',
        content: '# Assignment 2\n\nSolve a scheduling CSP using AC-3 and backtracking.',
        dueAt: '2028-10-01T23:59:59Z',
      },
      {
        title: 'A3: MDPs',
        description: 'Value and policy iteration.',
        content: '# Assignment 3\n\nImplement value iteration and Q-learning on a grid-world MDP.',
        dueAt: '2028-10-15T23:59:59Z',
      },
      {
        title: 'A4: Adversarial Search',
        description: 'Minimax and alpha-beta.',
        content: '# Assignment 4\n\nImplement minimax with alpha-beta pruning for a two-player game.',
        dueAt: '2028-11-01T23:59:59Z',
      },
    ]),
    project: project(
      { slug: 'cs221', name: 'CS 221' },
      'cs221-main',
      'CS 221 — Artificial Intelligence',
      'Search, CSP, MDPs, game trees, Bayesian networks, HMMs, and machine learning basics.',
      3,
      [
        { criterion: 'Agent Performance Score', maxScore: 50 },
        { criterion: 'Algorithm Correctness', maxScore: 30 },
        { criterion: 'Analysis Write-up', maxScore: 20 },
      ],
      [
        {
          title: 'Search & Constraint Satisfaction',
          description:
            'Implement A* for Pac-Man with a custom admissible heuristic. Solve a scheduling CSP using arc-consistency + backtracking.',
          order: 0,
        },
        {
          title: 'MDPs & Reinforcement Learning',
          description:
            'Implement Value Iteration and Policy Iteration for a grid-world MDP. Train Q-learning on Blackjack.',
          order: 1,
        },
        {
          title: 'Game Trees & Adversarial Search',
          description:
            'Implement Minimax with alpha-beta pruning. Add iterative deepening and an evaluation function.',
          order: 2,
        },
        {
          title: 'Final: Pac-Man AI Agent',
          description:
            'Build a complete Pac-Man agent combining A* navigation, ghost-avoidance MDP, and a learned score estimator.',
          order: 3,
          isFinal: true,
        },
      ]
    ),
  },
  {
    slug: 'stanford-cs229',
    courseCode: 'CS 229',
    title: 'Machine Learning',
    termLabel: 'Year 3 · Fall',
    description:
      'Supervised and unsupervised learning, neural networks, regularisation, bias-variance, and ML theory.',
    syllabusJson: {
      schedule: 'Year 3 · Fall — machine learning.',
      topics: ['Supervised learning', 'Neural nets', 'Unsupervised learning'],
      plannerCode: 'CS311',
    },
    sections: standardSections([
      'Supervised Learning',
      'Neural Networks',
      'Unsupervised Learning',
      'ML Project',
    ]),
    assignments: assignments([
      {
        title: 'P1: Linear Models',
        description: 'Regression and classification from scratch.',
        content: '# Problem Set 1\n\nImplement linear and logistic regression with gradient descent.',
        dueAt: '2028-09-20T23:59:59Z',
      },
      {
        title: 'P2: Neural Networks',
        description: 'MLP in NumPy.',
        content: '# Problem Set 2\n\nBuild a 3-layer MLP with backprop and Adam on MNIST.',
        dueAt: '2028-10-05T23:59:59Z',
      },
      {
        title: 'P3: Unsupervised',
        description: 'k-means, PCA, EM.',
        content: '# Problem Set 3\n\nImplement k-means and GMM with EM. Run PCA on a face dataset.',
        dueAt: '2028-10-20T23:59:59Z',
      },
      {
        title: 'P4: Model Selection',
        description: 'Cross-validation and error analysis.',
        content: '# Problem Set 4\n\nCompare models with k-fold CV and write an error analysis report.',
        dueAt: '2028-11-05T23:59:59Z',
      },
    ]),
    project: project(
      { slug: 'cs229', name: 'CS 229' },
      'cs229-main',
      'CS 229 — Machine Learning',
      'Supervised learning, neural networks, unsupervised learning, and ML theory.',
      3,
      [
        { criterion: 'Model Performance (Metrics)', maxScore: 45 },
        { criterion: 'Correctness of Implementation', maxScore: 35 },
        { criterion: 'Report Quality', maxScore: 20 },
      ],
      [
        {
          title: 'Supervised Learning',
          description:
            'Implement linear regression, logistic regression, and a decision tree from scratch with cross-validation.',
          order: 0,
        },
        {
          title: 'Neural Networks & Backpropagation',
          description:
            'Build a 3-layer MLP in NumPy with Adam and batch normalisation. Achieve ≥ 97% on MNIST.',
          order: 1,
        },
        {
          title: 'Unsupervised Learning & EM',
          description: 'Implement k-means and GMM with EM. Run PCA and reconstruct faces from 50 components.',
          order: 2,
        },
        {
          title: 'Final: End-to-End ML Research Project',
          description:
            'Complete ML pipeline on a real-world dataset with EDA, feature engineering, and a 6-page report.',
          order: 3,
          isFinal: true,
        },
      ]
    ),
  },
  {
    slug: 'year3-cs301',
    courseCode: 'CS 301',
    title: 'Research Methods in Computing',
    termLabel: 'Year 3 · Fall',
    description:
      'Reading research papers, experimental design, reproducibility, ethics, and technical writing for CS research.',
    syllabusJson: {
      schedule: 'Year 3 · Fall — research literacy.',
      topics: ['Paper reading', 'Experimental design', 'Ethics'],
      plannerCode: 'CS301',
    },
    sections: standardSections([
      'Reading Research',
      'Experimental Design',
      'Reproducibility & Ethics',
    ]),
    assignments: assignments([
      {
        title: 'R1: Paper Critique',
        description: 'Structured review of two papers.',
        content: '# Reading 1\n\nWrite structured critiques of two assigned CS research papers.',
        dueAt: '2028-09-25T23:59:59Z',
      },
      {
        title: 'R2: Reproduction Plan',
        description: 'Design a reproduction study.',
        content: '# Reading 2\n\nPropose an experiment to reproduce a published result.',
        dueAt: '2028-10-12T23:59:59Z',
      },
      {
        title: 'R3: Ethics Case Study',
        description: 'Responsible computing analysis.',
        content: '# Reading 3\n\nAnalyse an ethics case study in computing research or deployment.',
        dueAt: '2028-10-28T23:59:59Z',
      },
    ]),
    project: project(
      { slug: 'cs301', name: 'CS 301' },
      'cs301-main',
      'CS 301 — Research Methods in Computing',
      'Develop research literacy through paper analysis and experimental design.',
      3,
      [
        { criterion: 'Critical Analysis', maxScore: 40 },
        { criterion: 'Experimental Design', maxScore: 35 },
        { criterion: 'Writing Quality', maxScore: 25 },
      ],
      [
        {
          title: 'Literature Survey',
          description: 'Survey five papers on a chosen topic with a synthesis paragraph.',
          order: 0,
        },
        {
          title: 'Proposal Draft',
          description: 'Two-page research proposal with methodology and evaluation plan.',
          order: 1,
        },
        {
          title: 'Final: Research Portfolio',
          description: 'Compiled critiques, proposal, and peer review responses.',
          order: 2,
          isFinal: true,
        },
      ]
    ),
  },
  {
    slug: 'stanford-cs246',
    courseCode: 'CS 246',
    title: 'Mining Massive Datasets',
    termLabel: 'Year 3 · Spring',
    description:
      'MapReduce, Spark, locality-sensitive hashing, recommendation systems, PageRank, and stream mining.',
    syllabusJson: {
      schedule: 'Year 3 · Spring — data at scale.',
      topics: ['Spark', 'LSH', 'Recommendations', 'Graph mining'],
      plannerCode: 'CS321',
    },
    sections: standardSections([
      'MapReduce & Spark',
      'Similarity & LSH',
      'Recommendation Systems',
      'Graph Analysis',
    ]),
    assignments: assignments([
      {
        title: 'L1: Spark RDDs',
        description: 'Word count and inverted index.',
        content: '# Lab 1\n\nImplement word count and inverted index in Spark.',
        dueAt: '2029-02-15T23:59:59Z',
      },
      {
        title: 'L2: MinHash & LSH',
        description: 'Near-duplicate detection.',
        content: '# Lab 2\n\nImplement MinHash and LSH on a document corpus.',
        dueAt: '2029-03-01T23:59:59Z',
      },
      {
        title: 'L3: Collaborative Filtering',
        description: 'Matrix factorisation.',
        content: '# Lab 3\n\nImplement item-item CF and SGD matrix factorisation on MovieLens.',
        dueAt: '2029-03-15T23:59:59Z',
      },
      {
        title: 'L4: PageRank',
        description: 'Graph algorithms at scale.',
        content: '# Lab 4\n\nCompute PageRank on a large graph using Spark GraphX or similar.',
        dueAt: '2029-04-01T23:59:59Z',
      },
    ]),
    project: project(
      { slug: 'cs246', name: 'CS 246' },
      'cs246-main',
      'CS 246 — Mining Massive Datasets',
      'MapReduce, Spark, LSH, recommendation systems, PageRank, and stream mining at scale.',
      3,
      [
        { criterion: 'Scale & Performance', maxScore: 40 },
        { criterion: 'Algorithm Correctness', maxScore: 40 },
        { criterion: 'Visualisation & Insights', maxScore: 20 },
      ],
      [
        {
          title: 'MapReduce, Hadoop & Spark',
          description:
            'Implement word count, inverted index, and matrix multiplication using Spark. Optimise a slow stage by 5×.',
          order: 0,
        },
        {
          title: 'Similarity Search & LSH',
          description:
            'Implement MinHash and LSH for near-duplicate detection. Tune precision/recall.',
          order: 1,
        },
        {
          title: 'Recommendation Systems',
          description:
            'Implement collaborative filtering and matrix factorisation on MovieLens 20M.',
          order: 2,
        },
        {
          title: 'Final: Social Network Analysis',
          description:
            'PageRank, centrality, and community detection on a large social graph with visualisation.',
          order: 3,
          isFinal: true,
        },
      ]
    ),
  },
  {
    slug: 'stanford-cs255',
    courseCode: 'CS 255',
    title: 'Introduction to Cryptography',
    termLabel: 'Year 3 · Spring',
    description:
      'Provable security, symmetric encryption, MACs, hash functions, public-key crypto, digital signatures, and TLS.',
    syllabusJson: {
      schedule: 'Year 3 · Spring — cryptography.',
      topics: ['Symmetric crypto', 'Public-key', 'Signatures', 'Protocols'],
      plannerCode: 'CS333',
    },
    sections: standardSections([
      'Symmetric Encryption',
      'Public-Key Cryptography',
      'Digital Signatures',
      'Secure Protocols',
    ]),
    assignments: assignments([
      {
        title: 'H1: AES Modes',
        description: 'CBC, CTR, and GCM.',
        content: '# Homework 1\n\nImplement CBC-AES and AES-GCM authenticated encryption.',
        dueAt: '2029-02-20T23:59:59Z',
      },
      {
        title: 'H2: RSA & ECDH',
        description: 'Public-key primitives.',
        content: '# Homework 2\n\nImplement RSA with OAEP and ECDH on Curve25519.',
        dueAt: '2029-03-05T23:59:59Z',
      },
      {
        title: 'H3: ECDSA',
        description: 'Digital signatures.',
        content: '# Homework 3\n\nImplement ECDSA signing and verification.',
        dueAt: '2029-03-20T23:59:59Z',
      },
      {
        title: 'H4: Protocol Analysis',
        description: 'Formal protocol write-up.',
        content: '# Homework 4\n\nDesign and analyse a three-message authentication protocol.',
        dueAt: '2029-04-05T23:59:59Z',
      },
    ]),
    project: project(
      { slug: 'cs255', name: 'CS 255' },
      'cs255-main',
      'CS 255 — Introduction to Cryptography',
      'Provable security, symmetric and public-key crypto, signatures, and secure protocols.',
      3,
      [
        { criterion: 'Security Proof / Analysis', maxScore: 45 },
        { criterion: 'Implementation Correctness', maxScore: 40 },
        { criterion: 'Write-up Clarity', maxScore: 15 },
      ],
      [
        {
          title: 'Symmetric Encryption & MACs',
          description:
            'Implement CBC-AES and CTR-AES. Build AES-GCM. Demonstrate a padding-oracle attack.',
          order: 0,
        },
        {
          title: 'Hash Functions & Public-Key Crypto',
          description: 'Implement RSA encrypt/decrypt/sign with OAEP. Implement ECDH key exchange.',
          order: 1,
        },
        {
          title: 'Digital Signatures & Protocols',
          description: 'Implement ECDSA. Formally analyse a 3-message authentication protocol.',
          order: 2,
        },
        {
          title: 'Final: Secure Communication System',
          description:
            'Build an end-to-end encrypted messaging app with forward secrecy using modern key exchange.',
          order: 3,
          isFinal: true,
        },
      ]
    ),
  },
  {
    slug: 'year3-cs302',
    courseCode: 'CS 302',
    title: 'Capstone Planning',
    termLabel: 'Year 3 · Spring',
    description:
      'Capstone team formation, project scoping, milestone planning, and faculty advisor alignment.',
    syllabusJson: {
      schedule: 'Year 3 · Spring — capstone preparation.',
      topics: ['Team formation', 'Scoping', 'Milestones'],
      plannerCode: 'CS302',
    },
    sections: standardSections(['Project Scoping', 'Team & Advisor', 'Milestone Plan']),
    assignments: assignments([
      {
        title: 'C1: Project Pitch',
        description: 'One-page capstone pitch.',
        content: '# Capstone Pitch\n\nSubmit a one-page project pitch with goals and success metrics.',
        dueAt: '2029-02-25T23:59:59Z',
      },
      {
        title: 'C2: Architecture Sketch',
        description: 'System diagram and risks.',
        content: '# Architecture\n\nBlock diagram, API sketch, and risk register for your capstone.',
        dueAt: '2029-03-15T23:59:59Z',
      },
      {
        title: 'C3: Milestone Schedule',
        description: 'Semester-long plan.',
        content: '# Schedule\n\nGantt-style milestone plan with advisor sign-off.',
        dueAt: '2029-04-10T23:59:59Z',
      },
    ]),
    project: project(
      { slug: 'cs302', name: 'CS 302' },
      'cs302-main',
      'CS 302 — Capstone Planning',
      'Plan the senior capstone project with advisor approval.',
      3,
      [
        { criterion: 'Scope & Feasibility', maxScore: 40 },
        { criterion: 'Planning Quality', maxScore: 35 },
        { criterion: 'Advisor Alignment', maxScore: 25 },
      ],
      [
        {
          title: 'Advisor Match',
          description: 'Confirmed faculty advisor and signed intent form.',
          order: 0,
        },
        {
          title: 'Approved Proposal',
          description: 'Three-page capstone proposal approved by advisor.',
          order: 1,
        },
        {
          title: 'Final: Capstone Charter',
          description: 'Team charter, milestone plan, and evaluation rubric for CS 303.',
          order: 2,
          isFinal: true,
        },
      ]
    ),
  },
];

export const YEAR3_COURSE_SLUGS = YEAR3_COURSES.map((c) => c.slug);
