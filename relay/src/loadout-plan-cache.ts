import { object, optional, unknown, array, string, number, boolean } from 'zod/mini';

type Planner = (...args: unknown[]) => unknown;
const loadoutSchema = object({ ownedHardware: optional(array(unknown())), equippedHardware: optional(unknown()), ownedSoftware: optional(array(unknown())), equippedSoftware: optional(array(unknown())) });
const hardwareId = object({ id: string() });
const selectionSchema = object({ softwareId: string(), hardware: object({ cpu: hardwareId, gpu: hardwareId, ram: hardwareId, psu: hardwareId }), power: number(), canBoot: boolean(), sufficient: boolean(), switchCost: number(), isCurrentSoftware: boolean(), policyId: optional(string()), policyVersion: optional(number()) });
type Selection = ReturnType<typeof selectionSchema.parse>;
const slots = ['cpu','gpu','ram','psu'] as const;
const specKeys = ['cpuFrequency','cpuCores','cpuConsuming','gpuPower','gpuMemory','gpuConsuming','ramFrequency','ramMemory','psuPower','psuProtection'];
const resources = ['cpu_frequency','cpu_cores','gpu_power','gpu_memory','ram_frequency','ram_memory','psu_power'];
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

// Planning uses only these catalog fields. Exclude credentials, descriptions,
// images and UI timestamps; changes to any capacity, demand or ability invalidate.
function fingerprint(loadout: ReturnType<typeof loadoutSchema.parse>, candidates: unknown, generation: number): string | null {
    const hardware = [...loadout.ownedHardware ?? [], ...Object.values(record(loadout.equippedHardware))];
    const software = [...loadout.ownedSoftware ?? [], ...loadout.equippedSoftware ?? []];
    if (hardware.length + software.length > 2000) return null;
    let invalid = false;
    const numeric = (value: unknown) => { if (value == null) return null; if (typeof value !== 'number' || !Number.isFinite(value)) invalid = true; return value; };
    const strings = (value: unknown) => { if (value == null) return null; if (!Array.isArray(value) || value.some(x=>typeof x!=='string')) invalid = true; return value; };
    const payload = [generation, hardware.map(value => { const item=record(value),specs=record(item.specs);return [item.id,item.slot,item.category,specKeys.map(key=>numeric(specs[key]))]; }), software.map(value => {
        const item=record(value),consuming=record(item.consuming),abilities=Array.isArray(item.abilities)?item.abilities:Array.isArray(item.specs)?item.specs:item.specs?[item.specs]:[];
        return [item.id, resources.map(key=>{const values=consuming[key];if(values==null)return null;if(!Array.isArray(values)){invalid=true;return null;}return values.map(numeric);}), abilities.map(value=>{const ability=record(value);return [ability.type,numeric(ability.minPower),numeric(ability.maxPower),list(ability.power).map(numeric),strings(ability.fileTypes),strings(ability.serverTypes)];})];
    }), Object.entries(record(loadout.equippedHardware)).map(([slot,value])=>[slot,record(value).id]), list(loadout.equippedSoftware).map(value=>record(value).id), Array.isArray(candidates)?candidates.map(value=>record(record(value).sw).id ?? record(value).id):null];
    if (invalid) return null;
    try { const text=JSON.stringify(payload);return text.length<=65536?text:null; } catch { return null; }
}

export function create({ plan, generation, now=()=>Date.now() }: { plan: Planner; generation: ()=>unknown; now?: ()=>number }) {
    const cache = new Map<string, { at: number; fingerprint: string; selection: Selection | null }>();
    return (...args: unknown[]): unknown => {
        const parsed=loadoutSchema.safeParse(args[0]),epoch=generation();
        if (!parsed.success || !Number.isSafeInteger(epoch)) return plan(...args);
        const signature=fingerprint(parsed.data,args[1],epoch as number);
        if (!signature) return plan(...args);
        let key:string;try{key=JSON.stringify(args.slice(2));}catch{return plan(...args);}
        if(key.length>2048)return plan(...args);
        const at=now();
        for (const [key,entry] of cache) if(at<entry.at||at-entry.at>=60000) cache.delete(key);
        const cached=cache.get(key);
        if (cached?.fingerprint===signature) {
            if (cached.selection===null) return null;
            const selection=cached.selection;
            const hardware=new Map([...parsed.data.ownedHardware??[],...Object.values(record(parsed.data.equippedHardware))].map(value=>[record(value).id,value]));
            const software=new Map([...parsed.data.ownedSoftware??[],...parsed.data.equippedSoftware??[]].map(value=>[record(value).id,value]));
            const candidate=list(args[1]).find(value=>record(record(value).sw).id===selection.softwareId);
            return {...selection,software:software.get(selection.softwareId),candidate,spec:record(candidate).spec,hardware:Object.fromEntries(slots.map(slot=>[slot,hardware.get(selection.hardware[slot].id)]))};
        }
        const result=plan(...args),selection=selectionSchema.safeParse(result);
        if (result===null || selection.success) {
            // Cache ids and computed scalars, never whole inventory objects.
            cache.delete(key);cache.set(key,{at,fingerprint:signature,selection:selection.success?selection.data:null});
            while(cache.size>32)cache.delete(cache.keys().next().value!);
        }
        return result;
    };
}

const host=globalThis as typeof globalThis & { Cor3LoadoutAlgorithms?: Record<string, unknown> & { plan: Planner }; Cor3LoadoutPlanCacheFactory?: object; __cor3MasterGate?: { snapshot(): { generation?: unknown } } };
host.Cor3LoadoutPlanCacheFactory=Object.freeze({create});
const algorithms=host.Cor3LoadoutAlgorithms;
if(algorithms)host.Cor3LoadoutAlgorithms=Object.freeze({...algorithms,plan:create({plan:algorithms.plan,generation:()=>host.__cor3MasterGate?.snapshot().generation})});
