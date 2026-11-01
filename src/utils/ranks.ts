import { RankInfo } from '../types';

export function getRankInfo(rating: number): RankInfo {
  if (rating < 1200) {
    return {
      title: 'Newbie',
      titleEn: 'Newbie',
      color: '#808080',
      textClass: 'text-gray-500 font-semibold',
      badgeClass: 'bg-gray-100 text-gray-700 border border-gray-300',
      nextRankThreshold: 1200,
      nextRankTitle: 'Pupil',
    };
  }
  if (rating < 1400) {
    return {
      title: 'Pupil',
      titleEn: 'Pupil',
      color: '#008000',
      textClass: 'text-green-600 font-semibold',
      badgeClass: 'bg-green-50 text-green-700 border border-green-200',
      nextRankThreshold: 1400,
      nextRankTitle: 'Specialist',
    };
  }
  if (rating < 1600) {
    return {
      title: 'Specialist',
      titleEn: 'Specialist',
      color: '#03a89e',
      textClass: 'text-cyan-600 font-semibold',
      badgeClass: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
      nextRankThreshold: 1600,
      nextRankTitle: 'Expert',
    };
  }
  if (rating < 1900) {
    return {
      title: 'Expert',
      titleEn: 'Expert',
      color: '#0000ff',
      textClass: 'text-blue-600 font-bold',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
      nextRankThreshold: 1900,
      nextRankTitle: 'Candidate Master',
    };
  }
  if (rating < 2200) {
    return {
      title: 'Candidate Master',
      titleEn: 'Candidate Master',
      color: '#aa00aa',
      textClass: 'text-purple-600 font-bold',
      badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200',
      nextRankThreshold: 2200,
      nextRankTitle: 'Master',
    };
  }
  if (rating < 2400) {
    return {
      title: 'Master',
      titleEn: 'Master',
      color: '#ff8c00',
      textClass: 'text-amber-600 font-bold',
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      nextRankThreshold: 2400,
      nextRankTitle: 'Grandmaster',
    };
  }
  return {
    title: 'Grandmaster',
    titleEn: 'Grandmaster',
    color: '#e02424',
    textClass: 'text-red-600 font-bold',
    badgeClass: 'bg-red-50 text-red-700 border border-red-300',
  };
}
