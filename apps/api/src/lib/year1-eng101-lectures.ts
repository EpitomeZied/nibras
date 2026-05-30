/**
 * ENG 101 lecture videos — Stanford "Writing in the Sciences" Units 1–4.
 * Source: https://www.youtube.com/playlist?list=PL8yeejfiNxNBT2rTomRjmWNlgh4DBmHST
 */
import type { Year1Lecture } from './year1-curriculum';

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

export const ENG101_LECTURES: Year1Lecture[] = [
  ...lectureSection(0, 'Unit 1: Principles of Effective Writing', [
    { title: 'Introduction; principles of effective writing', youtubeId: 'x33Km7hRzP0' },
    { title: 'Examples of what not to do', youtubeId: 'Tf0hJn7XWCs' },
    { title: 'Overview, principles of effective writing', youtubeId: 'BAuxFWGORAM' },
    { title: 'Cut the clutter', youtubeId: '5ipMnCBifec' },
    { title: 'Cut the clutter, more tricks', youtubeId: 'w0R3Jr5qFUM' },
    { title: 'Practice cutting clutter', youtubeId: '68N-xrlzK64' },
  ]),
  ...lectureSection(1, 'Unit 2: Active Voice and Verbs', [
    { title: 'Use the active voice', youtubeId: 'aZqjYzW-jtw' },
    { title: 'Is it really OK to use "We" and "I"', youtubeId: 'tQHSp5VW63A' },
    { title: 'Active voice practice', youtubeId: 'XwBzeTfymBU' },
    { title: 'Write with verbs', youtubeId: 'VnAsdOG_1Tw' },
    { title: 'Practice examples', youtubeId: 'LP_XGJgzWRo' },
    { title: 'A few grammar tips', youtubeId: 'odGGS0uXRqs' },
  ]),
  ...lectureSection(2, 'Unit 3: Punctuation and Paragraphs', [
    { title: 'Experiment with punctuation', youtubeId: '1stuu97jZjw' },
    { title: 'Practice, colon, and dash', youtubeId: 'hdKBmU7PTsY' },
    { title: 'Parallelism', youtubeId: 'ScAyBtAivzk' },
    { title: 'Paragraphs', youtubeId: 'hOIBDSoxkls' },
    { title: 'More paragraph practice', youtubeId: 'MIQhwBVuEmE' },
    { title: 'A few more tips', youtubeId: 'xweGSvpHuxQ' },
  ]),
  ...lectureSection(3, 'Unit 4: The Writing Process', [
    { title: 'More paragraph practice', youtubeId: 'UH-VIonXNlk' },
    { title: 'Overview of the writing process', youtubeId: '3GeyoQUDAE4' },
    { title: 'The pre-writing setup', youtubeId: 'KvBEMS6zcGc' },
    { title: 'The Writing Step', youtubeId: '1ediizv2f3s' },
    { title: 'Revision', youtubeId: 'ZURGKkABcRs' },
    { title: 'Checklist for the final draft', youtubeId: 'TVEVgTTMuow' },
    { title: 'Demo edit 4 (optional)', youtubeId: 'O4kDqls9pZQ' },
  ]),
];
