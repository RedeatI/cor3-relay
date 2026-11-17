import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildPlatforms, files, outputRoot, platforms } from './build.ts';

buildPlatforms();
for (const platform of platforms) {
    const directory = join(outputRoot, platform);
    const tests = files(join(directory, 'tests')).filter(path => path.endsWith('.test.mjs'));
    const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...tests], {
        cwd: directory,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
    });
    if (result.status !== 0) {
        const failures = result.stdout.match(/^not ok [\s\S]*?^  \.\.\./gm) || [];
        process.stderr.write(failures.join('\n') + '\n' + result.stderr);
        throw result.error || new Error(`${platform} tests failed (${result.status})`);
    }
    const summary = result.stdout.split(/\r?\n/).filter(line => /^# (tests|pass|fail|cancelled|skipped|duration_ms) /.test(line));
    console.log(`${platform}\n${summary.join('\n')}`);
}
