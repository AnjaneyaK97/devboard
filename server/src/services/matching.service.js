/**
 * Technical skill taxonomy alias normalization map
 */
const SKILL_ALIASES = {
  'react.js': 'react',
  'reactjs': 'react',
  'node': 'node.js',
  'nodejs': 'node.js',
  'node.js': 'node.js',
  'ts': 'typescript',
  'js': 'javascript',
  'postgres': 'postgresql',
  'mongo': 'mongodb',
  'aws': 'amazon web services',
  'amazon web services': 'aws',
  'k8s': 'kubernetes',
  'golang': 'go',
  'tailwind': 'tailwindcss',
};

const normalizeSkill = (skill) => {
  const cleaned = (skill || '').trim().toLowerCase();
  return SKILL_ALIASES[cleaned] || cleaned;
};

/**
 * Expected minimum and recommended years of experience by level
 */
const EXPERIENCE_LEVEL_MAP = {
  entry: { min: 0, target: 1 },
  mid: { min: 2, target: 3 },
  senior: { min: 5, target: 6 },
  lead: { min: 8, target: 9 },
  executive: { min: 10, target: 12 },
};

/**
 * Calculate pure skill overlap percentage (0 - 100)
 */
export const calculateSkillScore = (candidateSkills = [], jobSkills = []) => {
  if (!jobSkills || jobSkills.length === 0) return 100;
  if (!candidateSkills || candidateSkills.length === 0) return 0;

  const normalizedCandidate = new Set(candidateSkills.map(normalizeSkill));
  const normalizedJob = jobSkills.map(normalizeSkill);

  let matchCount = 0;
  normalizedJob.forEach((skill) => {
    if (normalizedCandidate.has(skill)) {
      matchCount += 1;
    }
  });

  return Math.round((matchCount / normalizedJob.length) * 100);
};

/**
 * Calculate experience fit percentage (0 - 100)
 */
export const calculateExperienceScore = (candidateYears = 0, experienceLevel = 'mid') => {
  const benchmark = EXPERIENCE_LEVEL_MAP[experienceLevel] || EXPERIENCE_LEVEL_MAP.mid;
  const years = Math.max(0, candidateYears || 0);

  if (years >= benchmark.min) {
    return 100;
  }

  const shortfall = benchmark.min - years;
  if (shortfall <= 1) return 75;
  if (shortfall <= 2) return 50;
  return 25;
};

/**
 * Calculate comprehensive Smart Job Match Score (0 - 100)
 * Weighted: 70% skill overlap + 30% experience alignment
 *
 * @param {Object} candidate - { skills: string[], experienceYears: number }
 * @param {Object} job - { skills: string[], experienceLevel: string }
 * @returns {Object} { matchScore: number, skillScore: number, experienceScore: number, matchedSkills: string[] }
 */
export const calculateMatchScore = (candidate = {}, job = {}) => {
  const candidateSkills = candidate.skills || [];
  const jobSkills = job.skills || [];
  const candidateYears = candidate.experienceYears || 0;
  const experienceLevel = job.experienceLevel || 'mid';

  const skillScore = calculateSkillScore(candidateSkills, jobSkills);
  const experienceScore = calculateExperienceScore(candidateYears, experienceLevel);

  // 70% skill fit + 30% experience fit
  const matchScore = Math.min(100, Math.round(skillScore * 0.7 + experienceScore * 0.3));

  // Identify matched skills
  const normalizedCandidate = new Set(candidateSkills.map(normalizeSkill));
  const matchedSkills = jobSkills.filter((s) => normalizedCandidate.has(normalizeSkill(s)));

  return {
    matchScore,
    skillScore,
    experienceScore,
    matchedSkills,
  };
};
