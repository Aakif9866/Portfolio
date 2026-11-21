export type Stage = { title: string; summary: string; points: string[] };

export const ragStages: Stage[] = [
  {
    title: "Document ingestion",
    summary: "Load sources and turn them into clean text with metadata.",
    points: [
      "Parse PDFs, HTML, Markdown and other formats into plain text.",
      "Keep metadata (source, page, section, timestamps) for filtering and citations.",
      "Normalize whitespace and strip boilerplate like headers, footers and navigation.",
    ],
  },
  {
    title: "Chunking",
    summary: "Split text into retrievable units.",
    points: [
      "Fixed-size chunks with overlap are simple and a reasonable baseline.",
      "Recursive or structure-aware splitting respects paragraphs, headings and code blocks.",
      "Semantic chunking splits where the topic changes, at the cost of extra compute.",
      "Trade-off: small chunks match precisely but lose context; large chunks keep context but dilute similarity.",
    ],
  },
  {
    title: "Embedding generation",
    summary: "Map each chunk to a dense vector.",
    points: [
      "Similar meaning → nearby vectors, so retrieval becomes nearest-neighbour search.",
      "Queries and documents must use the same embedding model.",
      "Changing the model means re-embedding the whole corpus.",
    ],
  },
  {
    title: "Vector database",
    summary: "Index vectors for fast approximate nearest-neighbour search.",
    points: [
      "FAISS is a library; dedicated vector databases add persistence, filtering and scaling.",
      "Index types (flat, IVF, HNSW) trade recall against speed and memory.",
      "Metadata filters narrow the search space before or after vector search.",
    ],
  },
  {
    title: "Hybrid retrieval",
    summary: "Combine semantic and keyword search.",
    points: [
      "Dense retrieval captures meaning; BM25 keyword search catches exact terms, IDs and rare words.",
      "Results are merged, e.g. with Reciprocal Rank Fusion.",
      "Usually improves recall over either method alone.",
    ],
  },
  {
    title: "Reranking",
    summary: "Re-score candidates with a more precise model.",
    points: [
      "Retrieve broadly (e.g. top 50), then rerank with a cross-encoder that reads query and chunk together.",
      "More accurate than vector similarity, but too slow to run over the whole corpus.",
      "Improves precision at the top of the list, which is what reaches the prompt.",
    ],
  },
  {
    title: "Context construction",
    summary: "Assemble the prompt from the best chunks.",
    points: [
      "Select the top chunks within the token budget; deduplicate overlapping text.",
      "Order matters: models attend best to the beginning and end of long contexts.",
      "Include source labels so the model can cite and the UI can link back.",
    ],
  },
  {
    title: "LLM generation",
    summary: "Generate an answer grounded in the context.",
    points: [
      "Instruct the model to answer only from the provided context and say when it can't.",
      "Lower temperature favours faithful, repeatable answers.",
      "Return citations alongside the answer.",
    ],
  },
  {
    title: "Evaluation",
    summary: "Measure retrieval and generation separately.",
    points: [
      "Build a test set of questions with known relevant chunks and reference answers.",
      "Score retrieval (Recall@K, MRR) independently from answer quality (correctness, faithfulness).",
      "Re-run the evaluation whenever chunking, embeddings or prompts change.",
    ],
  },
];

export type Metric = { name: string; measures: string; formula: string; example: string };

export const ragMetrics: Metric[] = [
  {
    name: "Recall@K",
    measures: "Fraction of queries where at least one relevant chunk appears in the top K results.",
    formula: "Recall@K = (# queries with a relevant chunk in top K) / (# queries)",
    example: "3 queries; relevant chunk ranked 1, 4 and 12. Recall@5 = 2/3 ≈ 0.67.",
  },
  {
    name: "Recall@1",
    measures: "Strictest form: the very first result is relevant.",
    formula: "Recall@1 = (# queries with a relevant chunk at rank 1) / (# queries)",
    example: "Same queries: only the first is at rank 1. Recall@1 = 1/3 ≈ 0.33.",
  },
  {
    name: "Mean Reciprocal Rank",
    measures: "How high the first relevant result appears, on average.",
    formula: "MRR = (1/|Q|) · Σ 1 / rank_i",
    example: "Ranks 1, 4, 12 → (1 + 0.25 + 0.083) / 3 ≈ 0.44.",
  },
  {
    name: "Answer Correctness",
    measures: "Whether the generated answer matches the reference answer.",
    formula: "Judged by exact/fuzzy match, semantic similarity, or an LLM-as-judge rubric.",
    example: "Reference \"30 days\"; answer \"within a month (30 days)\" → correct.",
  },
  {
    name: "Faithfulness",
    measures: "Whether every claim in the answer is supported by the retrieved context.",
    formula: "Faithfulness = (# claims supported by context) / (# claims in answer)",
    example: "4 claims, 3 found in context → 0.75. The fourth is a hallucination even if it happens to be true.",
  },
];
