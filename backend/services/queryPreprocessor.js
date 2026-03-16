/**
 * Query Preprocessor Service
 *
 * Expands queries with pharmaceutical synonyms for better FTS matching.
 * Also normalizes drug name variants and cleans queries.
 */

// Pharmaceutical synonym dictionary: lay term → medical terms
const PHARMA_SYNONYMS = {
  // Symptoms / Side effects
  'drowsy': ['somnolence', 'sedation', 'drowsiness'],
  'sleepy': ['somnolence', 'sedation', 'drowsiness'],
  'tired': ['fatigue', 'asthenia', 'lethargy'],
  'dizzy': ['dizziness', 'vertigo', 'lightheadedness'],
  'swelling': ['edema', 'oedema', 'peripheral edema'],
  'swollen': ['edema', 'oedema', 'peripheral edema'],
  'rash': ['dermatitis', 'urticaria', 'exanthema', 'skin eruption'],
  'itchy': ['pruritus', 'itching'],
  'itching': ['pruritus'],
  'nauseous': ['nausea', 'emesis'],
  'vomiting': ['emesis', 'vomiting'],
  'headache': ['cephalalgia', 'headache'],
  'stomach pain': ['abdominal pain', 'gastralgia', 'epigastric pain'],
  'belly pain': ['abdominal pain', 'gastralgia'],
  'heart racing': ['tachycardia', 'palpitations'],
  'fast heartbeat': ['tachycardia', 'palpitations'],
  'dry mouth': ['xerostomia', 'dry mouth'],
  'trouble breathing': ['dyspnea', 'breathlessness', 'bronchoconstriction'],
  'wheezing': ['bronchospasm', 'wheezing', 'bronchoconstriction'],
  'runny nose': ['rhinorrhea', 'nasal discharge'],
  'stuffy nose': ['nasal congestion', 'rhinitis'],
  'sneezing': ['sternutation', 'sneezing', 'rhinitis'],
  'watery eyes': ['lacrimation', 'conjunctivitis', 'epiphora'],
  'weight gain': ['weight increase', 'obesity'],
  'cant sleep': ['insomnia', 'sleeplessness'],
  'insomnia': ['insomnia', 'sleeplessness'],
  'depression': ['depression', 'depressed mood', 'neuropsychiatric'],
  'anxiety': ['anxiety', 'agitation', 'nervousness'],
  'suicidal': ['suicidal ideation', 'neuropsychiatric events'],
  'bleeding': ['hemorrhage', 'haemorrhage', 'bleeding'],
  'bruising': ['ecchymosis', 'bruising', 'purpura'],
  'liver damage': ['hepatotoxicity', 'elevated liver enzymes', 'hepatic impairment'],
  'kidney damage': ['nephrotoxicity', 'renal impairment'],
  'gum swelling': ['gingival hyperplasia'],
  'ankle swelling': ['peripheral edema', 'pedal edema'],
  'flushing': ['flushing', 'vasodilation'],

  // Conditions
  'allergy': ['allergic rhinitis', 'allergic', 'hypersensitivity'],
  'allergies': ['allergic rhinitis', 'urticaria', 'allergic'],
  'hives': ['urticaria', 'wheals'],
  'asthma': ['asthma', 'bronchoconstriction', 'bronchospasm'],
  'high blood pressure': ['hypertension', 'elevated blood pressure'],
  'bp': ['blood pressure', 'hypertension'],
  'chest pain': ['angina', 'angina pectoris'],
  'heart attack': ['myocardial infarction', 'MI', 'cardiovascular event'],
  'stroke': ['cerebrovascular accident', 'stroke', 'CVA'],
  'diabetes': ['diabetes mellitus', 'diabetic', 'glycemic'],

  // Drug actions
  'works': ['mechanism of action', 'pharmacodynamics', 'efficacy'],
  'how it works': ['mechanism of action', 'pharmacodynamics'],
  'safe': ['safety', 'adverse effects', 'contraindications', 'tolerability'],
  'side effects': ['adverse effects', 'adverse reactions', 'side effects', 'tolerability'],
  'interactions': ['drug interactions', 'contraindications', 'coadministration'],
  'dose': ['dosage', 'dose', 'administration', 'posology'],
  'dosage': ['dosage', 'dose', 'administration', 'posology'],
  'overdose': ['overdose', 'toxicity', 'supratherapeutic'],
  'pregnancy': ['pregnancy', 'lactation', 'teratogenic', 'gestational'],
  'children': ['pediatric', 'paediatric', 'children', 'adolescent'],
  'elderly': ['geriatric', 'elderly', 'older adults'],
  'clinical trial': ['clinical trial', 'study', 'randomized', 'double-blind'],
  'evidence': ['clinical trial', 'study', 'evidence', 'efficacy data'],
};

// Drug name normalizations
const DRUG_NORMALIZATIONS = {
  'derise10mg': 'derise 10mg',
  'derise20mg': 'derise 20mg',
  'derise50mg': 'derise 50mg',
  'rilast10mg': 'rilast 10mg',
  'bevaas5mg': 'bevaas 5mg',
  'bevaas10mg': 'bevaas 10mg',
  'bevaas20mg': 'bevaas 20mg',
};

/**
 * Preprocess a query for search
 *
 * Returns separate queries for FTS (synonym-expanded) and semantic search (cleaned).
 *
 * @param {string} query - Raw user query
 * @returns {{ ftsQuery: string, semanticQuery: string }}
 */
function preprocessQuery(query) {
  // Clean the query
  let cleaned = query.trim().toLowerCase();

  // Normalize drug name variants (e.g., "derise10mg" → "derise 10mg")
  for (const [variant, normalized] of Object.entries(DRUG_NORMALIZATIONS)) {
    cleaned = cleaned.replace(new RegExp(variant, 'gi'), normalized);
  }

  // Semantic query: just the cleaned version (embeddings handle synonyms)
  const semanticQuery = cleaned;

  // FTS query: expand with synonyms
  let expandedTerms = cleaned.split(/\s+/).filter(w => w.length > 2);

  // Check for multi-word synonym matches first
  const multiWordKeys = Object.keys(PHARMA_SYNONYMS)
    .filter(k => k.includes(' '))
    .sort((a, b) => b.length - a.length); // longest first

  for (const key of multiWordKeys) {
    if (cleaned.includes(key)) {
      expandedTerms.push(...PHARMA_SYNONYMS[key]);
    }
  }

  // Check single-word synonym matches
  const words = cleaned.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (PHARMA_SYNONYMS[cleanWord]) {
      expandedTerms.push(...PHARMA_SYNONYMS[cleanWord]);
    }
  }

  // Deduplicate
  const uniqueTerms = [...new Set(expandedTerms)];

  // Build FTS query string (terms joined for plainto_tsquery)
  const ftsQuery = uniqueTerms.join(' ');

  return { ftsQuery, semanticQuery };
}

module.exports = { preprocessQuery, PHARMA_SYNONYMS };
