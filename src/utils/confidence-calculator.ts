/**
 * Calculates a real confidence score based on extraction quality,
 * and generates warnings and completeness metrics.
 */

import { ResumeData, SectionCompleteness } from '../types/resume';

/**
 * Calculate a confidence score (0-1) based on the extracted data quality.
 */
export function calculateConfidence(
  data: ResumeData,
  sectionsDetected: string[],
  mode: 'rule-based' | 'ai',
): number {
  const sectionScore = scoreSections(sectionsDetected);
  const contactScore = scoreContact(data);
  const fieldScore = scoreFieldPopulation(data);
  const dateScore = scoreDateParsing(data);

  // Weighted average
  const raw = sectionScore * 0.2 + contactScore * 0.25 + fieldScore * 0.3 + dateScore * 0.25;

  // AI mode gets a slight boost since it tends to be more contextually accurate
  const modeMultiplier = mode === 'ai' ? 1.05 : 1.0;

  return Math.min(1, Math.max(0, Math.round(raw * modeMultiplier * 100) / 100));
}

/**
 * Score based on number of sections detected.
 */
function scoreSections(sections: string[]): number {
  // Filter out 'header' and 'unknown' which are structural, not content sections
  const contentSections = sections.filter((s) => s !== 'header' && s !== 'unknown');
  const count = contentSections.length;
  if (count >= 6) return 1.0;
  if (count >= 4) return 0.8;
  if (count >= 3) return 0.6;
  if (count >= 1) return 0.4;
  return 0.1;
}

/**
 * Score based on contact info completeness.
 */
function scoreContact(data: ResumeData): number {
  if (!data.contact) return 0;
  const c = data.contact;
  let found = 0;
  const total = 4; // name, email, phone, location
  if (c.name) found++;
  if (c.email) found++;
  if (c.phone) found++;
  if (c.location || c.linkedin) found++;
  return found / total;
}

/**
 * Score based on how populated the extracted fields are across sections.
 */
function scoreFieldPopulation(data: ResumeData): number {
  const scores: number[] = [];

  if (data.experience && data.experience.length > 0) {
    const total = data.experience.length;
    let populated = 0;
    for (const exp of data.experience) {
      let fields = 0;
      if (exp.title) fields++;
      if (exp.company) fields++;
      if (exp.startDate) fields++;
      if (exp.description || (exp.highlights && exp.highlights.length > 0)) fields++;
      populated += fields / 4;
    }
    scores.push(populated / total);
  }

  if (data.education && data.education.length > 0) {
    const total = data.education.length;
    let populated = 0;
    for (const edu of data.education) {
      let fields = 0;
      if (edu.institution) fields++;
      if (edu.degree) fields++;
      if (edu.startDate || edu.endDate) fields++;
      populated += fields / 3;
    }
    scores.push(populated / total);
  }

  if (data.skills && data.skills.length > 0) {
    scores.push(1.0);
  }

  if (data.summary) scores.push(1.0);

  if (scores.length === 0) return 0.1;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Score based on how many experience/education entries have dates.
 */
function scoreDateParsing(data: ResumeData): number {
  let total = 0;
  let withDates = 0;

  if (data.experience) {
    for (const exp of data.experience) {
      total++;
      if (exp.startDate || exp.endDate || exp.current) withDates++;
    }
  }

  if (data.education) {
    for (const edu of data.education) {
      total++;
      if (edu.startDate || edu.endDate) withDates++;
    }
  }

  if (total === 0) return 0.5; // No entries to evaluate
  return withDates / total;
}

/**
 * Generate warnings about missing or incomplete data.
 */
export function generateWarnings(data: ResumeData, sectionsDetected: string[]): string[] {
  const warnings: string[] = [];
  const contentSections = sectionsDetected.filter((s) => s !== 'header' && s !== 'unknown');

  // Contact warnings
  if (!data.contact) {
    warnings.push('No contact information detected');
  } else {
    if (!data.contact.name) warnings.push('No name detected in contact info');
    if (!data.contact.email) warnings.push('No email address found');
    if (!data.contact.phone) warnings.push('No phone number found');
  }

  // Section-level warnings
  if (contentSections.length < 3) {
    warnings.push(
      `Only ${contentSections.length} section(s) detected — resume may be incomplete or poorly formatted`,
    );
  }

  if (!contentSections.includes('experience') && !data.experience?.length) {
    warnings.push('No work experience section detected');
  }

  if (!contentSections.includes('education') && !data.education?.length) {
    warnings.push('No education section detected');
  }

  if (!data.skills || data.skills.length === 0) {
    warnings.push('No skills detected');
  }

  if (!data.summary && !data.objective) {
    warnings.push('No professional summary or objective found');
  }

  // Experience entry warnings
  if (data.experience) {
    for (const exp of data.experience) {
      if (!exp.startDate && !exp.current) {
        const label = exp.title || exp.company || 'Unknown';
        warnings.push(`Experience entry "${label}" has no dates`);
      }
      if (!exp.company && exp.title) {
        warnings.push(`Experience entry "${exp.title}" is missing company name`);
      }
      if (!exp.title && exp.company) {
        warnings.push(`Experience entry at "${exp.company}" is missing job title`);
      }
    }
  }

  // Education entry warnings
  if (data.education) {
    for (const edu of data.education) {
      if (!edu.institution && edu.degree) {
        warnings.push(`Education entry "${edu.degree}" is missing institution`);
      }
      if (!edu.degree && edu.institution) {
        warnings.push(`Education entry at "${edu.institution}" is missing degree`);
      }
    }
  }

  return warnings;
}

/**
 * Calculate per-section completeness metrics.
 */
export function calculateCompleteness(data: ResumeData): SectionCompleteness[] {
  const results: SectionCompleteness[] = [];

  // Contact completeness
  if (data.contact) {
    const expected = 4; // name, email, phone, location
    let populated = 0;
    if (data.contact.name) populated++;
    if (data.contact.email) populated++;
    if (data.contact.phone) populated++;
    if (data.contact.location) populated++;
    results.push({
      section: 'contact',
      fieldsExpected: expected,
      fieldsPopulated: populated,
      percentage: Math.round((populated / expected) * 100),
    });
  }

  // Experience completeness
  if (data.experience && data.experience.length > 0) {
    const coreFields = 4; // title, company, startDate, description/highlights
    let totalPopulated = 0;
    for (const exp of data.experience) {
      let fields = 0;
      if (exp.title) fields++;
      if (exp.company) fields++;
      if (exp.startDate) fields++;
      if (exp.description || (exp.highlights && exp.highlights.length > 0)) fields++;
      totalPopulated += fields;
    }
    const totalExpected = data.experience.length * coreFields;
    results.push({
      section: 'experience',
      fieldsExpected: totalExpected,
      fieldsPopulated: totalPopulated,
      percentage: Math.round((totalPopulated / totalExpected) * 100),
    });
  }

  // Education completeness
  if (data.education && data.education.length > 0) {
    const coreFields = 3; // institution, degree, startDate
    let totalPopulated = 0;
    for (const edu of data.education) {
      let fields = 0;
      if (edu.institution) fields++;
      if (edu.degree) fields++;
      if (edu.startDate || edu.endDate) fields++;
      totalPopulated += fields;
    }
    const totalExpected = data.education.length * coreFields;
    results.push({
      section: 'education',
      fieldsExpected: totalExpected,
      fieldsPopulated: totalPopulated,
      percentage: Math.round((totalPopulated / totalExpected) * 100),
    });
  }

  // Skills completeness
  if (data.skills && data.skills.length > 0) {
    const withCategory = data.skills.filter((s) => s.category).length;
    results.push({
      section: 'skills',
      fieldsExpected: data.skills.length,
      fieldsPopulated: data.skills.length,
      percentage: 100,
    });
    if (withCategory > 0) {
      results.push({
        section: 'skills.categories',
        fieldsExpected: data.skills.length,
        fieldsPopulated: withCategory,
        percentage: Math.round((withCategory / data.skills.length) * 100),
      });
    }
  }

  return results;
}
