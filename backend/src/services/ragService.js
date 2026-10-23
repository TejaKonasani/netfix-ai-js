import { geminiService } from "./geminiService.js";
import { supabaseService } from "./supabaseService.js";
class RagService {
  /**
   * Generates and stores embedding vectors for all documents in legal_knowledge_docs corpus
   */
  async indexKnowledgeBase() {
    const docs = await supabaseService.searchKnowledgeDocs("", "all");
    let count = 0;
    for (const doc of docs) {
      if (!doc.embedding_vector) {
        const textToEmbed = `${doc.title}
${doc.source_text}`;
        const vector = await geminiService.generateEmbedding(textToEmbed);
        doc.embedding_vector = JSON.stringify(vector);
        count++;
      }
    }
    return count;
  }
  /**
   * Searches knowledge corpus using Gemini RAG embedding cosine similarity ranking + RBAC scoping
   */
  async searchSimilarDocs(query, options = {}) {
    if (!query || query.trim() === "") {
      return [];
    }
    const { topK = 3, category, userRole } = options;
    let candidateDocs = await supabaseService.searchKnowledgeDocs("", category || "all", userRole);
    if (userRole === "client" || userRole === "tenant") {
      candidateDocs = candidateDocs.filter((d) => {
        if (d.is_restricted) return false;
        if (d.allowed_roles && Array.isArray(d.allowed_roles)) {
          return d.allowed_roles.includes(userRole);
        }
        return true;
      });
    }
    if (candidateDocs.length === 0) {
      return [];
    }
    const queryVector = await geminiService.generateEmbedding(query);
    const scoredDocs = [];
    for (const doc of candidateDocs) {
      let docVector = [];
      if (doc.embedding_vector) {
        try {
          docVector = JSON.parse(doc.embedding_vector);
        } catch {
          docVector = [];
        }
      }
      if (!docVector || docVector.length === 0) {
        docVector = await geminiService.generateEmbedding(`${doc.title}
${doc.source_text}`);
        doc.embedding_vector = JSON.stringify(docVector);
      }
      const score = geminiService.computeCosineSimilarity(queryVector, docVector);
      scoredDocs.push({
        ...doc,
        similarityScore: Number(score.toFixed(4))
      });
    }
    scoredDocs.sort((a, b) => b.similarityScore - a.similarityScore);
    return scoredDocs.slice(0, topK);
  }
}
const ragService = new RagService();
export {
  RagService,
  ragService
};
