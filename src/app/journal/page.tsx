import type { Metadata } from "next";
import { PageHeader } from "@/components/Section";
import { JournalList } from "@/components/JournalList";
import { getPosts, journalCategories } from "@/lib/journal";

export const metadata: Metadata = {
  title: "Technical Journal",
  description: "Engineering notes on backend systems, system design, AI engineering and more.",
};

export default async function JournalPage() {
  const posts = await getPosts();
  return (
    <>
      <PageHeader
        label="Technical Journal"
        tone="amber"
        title="Engineering notes"
        intro="Backend engineering, system design, AI and RAG, databases, distributed systems and experiments. Articles marked sample placeholder are templates, not published writing."
      />
      <div className="mx-auto max-w-4xl px-4 pb-28 sm:px-6">
        <JournalList posts={posts} categories={journalCategories} />
      </div>
    </>
  );
}
