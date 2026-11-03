/**
 * Initial catalog categories from spec section 4. Loaded by the seed script
 * and safe to run repeatedly (upsert by slug). Editing names here does not
 * overwrite names an admin has changed in the database.
 */
export const initialCatalogCategories = [
  {
    slug: "digital_exposure",
    name: "Digital eksponering",
    description: "Opslag på sociale medier, placering i nyhedsbreve og synlighed på hjemmeside.",
  },
  {
    slug: "physical_exposure",
    name: "Fysisk eksponering",
    description: "Bannere, plakater og synlighed i klubhuset.",
  },
  {
    slug: "member_activation",
    name: "Medlemsaktivering",
    description: "Konkurrencer, smagsprøver og lokale aktiviteter.",
  },
  {
    slug: "member_offers",
    name: "Medlemstilbud og salg",
    description: "Rabatter, tilbud og koder til medlemmer.",
  },
  {
    slug: "events",
    name: "Events",
    description: "Turneringer, lokale arrangementer og aktiveringer.",
  },
  {
    slug: "bespoke_partnerships",
    name: "Skræddersyede partnerskaber",
    description: "Foreningsdefinerede produkter og særlige muligheder.",
  },
] as const;
