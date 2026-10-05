import type { VerifiedReference } from '@/types';
import { titlesMatch } from './matching';

/** Works published within this many calendar years, including the current one, count as recent. */
export const RECENT_YEARS = 7;
/** Older works the AI cited (theory, seminal studies) are kept only up to this many. */
const MAX_FOUNDATIONAL = 2;
/** Size the final list aims for; discovered works fill the room left by the AI's recent ones. */
const TARGET_REFERENCES = 10;
const MIN_DISCOVERED = 3;
const MAX_DISCOVERED = 6;

export const recentSinceYear = (currentYear: number) => currentYear - RECENT_YEARS + 1;

const normalizeDoi = (doi?: string) => doi?.trim().toLowerCase().replace(/^https?:\/\/doi\.org\//, '') ?? '';

const isSameWork = (a: VerifiedReference, b: VerifiedReference) => {
  const doiA = normalizeDoi(a.doi);
  const doiB = normalizeDoi(b.doi);
  if (doiA && doiB) return doiA === doiB;
  return titlesMatch(a.title, b.title);
};

/**
 * Citations per year of exposure, so a 2024 paper competes fairly with a 2019 one instead of
 * the oldest papers in the window always winning on raw counts.
 */
export const citationsPerYear = (year: number, citedByCount: number, currentYear: number): number =>
  citedByCount / Math.max(1, currentYear - year + 1);

const byCitationsPerYear = (currentYear: number) => (a: VerifiedReference, b: VerifiedReference) =>
  citationsPerYear(b.year, b.cited_by_count ?? 0, currentYear) -
  citationsPerYear(a.year, a.cited_by_count ?? 0, currentYear);

const byCitations = (a: VerifiedReference, b: VerifiedReference) =>
  (b.cited_by_count ?? 0) - (a.cited_by_count ?? 0);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export interface ReferenceSelectionInput {
  /** AI-cited works confirmed by Crossref or web search. */
  verified: VerifiedReference[];
  /** Works found by topic search, already ranked best first. */
  discovered: VerifiedReference[];
  currentYear: number;
}

/**
 * Builds the reference list shown to the student: the AI's recent verified works plus the best
 * discovered ones, ordered by citations per year, followed by at most two older foundational works.
 * Older AI citations beyond those are dropped: the AI tends to recall classics, and the list
 * is meant to point students at current, well-cited literature.
 */
export const selectReferences = ({
  verified,
  discovered,
  currentYear,
}: ReferenceSelectionInput): VerifiedReference[] => {
  const sinceYear = recentSinceYear(currentYear);
  const isRecent = (reference: VerifiedReference) => reference.year >= sinceYear;

  const recentVerified = verified.filter(isRecent);
  const foundational = verified
    .filter((reference) => !isRecent(reference))
    .sort(byCitations)
    .slice(0, MAX_FOUNDATIONAL);

  const discoveredSlots = clamp(
    TARGET_REFERENCES - recentVerified.length - foundational.length,
    MIN_DISCOVERED,
    MAX_DISCOVERED
  );
  const newlyDiscovered = discovered
    .filter((candidate) => !verified.some((known) => isSameWork(known, candidate)))
    .slice(0, discoveredSlots);

  const recent = [...recentVerified, ...newlyDiscovered].sort(byCitationsPerYear(currentYear));

  return [...recent, ...foundational];
};
