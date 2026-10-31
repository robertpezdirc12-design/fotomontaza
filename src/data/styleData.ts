/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface BudgetBreakdown {
  category: string;
  percentage: number;
  cost: string;
}

export interface BudgetEstimate {
  level: "€€" | "€€€" | "€€€€";
  range: string;
  breakdown: BudgetBreakdown[];
}

export interface RoomTypeConfig {
  id: 'living' | 'bedroom' | 'office' | 'dining';
  name: string;
  icon: string;
  subtitle: string;
  demoDescription: string;
  suggestedStyles: string[];
  defaultArea: number;
  typicalDimensions: { width: number; length: number; height: number };
}

export const ROOM_TYPES: RoomTypeConfig[] = [
  {
    id: 'living',
    name: 'Dnevna soba',
    icon: '🛋️',
    subtitle: 'Osrednji bivalni prostor za druženje in sprostitev',
    demoDescription: 'Prijetna dnevna soba s prostorom za zofo, klubsko mizo in naravno svetlobo.',
    suggestedStyles: ['japandi', 'midcentury', 'luxury', 'biophilic'],
    defaultArea: 24,
    typicalDimensions: { width: 4.8, length: 5.0, height: 2.7 }
  },
  {
    id: 'bedroom',
    name: 'Spalnica',
    icon: '🛏️',
    subtitle: 'Miren spalni ambient za regeneracijo in počitek',
    demoDescription: 'Umirjena spalnica s poudarkom na mehkih tekstilih in ambientalni osvetlitvi.',
    suggestedStyles: ['japandi', 'minimalist', 'bohemian', 'coastal'],
    defaultArea: 16,
    typicalDimensions: { width: 4.0, length: 4.0, height: 2.6 }
  },
  {
    id: 'office',
    name: 'Domača pisarna',
    icon: '💼',
    subtitle: 'Navdihujoč kotiček za osredotočenost in delo',
    demoDescription: 'Ergonomska delovna soba z urejenim prostorom in čistimi linijami.',
    suggestedStyles: ['industrial', 'minimalist', 'midcentury', 'biophilic'],
    defaultArea: 12,
    typicalDimensions: { width: 3.2, length: 3.8, height: 2.6 }
  },
  {
    id: 'dining',
    name: 'Jedilnica',
    icon: '🍽️',
    subtitle: 'Eleganten prostor za kulinarična doživetja',
    demoDescription: 'Odprta jedilnica z osrednjo mizo in usklajenimi stoli ter lestenjem.',
    suggestedStyles: ['luxury', 'farmhouse', 'artdeco', 'japandi'],
    defaultArea: 18,
    typicalDimensions: { width: 4.2, length: 4.3, height: 2.7 }
  }
];

export interface StyleConfig {
  id: string;
  name: string;
  description: string;
  prompt: string;
  palette: ColorSwatch[];
  materials: string[];
  lighting: string;
  furniture: string[];
  bestSuitedFor: string;
  budgetEstimate: BudgetEstimate;
  stylingTips: string[];
}

export const STYLE_CONFIGS: StyleConfig[] = [
  {
    id: "japandi",
    name: "Japandi",
    description: "Japandi minimalism blends serene Scandinavian functionality with Japanese rustic warmth to create peace.",
    prompt: "Interior design of a living room, Japandi style, earthy neutrals, low platform light wood furniture, zero clutter, minimalist ceramic decor, neutral palette",
    palette: [
      { name: "Hinoki Bamboo", hex: "#d6c4aa" },
      { name: "Oat Linen", hex: "#e6e0d4" },
      { name: "Serene Sage", hex: "#8a9486" },
      { name: "Wabi Charcoal", hex: "#3a3632" }
    ],
    materials: ["Svetel neobdelan hrast", "Grobo tkani lan", "Tatami bambusova preproga", "Keramika wabi-sabi"],
    lighting: "Topla difuzna svetloba 2700K z indirektnimi papirnatimi lampiončki Washi.",
    furniture: ["Nizka zofa s plinth podnožjem", "Nizka okrogla mizica", "Keramična vaza z vejo", "Podloga iz jute"],
    bestSuitedFor: "Miren dom, mestna stanovanja z naravno svetlobo, prostori za sprostitev in branje.",
    budgetEstimate: {
      level: "€€€",
      range: "1.800 € – 3.900 €",
      breakdown: [
        { category: "Nizko pohištvo iz hrasta", percentage: 45, cost: "1.200 €" },
        { category: "Laneni tekstil & preproga", percentage: 25, cost: "650 €" },
        { category: "Washi papirnata svetila", percentage: 15, cost: "400 €" },
        { category: "Wabi-sabi keramika & rastline", percentage: 15, cost: "350 €" }
      ]
    },
    stylingTips: [
      "Ohranite vsaj 40 % površin sten in tal povsem praznih za občutek zračnosti.",
      "Kombinirajte neobdelan svetel les s temnimi ogljenimi poudarki za globino.",
      "Vaze naj ne bodo polne šopkov – ena sama vejica bambusa ali evkaliptusa zadostuje."
    ]
  },
  {
    id: "industrial",
    name: "Industrial Modern",
    description: "Industrial Modern embraces raw architectural elements with charcoal tones and exposed brick for an urban edge.",
    prompt: "Interior design of a living room, Industrial Modern style, charcoal tones, exposed brick wall, distressed leather sofa, iron pipe detailing, large industrial windows",
    palette: [
      { name: "Cast Iron", hex: "#1f2226" },
      { name: "Distressed Saddle", hex: "#5a3d28" },
      { name: "Raw Concrete", hex: "#636971" },
      { name: "Exposed Brick", hex: "#9e472a" }
    ],
    materials: ["Surovo jeklo in lito železo", "Starano usnje z patino", "Opečna stena", "Brušen industrijski beton"],
    lighting: "Usmerjeni kovinski reflektorji in tople Edison žarnice z vidno nitko.",
    furniture: ["Chesterfield usnjena zofa", "Kavna miza na industrijskih kolesih", "Odprt kovinski regal", "Talna svetilka s črnim lokom"],
    bestSuitedFor: "Podstrešna loft stanovanja, visoki stropi, odprti bivalni prostori z vidnimi inštalacijami.",
    budgetEstimate: {
      level: "€€€",
      range: "2.200 € – 4.500 €",
      breakdown: [
        { category: "Usnjeno oblazinjeno pohištvo", percentage: 40, cost: "1.400 €" },
        { category: "Kovinski regali & mize", percentage: 25, cost: "850 €" },
        { category: "Industrijska svetila & Edison", percentage: 20, cost: "700 €" },
        { category: "Opečne obloge / betonski omet", percentage: 15, cost: "550 €" }
      ]
    },
    stylingTips: [
      "Pustite vidne kovinske spoje, vijake in cevi za avtentičen industrijski pridih.",
      "Mehčajte trdoto betona in kovine z vintage usnjem in preprogami z geometričnim vzorcem.",
      "Uporabite tople žarnice (2200K–2500K), da prostor ne deluje preveč hladno."
    ]
  },
  {
    id: "midcentury",
    name: "Mid-Century Modern",
    description: "Mid-Century Modern pairs warm retro aesthetics with sleek lines, peg legs, and vibrant autumnal accent colors.",
    prompt: "Interior design of a living room, Mid-Century Modern style, tapered peg legs on furniture, rich walnut wood finishes, mustard yellow and burnt orange accents",
    palette: [
      { name: "American Walnut", hex: "#5c381e" },
      { name: "Mustard Gold", hex: "#d9b352" },
      { name: "Burnt Orange", hex: "#c97a3e" },
      { name: "Retro Avocado", hex: "#245242" }
    ],
    materials: ["Ameriški orehov les", "Boucle in tweed tkanine", "Spunjena medenina", "Mat keramika"],
    lighting: "Ikonični medeninasti lestenci Sputnik in obločne talne svetilke s senčnikom.",
    furniture: ["Zofa z zaobljenimi peg nogicami", "Nizka lesena komoda", "Retro fotelj s pletenino", "Geometrična preproga"],
    bestSuitedFor: "Ljubitelje brezčasnega retro dizajna, bivalne prostore srednje velikosti, tople družinske sobe.",
    budgetEstimate: {
      level: "€€€",
      range: "2.100 € – 4.200 €",
      breakdown: [
        { category: "Orehova komoda & pohištvo", percentage: 45, cost: "1.350 €" },
        { category: "Oblazinjen fotelj & zofa", percentage: 30, cost: "950 €" },
        { category: "Retro svetila & lestenci", percentage: 15, cost: "450 €" },
        { category: "Dekorativne barvne blazine", percentage: 10, cost: "300 €" }
      ]
    },
    stylingTips: [
      "Izberite pohištvo s poševnimi vitkimi nogami (peg legs), ki dvignejo volumen od tal.",
      "Uporabite gorčično rumeno ali terakota barvo kot kontrast k temnemu orehu.",
      "Dodajte stensko uro v sončni obliki ali geometrično grafiko iz 60. let."
    ]
  },
  {
    id: "biophilic",
    name: "Biophilic",
    description: "Biophilic design brings the outdoors inside, layering abundant plant life with natural rattan and cream fabrics.",
    prompt: "Interior design of a living room, Biophilic Urban Jungle style, abundant indoor green plants, hanging vines, rattan accents, plush cream fabrics, natural sunlight",
    palette: [
      { name: "Leaf Chlorophyll", hex: "#2d5a37" },
      { name: "Natural Ash", hex: "#b59e7f" },
      { name: "Terracotta Clay", hex: "#b85d38" },
      { name: "Sunlit Cream", hex: "#eae6dc" }
    ],
    materials: ["Pleten ratan in bambus", "Glazirana terakota", "Naravni bombaž in konoplja", "Masiven svetel les"],
    lighting: "Maksimalna naravna sončna svetloba z zračnimi prosojnimi zavesami in toplo ambientalno osvetlitvijo rastlin.",
    furniture: ["Zofa iz svetlega lana", "Ratan viseči stol", "Lonci za rastline iz terakote", "Mizica iz naravnega lesa"],
    bestSuitedFor: "Prostore z veliko naravne svetlobe, ljubitelje narave in rastlin, zmanjševanje stresa.",
    budgetEstimate: {
      level: "€€",
      range: "1.200 € – 2.800 €",
      breakdown: [
        { category: "Sobne rastline & lonci", percentage: 35, cost: "750 €" },
        { category: "Pleteno pohištvo iz ratana", percentage: 35, cost: "750 €" },
        { category: "Tekstil iz jute & bombaža", percentage: 15, cost: "350 €" },
        { category: "Rastlinske luči & nega", percentage: 15, cost: "300 €" }
      ]
    },
    stylingTips: [
      "Postavite rastline v več nivojih: talne palme (Monstera, Ficus), viseče lonce in police.",
      "Uporabljajte zračne naravne zavese, ki prepuščajo filtrirano sončno svetlobo.",
      "Združite terakota glinene lonce različnih velikosti za organsko razgibanost."
    ]
  },
  {
    id: "luxury",
    name: "Luxury Contemporary",
    description: "Luxury Contemporary exudes opulence through rich boucle textures, polished marble tables, and refined brass hardware.",
    prompt: "Interior design of a living room, Luxury Contemporary style, plush boucle textures, elegant polished marble coffee table, gold and brass hardware accents, sophisticated lighting",
    palette: [
      { name: "Carrara Marble", hex: "#f5f3ee" },
      { name: "24k Polished Brass", hex: "#dfb76c" },
      { name: "Midnight Navy", hex: "#1c2b36" },
      { name: "Ebony Piano", hex: "#1b1b1f" }
    ],
    materials: ["Poliran Carrara marmor", "Plišast boucle in žamet", "Brušena medenina v zlatih tonih", "Tonirano steklo"],
    lighting: "Skriti LED svetlobni trakovi, arhitekturne stropne vgradne luči in kristalni lestenec.",
    furniture: ["Kraljeva boucle zofa z zlatimi nogami", "Marmorna kavna miza z medeninastim robom", "Žametni tabure", "Svilena preproga"],
    bestSuitedFor: "Prestižna stanovanja, reprezentativne dnevne sobe, večerne sprejeme.",
    budgetEstimate: {
      level: "€€€€",
      range: "3.500 € – 8.500 €",
      breakdown: [
        { category: "Marmorne mize & konzole", percentage: 40, cost: "2.400 €" },
        { category: "Boucle zofa po meri", percentage: 35, cost: "2.100 €" },
        { category: "Medeninasta arhitekturna svetila", percentage: 15, cost: "900 €" },
        { category: "Svilene preproge & žamet", percentage: 10, cost: "600 €" }
      ]
    },
    stylingTips: [
      "Vključite vsaj en monumentalen kos iz naravnega belega marmorja (Carrara ali Calacatta).",
      "Medeninaste poudarke ohranite v enotnem tonu (satenasto ali polirano zlato).",
      "Uporabite indirektno linijsko LED svetlobo za poudarek arhitekturnih linij."
    ]
  },
  {
    id: "bohemian",
    name: "Bohemian Chic",
    description: "Bohemian Chic layers eclectic patterns, vintage rugs, and macrame accents for a free-spirited, relaxed aesthetic.",
    prompt: "Interior design of a living room, Bohemian Chic style, eclectic patterns, vintage rugs, macrame wall hangings, warm earthy tones, lots of textures, relaxed vibe",
    palette: [
      { name: "Desert Ochre", hex: "#d69938" },
      { name: "Warm Terracotta", hex: "#b85d38" },
      { name: "Sunset Crimson", hex: "#96432b" },
      { name: "Bleached Macrame", hex: "#f0e3d0" }
    ],
    materials: ["Ročno tkane kilim preproge", "Makrame vrvice", "Rabljen tikov les", "Brušena medenina"],
    lighting: "Mehka topla svetloba z orientalskimi visečimi lampiončki in dišečimi svečami.",
    furniture: ["Nizka sproščena sedežna garnitura", "Maroški puf iz usnja", "Tkani makrame stenski okraski", "Plasti vintage preprog"],
    bestSuitedFor: "Ustvarjalce, boeme, sproščena družinska druženja, tople barvite prostore.",
    budgetEstimate: {
      level: "€€",
      range: "1.100 € – 2.500 €",
      breakdown: [
        { category: "Prekrivanje vintage preprog", percentage: 35, cost: "650 €" },
        { category: "Usnjeni pufi & blazine", percentage: 30, cost: "550 €" },
        { category: "Stenski makrame & dekor", percentage: 20, cost: "380 €" },
        { category: "Viseči lampiončki & sveče", percentage: 15, cost: "280 €" }
      ]
    },
    stylingTips: [
      "Brez strahu prekrijte 2 ali 3 različne preproge eno čez drugo pod kotom.",
      "Zmešajte različne vzorce, dokler delijo skupno zemeljsko barvno paleto.",
      "Vključite naravne spominke s potovanj in vintage keramične posode."
    ]
  },
  {
    id: "minimalist",
    name: "Pure Minimalist",
    description: "Pure Minimalist focuses on the essentials with clean white walls, hidden storage, and singular statement pieces.",
    prompt: "Interior design of a living room, Pure Minimalist style, clean white walls, hidden storage, singular statement furniture pieces, monotone palette, ample negative space",
    palette: [
      { name: "Chalk White", hex: "#f7f8fa" },
      { name: "Architectural Grey", hex: "#d9d9d9" },
      { name: "Brushed Steel", hex: "#757575" },
      { name: "Matte Black", hex: "#141416" }
    ],
    materials: ["Snežno beli mat premazi", "Monolitni kremen", "Brušen aluminij", "Brezšivni vgradni paneli"],
    lighting: "Nevidna indirektna svetloba in minimalistični arhitekturni linearni svetlobni profili.",
    furniture: ["Monolitna bela zofa z ostrimi linijami", "Lebdeča nizka polica", "Minimalistična črna mizica", "Enojna monokromatska umetnina"],
    bestSuitedFor: "Mentalno jasnost, umirjen življenjski slog brez nereda, sodobne novogradnje.",
    budgetEstimate: {
      level: "€€€",
      range: "2.400 € – 5.200 €",
      breakdown: [
        { category: "Skrite vgradne omare brez ročajev", percentage: 50, cost: "1.900 €" },
        { category: "Monolitna zofa z ostrimi linijami", percentage: 30, cost: "1.150 €" },
        { category: "Linearna arhitekturna svetila", percentage: 15, cost: "550 €" },
        { category: "Enojna velika minimalistična umetnina", percentage: 5, cost: "200 €" }
      ]
    },
    stylingTips: [
      "Vse kable, elektroniko in drobnarije pospravite za ravne gladke panele brez ročajev (push-to-open).",
      "Vsak kos pohištva naj bo skrbno izbran monolit – kvaliteta pred kvantiteto.",
      "Igrajte se s teksturo belih materialov (mat, saten, hrapav omet), da prostor ne deluje sterilen."
    ]
  },
  {
    id: "coastal",
    name: "Modern Coastal",
    description: "Modern Coastal blends breezy light blues, whitewashed driftwood, and natural linen for a relaxed beachside feel.",
    prompt: "Interior design of a living room, Modern Coastal style, breezy light blues, whitewashed driftwood furniture, natural linen fabrics, airy and bright, beachside atmosphere",
    palette: [
      { name: "Oceanic Cyan", hex: "#4d8ba6" },
      { name: "Driftwood Sand", hex: "#c8beb2" },
      { name: "Sea Salt Blue", hex: "#dde7ec" },
      { name: "Crisp Shore White", hex: "#f0f5f7" }
    ],
    materials: ["Beljen les in naplavine", "Zračen nebeljen lan", "Sisal in morska trava", "Pihano prozorno steklo"],
    lighting: "Zračna naravna svetloba, obogatena z visečimi svetili iz vrvi ali bele pletenine.",
    furniture: ["Zofa v peščeni barvi z mehkimi prevlekami", "Miza iz beljenega hrasta", "Pletena košara iz jute", "Prosojne lahkotne zavese"],
    bestSuitedFor: "Poletne rezidence, obmorska stanovanja, svetle prostore, kjer želite svežino morja.",
    budgetEstimate: {
      level: "€€",
      range: "1.500 € – 3.200 €",
      breakdown: [
        { category: "Lanena zofa s snemljivo prevleko", percentage: 40, cost: "950 €" },
        { category: "Pohištvo iz beljenega lesa", percentage: 30, cost: "700 €" },
        { category: "Preproga iz morske trave/sisala", percentage: 15, cost: "350 €" },
        { category: "Pletena svetila & steklene vaze", percentage: 15, cost: "350 €" }
      ]
    },
    stylingTips: [
      "Izogibajte se pretiranim mornarskim klišejem (sidra, rešilni obroči); namesto tega stavite na naravne teksture peska in morja.",
      "Zavese naj bodo dolge do tal in lahkotne, da se nežno premikajo ob vetru.",
      "Uporabite steklene steklenice in vaze v modrikastih in prosojnih tonih morja."
    ]
  },
  {
    id: "artdeco",
    name: "Art Deco",
    description: "Art Deco brings glamorous symmetry to life with geometric patterns, velvet seating, and bold jewel tones.",
    prompt: "Interior design of a living room, Art Deco style, geometric patterns, velvet seating, bold jewel tones, mirrored surfaces, glamorous metallic accents",
    palette: [
      { name: "Emerald Velvet", hex: "#1a3d36" },
      { name: "Polished Gold", hex: "#e5c158" },
      { name: "Ruby Wine", hex: "#91253b" },
      { name: "Piano Black", hex: "#141418" }
    ],
    materials: ["Bogat smaragdni žamet", "Polirana medenina z visokim leskom", "Fasetirana ogledala", "Eksotični intarzirani furnir"],
    lighting: "Geometrična stenska svetila v obliki sončnega vzhoda (Sunburst) in večnivojski lestenci.",
    furniture: ["Zaobljena školjkasta žametna zofa", "Zrcalna geometrična mizica", "Medeninasti konzolni pult", "Geometrična preproga"],
    bestSuitedFor: "Salonska meščanska stanovanja, dramatične večerne ambiente, ljubitelje glamurja 1920-ih.",
    budgetEstimate: {
      level: "€€€€",
      range: "2.800 € – 6.500 €",
      breakdown: [
        { category: "Žametno zaobljeno pohištvo", percentage: 45, cost: "1.900 €" },
        { category: "Polirana medenina & ogledala", percentage: 25, cost: "1.050 €" },
        { category: "Lestenec Sunburst & svetila", percentage: 20, cost: "850 €" },
        { category: "Geometrične zlate preproge", percentage: 10, cost: "400 €" }
      ]
    },
    stylingTips: [
      "Simetrija je ključna: par enakih svetil ali konzolnih miz ustvari avtentičen red Art Deco obdobja.",
      "Uporabite bogate žametne tkanine v safirnih, rubinastih ali smaragdnih tonih.",
      "Vključite fasetirano ogledalo z medeninastim geometrijskim okvirjem nad kamin ali konzolo."
    ]
  },
  {
    id: "farmhouse",
    name: "Modern Farmhouse",
    description: "Modern Farmhouse pairs rustic shiplap walls and reclaimed woods with sleek black iron fixtures for a cozy appeal.",
    prompt: "Interior design of a living room, Modern Farmhouse style, rustic shiplap walls, reclaimed wood furniture, sleek black iron fixtures, cozy and inviting, neutral tones",
    palette: [
      { name: "Weathered Barnwood", hex: "#8a6f53" },
      { name: "Shiplap White", hex: "#eeebe3" },
      { name: "Forged Iron", hex: "#1d1e20" },
      { name: "Slate Blue Accent", hex: "#485863" }
    ],
    materials: ["Recikliran tramov les", "Kovano črno železo", "Grobo bombažno platno", "Keramične ploščice v subway vzorcu"],
    lighting: "Lestenci v obliki kolesa voza z Edison žarnicami in črne kovinske svetilke.",
    furniture: ["Udobna zofa z bombažno prevleko", "Rustikalna miza iz masivnega hrasta", "Odprte lesene police na črnih nosilcih", "Pletena preproga"],
    bestSuitedFor: "Družinske hiše, podeželske počitniške objekte, tople in gostoljubne skupne prostore.",
    budgetEstimate: {
      level: "€€",
      range: "1.600 € – 3.400 €",
      breakdown: [
        { category: "Masivna rustikalna lesena miza", percentage: 40, cost: "1.000 €" },
        { category: "Udobna bombažna sedežna garnitura", percentage: 35, cost: "880 €" },
        { category: "Kovani črni lestenci & okovje", percentage: 15, cost: "380 €" },
        { category: "Belo leseno opaženje (shiplap)", percentage: 10, cost: "250 €" }
      ]
    },
    stylingTips: [
      "Kombinirajte rustikalen surov les s čistimi mat črnimi kovinskimi nosilci za sodoben kontrast.",
      "Uporabite praktične pralne bombažne prevleke v kremasto beli ali sivi barvi.",
      "Vključite keramične lonce z rožmarinom ali sivko za nežen vonj in toplino doma."
    ]
  }
];
