/**
 * LexGuard — Debug Logger
 * Set DEBUG = false before hackathon / production submission.
 */

const DEBUG = true;

export const log = {
  analyze: (msg, data) =>
    DEBUG &&
    console.log(
      `%c[LexGuard][Analyze] ${msg}`,
      'color:#4facfe;font-weight:bold',
      data ?? ''
    ),

  cache: (msg, data) =>
    DEBUG &&
    console.log(
      `%c[LexGuard][Cache] ${msg}`,
      'color:#f59e0b;font-weight:bold',
      data ?? ''
    ),

  prompt: (msg, data) =>
    DEBUG &&
    console.log(
      `%c[LexGuard][Prompt] ${msg}`,
      'color:#22c55e;font-weight:bold',
      data ?? ''
    ),

  error: (msg, data) =>
    console.error(
      `%c[LexGuard][Error] ${msg}`,
      'color:#ef4444;font-weight:bold',
      data ?? ''
    ),
};
