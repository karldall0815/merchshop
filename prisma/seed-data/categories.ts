export type AttributeType =
  | "text" | "longtext" | "url"
  | "number" | "date" | "boolean"
  | "select" | "multiselect";

export interface AttributeOption { value: string; label: string; }

export interface AttributeSchemaItem {
  key: string;
  label: string;
  type: AttributeType;
  required?: boolean;
  helpText?: string;
  sortOrder: number;
  options?: AttributeOption[];
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
}

export interface VariantTemplate {
  axisName: string;
  defaults: string[];
}

export interface BuiltinCategoryDef {
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
  attributeSchema: AttributeSchemaItem[];
  variantTemplate: VariantTemplate | null;
}

const cutOptions: AttributeOption[] = [
  { value: "unisex", label: "Unisex" },
  { value: "damen", label: "Damen" },
  { value: "herren", label: "Herren" },
  { value: "kids", label: "Kids" },
];

const allergenOptions: AttributeOption[] = [
  { value: "gluten",      label: "Gluten"     },
  { value: "milk",        label: "Milch"      },
  { value: "egg",         label: "Ei"         },
  { value: "nuts",        label: "Nüsse"      },
  { value: "soy",         label: "Soja"       },
  { value: "sesame",      label: "Sesam"      },
  { value: "celery",      label: "Sellerie"   },
  { value: "mustard",     label: "Senf"       },
  { value: "fish",        label: "Fisch"      },
  { value: "crustaceans", label: "Krebstiere" },
  { value: "lupines",     label: "Lupinen"    },
  { value: "sulfites",    label: "Sulfite"    },
  { value: "peanuts",     label: "Erdnüsse"   },
  { value: "mollusks",    label: "Weichtiere" },
];

const writingMaterialOptions: AttributeOption[] = [
  { value: "plastic", label: "Plastik" },
  { value: "metal",   label: "Metall"  },
  { value: "wood",    label: "Holz"    },
  { value: "recycled",label: "Recyclat"},
];

const bottleMaterialOptions: AttributeOption[] = [
  { value: "ceramic",  label: "Keramik"    },
  { value: "stainless",label: "Edelstahl"  },
  { value: "glass",    label: "Glas"       },
  { value: "plastic",  label: "Kunststoff" },
];

const connectorOptions: AttributeOption[] = [
  { value: "usb-a",     label: "USB-A"     },
  { value: "usb-c",     label: "USB-C"     },
  { value: "lightning", label: "Lightning" },
  { value: "bluetooth", label: "Bluetooth" },
];

const carrySystemOptions: AttributeOption[] = [
  { value: "shoulder",label: "Schulter"    },
  { value: "back",    label: "Rücken"      },
  { value: "handle",  label: "Tragegriff"  },
  { value: "multi",   label: "Multi"       },
];

const formatOptions: AttributeOption[] = [
  { value: "a4",      label: "A4"        },
  { value: "a5",      label: "A5"        },
  { value: "a6",      label: "A6"        },
  { value: "din-long",label: "DIN-Lang"  },
  { value: "square",  label: "Quadrat"   },
  { value: "custom",  label: "Sonder"    },
];

const seasonOptions: AttributeOption[] = [
  { value: "spring",label: "Frühjahr" },
  { value: "summer",label: "Sommer"   },
  { value: "autumn",label: "Herbst"   },
  { value: "winter",label: "Winter"   },
];

export const BUILTIN_CATEGORIES: BuiltinCategoryDef[] = [
  {
    slug: "kleidung", name: "Kleidung", sortOrder: 10,
    attributeSchema: [
      { key: "material",      label: "Material",       type: "text",     sortOrder: 10 },
      { key: "cut",           label: "Schnitt",        type: "select",   sortOrder: 20, options: cutOptions },
      { key: "care",          label: "Waschpflege",    type: "longtext", sortOrder: 30 },
      { key: "printPosition", label: "Druck-Position", type: "text",     sortOrder: 40 },
    ],
    variantTemplate: { axisName: "Größe", defaults: ["S","M","L","XL","XXL","XXXL"] },
  },
  {
    slug: "lebensmittel", name: "Lebensmittel", sortOrder: 20,
    attributeSchema: [
      { key: "mhd",       label: "MHD/Verfallsdatum", type: "date",    sortOrder: 10 },
      { key: "packSize",  label: "Verpackungseinheit",type: "number",  sortOrder: 20, min: 1 },
      { key: "allergens", label: "Allergene",         type: "multiselect", sortOrder: 30, options: allergenOptions },
      { key: "bio",       label: "Bio",               type: "boolean", sortOrder: 40 },
      { key: "fairTrade", label: "Fair-Trade",        type: "boolean", sortOrder: 50 },
      { key: "lotNumber", label: "Chargen-Nr.",       type: "text",    sortOrder: 60, maxLength: 60 },
    ],
    variantTemplate: null,
  },
  {
    slug: "schreibwaren", name: "Schreibwaren", sortOrder: 30,
    attributeSchema: [
      { key: "material",   label: "Material",        type: "select", sortOrder: 10, options: writingMaterialOptions },
      { key: "refillCode", label: "Mine-Refill-Code",type: "text",   sortOrder: 20 },
      { key: "engraving",  label: "Gravur",          type: "boolean",sortOrder: 30 },
    ],
    variantTemplate: { axisName: "Farbe", defaults: [] },
  },
  {
    slug: "trinkflaschen-tassen", name: "Trinkflaschen & Tassen", sortOrder: 40,
    attributeSchema: [
      { key: "volumeMl",   label: "Volumen (ml)", type: "number",  sortOrder: 10, min: 1 },
      { key: "material",   label: "Material",     type: "select",  sortOrder: 20, options: bottleMaterialOptions },
      { key: "dishwasher", label: "Spülmaschine", type: "boolean", sortOrder: 30 },
      { key: "bpaFree",    label: "BPA-frei",     type: "boolean", sortOrder: 40 },
      { key: "printMethod",label: "Druckverfahren",type: "text",   sortOrder: 50 },
    ],
    variantTemplate: null,
  },
  {
    slug: "tech", name: "Tech & Elektronik", sortOrder: 50,
    attributeSchema: [
      { key: "capacityGb",   label: "Kapazität (GB)",type: "number",  sortOrder: 10 },
      { key: "batteryMah",   label: "Akku (mAh)",    type: "number",  sortOrder: 20 },
      { key: "connector",    label: "Anschluss",     type: "select",  sortOrder: 30, options: connectorOptions },
      { key: "ceCompliant",  label: "CE-konform",    type: "boolean", sortOrder: 40 },
      { key: "datasheet",    label: "Datenblatt",    type: "url",     sortOrder: 50 },
    ],
    variantTemplate: null,
  },
  {
    slug: "taschen", name: "Taschen", sortOrder: 60,
    attributeSchema: [
      { key: "volumeLiters", label: "Volumen (l)",  type: "number", sortOrder: 10 },
      { key: "dimensions",   label: "Maße (L×B×H)", type: "text",   sortOrder: 20 },
      { key: "material",     label: "Material",     type: "text",   sortOrder: 30 },
      { key: "carrySystem",  label: "Tragesystem",  type: "select", sortOrder: 40, options: carrySystemOptions },
    ],
    variantTemplate: null,
  },
  {
    slug: "drucksachen", name: "Drucksachen", sortOrder: 70,
    attributeSchema: [
      { key: "format",   label: "Format",     type: "select", sortOrder: 10, options: formatOptions },
      { key: "pageCount",label: "Seitenzahl", type: "number", sortOrder: 20, min: 1 },
      { key: "printRun", label: "Auflage",    type: "number", sortOrder: 30, min: 1 },
      { key: "year",     label: "Jahrgang",   type: "number", sortOrder: 40 },
    ],
    variantTemplate: null,
  },
  {
    slug: "werbeartikel", name: "Werbeartikel & Sonstiges", sortOrder: 80,
    attributeSchema: [
      { key: "material",        label: "Material",         type: "text", sortOrder: 10 },
      { key: "dimensions",      label: "Maße",             type: "text", sortOrder: 20 },
      { key: "brandingPosition",label: "Branding-Position",type: "text", sortOrder: 30 },
    ],
    variantTemplate: null,
  },
  {
    slug: "saisonal", name: "Saisonal/Event", sortOrder: 90,
    attributeSchema: [
      { key: "season",        label: "Saison",         type: "select", sortOrder: 10, options: seasonOptions },
      { key: "event",         label: "Event",          type: "text",   sortOrder: 20 },
      { key: "availableFrom", label: "Verfügbar von",  type: "date",   sortOrder: 30 },
      { key: "availableTo",   label: "Verfügbar bis",  type: "date",   sortOrder: 40 },
    ],
    variantTemplate: null,
  },
  {
    slug: "frei", name: "Frei (keine Vorgaben)", sortOrder: 100,
    attributeSchema: [],
    variantTemplate: null,
  },
];
