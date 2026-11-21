export type Step = { label: string; detail: string };

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  area: "Generative AI" | "Machine Learning" | "Full-stack";
  overview: string;
  problem: string;
  architecture: Step[];
  stack: string[];
  decisions: { title: string; body: string }[];
  implementation: string[];
  // TODO: these are the engineering considerations inherent to each design.
  // Replace with the specific problems you hit and how you solved them.
  challenges: { challenge: string; solution: string }[];
  repo: string; // TODO: GitHub URL ("" hides the link)
  demo: string; // live demo URL ("" hides the link)
};

export const projects: Project[] = [
  {
    slug: "document-qa-rag",
    title: "Document Q&A – RAG Application",
    tagline: "Ask questions over your own documents and get answers grounded in retrieved context.",
    area: "Generative AI",
    overview:
      "A Retrieval-Augmented Generation application that ingests documents, splits them into chunks, embeds them, indexes the vectors in FAISS, and answers questions with an LLM using only the most relevant retrieved passages as context.",
    problem:
      "LLMs don't know the contents of private documents and will confidently guess when asked about them. The application needs to find the right passages first and constrain the model to answer from them.",
    architecture: [
      { label: "Upload", detail: "Documents are loaded and their text extracted." },
      { label: "Chunk", detail: "Text is split into overlapping chunks so each piece fits the embedding model and keeps local context." },
      { label: "Embed", detail: "Each chunk is converted into a dense vector with an embedding model." },
      { label: "FAISS index", detail: "Vectors are stored in a FAISS index for fast nearest-neighbour search." },
      { label: "Retrieve", detail: "The user's question is embedded and the top-k most similar chunks are fetched." },
      { label: "LLM answer", detail: "Retrieved chunks are placed into the prompt and the LLM generates a context-aware answer." },
    ],
    stack: ["Python", "LangChain", "FAISS", "Vector embeddings", "LLM API"],
    decisions: [
      { title: "FAISS for vector search", body: "An in-process library is enough for a single-user document set and avoids running a separate vector database." },
      { title: "Overlapping chunks", body: "Overlap reduces the chance that an answer is split across a chunk boundary and lost at retrieval time." },
      { title: "Answer only from context", body: "The prompt instructs the model to use the retrieved passages and say when the answer isn't present, rather than guess." },
    ],
    implementation: [
      "Document loading and text extraction pipeline.",
      "Configurable chunk size and overlap.",
      "Embedding generation and FAISS index build.",
      "Similarity search returning top-k chunks for each query.",
      "Prompt construction combining the question with retrieved context.",
    ],
    challenges: [
      { challenge: "Choosing chunk size", solution: "Small chunks retrieve precisely but lose context; large chunks keep context but dilute similarity. Size and overlap are tuned against sample questions." },
      { challenge: "Irrelevant context in the prompt", solution: "Limit k and keep the prompt explicit about using only the supplied passages." },
    ],
    repo: "",
    demo: "",
  },
  {
    slug: "information-retrieval-system",
    title: "Information Retrieval System",
    tagline: "Conversational querying over documents with LangChain, FAISS, Google embeddings and Groq.",
    area: "Generative AI",
    overview:
      "A Streamlit application for chatting with a document collection. Documents are embedded with Google Generative AI embeddings and indexed in FAISS; a Groq-hosted LLM generates answers through a LangChain conversational chain that keeps track of the conversation.",
    problem:
      "Single-shot Q&A breaks down for follow-up questions like \"what about the second one?\". The system needs conversation memory so follow-ups are resolved against earlier turns before retrieval.",
    architecture: [
      { label: "Streamlit UI", detail: "User uploads documents and chats through a Streamlit interface." },
      { label: "Embeddings", detail: "Chunks are embedded with Google Generative AI embeddings." },
      { label: "FAISS", detail: "Vectors are indexed in FAISS for similarity search." },
      { label: "Conversational chain", detail: "LangChain combines chat history with the new question and retrieves relevant chunks." },
      { label: "Groq LLM", detail: "The Groq API serves the LLM that generates the response from the retrieved context." },
    ],
    stack: ["Python", "LangChain", "Streamlit", "FAISS", "Google Generative AI embeddings", "Groq API"],
    decisions: [
      { title: "Streamlit for the interface", body: "Fast to build an interactive UI in pure Python, keeping focus on the retrieval logic." },
      { title: "Separate embedding and generation providers", body: "Embeddings and generation are independent components, so each can be swapped without touching the other." },
      { title: "Conversation memory", body: "Chat history is passed into the chain so follow-up questions are interpreted in context." },
    ],
    implementation: [
      "Document upload and chunking.",
      "Embedding with Google Generative AI and indexing in FAISS.",
      "LangChain conversational retrieval chain with chat history.",
      "Groq API integration for generation.",
      "Streamlit chat interface with session state.",
    ],
    challenges: [
      { challenge: "Follow-up questions", solution: "Keep chat history in session state and feed it to the chain alongside the new question." },
      { challenge: "API keys in a UI app", solution: "Keys are loaded from environment variables, never hard-coded or committed." },
    ],
    repo: "",
    demo: "",
  },
  {
    slug: "chicken-disease-classification",
    title: "Chicken Disease Classification",
    tagline: "Deep-learning image classifier with versioned data, reproducible experiments and an automated pipeline.",
    area: "Machine Learning",
    overview:
      "A computer vision project that classifies poultry images for disease using a convolutional neural network built with TensorFlow/Keras. DVC versions the data and pipeline stages, and deployment is automated.",
    problem:
      "Model notebooks are hard to reproduce. The goal was an end-to-end pipeline where data, training and evaluation are versioned stages that can be re-run reliably and deployed automatically.",
    architecture: [
      { label: "Data ingestion", detail: "Image dataset is downloaded and prepared as a pipeline stage." },
      { label: "Base model", detail: "A CNN base model is prepared for transfer learning." },
      { label: "Training", detail: "The model is trained on the prepared images with TensorFlow/Keras." },
      { label: "Evaluation", detail: "The trained model is evaluated and metrics are recorded." },
      { label: "DVC pipeline", detail: "DVC tracks data and stage dependencies so only changed stages re-run." },
      { label: "Deployment", detail: "An automated pipeline packages and deploys the model behind a prediction interface." },
    ],
    stack: ["Python", "TensorFlow", "Keras", "Computer Vision", "DVC"],
    decisions: [
      { title: "Transfer learning", body: "Starting from a pretrained CNN needs far less data and compute than training from scratch." },
      { title: "DVC for data and pipelines", body: "Large images stay out of Git while every experiment remains reproducible from a commit." },
      { title: "Modular pipeline stages", body: "Ingestion, model preparation, training and evaluation are separate components with their own config." },
    ],
    implementation: [
      "Config-driven pipeline components.",
      "Image preprocessing and augmentation.",
      "CNN training with TensorFlow/Keras.",
      "DVC stages for reproducible runs.",
      "Automated build and deployment workflow.",
    ],
    challenges: [
      { challenge: "Reproducibility", solution: "DVC ties each model to the exact data and parameters that produced it." },
      { challenge: "Limited labelled images", solution: "Transfer learning and augmentation to make better use of the available data." },
    ],
    repo: "",
    demo: "",
  },
  {
    slug: "wafer-classification",
    title: "Wafer Classification System",
    tagline: "End-to-end ML pipeline for semiconductor wafer defect classification, deployed on AWS.",
    area: "Machine Learning",
    overview:
      "A machine learning system that classifies wafer sensor data as faulty or good. It covers data validation, preprocessing, model training and evaluation, and prediction, packaged as an end-to-end pipeline and deployed to AWS.",
    problem:
      "Manufacturing sensor data is wide, noisy and has missing values. A usable classifier needs consistent validation and preprocessing in both training and prediction.",
    architecture: [
      { label: "Validation", detail: "Incoming data files are validated against an expected schema." },
      { label: "Preprocessing", detail: "Missing values are handled and features are cleaned consistently." },
      { label: "Training", detail: "A classifier is trained on the processed data." },
      { label: "Evaluation", detail: "The model is evaluated on held-out data." },
      { label: "Prediction", detail: "New data runs through the same preprocessing before prediction." },
      { label: "AWS", detail: "The application is deployed on AWS." },
    ],
    stack: ["Python", "Scikit-learn", "Pandas", "NumPy", "AWS"],
    decisions: [
      { title: "Schema validation first", body: "Rejecting malformed files early prevents silent garbage in training and prediction." },
      { title: "Shared preprocessing", body: "The same preprocessing code runs in training and prediction to avoid train/serve skew." },
    ],
    implementation: [
      "Schema-based data validation.",
      "Missing value handling and feature cleanup.",
      "Model training and evaluation.",
      "Prediction pipeline reusing preprocessing.",
      "Deployment to AWS.",
    ],
    challenges: [
      { challenge: "Missing and noisy sensor values", solution: "Explicit imputation and cleanup steps applied identically at training and prediction." },
      { challenge: "Keeping training and serving consistent", solution: "One preprocessing module used by both pipelines." },
    ],
    repo: "",
    demo: "",
  },
  {
    slug: "youtube-video-summarizer",
    title: "YouTube Video Summarizer",
    tagline: "Turns a video transcript into a concise summary with the Gemini API.",
    area: "Generative AI",
    overview:
      "An interactive application that takes a YouTube link, fetches the video's transcript, and uses the Gemini API to produce a structured summary.",
    problem:
      "Long videos are slow to skim. Transcripts are long and unstructured; turning them into a useful summary requires prompt design and handling transcripts that exceed comfortable prompt sizes.",
    architecture: [
      { label: "Video URL", detail: "User submits a YouTube link through the UI." },
      { label: "Transcript", detail: "The transcript is fetched and cleaned." },
      { label: "Prompt", detail: "The transcript is combined with summarization instructions." },
      { label: "Gemini", detail: "The Gemini API generates the summary." },
      { label: "Display", detail: "The summary is shown in the interface." },
    ],
    stack: ["Python", "Gemini API"],
    decisions: [
      { title: "Use transcripts, not audio", body: "Working from existing transcripts avoids running speech-to-text." },
      { title: "Structured prompt", body: "The prompt asks for a fixed structure, so outputs are consistent across videos." },
    ],
    implementation: [
      "Video ID extraction from URLs.",
      "Transcript retrieval and cleanup.",
      "Prompt template for summarization.",
      "Gemini API integration.",
      "Interactive UI.",
    ],
    challenges: [
      { challenge: "Videos without transcripts", solution: "Detect the missing transcript and report it clearly instead of failing silently." },
      { challenge: "Very long transcripts", solution: "Keep within model context limits, e.g. by splitting and summarizing in parts." },
    ],
    repo: "",
    demo: "",
  },
  {
    slug: "mern-booking-app",
    title: "MERN Booking Application",
    tagline: "Full-stack booking platform with authentication and booking workflows.",
    area: "Full-stack",
    overview:
      "A booking application built on the MERN stack: a React frontend, a Node.js/Express REST API, and MongoDB for persistence, with user authentication and booking workflows.",
    problem:
      "Booking systems need authenticated users, protected operations and data that stays consistent when listings are browsed, booked and managed.",
    architecture: [
      { label: "React client", detail: "Users browse listings and make bookings in the React frontend." },
      { label: "Express API", detail: "REST endpoints handle listings, bookings and users." },
      { label: "Auth middleware", detail: "Protected routes verify the user's token before running." },
      { label: "Booking logic", detail: "Services validate and create bookings." },
      { label: "MongoDB", detail: "Users, listings and bookings are stored in MongoDB." },
    ],
    stack: ["React", "Node.js", "Express.js", "MongoDB"],
    decisions: [
      { title: "Token-based auth", body: "Stateless tokens keep the API simple to scale and protect routes via middleware." },
      { title: "REST resources", body: "Listings, bookings and users map to clear REST resources." },
    ],
    implementation: [
      "Registration and login with hashed passwords.",
      "Auth middleware for protected routes.",
      "Listing and booking CRUD endpoints.",
      "Booking flow in the React client.",
      "MongoDB schemas for users, listings and bookings.",
    ],
    challenges: [
      { challenge: "Protecting user-specific operations", solution: "Middleware verifies the token and handlers check resource ownership." },
      { challenge: "Invalid bookings", solution: "Validate booking input on the server, not only in the client." },
    ],
    repo: "",
    demo: "",
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
