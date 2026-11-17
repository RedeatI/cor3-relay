import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const runtimeRoot = join(root, 'relay');
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
        cpSync(join(runtimeRoot, 'platforms', platform.toLowerCase() + '.json'), join(target, 'extension', 'manifest.json'));
        const popupPath = join(target, 'extension', 'popup.html');
        writeFileSync(popupPath, readFileSync(popupPath, 'utf8').replace('Chrome 2.1.0', `${platform} 2.1.0`));
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
