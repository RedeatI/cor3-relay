import { object, optional, unknown, number } from 'zod/mini';

const itemSchema = object({ manufacturer: optional(unknown()), version: optional(unknown()), specs: optional(unknown()), consuming: optional(unknown()), itemVulnerability: optional(unknown()), image: optional(unknown()) });
const imageOrigins = new Set(['https://cor3.gg', 'https://os.cor3.gg', 'https://cdn.cor3.gg']);

export function imageUrl(value: unknown): string | null {
    if (typeof value !== 'string' || !value.trim() || value.length > 2048) return null;
    try {
        const origin = globalThis.location?.origin;
        const url = new URL(value, imageOrigins.has(origin) ? origin : 'https://cor3.gg');
        if (!imageOrigins.has(url.origin) || url.username || url.password ||
            !/\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url.pathname)) return null;
        return url.origin + url.pathname;
    } catch {
        return null;
    }
}
const scalar = number();
const numeric = (value: unknown): number | null => {
    const result = scalar.safeParse(value);
    return result.success && Math.abs(result.data) < 1e15 ? result.data : null;
};
const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const definitions = [
    ['cpuConsuming', '功耗', 'kW', 'cpu_consuming'],
    ['cpuCores', '核心数', '', 'cpu_cores'],
    ['cpuFrequency', '频率', 'GHz', 'cpu_frequency'],
    ['gpuConsuming', '功耗', 'kW', 'gpu_consuming'],
    ['gpuPower', '算力', 'PFLOPS', 'gpu_power'],
    ['gpuMemory', '显存', 'TB', 'gpu_memory'],
    ['ramFrequency', '频率', 'GHz', 'ram_frequency'],
    ['ramMemory', '内存', 'TB', 'ram_memory'],
    ['psuPower', '供电', 'kW', 'psu_power'],
    ['psuProtection', '防护', '%', 'psu_protection'],
] as const;
type Stat = { key: string; label: string; unit: string; value: number };
type Capability = { type: string; min: number | null; max: number | null };
type Demand = { key: string; label: string; unit: string; min: number | null; max: number | null; allocated: number | null };

/** Project server-reported totals. An absent reading stays unknown, including PSU usage. */
export function projectResources(value: unknown) {
    const resources = record(value);
    const supply = record(resources.supply);
    const demand = record(resources.demand);
    const keys = ['cpuFrequency', 'cpuCores', 'gpuPower', 'gpuMemory', 'ramFrequency', 'ramMemory', 'psuPower'];
    const nonnegative = (input: unknown) => {
        const reading = numeric(input);
        return reading !== null && reading >= 0 ? reading : null;
    };
    return definitions.flatMap(([key, label, unit, alias]) => {
        if (!keys.includes(key)) return [];
        const capacity = nonnegative(supply[alias] ?? supply[key]);
        const used = nonnegative((key === 'psuPower' ? demand.psu_total : undefined) ?? demand[alias] ?? demand[key]);
        return capacity === null && used === null ? [] : [{ key, label: key.slice(0, 3).toUpperCase() + ' ' + label, unit, capacity, used }];
    });
}

export function project(value: unknown, kind: 'hardware' | 'software') {
    const parsed = itemSchema.safeParse(value);
    const item = parsed.success ? parsed.data : {};
    const stats: Stat[] = [], functions: Capability[] = [], demands: Demand[] = [];
    if (kind === 'hardware') {
        const specs = record(item.specs);
        for (const [key, label, unit, alias] of definitions) {
            const amount = numeric(specs[key] ?? specs[alias]);
            if (amount !== null) stats.push({ key, label, unit, value: amount });
        }
        const vulnerability = numeric(item.itemVulnerability);
        if (vulnerability !== null) stats.push({ key: 'vulnerability', label: '漏洞率', unit: '%', value: vulnerability });
    } else {
        for (const entry of (Array.isArray(item.specs) ? item.specs : item.specs && typeof item.specs === 'object' ? [item.specs] : []).slice(0,32)) {
            const spec = record(entry), power = Array.isArray(spec.power) ? spec.power : [];
            const type = typeof spec.type === 'string' ? spec.type.slice(0,40).toUpperCase() : '';
            if (type) functions.push({ type, min: numeric(power[0]), max: numeric(power[1]) });
        }
        const consuming = record(item.consuming);
        for (const [key, label, unit, alias] of definitions) {
            const range = consuming[key] ?? consuming[alias];
            if (!Array.isArray(range) || range.length < 2) continue;
            const frequency = key === 'cpuFrequency' || key === 'ramFrequency';
            demands.push({ key, label: key.slice(0,3).toUpperCase() + ' ' + label, unit, allocated: !frequency && range.length >= 3 ? numeric(range[0]) : null, min: numeric(range[frequency ? 0 : 1]), max: numeric(range[frequency ? 1 : range.length >= 3 ? 2 : range.length-1]) });
        }
    }
    return { stats, functions, demands, image: imageUrl(item.image), manufacturer: typeof item.manufacturer === 'string' ? item.manufacturer.slice(0,100) : '', version: typeof item.version === 'string' ? item.version.slice(0,40) : '' };
}

const host = globalThis as typeof globalThis & { Cor3LoadoutDetails?: object };
host.Cor3LoadoutDetails = Object.freeze({ project, projectResources, imageUrl });
