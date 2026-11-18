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

type TemplateSeed = {
  slug: string;
  categorySlug: (typeof initialCatalogCategories)[number]["slug"];
  name: string;
  description: string;
  unit: string;
  minimumDeliverables: string;
  evidenceRequirements: string;
  /** Kroner excl. VAT: [min, suggested, max]. Illustrative pilot values, NOT final prices. */
  priceKroner: [number, number, number];
};

/**
 * Proposed pilot catalogue of platform-standard products (DECISIONS.md D-012).
 * Prices are illustrative, not contractual. Admins change them in
 * /admin/katalog; this list only fills an empty database.
 */
export const initialProductTemplates: TemplateSeed[] = [
  {
    slug: "social_post",
    categorySlug: "digital_exposure",
    name: "Opslag på sociale medier",
    description: "Et opslag på foreningens Facebook- eller Instagram-side, der præsenterer virksomheden.",
    unit: "opslag",
    minimumDeliverables:
      "Ét opslag med virksomhedens navn, logo eller billede og et link. Ligger mindst 30 dage.",
    evidenceRequirements: "Link til opslaget og skærmbillede af opslaget og dets visninger efter 7 dage.",
    priceKroner: [300, 750, 2500],
  },
  {
    slug: "newsletter_placement",
    categorySlug: "digital_exposure",
    name: "Placering i nyhedsbrev",
    description: "Omtale af virksomheden i foreningens nyhedsbrev til medlemmer.",
    unit: "udsendelse",
    minimumDeliverables: "Logo, kort tekst og link i én udsendelse.",
    evidenceRequirements: "Kopi af nyhedsbrevet og antal modtagere fra mailsystemet.",
    priceKroner: [300, 1000, 3000],
  },
  {
    slug: "website_logo",
    categorySlug: "digital_exposure",
    name: "Logo på hjemmeside",
    description:
      "Virksomhedens logo med link på foreningens hjemmeside under sponsorer eller samarbejdspartnere.",
    unit: "år",
    minimumDeliverables: "Logo med link i hele perioden.",
    evidenceRequirements: "Skærmbillede af siden ved start og slut af perioden.",
    priceKroner: [500, 1500, 5000],
  },
  {
    slug: "field_banner",
    categorySlug: "physical_exposure",
    name: "Banner ved banen eller i hallen",
    description: "Virksomhedens banner hænger synligt ved foreningens bane eller i hallen.",
    unit: "sæson",
    minimumDeliverables:
      "Banneret hænger i hele sæsonen. Virksomheden leverer banneret, medmindre andet aftales.",
    evidenceRequirements: "Foto af banneret på plads ved start og midt i sæsonen.",
    priceKroner: [1500, 4000, 15000],
  },
  {
    slug: "clubhouse_poster",
    categorySlug: "physical_exposure",
    name: "Plakat i klubhuset",
    description: "Plakat eller flyer på en synlig plads i klubhuset.",
    unit: "måned",
    minimumDeliverables: "Plakaten hænger synligt i hele måneden.",
    evidenceRequirements: "Foto af plakaten på plads.",
    priceKroner: [200, 500, 1500],
  },
  {
    slug: "member_competition",
    categorySlug: "member_activation",
    name: "Konkurrence for medlemmer",
    description: "Foreningen afholder en konkurrence blandt medlemmerne med en præmie fra virksomheden.",
    unit: "konkurrence",
    minimumDeliverables:
      "Konkurrencen annonceres i mindst én kanal og afgøres inden for den aftalte periode.",
    evidenceRequirements: "Link eller skærmbillede af annonceringen og antal deltagere.",
    priceKroner: [500, 1500, 5000],
  },
  {
    slug: "product_sampling",
    categorySlug: "member_activation",
    name: "Uddeling af smagsprøver eller vareprøver",
    description: "Virksomheden må dele prøver ud ved en træning, kamp eller et arrangement.",
    unit: "arrangement",
    minimumDeliverables:
      "Plads til en stand eller uddeling ved ét arrangement med medlemmer eller tilskuere.",
    evidenceRequirements: "Foto fra uddelingen og et skøn over antal fremmødte.",
    priceKroner: [500, 2000, 6000],
  },
  {
    slug: "member_discount_code",
    categorySlug: "member_offers",
    name: "Rabatkode til medlemmer",
    description: "Foreningen formidler et tilbud eller en rabatkode fra virksomheden til medlemmerne.",
    unit: "kampagne",
    minimumDeliverables: "Tilbuddet sendes ud i mindst én kanal til medlemmerne.",
    evidenceRequirements:
      "Skærmbillede eller kopi af udsendelsen. Virksomheden måler selv indløsning af koden.",
    priceKroner: [300, 1000, 3000],
  },
  {
    slug: "event_title_mention",
    categorySlug: "events",
    name: "Synlighed ved arrangement",
    description: "Virksomheden nævnes og er synlig ved et af foreningens arrangementer, f.eks. et stævne.",
    unit: "arrangement",
    minimumDeliverables: "Omtale i annonceringen af arrangementet og synligt logo eller banner på dagen.",
    evidenceRequirements: "Annonceringen og fotos fra dagen.",
    priceKroner: [1000, 3000, 20000],
  },
];

/** Advertiser industries for exclusions (data, admins can extend). */
export const initialIndustries = [
  { slug: "alcohol", name: "Alkohol" },
  { slug: "gambling", name: "Spil og betting" },
  { slug: "tobacco_nicotine", name: "Tobak og nikotin" },
  { slug: "energy_drinks", name: "Energidrikke" },
  { slug: "fast_food", name: "Fastfood" },
  { slug: "banking_finance", name: "Bank og finans" },
  { slug: "insurance", name: "Forsikring" },
  { slug: "real_estate", name: "Ejendomsmægler og bolig" },
  { slug: "automotive", name: "Biler og transport" },
  { slug: "supermarket", name: "Supermarked og dagligvarer" },
  { slug: "sports_retail", name: "Sportsudstyr" },
  { slug: "telecom", name: "Tele og internet" },
  { slug: "energy_utilities", name: "Energi og forsyning" },
  { slug: "crafts_construction", name: "Håndværk og byggeri" },
  { slug: "restaurants_cafes", name: "Restauranter og caféer" },
  { slug: "health_fitness", name: "Sundhed og fitness" },
  { slug: "politics", name: "Politiske partier og organisationer" },
] as const;
