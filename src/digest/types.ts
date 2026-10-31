// Plan morning-digest § 1. The contract section 2 builds against: one row per job in a night's
// run log, plus how many lines didn't parse.

export type RunStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null; // null in the log; views show it as `—`
  runs: number; // lines for this job
  retries: number; // lines with status `retry`
  lastStatus: RunStatus;
  lastError: string | null; // `error` of the last line that had one
  firstAt: string; // `at` as written in the log, offset kept
  lastAt: string;
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job
  badLines: number; // lines that didn't parse; counted, never thrown
};

// Reads `<runsDir>/<night>.jsonl`. Returns null when the file doesn't exist; an empty file is a
// night with no rows.
export type ReadNight = (runsDir: string, night: string) => Night | null;
