/**
 * Compute dot product of two numeric arrays
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
const dot = (a, b) => {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) sum += a[i] * b[i];
  return sum;
};

/**
 * Compute vector magnitude (L2 norm)
 * @param {number[]} v
 * @returns {number}
 */
const magnitude = (v) => Math.sqrt(dot(v, v));

/**
 * Compute cosine similarity between two vectors in [ -1, 1 ]
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
const cosineSimilarity = (a, b) => {
  const denom = magnitude(a) * magnitude(b);
  if (!denom) return 0;
  return dot(a, b) / denom;
};

/**
 * Rank documents by cosine similarity to the query vector
 * @param {{ embedding: number[] }[]} docs
 * @param {number[]} queryVector
 * @param {number} topK
 * @returns {Array<{ doc: any, score: number }>} sorted by descending score
 */
const rankByCosineSimilarity = (docs, queryVector, topK = 5) => {
  const scored = docs.map((doc) => ({
    doc,
    score: cosineSimilarity(queryVector, doc.embedding || []),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(1, topK));
};

module.exports = {
  dot,
  magnitude,
  cosineSimilarity,
  rankByCosineSimilarity,
};


