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

function lectureSection(
  sectionSortOrder: number,
  sectionTitle: string,
  videos: Array<{ title: string; youtubeId: string }>
): Year1Lecture[] {
  return videos.map((video, videoSortOrder) => ({
    sectionTitle,
    sectionSortOrder,
    sortOrder: sectionSortOrder,
    videoTitle: video.title,
    videoSortOrder,
    youtubeId: video.youtubeId,
  }));
}

export const CS106A_LECTURES: Year1Lecture[] = [
  ...lectureSection(0, 'Lecture 1: Welcome to Code in Place', [
    { title: 'Welcome', youtubeId: 'dxZFXJhZPvU' },
    { title: 'General Info', youtubeId: 'ukpUVAhdo94' },
    { title: 'Karel', youtubeId: 'LpxjnuQwTg4' },
  ]),
  ...lectureSection(1, 'Lecture 2: Control Flow in Karel', [
    { title: 'Recap', youtubeId: 'xAQlbo82EuU' },
    { title: 'For Loops', youtubeId: 'yVmGFatf-Y8' },
    { title: 'While Loops', youtubeId: 'S5y2u7VITMo' },
    { title: 'If/Else', youtubeId: 'ACkcPIB5SZs' },
    { title: 'Steeple Chase', youtubeId: 'nxu8NBAv2pM' },
  ]),
  ...lectureSection(2, 'Lecture 3: Decomposition', [
    { title: 'Recap', youtubeId: 'YFWUzglTrBQ' },
    { title: 'Morning', youtubeId: 'Cz-wnRvlAMI' },
    { title: 'Mountain', youtubeId: 'ecqDCBm8tkY' },
    { title: 'Rhoomba', youtubeId: 'JIQr_gtAWrc' },
    { title: 'WordSearch', youtubeId: '62RtoSXfitU' },
  ]),
  ...lectureSection(3, 'Lecture 4: Variables in Python', [
    { title: 'Recap', youtubeId: 'pkh2gDQ8tjM' },
    { title: 'HelloWorld', youtubeId: 'wEbmXvfl8TM' },
    { title: 'Add2Numbers', youtubeId: 'oUuIMt5KmyQ' },
  ]),
  ...lectureSection(4, 'Lecture 5: Expressions', [
    { title: 'Recap', youtubeId: 'YwePpeJn828' },
    { title: 'Expressions', youtubeId: 'iTBsRFnaoJ0' },
    { title: 'Constants', youtubeId: 'sAo9IdC223s' },
    { title: 'Math Library', youtubeId: 'H90Ud28sedo' },
    { title: 'Random Numbers', youtubeId: 'SQ2_cDLgrHI' },
    { title: 'Dice Simulator', youtubeId: '_rMzEF0v6UI' },
  ]),
  ...lectureSection(5, 'Lecture 6: Control Flow in Python', [
    { title: 'Recap', youtubeId: '60AMFkbGZGY' },
    { title: 'Conditions', youtubeId: 'c6CZIQ3UFZE' },
    { title: 'Guess Num and Sentinel Sum', youtubeId: 'Y_IWN4OxhlM' },
    { title: 'Booleans', youtubeId: 'Y7evkU5j7TY' },
    { title: 'For Loops', youtubeId: '5BTJ4gVXaFQ' },
    { title: 'GameShow Teaser', youtubeId: 'mVoerPV6YLY' },
  ]),
  ...lectureSection(6, 'Lecture 7: Functions Revisited', [
    { title: 'Recap with GameShow', youtubeId: 'wY68LUvnJ04' },
    { title: 'Functions are like Toasters', youtubeId: 'hmcuptr9WBE' },
    { title: 'Anatomy of a Function', youtubeId: 'lZ8DGnIRsng' },
    { title: 'Many Examples', youtubeId: 'CS-BMynY5ko' },
    { title: 'I/O', youtubeId: '8vXvRwj8fos' },
  ]),
  ...lectureSection(7, 'Lecture 8: Functions — More Practice', [
    { title: 'Recap', youtubeId: 'vMy48Q6aPk0' },
    { title: 'Factorial', youtubeId: 'kZpiuJ1r3rg' },
    { title: 'DocTests', youtubeId: 'rXtLAPxeSgI' },
    { title: 'Passing Primitives', youtubeId: 'vmzFKkyjo4o' },
    { title: 'Calendar', youtubeId: '8PCQndHgkPE' },
  ]),
  ...lectureSection(8, 'Lecture 9: Images', [
    { title: 'Recap', youtubeId: 'gjT_okH7HD8' },
    { title: 'Images in Python', youtubeId: 'iC82OUseeeY' },
    { title: 'First Examples', youtubeId: 'aeGbb8wC56g' },
    { title: 'GreenScreen', youtubeId: 'pAG9rAqA4N4' },
    { title: 'Mirrored', youtubeId: 'x0PpSbK4k_s' },
    { title: 'Nested For vs For Each Pixel', youtubeId: 'DhohL7AOzsw' },
  ]),
  ...lectureSection(9, 'Lecture 10: Graphics', [
    { title: 'Recap', youtubeId: 'h9nnz_QSzZA' },
    { title: 'Blue Rect', youtubeId: '3RMrC1wWyFE' },
    { title: 'Programming is Awesome', youtubeId: 'SfiEWn9RCXM' },
    { title: 'Checkers', youtubeId: 'Y9Qi-6TWwpM' },
  ]),
  ...lectureSection(10, 'Lecture 11: Animations', [
    { title: 'Recap', youtubeId: 'B8-lPPUU7eY' },
    { title: 'Animation Loop', youtubeId: 'jz02xtVaBo8' },
    { title: 'Move to Center', youtubeId: 'frTXMIWSuq0' },
    { title: 'Bouncing Ball', youtubeId: 'qjsxi3UzoA0' },
    { title: 'References', youtubeId: 'g0G4S_woMRA' },
    { title: 'Pong', youtubeId: 'XcvbczJF6CU' },
  ]),
  ...lectureSection(11, 'Lecture 12: Lists', [
    { title: 'Recap with Console', youtubeId: 'QioUAmUAIgE' },
    { title: 'None', youtubeId: 'A-NrRd9GyYg' },
    { title: 'Lists', youtubeId: 'vhknJZ-2Bzg' },
    { title: 'Lists as Parameters', youtubeId: 'w4beNu04CMs' },
    { title: 'AverageScores', youtubeId: 'L_TyVmOQq-I' },
  ]),
  ...lectureSection(12, 'Lecture 13: Text Processing', [
    { title: 'Hook and Recap', youtubeId: 'BQQVnsE2DZI' },
    { title: 'Working with Strings', youtubeId: 'xRhjkyJHFbE' },
    { title: 'Helpful String Functions', youtubeId: 'MOhsuyHr6fU' },
    { title: 'Just Number and DNA to mRNA', youtubeId: 'fNChmzR6rVs' },
    { title: 'Characters', youtubeId: 'SnJYJHmNW7s' },
    { title: 'Immutable', youtubeId: '-cIzBBzTnK8' },
    { title: 'ReverseString and Palindrome', youtubeId: 'PB4tJZHdcAk' },
    { title: 'FakeMedicine', youtubeId: 'BbE4dnoAmXs' },
  ]),
  ...lectureSection(13, 'Lecture 14: Dictionaries', [
    { title: 'Recap with Files', youtubeId: 'GyexyR1qwZE' },
    { title: 'What are Dictionaries', youtubeId: 'iW6PlKk5XZk' },
    { title: 'Mutability and Dictionaries', youtubeId: 'vN9qV2hHbGk' },
    { title: 'Dictionapalooza', youtubeId: 'IUTaANNVS_w' },
    { title: 'CountWords', youtubeId: 'Pvcvy0W38T8' },
    { title: 'PhoneBook', youtubeId: 'jx8u6dFUxpY' },
  ]),
];
