import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { compileLanguage } from './compile-language.ts';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const runtimeRoot = join(root, 'relay');
export const releaseVersion: string = JSON.parse(readFileSync(join(runtimeRoot, 'package.json'), 'utf8')).version;
export const outputRoot = join(root, 'build', 'relay');
export const platforms = ['Chrome', 'Edge'] as const;

export function files(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = join(directory, entry.name);
        if (entry.isSymbolicLink()) throw new Error(`Symlinks are not release inputs: ${path}`);
        return entry.isDirectory() ? files(path) : [path];
    }).sort();
}

export function buildPlatforms(): void {
    compileLanguage();
    // Only this checked, repo-local generated directory may be replaced.
    const generated = relative(root, outputRoot);
    if (generated !== join('build', 'relay') || generated.startsWith('..' + sep)) {
        throw new Error('Build output escaped the repository');
    }
    console.log(`Building into ${outputRoot}`);
    rmSync(outputRoot, { recursive: true, force: true });
    for (const platform of platforms) {
        const target = join(outputRoot, platform);
        mkdirSync(target, { recursive: true });
        cpSync(join(runtimeRoot, 'extension'), join(target, 'extension'), { recursive: true });
        cpSync(join(runtimeRoot, 'tests'), join(target, 'tests'), { recursive: true });
        const manifest = JSON.parse(readFileSync(join(runtimeRoot, 'platforms', platform.toLowerCase() + '.json'), 'utf8'));
        writeFileSync(join(target, 'extension', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
        const popupPath = join(target, 'extension', 'popup.html');
        const popup = readFileSync(popupPath, 'utf8');
        const label = 'COR3 Relay · Chrome ' + releaseVersion + '</p>';
        if (!popup.includes(label)) throw new Error('Toolbar version differs from Relay package version');
        writeFileSync(popupPath, popup.replace(label, 'COR3 Relay · ' + platform + ' ' + releaseVersion + '</p>'));
        const extension = join(target, 'extension');
        const hashes = Object.fromEntries(files(extension).map(path => [
            relative(extension, path).split(sep).join('/'),
            createHash('sha256').update(readFileSync(path)).digest('hex'),
        ]));
        writeFileSync(join(target, 'SHA256.json'), JSON.stringify(hashes, null, 2) + '\n');
        console.log(`${platform}: ${Object.keys(hashes).length} extension files`);
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildPlatforms();
