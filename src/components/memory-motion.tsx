"use client";
import Image from "next/image";
import { Memory, Kind, relatedIds } from "@/lib/model";
export default function MemoryMotion({
  memory,
  selected,
  onOpen,
}: {
  memory: Memory;
  selected?: string;
  onOpen: (id: string) => void;
}) {
  const scoped = selected
    ? relatedIds(memory, selected)
    : relatedIds(memory, "nova");
  const sequence: Kind[] = [
    "Observation",
    "Evidence",
    "Research",
    "Strategy",
    "Action",
    "Outcome",
  ];
  const nodes = sequence.map((kind) =>
    memory.records.find((r) => r.kind === kind && scoped.has(r.id)),
  );
  return (
    <section
      className="memory-motion"
      aria-label="Animated connected research example"
    >
      <div className="motion-caption">
        <span>
          <Image
            src="/brand-symbol-transparent.png"
            alt=""
            width={22}
            height={30}
          />{" "}
          UNDERLYING EVIDENCE TRAIL
        </span>
        <small>
          {selected ? "CONNECTED TO THIS RECORD" : "FICTIONAL NOVAX EXAMPLE"} /
          FOLLOW THE WORK
        </small>
      </div>
      <div className="motion-track">
        {sequence.map((kind, i) => {
          const node = nodes[i];
          return (
            <div
              className="motion-step"
              key={kind}
              style={{ "--step": i } as React.CSSProperties}
            >
              <span className="motion-dot" />
              <button disabled={!node} onClick={() => node && onOpen(node.id)}>
                <small>
                  {String(i + 1).padStart(2, "0")} / {kind}
                </small>
                <strong>{node?.title || "No linked record yet"}</strong>
                <span>
                  {node?.status || "Capture to connect"} {node && "↗"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <p>
        Illustrative linked records. Exact relationship labels remain in record
        history.
      </p>
    </section>
  );
}
