import {
  calculateSkillScore,
  calculateExperienceScore,
  calculateMatchScore,
} from '../../src/services/matching.service.js';

describe('Smart Job Matching Service Unit Tests', () => {
  describe('calculateSkillScore', () => {
    it('should return 100 when all required skills are present', () => {
      const candidateSkills = ['react', 'node.js', 'typescript'];
      const jobSkills = ['react', 'node.js', 'typescript'];
      expect(calculateSkillScore(candidateSkills, jobSkills)).toBe(100);
    });

    it('should normalize skill aliases (e.g. reactjs -> react, postgres -> postgresql)', () => {
      const candidateSkills = ['reactjs', 'postgres', 'ts'];
      const jobSkills = ['react', 'postgresql', 'typescript'];
      expect(calculateSkillScore(candidateSkills, jobSkills)).toBe(100);
    });

    it('should calculate partial overlap percentage', () => {
      const candidateSkills = ['react', 'css'];
      const jobSkills = ['react', 'typescript', 'node.js', 'docker'];
      // 1 out of 4 = 25%
      expect(calculateSkillScore(candidateSkills, jobSkills)).toBe(25);
    });

    it('should return 0 when no skills match', () => {
      const candidateSkills = ['ruby', 'rails'];
      const jobSkills = ['react', 'node.js'];
      expect(calculateSkillScore(candidateSkills, jobSkills)).toBe(0);
    });

    it('should return 100 if job has no required skills listed', () => {
      expect(calculateSkillScore(['react'], [])).toBe(100);
    });
  });

  describe('calculateExperienceScore', () => {
    it('should return 100 if candidate meets or exceeds minimum requirement', () => {
      expect(calculateExperienceScore(6, 'senior')).toBe(100); // senior min is 5
      expect(calculateExperienceScore(2, 'entry')).toBe(100);
    });

    it('should return 75 if candidate is 1 year short of requirement', () => {
      expect(calculateExperienceScore(4, 'senior')).toBe(75); // senior min is 5
    });

    it('should return 50 if candidate is 2 years short of requirement', () => {
      expect(calculateExperienceScore(3, 'senior')).toBe(50);
    });

    it('should return 25 if candidate is 3+ years short of requirement', () => {
      expect(calculateExperienceScore(1, 'senior')).toBe(25);
    });
  });

  describe('calculateMatchScore (Combined Weighted Score)', () => {
    it('should compute weighted score: 70% skill fit + 30% experience fit', () => {
      const candidate = {
        skills: ['react', 'node.js'],
        experienceYears: 6,
      };

      const job = {
        skills: ['react', 'node.js'], // 100% skill score
        experienceLevel: 'senior', // 100% experience score (6 >= 5)
      };

      const result = calculateMatchScore(candidate, job);
      expect(result.skillScore).toBe(100);
      expect(result.experienceScore).toBe(100);
      expect(result.matchScore).toBe(100);
      expect(result.matchedSkills).toEqual(['react', 'node.js']);
    });

    it('should correctly weight when skills partially match and experience has shortfall', () => {
      const candidate = {
        skills: ['react'], // 1 of 2 = 50% skill score
        experienceYears: 4, // 1 year short of senior (5) = 75% experience score
      };

      const job = {
        skills: ['react', 'node.js'],
        experienceLevel: 'senior',
      };

      // Expected: (50 * 0.70) + (75 * 0.30) = 35 + 22.5 = 57.5 -> 58
      const result = calculateMatchScore(candidate, job);
      expect(result.skillScore).toBe(50);
      expect(result.experienceScore).toBe(75);
      expect(result.matchScore).toBe(58);
      expect(result.matchedSkills).toEqual(['react']);
    });
  });
});
