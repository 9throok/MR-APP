/**
 * Document Chunker Service
 *
 * Splits knowledge base documents into smaller, section-aware chunks
 * with overlap for better RAG retrieval. Also extracts medicine/product tags.
 */

// Common pharmaceutical drug name patterns
const DRUG_NAME_PATTERNS = [
  // Brand names with strengths: "Derise 10mg", "Bevaas 5mg"
  /\b([A-Z][a-z]+(?:\s+\d+\s*(?:mg|mcg|ml|mL|g|IU)))\b/g,
  // Generic names (common suffixes): desloratadine, amlodipine, montelukast
  /\b([a-z]+(?:ine|ast|ole|pril|artan|statin|mab|nib|zole|pine|lukast|tadine))\b/gi,
];

// Therapeutic class keywords to tag
const THERAPEUTIC_CLASSES = [
  'antihistamine', 'calcium channel blocker', 'leukotriene receptor antagonist',
  'ace inhibitor', 'arb', 'beta blocker', 'statin', 'ppi', 'nsaid',
  'antihypertensive', 'bronchodilator', 'corticosteroid', 'antibiotic',
  'antidiabetic', 'anticoagulant', 'diuretic', 'antidepressant',
];

/**
 * Estimate token count from text (rough: ~1.3 tokens per word)
 */
function estimateTokens(text) {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);
}

/**
 * Extract section heading from a text block
 */
function extractSectionHeading(text) {
  const lines = text.trim().split('\n');
  const firstLine = lines[0].trim();

  // Markdown headings
  const mdMatch = firstLine.match(/^#{1,4}\s+(.+)/);
  if (mdMatch) return mdMatch[1].trim();

  // Underline-style headings (next line is === or ---)
  if (lines.length >= 2 && /^[=\-]{3,}$/.test(lines[1].trim())) {
    return firstLine;
  }

  // ALL CAPS section labels: "ADVERSE EFFECTS:", "DOSAGE AND ADMINISTRATION:"
  const capsMatch = firstLine.match(/^([A-Z][A-Z\s&]+[A-Z]):?\s*$/);
  if (capsMatch) return capsMatch[1].trim();

  // Label-style: "BRAND NAME: Derise"
  const labelMatch = firstLine.match(/^([A-Z][A-Z\s]+):/);
  if (labelMatch && labelMatch[1].length < 40) return labelMatch[1].trim();

  return null;
}

/**
 * Extract medicine/product tags from chunk content
 */
function extractTags(content, productName) {
  const tags = new Set();

  // Add product name if provided
  if (productName) {
    tags.add(productName.toLowerCase());
  }

  // Extract brand names with strengths
  const strengthPattern = /\b([A-Z][a-z]+)\s+(\d+\s*(?:mg|mcg|ml|mL|g|IU))\b/g;
  let match;
  while ((match = strengthPattern.exec(content)) !== null) {
    tags.add(`${match[1].toLowerCase()} ${match[2].toLowerCase()}`);
    tags.add(match[1].toLowerCase());
  }

  // Extract generic drug names
  const genericPattern = /\b([a-z]+(?:ine|ast|ole|pril|artan|statin|mab|nib|zole|pine|lukast|tadine))\b/gi;
  while ((match = genericPattern.exec(content)) !== null) {
    const name = match[1].toLowerCase();
    // Filter out common English words that match these patterns
    if (name.length > 4 && !['online', 'define', 'combine', 'decline', 'routine', 'machine', 'imagine', 'examine', 'amine'].includes(name)) {
      tags.add(name);
    }
  }

  // Extract therapeutic classes
  const lowerContent = content.toLowerCase();
  for (const cls of THERAPEUTIC_CLASSES) {
    if (lowerContent.includes(cls)) {
      tags.add(cls);
    }
  }

  // Extract formulation types
  const formulations = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'suspension'];
  for (const form of formulations) {
    if (lowerContent.includes(form)) {
      tags.add(form);
    }
  }

  return Array.from(tags);
}

/**
 * Split a document into section-aware chunks with overlap
 *
 * @param {string} content - Full document text
 * @param {Object} options
 * @param {number} options.maxTokens - Max tokens per chunk (default 300)
 * @param {number} options.overlapTokens - Token overlap between chunks (default 50)
 * @param {string} options.productName - Product name for tagging
 * @returns {Array<{content, chunkIndex, tokenCount, metadata, tags}>}
 */
function chunkDocument(content, { maxTokens = 300, overlapTokens = 50, productName = null } = {}) {
  if (!content || !content.trim()) return [];

  // Step 1: Split into sections by structural markers
  const sections = splitIntoSections(content);

  // Step 2: Split oversized sections into smaller chunks with overlap
  const chunks = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionTokens = estimateTokens(section.text);

    if (sectionTokens <= maxTokens) {
      // Section fits in one chunk
      const tags = extractTags(section.text, productName);
      chunks.push({
        content: section.text.trim(),
        chunkIndex: chunkIndex++,
        tokenCount: sectionTokens,
        metadata: { section: section.heading || null },
        tags,
      });
    } else {
      // Split large section into overlapping chunks
      const subChunks = splitWithOverlap(section.text, maxTokens, overlapTokens);
      for (const sub of subChunks) {
        const tags = extractTags(sub, productName);
        chunks.push({
          content: sub.trim(),
          chunkIndex: chunkIndex++,
          tokenCount: estimateTokens(sub),
          metadata: { section: section.heading || null },
          tags,
        });
      }
    }
  }

  return chunks;
}

/**
 * Split content into logical sections based on structural markers
 */
function splitIntoSections(content) {
  // Split on: markdown headings, underline headings, ALL CAPS labels, separators
  const sectionPattern = /(?:^|\n)(?=#{1,4}\s|[A-Z][A-Z\s&]{2,}[A-Z]:?\s*\n|[^\n]+\n[=\-]{3,}\n|---+\n)/;

  const rawSections = content.split(sectionPattern).filter(s => s.trim());

  if (rawSections.length === 0) {
    return [{ heading: null, text: content }];
  }

  return rawSections.map(section => ({
    heading: extractSectionHeading(section),
    text: section.trim(),
  }));
}

/**
 * Split text into overlapping chunks by sentence boundaries
 */
function splitWithOverlap(text, maxTokens, overlapTokens) {
  // Split into sentences
  const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
  const chunks = [];
  let currentChunk = [];
  let currentTokens = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;
    const sentenceTokens = estimateTokens(sentence);

    if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
      // Save current chunk
      chunks.push(currentChunk.join(' '));

      // Start new chunk with overlap from end of previous
      const overlapSentences = [];
      let overlapCount = 0;
      for (let j = currentChunk.length - 1; j >= 0 && overlapCount < overlapTokens; j--) {
        overlapSentences.unshift(currentChunk[j]);
        overlapCount += estimateTokens(currentChunk[j]);
      }
      currentChunk = overlapSentences;
      currentTokens = overlapCount;
    }

    currentChunk.push(sentence);
    currentTokens += sentenceTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

module.exports = { chunkDocument, extractTags, estimateTokens };
