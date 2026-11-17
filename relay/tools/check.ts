import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { z } from 'zod';
import { files, runtimeRoot, platforms } from './build.ts';

const extension = join(runtimeRoot, 'extension');
const inventory = z.record(z.string(), z.string().regex(/^[a-f0-9]{64}$/)).parse(
    JSON.parse(readFileSync(join(runtimeRoot, 'runtime-integrity.json'), 'utf8')),
);
const actual = files(extension);
if (actual.length !== Object.keys(inventory).length) throw new Error('Runtime inventory count changed');
for (const path of actual) {
    const name = relative(extension, path).replaceAll('\\', '/');
    if (createHash('sha256').update(readFileSync(path)).digest('hex') !== inventory[name]) {
        throw new Error(`Runtime integrity mismatch: ${name}`);
    }
    if (path.endsWith('.js')) {
        const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
        if (result.status !== 0) throw new Error(`Syntax: ${name}\n${result.stderr}`);
    }
}

for (const path of files(runtimeRoot)) {
    const name = relative(runtimeRoot, path).replaceAll('\\', '/');
    if (/\.(pem|pfx|p12|key|log|zip)$/i.test(name) || /(^|\/)\.env(?:\.|$)/.test(name)) {
        throw new Error(`Unexpected release input: ${name}`);
    }
    if (!/\.(js|mjs|ts|json|html|css|md)$/.test(path)) continue;
    const text = readFileSync(path, 'utf8');
    for (const match of text.matchAll(/FREEL_[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}/g)) {
        if (!/^FREEL_FF[0-9A-F]{6}-[0-9A-F]{4}$/.test(match[0])) {
            throw new Error(`Non-synthetic account identifier: ${name}`);
        }
    }
    const forbidden = [
        /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/,
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
        /[A-Z]:[\\/](?:Users[\\/][^\\/\s]+[\\/]|_codex[\\/]|qqdate[\\/])/i,
    ];
    if (forbidden.some(pattern => pattern.test(text))) throw new Error(`Private release data: ${name}`);
}

for (const platform of platforms) {
    const manifest = JSON.parse(readFileSync(join(runtimeRoot, 'platforms', platform.toLowerCase() + '.json'), 'utf8'));
    if (manifest.key || manifest.name !== 'COR3 Relay' || manifest.version !== '2.1.0') throw new Error(`Manifest identity: ${platform}`);
}
console.log(`Relay audit passed: ${actual.length} runtime files; syntax, integrity, synthetic IDs and release inputs checked.`);
