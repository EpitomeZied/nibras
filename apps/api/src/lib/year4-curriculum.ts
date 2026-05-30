/**
 * Year 4 Senior — tracking course definitions.
 * See docs/year4-curriculum.md.
 */
import type { Year1CourseDefinition } from './year1-curriculum';
import {
  curriculumAssignments as assignments,
  curriculumProject as project,
  standardSections,
} from './curriculum-helpers';

export const YEAR4_COURSES: Year1CourseDefinition[] = [
  {
    slug: 'stanford-cs230',
    courseCode: 'CS 230',
    title: 'Deep Learning',
    termLabel: 'Year 4 · Fall',
    description:
      'Neural networks, CNNs, RNNs, optimisation, regularisation, and deep learning best practices.',
    syllabusJson: {
      schedule: 'Year 4 · Fall — deep learning.',
      topics: ['CNNs', 'RNNs', 'Optimisation', 'Regularisation'],
      plannerCode: 'CS311',
    },
    sections: standardSections([
      'Neural Network Foundations',
      'CNNs & Computer Vision',
      'Sequence Models',
      'Deep Learning Project',
    ]),
    assignments: assignments([
      {
        title: 'A1: Backprop & Optimisation',
        description: 'NumPy MLP and optimisers.',
        content: '# Assignment 1\n\nImplement backprop and compare SGD, Adam, and RMSprop.',
        dueAt: '2029-09-15T23:59:59Z',
      },
      {
        title: 'A2: CNNs',
        description: 'Image classification.',
        content: '# Assignment 2\n\nTrain a CNN on CIFAR-10 with data augmentation.',
        dueAt: '2029-09-30T23:59:59Z',
      },
      {
        title: 'A3: RNNs',
        description: 'Sequence modelling.',
        content: '# Assignment 3\n\nImplement an LSTM for character-level language modelling.',
        dueAt: '2029-10-15T23:59:59Z',
      },
      {
        title: 'A4: Transfer Learning',
        description: 'Fine-tuning pretrained models.',
        content: '# Assignment 4\n\nFine-tune a pretrained model on a custom dataset.',
        dueAt: '2029-11-01T23:59:59Z',
      },
    ]),
    project: project(
      { slug: 'cs230', name: 'CS 230' },
      'cs230-main',
      'CS 230 — Deep Learning',
      'Neural networks, CNNs, RNNs, optimisation, and regularisation.',
      4,
      [
        { criterion: 'Model Performance', maxScore: 45 },
        { criterion: 'Implementation Quality', maxScore: 35 },
        { criterion: 'Report & Reproducibility', maxScore: 20 },
      ],
      [
        {
          title: 'Neural Network Foundations',
          description:
            'Implement backprop from scratch. Compare SGD, Adam, and RMSprop on a regression task.',
          order: 0,
        },
        {
          title: 'CNNs & Computer Vision',
          description:
            'Build a CNN for CIFAR-10 with batch norm and data augmentation. Achieve ≥ 85% accuracy.',
          order: 1,
        },
        {
          title: 'Sequence Models & Attention',
          description: 'Implement an LSTM for character-level language modelling. Add attention.',
          order: 2,
        },
        {
          title: 'Final: Deep Learning Research Project',
          description:
            'Reproduce a recent paper result or propose a novel architecture variant with ablation study.',
          order: 3,
          isFinal: true,
        },
      ]
    ),
  },
  {
    slug: 'stanford-cs224n',
    courseCode: 'CS 224N',
    title: 'Natural Language Processing with Deep Learning',
    termLabel: 'Year 4 · Fall',
    description:
      'Word vectors, RNNs, attention, transformers, and NLP applications with PyTorch.',
    syllabusJson: {
      schedule: 'Year 4 · Fall — NLP.',
      topics: ['Word vectors', 'Transformers', 'Attention', 'NLP tasks'],
      plannerCode: 'CS312',
    },
    sections: standardSections([
      'Word Vectors & Language Models',
      'Sequence Models for NLP',
      'Attention & Transformers',
      'NLP Applications',
    ]),
    assignments: assignments([
      {
        title: 'P1: Word Vectors',
        description: 'GloVe-style embeddings.',
        content: '# Problem Set 1\n\nTrain word vectors and evaluate on analogy tasks.',
        dueAt: '2029-09-20T23:59:59Z',
      },
      {
        title: 'P2: Neural LM',
        description: 'RNN language model.',
        content: '# Problem Set 2\n\nImplement a neural language model with perplexity evaluation.',
        dueAt: '2029-10-05T23:59:59Z',
      },
      {
        title: 'P3: Attention',
        description: 'Seq2seq with attention.',
        content: '# Problem Set 3\n\nBuild seq2seq with Bahdanau attention for machine translation.',
        dueAt: '2029-10-20T23:59:59Z',
      },
      {
        title: 'P4: Transformers',
        description: 'Mini transformer block.',
        content: '# Problem Set 4\n\nImplement multi-head self-attention and a transformer encoder layer.',
        dueAt: '2029-11-05T23:59:59Z',
      },
    ]),
    project: project(
      { slug: 'cs224n', name: 'CS 224N' },
      'cs224n-main',
      'CS 224N — Natural Language Processing with Deep Learning',
      'Word vectors, RNNs, attention, transformers, and NLP applications.',
      4,
      [
        { criterion: 'NLP Task Performance', maxScore: 45 },
        { criterion: 'Model Implementation', maxScore: 35 },
        { criterion: 'Analysis & Write-up', maxScore: 20 },
      ],
      [
        {
          title: 'Word Vectors & Language Models',
          description:
            'Train GloVe-style word vectors. Implement a neural language model with perplexity evaluation.',
          order: 0,
        },
        {
          title: 'Sequence Models for NLP',
          description:
            'Build a seq2seq model with attention for machine translation on a parallel corpus.',
          order: 1,
        },
        {
          title: 'Transformers & Pre-training',
          description:
            'Fine-tune a pre-trained transformer (BERT or GPT) on a downstream NLP task.',
          order: 2,
        },
        {
          title: 'Final: NLP Application',
          description:
            'Build a complete NLP application (QA, summarisation, or chatbot) with evaluation metrics.',
          order: 3,
          isFinal: true,
        },
      ]
    ),
  },
  {
    slug: 'stanford-cs231n',
    courseCode: 'CS 231N',
    title: 'Deep Learning for Computer Vision',
    termLabel: 'Year 4 · Spring',
    description:
      'Image classification, detection, segmentation, GANs, and vision transformers.',
    syllabusJson: {
      schedule: 'Year 4 · Spring — computer vision.',
      topics: ['CNNs', 'Detection', 'Segmentation', 'GANs'],
      plannerCode: 'CS313',
    },
    sections: standardSections([
      'Image Classification',
      'Object Detection',
      'Segmentation',
      'Generative Models',
    ]),
    assignments: assignments([
      {
        title: 'A1: Linear Classifier',
        description: 'Softmax and SVM on features.',
        content: '# Assignment 1\n\nImplement linear classifiers on CIFAR-10 features.',
        dueAt: '2030-02-15T23:59:59Z',
      },
      {
        title: 'A2: Two-Layer Net',
        description: 'Fully connected network.',
        content: '# Assignment 2\n\nTwo-layer neural net with backprop on CIFAR-10.',
        dueAt: '2030-03-01T23:59:59Z',
      },
      {
        title: 'A3: CNN',
        description: 'Convolutional network.',
        content: '# Assignment 3\n\nDesign and train a CNN achieving strong CIFAR-10 accuracy.',
        dueAt: '2030-03-15T23:59:59Z',
      },
      {
        title: 'A4: Detection',
        description: 'Object detection pipeline.',
        content: '# Assignment 4\n\nImplement or fine-tune a detection model on a custom dataset.',
        dueAt: '2030-04-01T23:59:59Z',
      },
    ]),
    project: project(
      { slug: 'cs231n', name: 'CS 231N' },
      'cs231n-main',
      'CS 231N — Deep Learning for Computer Vision',
      'Image classification, detection, segmentation, GANs, and vision transformers.',
      4,
      [
        { criterion: 'Vision Task Performance', maxScore: 45 },
        { criterion: 'Architecture & Training', maxScore: 35 },
        { criterion: 'Visualisation & Report', maxScore: 20 },
      ],
      [
        {
          title: 'Image Classification Pipeline',
          description:
            'Build a complete CNN training pipeline with data augmentation and learning rate scheduling.',
          order: 0,
        },
        {
          title: 'Object Detection',
          description:
            'Implement or fine-tune a detection model (YOLO or Faster R-CNN) on a custom dataset.',
          order: 1,
        },
        {
          title: 'Segmentation & GANs',
          description: 'Implement semantic segmentation with U-Net. Train a DCGAN on a face dataset.',
          order: 2,
        },
        {
          title: 'Final: Vision Research Project',
          description:
            'Complete vision project with ablation study, error analysis, and visualisation dashboard.',
          order: 3,
          isFinal: true,
        },
      ]
    ),
  },
  {
    slug: 'stanford-cs-capstone',
    courseCode: 'CS 303',
    title: 'Senior Capstone Project',
    termLabel: 'Year 4 · Spring',
    description:
      'Team-based capstone integrating systems, ML, or security — design, implementation, demo, and final report.',
    syllabusJson: {
      schedule: 'Year 4 · Spring — capstone delivery.',
      topics: ['Implementation', 'Demo', 'Report', 'Presentation'],
      plannerCode: 'CS303',
    },
    sections: standardSections([
      'Milestone 1: Prototype',
      'Milestone 2: Integration',
      'Milestone 3: Evaluation',
      'Final Delivery',
    ]),
    assignments: assignments([
      {
        title: 'M1: Prototype Demo',
        description: 'Working prototype checkpoint.',
        content: '# Milestone 1\n\nDemo a working prototype with core features.',
        dueAt: '2030-02-28T23:59:59Z',
      },
      {
        title: 'M2: Integration Review',
        description: 'End-to-end system checkpoint.',
        content: '# Milestone 2\n\nIntegrated system with test coverage and deployment notes.',
        dueAt: '2030-03-28T23:59:59Z',
      },
      {
        title: 'M3: Evaluation Report',
        description: 'Metrics and user study.',
        content: '# Milestone 3\n\nEvaluation against success metrics from CS 302 charter.',
        dueAt: '2030-04-20T23:59:59Z',
      },
      {
        title: 'Final: Capstone Submission',
        description: 'Code, demo video, and report.',
        content: '# Final\n\nSubmit repository, demo video, and final report.',
        dueAt: '2030-05-15T23:59:59Z',
      },
    ]),
    project: project(
      { slug: 'cs303', name: 'CS 303' },
      'cs303-main',
      'CS 303 — Senior Capstone Project',
      'Team capstone: design, build, evaluate, and present a substantial computing project.',
      4,
      [
        { criterion: 'Technical Depth & Completeness', maxScore: 40 },
        { criterion: 'Evaluation & Impact', maxScore: 30 },
        { criterion: 'Demo & Presentation', maxScore: 30 },
      ],
      [
        {
          title: 'Prototype & Architecture',
          description: 'Working prototype with documented architecture and CI.',
          order: 0,
        },
        {
          title: 'Integrated System',
          description: 'End-to-end system meeting scoped requirements with tests.',
          order: 1,
        },
        {
          title: 'Evaluation & Iteration',
          description: 'User study or benchmark evaluation with iteration log.',
          order: 2,
        },
        {
          title: 'Final: Capstone Delivery',
          description:
            'Public demo, final report, open-source repository, and faculty panel presentation.',
          order: 3,
          isFinal: true,
        },
      ]
    ),
  },
];

export const YEAR4_COURSE_SLUGS = YEAR4_COURSES.map((c) => c.slug);
