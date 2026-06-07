import { chunkText } from "./chunker.js";

export class RagStore {
  constructor({ chunkSize, chunkOverlap } = {}) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.documents = new Map();
    this.chunks = [];
  }

  addDocument({ id, title, text, metadata = {} }) {
    const documentId = id || `doc_${this.documents.size + 1}`;
    const chunks = chunkText(text, {
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap
    }).map((chunk, index) => ({
      ...chunk,
      id: `${documentId}:${index + 1}`,
      documentId,
      title: title || documentId,
      metadata,
      vector: vectorize(chunk.content)
    }));

    this.documents.set(documentId, {
      id: documentId,
      title: title || documentId,
      metadata,
      chunkCount: chunks.length
    });
    this.chunks = this.chunks.filter((chunk) => chunk.documentId !== documentId).concat(chunks);
    return this.documents.get(documentId);
  }

  retrieve(query, { topK = 4 } = {}) {
    const queryVector = vectorize(query);
    return this.chunks
      .map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(queryVector, chunk.vector)
      }))
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ vector, ...chunk }) => chunk);
  }

  listDocuments() {
    return [...this.documents.values()];
  }
}

function vectorize(text) {
  const vector = new Map();
  for (const token of tokenize(text)) {
    vector.set(token, (vector.get(token) || 0) + 1);
  }
  return vector;
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let aMag = 0;
  let bMag = 0;

  for (const value of a.values()) aMag += value * value;
  for (const value of b.values()) bMag += value * value;
  for (const [token, value] of a.entries()) dot += value * (b.get(token) || 0);

  if (!aMag || !bMag) return 0;
  return dot / (Math.sqrt(aMag) * Math.sqrt(bMag));
}
