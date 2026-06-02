import SlugifyLib from "slugify";

export function makeSlug(text: string): string {
  return SlugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export async function makeUniqueSlug(
  text: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = makeSlug(text);
  let slug = base;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}
