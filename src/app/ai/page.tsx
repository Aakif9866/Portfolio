import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/Section";
import { RagPipeline } from "@/components/RagPipeline";
import { ragMetrics } from "@/data/rag";
import { tone, toneAt } from "@/lib/tone";

export const metadata: Metadata = {
  title: "AI & RAG Engineering",
  description: "The Retrieval-Augmented Generation pipeline end to end, and how to evaluate it.",
};

export default function AiPage() {
  return (
    <>
      <PageHeader
        label="AI & RAG Engineering"
        tone="violet"
        title="Retrieval-Augmented Generation, end to end"
        intro="A RAG system is a search engine glued to a language model. Expand each stage to see what it does and the trade-offs involved."
      />
      <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <RagPipeline />
      </div>

      <Section id="metrics" index="01" label="Evaluation" tone="coral" title="Retrieval and answer metrics" intro="Retrieval and generation fail differently, so they're measured separately.">
        <div className="grid gap-4 md:grid-cols-2">
          {ragMetrics.map((m, i) => (
            <div key={m.name} style={toneAt(i + 1)} className="rounded-lg border border-line border-t-2 border-t-(--tone) bg-surface p-6">
              <h3 className="font-semibold text-(--tone)">{m.name}</h3>
              <p className="mt-2 text-sm text-muted">{m.measures}</p>
              <p className="mt-4 overflow-x-auto rounded-md bg-bg px-3 py-2 font-mono text-xs text-(--tone)">{m.formula}</p>
              <p className="mt-3 text-sm"><span className="font-mono text-xs text-muted">e.g. </span>{m.example}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="quality" index="02" label="Why it matters" tone="amber" title="Retrieval quality caps answer quality">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { t: "Missed retrieval", c: "coral" as const, b: "If the relevant chunk isn't retrieved, the model can only refuse or guess. No prompt can recover information it never saw, so Recall@K bounds correctness on document-grounded questions." },
            { t: "Noisy retrieval", c: "amber" as const, b: "Irrelevant chunks compete for attention and context budget. Low precision at the top raises the chance the model answers from the wrong passage, which hurts faithfulness." },
            { t: "Diagnose by halves", c: "green" as const, b: "Low recall: fix chunking, embeddings, hybrid search or reranking. High recall but wrong answers: fix context construction and the prompt." },
          ].map((x) => (
            <div key={x.t} style={tone(x.c)} className="border-t-2 border-(--tone) pt-4">
              <h3 className="font-semibold text-heading">{x.t}</h3>
              <p className="mt-2 text-sm text-muted">{x.b}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
