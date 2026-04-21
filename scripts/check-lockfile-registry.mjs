import fs from 'node:fs';
import path from 'node:path';

const lockfilePath = path.join(process.cwd(), 'package-lock.json');
const allowedHost = 'registry.npmjs.org';

function parseResolvedHost(resolved) {
  try {
    return new URL(resolved).host;
  } catch {
    return null;
  }
}

const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
const packages = Object.entries(lockfile.packages ?? {});
const invalidEntries = packages
  .map(([pkgPath, metadata]) => ({
    pkgPath,
    resolved: metadata?.resolved,
    host: metadata?.resolved ? parseResolvedHost(metadata.resolved) : null
  }))
  .filter((entry) => entry.resolved && entry.host && entry.host !== allowedHost);

if (invalidEntries.length) {
  const preview = invalidEntries
    .slice(0, 5)
    .map((entry) => `${entry.pkgPath || '<root>'}: ${entry.resolved}`)
    .join('\n');

  throw new Error(
    [
      `package-lock.json contains ${invalidEntries.length} package(s) resolved from non-public registries.`,
      `Allowed host: ${allowedHost}`,
      'Examples:',
      preview,
      'Regenerate the lockfile with the public npm registry before committing.'
    ].join('\n')
  );
}

console.log(`Lockfile registry check passed. All resolved URLs use ${allowedHost}.`);
