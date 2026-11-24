import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { buildSync } from 'esbuild';
import { runtimeRoot } from './build.ts';

export function compileLanguage(): void {
    buildSync({entryPoints:[join(runtimeRoot,'src','page-lifetime.ts')],outfile:join(runtimeRoot,'extension','page-lifetime.js'),bundle:true,platform:'browser',format:'iife',target:['chrome128']});
    const popup = readFileSync(join(runtimeRoot, 'extension', 'popup.js'), 'utf8');
    function literal(name: string, close: string): unknown {
        const marker = `  var ${name} = `;
        const start = popup.indexOf(marker);
        const end = popup.indexOf(`\n  ${close};`, start);
        if (start < 0 || end < start) throw new Error(`Missing legacy language catalog: ${name}`);
        return runInNewContext('(' + popup.slice(start + marker.length, end + 4) + ')', {}, { timeout: 1000 });
    }
    const pairs: [string, string][] = [];
    for (const name of ['STATIC_ZH', 'ERROR_ZH']) pairs.push(...Object.entries(literal(name, '}') as Record<string, string>));
    for (const name of ['PHRASE_ZH', 'ERROR_PHRASES_ZH']) pairs.push(...literal(name, ']') as [string, string][]);
    const quoted = '("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')';
    const call = new RegExp('\\bt\\(\\s*' + quoted + '\\s*,\\s*' + quoted, 'g');
    for (const match of popup.matchAll(call)) {
        const en = runInNewContext(match[1]!, {}, { timeout: 1000 }) as string;
        const zh = runInNewContext(match[2]!, {}, { timeout: 1000 }) as string;
        if (en && zh) pairs.push([en, zh]);
    }
    writeFileSync(join(runtimeRoot, 'src', 'legacy-ui-messages.ts'), '// Generated from the retained popup dictionaries.\nexport const LEGACY_MESSAGES: readonly (readonly [string, string])[] = ' + JSON.stringify(pairs, null, 2) + ';\n');
    buildSync({ entryPoints: [join(runtimeRoot, 'src', 'ui-language.ts')], outfile: join(runtimeRoot, 'extension', 'ui-language.js'), bundle: true, minify: true, platform: 'browser', format: 'iife', target: ['chrome128'], banner: { js: '// Generated from relay/src/ui-language.ts. Do not edit this artifact directly.' }, legalComments: 'inline', logLevel: 'silent' });
    buildSync({ entryPoints: [join(runtimeRoot, 'src', 'loadout-details.ts')], outfile: join(runtimeRoot, 'extension', 'loadout-details.js'), bundle: true, minify: true, platform: 'browser', format: 'iife', target: ['chrome128'], banner: { js: '// Generated from relay/src/loadout-details.ts. Do not edit this artifact directly.' }, legalComments: 'inline', logLevel: 'silent' });
    buildSync({ entryPoints: [join(runtimeRoot, 'src', 'loadout-plan-cache.ts')], outfile: join(runtimeRoot, 'extension', 'loadout-plan-cache.js'), bundle: true, minify: true, platform: 'browser', format: 'iife', target: ['chrome128'], banner: { js: '// Generated from relay/src/loadout-plan-cache.ts. Do not edit this artifact directly.' }, legalComments: 'inline', logLevel: 'silent' });
}

if (process.argv[1]?.endsWith('compile-language.ts')) compileLanguage();
