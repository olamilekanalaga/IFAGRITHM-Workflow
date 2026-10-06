import { Memory, RecordItem, Kind } from "./model";
const records: RecordItem[] = [];
const relations: Memory["relations"] = [];
function add(
  id: string,
  kind: Kind,
  title: string,
  body: string,
  status = "Active",
  owner = "Ola",
  category?: string,
) {
  records.push({
    id,
    kind,
    title,
    body,
    status,
    owner,
    category,
    createdAt: new Date(Date.UTC(2026, 9, 6, 9, records.length)).toISOString(),
    confidence: kind === "Insight" ? "Tentative" : undefined,
  });
}
function link(from: string, to: string, label: string) {
  relations.push({ id: `${from}-${to}`, from, to, label });
}
add(
  "ola",
  "Person",
  "Ola",
  "Decision owner and research contributor. Demonstration profile.",
);
add(
  "ada",
  "Person",
  "Ada • Scout",
  "Discovers companies and captures source-backed observations. Demonstration profile.",
);
add(
  "sam",
  "Person",
  "Sam • Researcher",
  "Investigates hypotheses and documents limitations. Demonstration profile.",
);
const examples = [
  [
    "nova",
    "NovaX",
    "Exchange",
    "Trading competition",
    "NovaX announced a $100,000 trading competition.",
    "Trading incentives may indicate acquisition spend.",
    "Trading Competition Prospecting",
    "Conversation",
  ],
  [
    "tide",
    "Tide Protocol",
    "Protocol",
    "Liquidity incentive",
    "Tide announced a liquidity incentive programme.",
    "Incentives may attract capital without sustained usage.",
    "Retention Research Outreach",
    "Researching",
  ],
  [
    "orbit",
    "Orbit Social",
    "Consumer App",
    "Ambassador recruitment",
    "Orbit opened applications for community ambassadors.",
    "Community recruitment may signal distribution friction.",
    "Distribution Discovery",
    "Contacted",
  ],
  [
    "cedar",
    "Cedar RWA",
    "RWA",
    "Partnership expansion",
    "Cedar announced an expansion into a new market.",
    "Expansion may introduce onboarding and partner dependencies.",
    "Market Entry Discovery",
    "Future Opportunity",
  ],
];
for (const [
  id,
  name,
  category,
  behaviour,
  observation,
  hypothesis,
  strategy,
  status,
] of examples) {
  add(
    id,
    "Company",
    name,
    `Fictional ${category.toLowerCase()} used to demonstrate connected company memory.`,
    status,
    "Ada",
    category,
  );
  add(
    `${id}-person`,
    "Person",
    `${name} growth lead`,
    "Fictional external contact. No real outreach has occurred.",
    "Known",
    "Ada",
  );
  add(
    `${id}-behaviour`,
    "Behaviour",
    behaviour,
    "Editable demonstration behaviour label.",
  );
  add(
    `${id}-obs`,
    "Observation",
    observation,
    "Scout observation in a fictional scenario. Validate the source before using it commercially.",
    "Recorded",
    "Ada",
  );
  add(
    `${id}-evidence`,
    "Evidence",
    `${name} announcement reference`,
    "Sample source reference only; this is not verified evidence.",
    "Sample",
    "Ada",
  );
  add(
    `${id}-research`,
    "Research",
    `${name}: acquisition and retention`,
    hypothesis + " Investigate motivations, alternatives and missing evidence.",
    "In progress",
    "Sam",
  );
  add(
    `${id}-insight`,
    "Insight",
    hypothesis,
    "Tentative hypothesis, not a validated finding. Announcement alone does not establish budget, intent or willingness to buy.",
    "Needs validation",
    "Sam",
  );
  add(
    `${id}-strategy`,
    "Strategy",
    strategy,
    "Test whether an evidence-led conversation reveals a research need. Stop if the company is not qualified.",
    "Testing",
    "Ola",
  );
  add(
    `${id}-action`,
    "Action",
    `${name}: discovery outreach`,
    "Fictional outreach. Ask about the business decision and uncertainty before proposing work.",
    id === "nova" ? "Completed" : "Planned",
    "Ola",
  );
  add(
    `${id}-outcome`,
    "Outcome",
    id === "nova" ? "Replied → discovery conversation" : "Outcome pending",
    "Demonstration only. No actual client, revenue or response is claimed.",
    id === "nova" ? "Replied" : "Pending",
    "Ola",
  );
  link(id, `${id}-person`, "has contact");
  link(id, `${id}-obs`, "observed in");
  link(`${id}-obs`, `${id}-behaviour`, "exhibits");
  link(`${id}-evidence`, `${id}-obs`, "supports");
  link(`${id}-obs`, `${id}-research`, "prompted");
  link(`${id}-evidence`, `${id}-research`, "informs");
  link(`${id}-research`, `${id}-insight`, "produced");
  link(`${id}-insight`, `${id}-strategy`, "motivates");
  link(`${id}-strategy`, id, "applied to");
  link(`${id}-strategy`, `${id}-action`, "executed through");
  link(`${id}-action`, `${id}-person`, "contacted");
  link(`${id}-action`, `${id}-outcome`, "resulted in");
  link("ada", `${id}-obs`, "contributed");
  link("sam", `${id}-research`, "contributed");
  link("ola", `${id}-action`, "performed");
}
add(
  "learning",
  "Learning",
  "An announcement is a starting point, not qualification",
  "Separate observed activity from inferred intent. Ask which decision needs evidence.",
  "Draft",
  "Sam",
);
link("nova-outcome", "learning", "informs");
add(
  "playbook",
  "Playbook",
  "Evidence-led discovery • draft",
  "1. Capture source. 2. State hypothesis and uncertainty. 3. Investigate need. 4. Record action and outcome. This sample playbook is not validated.",
  "Draft",
  "Ola",
);
link("learning", "playbook", "candidate for");
add(
  "task",
  "Task",
  "Validate NovaX acquisition hypothesis",
  "Identify what would confirm or contradict the hypothesis before preparing a proposal.",
  "Open",
  "Sam",
);
link("nova-research", "task", "requires");
for (const company of records.filter((r) => r.kind === "Company")) {
  const research = records.find((r) => r.id === `${company.id}-research`);
  const observation = records.find((r) => r.id === `${company.id}-obs`);
  const behaviour = records.find((r) => r.id === `${company.id}-behaviour`);
  if (research)
    Object.assign(research, {
      researchQuestion: `What behaviour is ${company.title} encouraging, and what evidence would inform a useful discovery question?`,
      observedFacts: observation?.title,
      actors: `${company.title} and public participants; identities and motivations unverified.`,
      encouragedBehaviour: behaviour?.title,
      publicUnknowns:
        "Actual problem, current solution, intent, budget and commercial fit cannot be established from the announcement.",
    });
}
for (const strategy of records.filter((r) => r.kind === "Strategy"))
  strategy.strategyType = "Outreach strategy";
// Additive demonstration records: operating work is distinct from research reasoning.
add(
  "nova-decision",
  "Decision",
  "NovaX: commercial + content",
  "Fictional decision: explore a discovery conversation and develop an evidence-led behaviour post. Neither branch proves a problem.",
  "Decided",
  "Ola",
);
records.find((r) => r.id === "nova-decision")!.disposition =
  "Commercial + Content";
link("nova-research", "nova-decision", "informs decision");
link("nova-decision", "nova", "commercial branch");
add(
  "nova-content",
  "Content",
  "How to evaluate trading competition behaviour",
  "Fictional draft: discuss observable behaviour, evaluation questions and limitations. Do not present NovaX as a real case study.",
  "Draft",
  "Sam",
);
records.find((r) => r.id === "nova-content")!.contentFormat =
  "Campaign Breakdown";
link("nova-research", "nova-content", "content branch");
add(
  "tide-content",
  "Content",
  "What persists after liquidity incentives end?",
  "Fictional behaviour-post brief. Distinguish activity from intent and outline a retention measurement question.",
  "Ready to publish",
  "Sam",
);
records.find((r) => r.id === "tide-content")!.contentFormat = "Behaviour Post";
link("tide-research", "tide-content", "content branch");
add(
  "orbit-content",
  "Content",
  "Evaluating whether ambassador distribution creates intended behaviour",
  "Fictional publication brief with research question, methodology and limitations.",
  "Ready to publish",
  "Sam",
);
records.find((r) => r.id === "orbit-content")!.contentFormat = "Decision Brief";
link("orbit-research", "orbit-content", "content branch");
for (const id of ["orbit", "cedar"]) {
  add(
    `${id}-decision`,
    "Decision",
    `${id === "orbit" ? "Orbit" : "Cedar"}: choose commercial / content route`,
    "Fictional review: archive, content, potential client or both? Document evidence and uncertainty.",
    "Pending review",
    "Ola",
  );
  records.find((r) => r.id === `${id}-decision`)!.disposition = "Pending";
  link(`${id}-research`, `${id}-decision`, "requires decision");
}
records.find((r) => r.id === "orbit")!.approachRoute = "Direct IFAGRITHM DM";
add(
  "nova-problem",
  "Problem",
  "Could competition participants be returning users?",
  "An investigation question, not a client-confirmed retention problem.",
  "Needs validation",
  "Sam",
);
records.find((r) => r.id === "nova-problem")!.problemState = "Hypothesis";
link("nova", "nova-problem", "has hypothesis");
link("nova-research", "nova-problem", "investigates");
add(
  "vela",
  "Company",
  "Vela Protocol",
  "Fictional client used to demonstrate delivery. No actual client relationship or revenue is claimed.",
  "Client",
  "Ada",
  "Protocol",
);
add(
  "vela-person",
  "Person",
  "Vela product lead",
  "Fictional client contact.",
  "Known",
  "Ola",
);
link("vela", "vela-person", "has contact");
add(
  "vela-conversation",
  "Evidence",
  "Vela: discovery conversation notes",
  "Fictional conversation: the product lead asks for a documented account of returning usage after an intervention. Real work requires actual evidence.",
  "Sample",
  "Ola",
);
records.find((r) => r.id === "vela-conversation")!.evidenceType =
  "Founder / client conversation";
link("vela", "vela-conversation", "discovery evidence");
add(
  "vela-problem",
  "Problem",
  "Vela needs evidence for the next product intervention",
  "Client-confirmed within this fictional scenario only. The need comes from discovery notes, not inferred behaviour.",
  "Confirmed in demo",
  "Ola",
);
Object.assign(
  records.find((r) => r.id === "vela-problem")!,
  {
    problemState: "Client-confirmed",
    validationEvidenceId: "vela-conversation",
  },
);
link("vela", "vela-problem", "confirmed during discovery");
link("vela-conversation", "vela-problem", "supports confirmation");
add(
  "vela-research",
  "Research",
  "Vela: measure behaviour after intervention",
  "Fictional scoped delivery research. Compare activity before and after; document uncertainty and confounding factors.",
  "Completed",
  "Sam",
);
link("vela-problem", "vela-research", "scopes");
add(
  "vela-delivery",
  "Delivery",
  "Vela: intervention analysis and decision brief",
  "Fictional active engagement. Scout collects sources; analyst examines off-chain activity and on-chain data only if needed. Deliver findings, limitations and recommendation.",
  "Active",
  "Sam",
);
Object.assign(
  records.find((r) => r.id === "vela-delivery")!,
  {
    analysisApproach: "Off-chain analysis; on-chain only if required",
    deliveryOutput: "Intervention analysis and decision brief",
  },
);
link("vela-research", "vela-delivery", "client deliverable");
link("vela", "vela-delivery", "engagement");
const work = [
  ["approve-orbit", "Approve Orbit outreach", "Ola", "Ola", "orbit-decision"],
  ["follow-nova", "Follow up NovaX discovery", "Ola", "Ola", "nova"],
  ["scope-vela", "Review Vela delivery scope", "Ola", "Ola", "vela-delivery"],
  [
    "analyse-tide",
    "Investigate Tide retention hypothesis",
    "Sam",
    "Analyst",
    "tide-research",
  ],
  [
    "analyse-vela",
    "Review intervention measurement limitations",
    "Sam",
    "Analyst",
    "vela-delivery",
  ],
];
for (const [id, title, owner, role, parent] of work) {
  add(
    id,
    "Task",
    title,
    "Fictional assignment for the operating queue. Record completion and what was learned.",
    "Open",
    owner,
  );
  records.find((r) => r.id === id)!.assigneeRole = role;
  link(parent, id, "requires work");
}
// Structured optional detail for the fictional demonstration; no real source claim.
const novaObservation = records.find((r) => r.id === "nova-obs");
if (novaObservation) novaObservation.behaviourDetail = "$100,000";
export const seed: Memory = {
  version: 1,
  records,
  relations,
  activity: records
    .filter((r) => !["Behaviour", "Person"].includes(r.kind))
    .map((r) => ({
      id: `activity-${r.id}`,
      recordId: r.id,
      actor: r.owner,
      date: r.createdAt,
      description: `${r.kind} recorded: ${r.title}`,
    }))
    .reverse(),
};
