import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger.js';

// Technical skills dictionary for automated resume tagging
const SKILLS_TAXONOMY = [
  'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'svelte',
  'node.js', 'express', 'nestjs', 'python', 'django', 'fastapi', 'flask',
  'go', 'rust', 'java', 'spring boot', 'c++', 'c#', '.net', 'ruby', 'rails',
  'php', 'laravel', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
  'graphql', 'rest api', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
  'ci/cd', 'github actions', 'tailwind css', 'redux', 'microservices', 'kafka', 'rabbitmq',
  'jest', 'vitest', 'cypress', 'linux', 'git', 'html5', 'css3'
];

/**
 * Extract plain text and skills from a PDF buffer
 * @param {Buffer} buffer
 */
export const parseResumeBuffer = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    const text = data.text || '';
    const lowerText = text.toLowerCase();

    // 1. Skill Extraction
    const matchedSkills = [];
    for (const skill of SKILLS_TAXONOMY) {
      // Escape special characters for regex (e.g. c++, .net, next.js)
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lowerText)) {
        matchedSkills.push(skill);
      }
    }

    // 2. Experience Estimation Regex
    let estimatedYears = 0;
    const expRegex = /(\d{1,2})\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:professional|hands-on|industry|software))?\s+experience/i;
    const expMatch = text.match(expRegex);
    if (expMatch && expMatch[1]) {
      estimatedYears = parseInt(expMatch[1], 10);
    }

    return {
      textLength: text.length,
      extractedSkills: Array.from(new Set(matchedSkills)),
      estimatedExperienceYears: estimatedYears,
      preview: text.substring(0, 300).trim(),
    };
  } catch (err) {
    logger.error(`Error parsing resume PDF: ${err.message}`);
    return {
      textLength: 0,
      extractedSkills: [],
      estimatedExperienceYears: 0,
      preview: '',
    };
  }
};
