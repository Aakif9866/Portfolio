// Single source of truth for personal details.
// Empty strings are treated as "not set": the matching link/button is hidden, never rendered dead.
export const profile = {
  name: "Your Name", // TODO
  role: "Backend Engineer & AI Developer",
  email: "", // TODO: you@example.com
  github: "", // TODO: https://github.com/<user>
  linkedin: "", // TODO: https://www.linkedin.com/in/<user>
  resume: "", // TODO: put resume.pdf in /public and set to "/resume.pdf"
  formspreeId: "", // TODO: form id from formspree.io (the part after /f/)
  siteUrl: "https://portfolio-test-branch.vercel.app", // deployed URL (used for SEO / sitemap)
  intro:
    "Backend engineer and AI developer with a Computer Science and Data Science background. I work on APIs, data stores and the retrieval and model pipelines that sit behind AI-powered products.",
  hero:
    "I build backend systems, intelligent applications and AI-powered solutions. Interested in the engineering behind scalable software, retrieval systems, distributed architectures and applied machine learning.",
};

export const about = [
  {
    title: "Foundations",
    body: "Computer Science and Data Science background: data structures, algorithms, operating systems and databases on one side; statistics, linear algebra and model evaluation on the other.",
  },
  {
    title: "Backend & APIs",
    body: "REST API design, authentication and authorization, schema design in MongoDB and PostgreSQL, and caching with Redis. I care about clear contracts, predictable failure modes and boring, debuggable code.",
  },
  {
    title: "Generative AI & RAG",
    body: "Retrieval-Augmented Generation pipelines with LangChain, LangGraph and FAISS: ingestion, chunking, embeddings, retrieval and grounded generation, and how to measure whether retrieval is actually working.",
  },
  {
    title: "Machine & Deep Learning",
    body: "Classical ML with scikit-learn and deep learning with TensorFlow/Keras, including computer vision, data and experiment versioning with DVC, and packaging models for deployment.",
  },
  {
    title: "Architecture & System Design",
    body: "How requests move through a system: gateways, services, queues, caches and databases, and the trade-offs between consistency, latency and operational simplicity.",
  },
  {
    title: "Experimentation",
    body: "I learn by building small, focused experiments and writing down what I find. The Technical Journal is where those notes live.",
  },
];
