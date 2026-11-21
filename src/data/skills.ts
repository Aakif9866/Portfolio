export type SkillGroup = { title: string; focus: string; items: string[] };

export const skills: SkillGroup[] = [
  {
    title: "Programming Languages",
    focus: "Python for AI and data work, TypeScript/JavaScript for services, C/C++ for systems fundamentals.",
    items: ["Python", "C++", "C", "Java", "JavaScript", "TypeScript"],
  },
  {
    title: "Backend Engineering",
    focus: "APIs, auth, persistence and caching.",
    items: ["Node.js", "Express.js", "REST APIs", "Authentication & Authorization", "MongoDB", "PostgreSQL", "Redis"],
  },
  {
    title: "AI / Generative AI",
    focus: "Retrieval pipelines and LLM integration.",
    items: ["LangChain", "LangGraph", "RAG", "FAISS", "Vector Embeddings", "LLM Integration", "Prompt Engineering", "Hugging Face", "Gemini", "Groq"],
  },
  {
    title: "Machine Learning",
    focus: "Training, evaluating and shipping models.",
    items: ["TensorFlow", "Keras", "Scikit-learn", "NumPy", "Pandas", "Computer Vision", "Model Deployment"],
  },
  {
    title: "Infrastructure & Tools",
    focus: "Packaging, delivery and observability.",
    items: ["Docker", "AWS", "Git", "GitHub Actions", "DVC", "Linux", "Prometheus", "Grafana"],
  },
];
