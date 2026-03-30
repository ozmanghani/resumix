/**
 * Core resume data model interfaces.
 * These define the shape of extracted resume data.
 */

export interface ContactInfo {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  location?: string;
  address?: string;
}

export interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  honors?: string;
  description?: string;
}

export interface Experience {
  company?: string;
  title?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  highlights?: string[];
}

export interface Skill {
  name: string;
  category?: string;
}

export interface Certification {
  name?: string;
  issuer?: string;
  date?: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface Project {
  name?: string;
  description?: string;
  technologies?: string[];
  url?: string;
  startDate?: string;
  endDate?: string;
}

export interface Language {
  name: string;
  proficiency?: string;
}

export interface Award {
  title?: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface Publication {
  title?: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
}

export interface VolunteerExperience {
  organization?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

/**
 * The complete parsed resume data structure.
 * All fields are optional since users may request only specific fields.
 */
export interface ResumeData {
  contact?: ContactInfo;
  summary?: string;
  objective?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  certifications?: Certification[];
  projects?: Project[];
  languages?: Language[];
  awards?: Award[];
  publications?: Publication[];
  volunteer?: VolunteerExperience[];
}

/**
 * Metadata about the parsing operation.
 */
export interface ParseMetadata {
  /** Total pages in the PDF */
  pages: number;
  /** Parsing duration in milliseconds */
  duration: number;
  /** Parser mode used: 'rule-based' or 'ai' */
  mode: 'rule-based' | 'ai';
  /** Sections detected in the resume */
  sectionsDetected: string[];
  /** Confidence score (0-1) when using AI */
  confidence?: number;
}

/**
 * The result returned from parsing a resume.
 */
export interface ParseResult {
  data: ResumeData;
  metadata: ParseMetadata;
  /** The raw extracted text from the PDF */
  rawText?: string;
}
