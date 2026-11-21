import type { Metadata } from "next";
import { PageHeader } from "@/components/Section";
import { ConceptExplorer } from "@/components/ConceptExplorer";

export const metadata: Metadata = {
  title: "Backend Engineering",
  description: "Interactive explanations of how backend systems work internally.",
};

export default function BackendPage() {
  return (
    <>
      <PageHeader
        label="Backend Engineering Showcase"
        tone="blue"
        title="How backend systems work internally"
        intro="Pick a concept, then step through it. Each walkthrough follows a request or piece of data through the components involved and explains what happens at every hop."
      />
      <div className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
        <ConceptExplorer />
      </div>
    </>
  );
}
