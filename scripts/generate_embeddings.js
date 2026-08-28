/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const masterPath = path.join(__dirname, '../data/processed/master_universities.json');
const outputPath = path.join(__dirname, '../data/processed/university_embeddings.json');

const masterContents = fs.readFileSync(masterPath, 'utf8');
const universities = JSON.parse(masterContents);
const sourceHash = crypto.createHash('sha256').update(masterContents).digest('hex');

function usableScholarshipText(value) {
  const text = String(value || '').trim();
  if (!text || /availability and coverage must be verified/i.test(text)) return '';
  return text;
}

// Tokenize text into lowercased n-grams and terms
function tokenize(text) {
  if (!text) return [];
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = cleaned.split(' ').filter(w => w.length > 1);
  const grams = [];
  
  // Add unigrams & bigrams
  for (let i = 0; i < words.length; i++) {
    grams.push(words[i]);
    if (i < words.length - 1) {
      grams.push(`${words[i]}_${words[i + 1]}`);
    }
  }
  return grams;
}

// Build Corpus & Compute IDF
const documentTerms = [];
const docFreq = {};
const N = universities.length;

universities.forEach(uni => {
  const textChunk = [
    uni.name,
    uni.name_urdu || '',
    uni.city,
    uni.province,
    uni.type,
    uni.category,
    uni.chartered_by || '',
    `fee_${uni.fee_range_max}`,
    uni.has_hec_scholarship ? 'hec_scholarship hec_need_based free_education full_tuition' : '',
    uni.has_usaid_scholarship ? 'usaid_scholarship mnesdays mnbsp' : '',
    (uni.scholarship_programs || []).join(' '),
    usableScholarshipText(uni.scholarship_details),
    (uni.programs || []).map(p => `program_${p.toLowerCase().replace(/\s+/g, '_')} ${p}`).join(' '),
    uni.campuses || ''
  ].join(' ');

  const tokens = tokenize(textChunk);
  const uniqueTokens = new Set(tokens);
  
  uniqueTokens.forEach(token => {
    docFreq[token] = (docFreq[token] || 0) + 1;
  });

  documentTerms.push({
    id: uni.id,
    tokens: tokens,
    textChunk: textChunk
  });
});

// Compute TF-IDF vectors
const idf = {};
Object.keys(docFreq).forEach(term => {
  idf[term] = Math.log(1 + (N / docFreq[term]));
});

const vectorizedIndex = documentTerms.map(doc => {
  const tf = {};
  doc.tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });

  const vector = {};
  let magnitudeSq = 0;

  Object.keys(tf).forEach(term => {
    const weight = tf[term] * idf[term];
    vector[term] = parseFloat(weight.toFixed(4));
    magnitudeSq += weight * weight;
  });

  return {
    id: doc.id,
    vector: vector,
    norm: parseFloat(Math.sqrt(magnitudeSq).toFixed(4)),
    chunkSnippet: doc.textChunk.substring(0, 300)
  };
});

const outputData = {
  version: "1.0",
  generatedAt: new Date().toISOString(),
  sourceHash,
  totalDocuments: N,
  idf: idf,
  vectorizedIndex: vectorizedIndex
};

fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
console.log(`Successfully generated vector index for ${N} universities at ${outputPath}`);
