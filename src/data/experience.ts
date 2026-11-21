export type Role = {
  company: string;
  position: string;
  start: string;
  end: string; // "Present" for current role
  responsibilities: string[];
  technologies: string[];
  achievements: string[];
  placeholder?: boolean; // shows a "placeholder" tag until you replace the entry
};

// TODO: replace with your real roles. Keep descriptions engineering-focused and
// avoid client names, internal project names or proprietary details.
export const experience: Role[] = [
  {
    company: "Company name",
    position: "Backend / AI Engineer",
    start: "Month YYYY",
    end: "Present",
    responsibilities: [
      "Describe the systems you built or owned (APIs, pipelines, services).",
      "Describe how you worked: design reviews, on-call, testing practices.",
    ],
    technologies: ["Node.js", "PostgreSQL", "Python"],
    achievements: ["A concrete, verifiable outcome you're comfortable sharing."],
    placeholder: true,
  },
  {
    company: "Company name",
    position: "Software Engineering Intern",
    start: "Month YYYY",
    end: "Month YYYY",
    responsibilities: ["Describe your scope and the problems you worked on."],
    technologies: ["Python", "Machine Learning"],
    achievements: [],
    placeholder: true,
  },
];
