/**
 * CS 106A lecture videos — Stanford Code in Place 2020.
 * Source: https://codeinplace2020.github.io/
 */
import type { Year1Lecture } from './year1-curriculum';

const BASE = 'https://codeinplace2020.github.io/faqs';

function cs106aLectureResources(lectureNum: number): Array<{ label: string; url: string }> {
  const slides: Record<number, string> = {
    1: '1-Welcome',
    2: '2-ControlFlow',
    3: '3-Decomposition',
    4: '4-IntroPython',
    5: '5-Expressions',
    6: '6-ControlFlowRevisited',
    7: '7-Functions',
    8: '8-Parameters',
    9: '9-Images',
    10: '10-Graphics',
    11: '11-Animations',
    12: '12-Lists',
    13: '13-TextProcessing',
    14: '14-Dictionaries',
  };
  const file = slides[lectureNum];
  if (!file) return [];
  const out: Array<{ label: string; url: string }> = [
    { label: `Lecture ${lectureNum} slides`, url: `${BASE}/${file}.pdf` },
  ];
  if (lectureNum > 1) {
    out.push({
      label: `Lecture ${lectureNum} code`,
      url: `${BASE}/Lecture${lectureNum}.zip`,
    });
  }
  return out;
}

function lectureSection(
  sectionSortOrder: number,
  sectionTitle: string,
  videos: Array<{ title: string; youtubeId: string }>,
  resources?: Array<{ label: string; url: string }>
): Year1Lecture[] {
  return videos.map((video, videoSortOrder) => ({
    sectionTitle,
    sectionSortOrder,
    sortOrder: sectionSortOrder,
    videoTitle: video.title,
    videoSortOrder,
    youtubeId: video.youtubeId,
    resources,
  }));
}

export const CS106A_LECTURES: Year1Lecture[] = [
  ...lectureSection(
    0,
    'Lecture 1: Welcome to Code in Place',
    [
      { title: 'Welcome', youtubeId: 'dxZFXJhZPvU' },
      { title: 'General Info', youtubeId: 'ukpUVAhdo94' },
      { title: 'Karel', youtubeId: 'LpxjnuQwTg4' },
    ],
    cs106aLectureResources(1)
  ),
  ...lectureSection(
    1,
    'Lecture 2: Control Flow in Karel',
    [
    { title: 'Recap', youtubeId: 'xAQlbo82EuU' },
    { title: 'For Loops', youtubeId: 'yVmGFatf-Y8' },
    { title: 'While Loops', youtubeId: 'S5y2u7VITMo' },
    { title: 'If/Else', youtubeId: 'ACkcPIB5SZs' },
    { title: 'Steeple Chase', youtubeId: 'nxu8NBAv2pM' },
    ],
    cs106aLectureResources(2)
  ),
  ...lectureSection(
    2,
    'Lecture 3: Decomposition',
    [
    { title: 'Recap', youtubeId: 'YFWUzglTrBQ' },
    { title: 'Morning', youtubeId: 'Cz-wnRvlAMI' },
    { title: 'Mountain', youtubeId: 'ecqDCBm8tkY' },
    { title: 'Rhoomba', youtubeId: 'JIQr_gtAWrc' },
    { title: 'WordSearch', youtubeId: '62RtoSXfitU' },
    ],
    cs106aLectureResources(3)
  ),
  ...lectureSection(
    3,
    'Lecture 4: Variables in Python',
    [
    { title: 'Recap', youtubeId: 'pkh2gDQ8tjM' },
    { title: 'HelloWorld', youtubeId: 'wEbmXvfl8TM' },
    { title: 'Add2Numbers', youtubeId: 'oUuIMt5KmyQ' },
    ],
    cs106aLectureResources(4)
  ),
  ...lectureSection(
    4,
    'Lecture 5: Expressions',
    [
    { title: 'Recap', youtubeId: 'YwePpeJn828' },
    { title: 'Expressions', youtubeId: 'iTBsRFnaoJ0' },
    { title: 'Constants', youtubeId: 'sAo9IdC223s' },
    { title: 'Math Library', youtubeId: 'H90Ud28sedo' },
    { title: 'Random Numbers', youtubeId: 'SQ2_cDLgrHI' },
    { title: 'Dice Simulator', youtubeId: '_rMzEF0v6UI' },
    ],
    cs106aLectureResources(5)
  ),
  ...lectureSection(
    5,
    'Lecture 6: Control Flow in Python',
    [
    { title: 'Recap', youtubeId: '60AMFkbGZGY' },
    { title: 'Conditions', youtubeId: 'c6CZIQ3UFZE' },
    { title: 'Guess Num and Sentinel Sum', youtubeId: 'Y_IWN4OxhlM' },
    { title: 'Booleans', youtubeId: 'Y7evkU5j7TY' },
    { title: 'For Loops', youtubeId: '5BTJ4gVXaFQ' },
    { title: 'GameShow Teaser', youtubeId: 'mVoerPV6YLY' },
    ],
    cs106aLectureResources(6)
  ),
  ...lectureSection(
    6,
    'Lecture 7: Functions Revisited',
    [
    { title: 'Recap with GameShow', youtubeId: 'wY68LUvnJ04' },
    { title: 'Functions are like Toasters', youtubeId: 'hmcuptr9WBE' },
    { title: 'Anatomy of a Function', youtubeId: 'lZ8DGnIRsng' },
    { title: 'Many Examples', youtubeId: 'CS-BMynY5ko' },
    { title: 'I/O', youtubeId: '8vXvRwj8fos' },
    ],
    cs106aLectureResources(7)
  ),
  ...lectureSection(
    7,
    'Lecture 8: Functions — More Practice',
    [
    { title: 'Recap', youtubeId: 'vMy48Q6aPk0' },
    { title: 'Factorial', youtubeId: 'kZpiuJ1r3rg' },
    { title: 'DocTests', youtubeId: 'rXtLAPxeSgI' },
    { title: 'Passing Primitives', youtubeId: 'vmzFKkyjo4o' },
    { title: 'Calendar', youtubeId: '8PCQndHgkPE' },
    ],
    cs106aLectureResources(8)
  ),
  ...lectureSection(
    8,
    'Lecture 9: Images',
    [
    { title: 'Recap', youtubeId: 'gjT_okH7HD8' },
    { title: 'Images in Python', youtubeId: 'iC82OUseeeY' },
    { title: 'First Examples', youtubeId: 'aeGbb8wC56g' },
    { title: 'GreenScreen', youtubeId: 'pAG9rAqA4N4' },
    { title: 'Mirrored', youtubeId: 'x0PpSbK4k_s' },
    { title: 'Nested For vs For Each Pixel', youtubeId: 'DhohL7AOzsw' },
    ],
    cs106aLectureResources(9)
  ),
  ...lectureSection(
    9,
    'Lecture 10: Graphics',
    [
    { title: 'Recap', youtubeId: 'h9nnz_QSzZA' },
    { title: 'Blue Rect', youtubeId: '3RMrC1wWyFE' },
    { title: 'Programming is Awesome', youtubeId: 'SfiEWn9RCXM' },
    { title: 'Checkers', youtubeId: 'Y9Qi-6TWwpM' },
    ],
    cs106aLectureResources(10)
  ),
  ...lectureSection(
    10,
    'Lecture 11: Animations',
    [
    { title: 'Recap', youtubeId: 'B8-lPPUU7eY' },
    { title: 'Animation Loop', youtubeId: 'jz02xtVaBo8' },
    { title: 'Move to Center', youtubeId: 'frTXMIWSuq0' },
    { title: 'Bouncing Ball', youtubeId: 'qjsxi3UzoA0' },
    { title: 'References', youtubeId: 'g0G4S_woMRA' },
    { title: 'Pong', youtubeId: 'XcvbczJF6CU' },
    ],
    cs106aLectureResources(11)
  ),
  ...lectureSection(
    11,
    'Lecture 12: Lists',
    [
    { title: 'Recap with Console', youtubeId: 'QioUAmUAIgE' },
    { title: 'None', youtubeId: 'A-NrRd9GyYg' },
    { title: 'Lists', youtubeId: 'vhknJZ-2Bzg' },
    { title: 'Lists as Parameters', youtubeId: 'w4beNu04CMs' },
    { title: 'AverageScores', youtubeId: 'L_TyVmOQq-I' },
    ],
    cs106aLectureResources(12)
  ),
  ...lectureSection(
    12,
    'Lecture 13: Text Processing',
    [
    { title: 'Hook and Recap', youtubeId: 'BQQVnsE2DZI' },
    { title: 'Working with Strings', youtubeId: 'xRhjkyJHFbE' },
    { title: 'Helpful String Functions', youtubeId: 'MOhsuyHr6fU' },
    { title: 'Just Number and DNA to mRNA', youtubeId: 'fNChmzR6rVs' },
    { title: 'Characters', youtubeId: 'SnJYJHmNW7s' },
    { title: 'Immutable', youtubeId: '-cIzBBzTnK8' },
    { title: 'ReverseString and Palindrome', youtubeId: 'PB4tJZHdcAk' },
    { title: 'FakeMedicine', youtubeId: 'BbE4dnoAmXs' },
    ],
    cs106aLectureResources(13)
  ),
  ...lectureSection(
    13,
    'Lecture 14: Dictionaries',
    [
    { title: 'Recap with Files', youtubeId: 'GyexyR1qwZE' },
    { title: 'What are Dictionaries', youtubeId: 'iW6PlKk5XZk' },
    { title: 'Mutability and Dictionaries', youtubeId: 'vN9qV2hHbGk' },
    { title: 'Dictionapalooza', youtubeId: 'IUTaANNVS_w' },
    { title: 'CountWords', youtubeId: 'Pvcvy0W38T8' },
    { title: 'PhoneBook', youtubeId: 'jx8u6dFUxpY' },
    ],
    cs106aLectureResources(14)
  ),
];
