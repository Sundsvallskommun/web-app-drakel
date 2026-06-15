import path from 'path';

// Auto-generated API clients (swagger-typescript-api) under **/data-contracts/** are never
// hand-edited and opt out of eslint/tsc, so we skip formatting/linting them too. Keeping them
// out of prettier also stops the quote churn between the generator and the repo style.
const isGenerated = file => file.split(path.sep).join('/').includes('/data-contracts/');

const tasksFor = pkg => files => {
  const cwd = path.resolve(pkg);
  const relativePaths = files
    .filter(file => !isGenerated(file))
    .map(file => path.relative(cwd, file).split(path.sep).join('/'));
  if (relativePaths.length === 0) return [];
  const joined = relativePaths.join(' ');
  return [
    `yarn --cwd ${pkg} prettier --write ${joined}`,
    // --no-warn-ignored: lint-staged passes explicit paths, so files matched by eslint's own
    // `ignores` (e.g. *.d.ts) would otherwise emit a "File ignored" warning and trip --max-warnings=0.
    `yarn --cwd ${pkg} eslint --no-error-on-unmatched-pattern --no-warn-ignored --fix --max-warnings=0 ${joined}`,
  ];
};

export default {
  'frontend/src/**/*.{ts,tsx}': tasksFor('frontend'),
  'frontend/e2e/**/*.ts': tasksFor('frontend'),
  'backend/src/**/*.ts': tasksFor('backend'),
};
