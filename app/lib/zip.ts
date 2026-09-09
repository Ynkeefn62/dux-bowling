// Zippopotam.us is a free, keyless, HTTPS lookup. No account, no tracking, and
// we only ever send the five digits the visitor typed. City/state stay editable
// by hand if the lookup is unavailable.
export type ZipResult = { city: string; state: string } | null;

export async function lookupZip(zip: string): Promise<ZipResult> {
  if (!/^\d{5}$/.test(zip)) return null;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, { cache: 'force-cache' });
    if (!res.ok) return null;
    const data = (await res.json()) as { places?: { 'place name'?: string; 'state abbreviation'?: string }[] };
    const place = data.places?.[0];
    if (!place?.['place name'] || !place['state abbreviation']) return null;
    return { city: place['place name'], state: place['state abbreviation'] };
  } catch {
    return null;
  }
}
