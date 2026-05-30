/**
 * CS 106A lecture videos — Stanford Code in Place 2020.
 * Source: https://codeinplace2020.github.io/
 */
import type { Year1Lecture } from './year1-curriculum';

const BASE = 'https://codeinplace2020.github.io/faqs';

/** Slides and lecture code zips keyed by lecture number (1–14). */
export const CS106A_LECTURE_RESOURCES: Array<{ label: string; url: string }> = [
  { label: 'Lecture 1 slides', url: `${BASE}/1-Welcome.pdf` },
  { label: 'Lecture 2 slides', url: `${BASE}/2-ControlFlow.pdf` },
  { label: 'Lecture 2 code', url: `${BASE}/Lecture2.zip` },
  { label: 'Lecture 3 slides', url: `${BASE}/3-Decomposition.pdf` },
  { label: 'Lecture 3 code', url: `${BASE}/Lecture3.zip` },
  { label: 'Lecture 4 slides', url: `${BASE}/4-IntroPython.pdf` },
  { label: 'Lecture 4 code', url: `${BASE}/Lecture4.zip` },
  { label: 'Lecture 5 slides', url: `${BASE}/5-Expressions.pdf` },
  { label: 'Lecture 5 code', url: `${BASE}/Lecture5.zip` },
  { label: 'Lecture 6 slides', url: `${BASE}/6-ControlFlowRevisited.pdf` },
  { label: 'Lecture 6 code', url: `${BASE}/Lecture6.zip` },
  { label: 'Lecture 7 slides', url: `${BASE}/7-Functions.pdf` },
  { label: 'Lecture 7 code', url: `${BASE}/Lecture7.zip` },
  { label: 'Lecture 8 slides', url: `${BASE}/8-Parameters.pdf` },
  { label: 'Lecture 8 code', url: `${BASE}/Lecture8.zip` },
  { label: 'Lecture 9 slides', url: `${BASE}/9-Images.pdf` },
  { label: 'Lecture 9 code', url: `${BASE}/Lecture9.zip` },
  { label: 'Lecture 10 slides', url: `${BASE}/10-Graphics.pdf` },
  { label: 'Lecture 10 code', url: `${BASE}/Lecture10.zip` },
  { label: 'Lecture 11 slides', url: `${BASE}/11-Animations.pdf` },
  { label: 'Lecture 11 code', url: `${BASE}/Lecture11.zip` },
  { label: 'Lecture 12 slides', url: `${BASE}/12-Lists.pdf` },
  { label: 'Lecture 12 code', url: `${BASE}/Lecture12.zip` },
  { label: 'Lecture 13 slides', url: `${BASE}/13-TextProcessing.pdf` },
  { label: 'Lecture 13 code', url: `${BASE}/Lecture13.zip` },
  { label: 'Lecture 14 slides', url: `${BASE}/14-Dictionaries.pdf` },
  { label: 'Lecture 14 code', url: `${BASE}/Lecture14.zip` },
];

export const CS106A_LECTURES: Year1Lecture[] = [
  // Lecture 1 — Welcome to Code in Place
  { sectionTitle: 'Lecture 1: Welcome', sortOrder: 0, youtubeId: 'dxZFXJhZPvU' },
  { sectionTitle: 'Lecture 1: General Info', sortOrder: 1, youtubeId: 'ukpUVAhdo94' },
  { sectionTitle: 'Lecture 1: Karel', sortOrder: 2, youtubeId: 'LpxjnuQwTg4' },
  // Lecture 2 — Control Flow in Karel
  { sectionTitle: 'Lecture 2: Recap', sortOrder: 3, youtubeId: 'xAQlbo82EuU' },
  { sectionTitle: 'Lecture 2: For Loops', sortOrder: 4, youtubeId: 'yVmGFatf-Y8' },
  { sectionTitle: 'Lecture 2: While Loops', sortOrder: 5, youtubeId: 'S5y2u7VITMo' },
  { sectionTitle: 'Lecture 2: If/Else', sortOrder: 6, youtubeId: 'ACkcPIB5SZs' },
  { sectionTitle: 'Lecture 2: Steeple Chase', sortOrder: 7, youtubeId: 'nxu8NBAv2pM' },
  // Lecture 3 — Decomposition
  { sectionTitle: 'Lecture 3: Recap', sortOrder: 8, youtubeId: 'YFWUzglTrBQ' },
  { sectionTitle: 'Lecture 3: Morning', sortOrder: 9, youtubeId: 'Cz-wnRvlAMI' },
  { sectionTitle: 'Lecture 3: Mountain', sortOrder: 10, youtubeId: 'ecqDCBm8tkY' },
  { sectionTitle: 'Lecture 3: Rhoomba', sortOrder: 11, youtubeId: 'JIQr_gtAWrc' },
  { sectionTitle: 'Lecture 3: WordSearch', sortOrder: 12, youtubeId: '62RtoSXfitU' },
  // Lecture 4 — Variables in Python
  { sectionTitle: 'Lecture 4: Recap', sortOrder: 13, youtubeId: 'pkh2gDQ8tjM' },
  { sectionTitle: 'Lecture 4: HelloWorld', sortOrder: 14, youtubeId: 'wEbmXvfl8TM' },
  { sectionTitle: 'Lecture 4: Add2Numbers', sortOrder: 15, youtubeId: 'oUuIMt5KmyQ' },
  // Lecture 5 — Expressions
  { sectionTitle: 'Lecture 5: Recap', sortOrder: 16, youtubeId: 'YwePpeJn828' },
  { sectionTitle: 'Lecture 5: Expressions', sortOrder: 17, youtubeId: 'iTBsRFnaoJ0' },
  { sectionTitle: 'Lecture 5: Constants', sortOrder: 18, youtubeId: 'sAo9IdC223s' },
  { sectionTitle: 'Lecture 5: Math Library', sortOrder: 19, youtubeId: 'H90Ud28sedo' },
  { sectionTitle: 'Lecture 5: Random Numbers', sortOrder: 20, youtubeId: 'SQ2_cDLgrHI' },
  { sectionTitle: 'Lecture 5: Dice Simulator', sortOrder: 21, youtubeId: '_rMzEF0v6UI' },
  // Lecture 6 — Control Flow in Python
  { sectionTitle: 'Lecture 6: Recap', sortOrder: 22, youtubeId: '60AMFkbGZGY' },
  { sectionTitle: 'Lecture 6: Conditions', sortOrder: 23, youtubeId: 'c6CZIQ3UFZE' },
  { sectionTitle: 'Lecture 6: Guess Num and Sentinel Sum', sortOrder: 24, youtubeId: 'Y_IWN4OxhlM' },
  { sectionTitle: 'Lecture 6: Booleans', sortOrder: 25, youtubeId: 'Y7evkU5j7TY' },
  { sectionTitle: 'Lecture 6: For Loops', sortOrder: 26, youtubeId: '5BTJ4gVXaFQ' },
  { sectionTitle: 'Lecture 6: GameShow Teaser', sortOrder: 27, youtubeId: 'mVoerPV6YLY' },
  // Lecture 7 — Functions Revisited
  { sectionTitle: 'Lecture 7: Recap with GameShow', sortOrder: 28, youtubeId: 'wY68LUvnJ04' },
  { sectionTitle: 'Lecture 7: Functions are like Toasters', sortOrder: 29, youtubeId: 'hmcuptr9WBE' },
  { sectionTitle: 'Lecture 7: Anatomy of a Function', sortOrder: 30, youtubeId: 'lZ8DGnIRsng' },
  { sectionTitle: 'Lecture 7: Many Examples', sortOrder: 31, youtubeId: 'CS-BMynY5ko' },
  { sectionTitle: 'Lecture 7: I/O', sortOrder: 32, youtubeId: '8vXvRwj8fos' },
  // Lecture 8 — Functions: More Practice
  { sectionTitle: 'Lecture 8: Recap', sortOrder: 33, youtubeId: 'vMy48Q6aPk0' },
  { sectionTitle: 'Lecture 8: Factorial', sortOrder: 34, youtubeId: 'kZpiuJ1r3rg' },
  { sectionTitle: 'Lecture 8: DocTests', sortOrder: 35, youtubeId: 'rXtLAPxeSgI' },
  { sectionTitle: 'Lecture 8: Passing Primitives', sortOrder: 36, youtubeId: 'vmzFKkyjo4o' },
  { sectionTitle: 'Lecture 8: Calendar', sortOrder: 37, youtubeId: '8PCQndHgkPE' },
  // Lecture 9 — Images
  { sectionTitle: 'Lecture 9: Recap', sortOrder: 38, youtubeId: 'gjT_okH7HD8' },
  { sectionTitle: 'Lecture 9: Images in Python', sortOrder: 39, youtubeId: 'iC82OUseeeY' },
  { sectionTitle: 'Lecture 9: First Examples', sortOrder: 40, youtubeId: 'aeGbb8wC56g' },
  { sectionTitle: 'Lecture 9: GreenScreen', sortOrder: 41, youtubeId: 'pAG9rAqA4N4' },
  { sectionTitle: 'Lecture 9: Mirrored', sortOrder: 42, youtubeId: 'x0PpSbK4k_s' },
  { sectionTitle: 'Lecture 9: Nested For vs For Each Pixel', sortOrder: 43, youtubeId: 'DhohL7AOzsw' },
  // Lecture 10 — Graphics
  { sectionTitle: 'Lecture 10: Recap', sortOrder: 44, youtubeId: 'h9nnz_QSzZA' },
  { sectionTitle: 'Lecture 10: Blue Rect', sortOrder: 45, youtubeId: '3RMrC1wWyFE' },
  { sectionTitle: 'Lecture 10: Programming is Awesome', sortOrder: 46, youtubeId: 'SfiEWn9RCXM' },
  { sectionTitle: 'Lecture 10: Checkers', sortOrder: 47, youtubeId: 'Y9Qi-6TWwpM' },
  // Lecture 11 — Animations
  { sectionTitle: 'Lecture 11: Recap', sortOrder: 48, youtubeId: 'B8-lPPUU7eY' },
  { sectionTitle: 'Lecture 11: Animation Loop', sortOrder: 49, youtubeId: 'jz02xtVaBo8' },
  { sectionTitle: 'Lecture 11: Move to Center', sortOrder: 50, youtubeId: 'frTXMIWSuq0' },
  { sectionTitle: 'Lecture 11: Bouncing Ball', sortOrder: 51, youtubeId: 'qjsxi3UzoA0' },
  { sectionTitle: 'Lecture 11: References', sortOrder: 52, youtubeId: 'g0G4S_woMRA' },
  { sectionTitle: 'Lecture 11: Pong', sortOrder: 53, youtubeId: 'XcvbczJF6CU' },
  // Lecture 12 — Lists
  { sectionTitle: 'Lecture 12: Recap with Console', sortOrder: 54, youtubeId: 'QioUAmUAIgE' },
  { sectionTitle: 'Lecture 12: None', sortOrder: 55, youtubeId: 'A-NrRd9GyYg' },
  { sectionTitle: 'Lecture 12: Lists', sortOrder: 56, youtubeId: 'vhknJZ-2Bzg' },
  { sectionTitle: 'Lecture 12: Lists as Parameters', sortOrder: 57, youtubeId: 'w4beNu04CMs' },
  { sectionTitle: 'Lecture 12: AverageScores', sortOrder: 58, youtubeId: 'L_TyVmOQq-I' },
  // Lecture 13 — Text Processing
  { sectionTitle: 'Lecture 13: Hook and Recap', sortOrder: 59, youtubeId: 'BQQVnsE2DZI' },
  { sectionTitle: 'Lecture 13: Working with Strings', sortOrder: 60, youtubeId: 'xRhjkyJHFbE' },
  { sectionTitle: 'Lecture 13: Helpful String Functions', sortOrder: 61, youtubeId: 'MOhsuyHr6fU' },
  { sectionTitle: 'Lecture 13: Just Number and DNA to mRNA', sortOrder: 62, youtubeId: 'fNChmzR6rVs' },
  { sectionTitle: 'Lecture 13: Characters', sortOrder: 63, youtubeId: 'SnJYJHmNW7s' },
  { sectionTitle: 'Lecture 13: Immutable', sortOrder: 64, youtubeId: '-cIzBBzTnK8' },
  { sectionTitle: 'Lecture 13: ReverseString and Palindrome', sortOrder: 65, youtubeId: 'PB4tJZHdcAk' },
  { sectionTitle: 'Lecture 13: FakeMedicine', sortOrder: 66, youtubeId: 'BbE4dnoAmXs' },
  // Lecture 14 — Dictionaries
  { sectionTitle: 'Lecture 14: Recap with Files', sortOrder: 67, youtubeId: 'GyexyR1qwZE' },
  { sectionTitle: 'Lecture 14: What are Dictionaries', sortOrder: 68, youtubeId: 'iW6PlKk5XZk' },
  { sectionTitle: 'Lecture 14: Mutability and Dictionaries', sortOrder: 69, youtubeId: 'vN9qV2hHbGk' },
  { sectionTitle: 'Lecture 14: Dictionapalooza', sortOrder: 70, youtubeId: 'IUTaANNVS_w' },
  { sectionTitle: 'Lecture 14: CountWords', sortOrder: 71, youtubeId: 'Pvcvy0W38T8' },
  { sectionTitle: 'Lecture 14: PhoneBook', sortOrder: 72, youtubeId: 'jx8u6dFUxpY' },
];
