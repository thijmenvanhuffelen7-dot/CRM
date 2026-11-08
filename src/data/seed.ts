import { addDays, addMonths, format, setHours, setMinutes, startOfDay, subDays, subMonths } from "date-fns";
import type {
  Activity,
  AgencyProfile,
  Campaign,
  CampaignStatus,
  Client,
  Flow,
  FlowStatus,
  FlowType,
  Integration,
  Lead,
  MonthlyMetric,
  Package,
  PipelineStage,
  Priority,
  Task,
  TeamMember,
} from "./types";

/** Deterministic PRNG so the demo looks the same on every reset. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rand = rng(42);
const between = (min: number, max: number) => min + rand() * (max - min);
const int = (min: number, max: number) => Math.round(between(min, max));
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

let idc = 0;
export const uid = (p = "id") => `${p}_${Date.now().toString(36)}${(idc++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function buildSeed(now = new Date()) {
  const today = startOfDay(now);
  const iso = (d: Date) => d.toISOString();
  const at = (dayOffset: number, h = 10, m = 0) => iso(setMinutes(setHours(addDays(today, dayOffset), h), m));

  const team: TeamMember[] = [
    { id: "u_sophie", name: "Sophie de Vries", email: "sophie@inboxstudio.co", role: "admin", title: "Founder & Strategy lead", color: "243", capacity: 32 },
    { id: "u_daan", name: "Daan Jansen", email: "daan@inboxstudio.co", role: "copywriter", title: "Senior copywriter", color: "172", capacity: 40 },
    { id: "u_mila", name: "Mila Bakker", email: "mila@inboxstudio.co", role: "designer", title: "Email designer", color: "330", capacity: 36 },
  ];

  const packages: Package[] = [
    { id: "p_starter", name: "Starter", price: 1500, campaignsPerMonth: 4, description: "Core flows and a weekly newsletter.", features: ["4 campaigns / month", "3 core flows", "Monthly report"] },
    { id: "p_growth", name: "Growth", price: 2800, campaignsPerMonth: 8, description: "Twice-weekly campaigns and full flow build-out.", features: ["8 campaigns / month", "All 5 core flows", "A/B testing", "Bi-weekly call"] },
    { id: "p_premium", name: "Premium", price: 4500, campaignsPerMonth: 12, description: "Full-service retention with SMS and segmentation.", features: ["12 campaigns / month", "Advanced segmentation", "SMS", "Dedicated strategist", "Weekly call"] },
  ];

  const stages: PipelineStage[] = [
    { id: "s_new", name: "New lead", kind: "open", probability: 0.05 },
    { id: "s_contacted", name: "Contacted", kind: "open", probability: 0.1 },
    { id: "s_audit", name: "Audit sent", kind: "open", probability: 0.25 },
    { id: "s_call", name: "Call booked", kind: "open", probability: 0.4 },
    { id: "s_proposal", name: "Proposal sent", kind: "open", probability: 0.6 },
    { id: "s_won", name: "Won", kind: "won", probability: 1 },
    { id: "s_lost", name: "Lost", kind: "lost", probability: 0 },
  ];

  const flowTypes: FlowType[] = ["Welcome series", "Abandoned cart", "Browse abandonment", "Post-purchase", "Win-back"];
  const mkFlows = (statuses: FlowStatus[]): Flow[] =>
    flowTypes.map((type, i) => ({
      id: uid("f"),
      type,
      status: statuses[i],
      emails: statuses[i] === "not_built" ? 0 : [3, 3, 2, 4, 3][i],
      revenue30d: statuses[i] === "live" ? Math.round(between(1200, 14000)) : 0,
      conversionRate: statuses[i] === "live" ? +between(1.2, 6.5).toFixed(1) : 0,
    }));

  const clientDefs = [
    { name: "Noorde Studio", domain: "noordestudio.com", color: "#1f2937", niche: "Fashion", pkg: "p_premium", retainer: 4500, am: "u_sophie", health: "good", list: 84200, tone: "Calm, considered and minimal. Short sentences. Never shouty.", colors: [["Ink", "#1f2937"], ["Sand", "#e8dccb"], ["Clay", "#b4673f"]], fonts: ["Canela", "Söhne"], flows: ["live", "live", "live", "live", "in_progress"] },
    { name: "Lumen Jewelry", domain: "lumenjewelry.co", color: "#b08d57", niche: "Jewelry", pkg: "p_growth", retainer: 2800, am: "u_sophie", health: "good", list: 41300, tone: "Warm, romantic and personal — like a handwritten note.", colors: [["Gold", "#b08d57"], ["Ivory", "#f7f3ea"], ["Night", "#14141a"]], fonts: ["Playfair Display", "Inter"], flows: ["live", "live", "in_progress", "live", "not_built"] },
    { name: "Kicks Collective", domain: "kickscollective.com", color: "#ef4444", niche: "Sneakers", pkg: "p_premium", retainer: 4800, am: "u_sophie", health: "attention", list: 126500, tone: "Hype, energetic, insider. Drop culture language, emojis allowed.", colors: [["Red", "#ef4444"], ["Black", "#0a0a0a"], ["Concrete", "#d4d4d4"]], fonts: ["Druk Wide", "Helvetica Neue"], flows: ["live", "live", "live", "in_progress", "live"] },
    { name: "Glow Theory", domain: "glowtheory.com", color: "#f59e8b", niche: "Skincare", pkg: "p_growth", retainer: 3000, am: "u_sophie", health: "good", list: 58900, tone: "Science-backed but friendly. Educate first, sell second.", colors: [["Peach", "#f59e8b"], ["Cream", "#fff6ef"], ["Cocoa", "#5b3a29"]], fonts: ["Recoleta", "DM Sans"], flows: ["live", "live", "live", "live", "live"] },
    { name: "Vital Daily", domain: "vitaldaily.com", color: "#16a34a", niche: "Supplements", pkg: "p_growth", retainer: 2800, am: "u_sophie", health: "at_risk", list: 37400, tone: "Direct and motivating. Claims always backed by research — no medical promises.", colors: [["Leaf", "#16a34a"], ["Mint", "#ecfdf3"], ["Forest", "#0f2e1d"]], fonts: ["Poppins", "Inter"], flows: ["live", "in_progress", "not_built", "live", "not_built"] },
    { name: "Atelier Mare", domain: "ateliermare.com", color: "#0e7490", niche: "Fashion", pkg: "p_starter", retainer: 1500, am: "u_sophie", health: "good", list: 19800, tone: "Breezy Mediterranean summer, effortless and sunny.", colors: [["Sea", "#0e7490"], ["Linen", "#f5f0e6"], ["Terracotta", "#c2410c"]], fonts: ["Cormorant", "Work Sans"], flows: ["live", "live", "not_built", "in_progress", "not_built"] },
    { name: "Purely Skin", domain: "purelyskin.com", color: "#8b5cf6", niche: "Skincare", pkg: "p_starter", retainer: 1650, am: "u_sophie", health: "attention", list: 22600, tone: "Gentle, inclusive, reassuring. Focus on sensitive skin.", colors: [["Lavender", "#8b5cf6"], ["Mist", "#f5f3ff"], ["Slate", "#334155"]], fonts: ["Fraunces", "Inter"], flows: ["live", "live", "in_progress", "not_built", "not_built"] },
    { name: "Forge Nutrition", domain: "forgenutrition.com", color: "#ea580c", niche: "Supplements", pkg: "p_premium", retainer: 4200, am: "u_sophie", health: "good", list: 97300, tone: "Bold, gym-floor confidence. Performance over fluff.", colors: [["Ember", "#ea580c"], ["Steel", "#1e293b"], ["Chalk", "#f8fafc"]], fonts: ["Oswald", "Roboto"], flows: ["live", "live", "live", "live", "live"] },
  ] as const;

  const firstNames = ["Emma", "Lucas", "Julia", "Noah", "Sara", "Finn", "Lotte", "Milan", "Anna", "Tim", "Eva", "Ruben", "Fleur", "Jesse", "Iris", "Sem"];
  const lastNames = ["Visser", "Smit", "Meijer", "de Boer", "Mulder", "de Groot", "Bos", "Vos", "Peters", "Hendriks", "Dekker", "Brouwer"];

  const clients: Client[] = clientDefs.map((c, i) => {
    const cStart = subMonths(today, int(3, 22));
    const first = firstNames[i * 2 % firstNames.length];
    const last = lastNames[i % lastNames.length];
    const emailDomain = c.domain;
    return {
      id: `c_${i + 1}`,
      name: c.name,
      domain: c.domain,
      color: c.color,
      niche: c.niche,
      packageId: c.pkg,
      retainer: c.retainer,
      accountManagerId: c.am,
      health: c.health,
      contractStart: iso(cStart),
      contractEnd: iso(addMonths(cStart, addMonths(cStart, 12) > today ? 12 : 24)),
      listSize: c.list,
      esp: "Klaviyo",
      notes:
        i === 2
          ? "Open rates dipped after the Black Friday warm-up. Discuss sunsetting unengaged profiles on next call."
          : i === 4
          ? "Client unhappy with flow build pace. Prioritise browse abandonment and send a recovery plan this week."
          : `${c.name} is a ${c.niche.toLowerCase()} brand on Shopify Plus. Main goals: grow email share of revenue to 30% and improve repeat purchase rate.`,
      contacts: [
        { id: uid("ct"), name: `${first} ${last}`, role: "Head of E-commerce", email: `${first.toLowerCase()}@${emailDomain}`, phone: `+31 6 ${int(10000000, 99999999)}`, primary: true },
        { id: uid("ct"), name: `${firstNames[(i * 2 + 1) % firstNames.length]} ${lastNames[(i + 5) % lastNames.length]}`, role: "Marketing manager", email: `marketing@${emailDomain}` },
      ],
      brandKit: {
        colors: c.colors.map(([name, hex]) => ({ name, hex })),
        headingFont: c.fonts[0],
        bodyFont: c.fonts[1],
        tone: c.tone,
        dos: ["Lead with the product benefit", "Use real customer photos", "Keep subject lines under 45 characters"],
        donts: ["No ALL CAPS subject lines", "Avoid discount-first messaging outside sale periods", "No stock imagery"],
      },
      flows: mkFlows([...c.flows] as FlowStatus[]),
      files: [
        { id: uid("fl"), name: `${c.name} brand guidelines.pdf`, kind: "pdf", size: 4_200_000, uploadedBy: "u_sophie", uploadedAt: iso(addDays(cStart, 2)) },
        { id: uid("fl"), name: "Logo pack.zip", kind: "other", size: 12_800_000, uploadedBy: "u_mila", uploadedAt: iso(addDays(cStart, 3)) },
        { id: uid("fl"), name: "Email template master", kind: "figma", size: 0, uploadedBy: "u_mila", uploadedAt: iso(addDays(cStart, 9)), url: "https://figma.com" },
        { id: uid("fl"), name: "Product shots — new season.jpg", kind: "image", size: 3_100_000, uploadedBy: "u_mila", uploadedAt: iso(subDays(today, int(2, 20))) },
      ],
      createdAt: iso(cStart),
    };
  });

  // ---- Leads (15 across all stages)
  const leadDefs: [string, string, string, string, number, number, string][] = [
    ["Saltwater Swim", "saltwaterswim.com", "s_new", "Fashion", 2200, 1_800_000, "Mailchimp"],
    ["Oak & Ember Candles", "oakandember.com", "s_new", "Home", 1500, 900_000, "Shopify Email"],
    ["Bloom Botanics", "bloombotanics.co", "s_new", "Skincare", 2800, 2_600_000, "Klaviyo"],
    ["Stride Running Co.", "striderunning.com", "s_contacted", "Sneakers", 3200, 4_100_000, "Klaviyo"],
    ["Halo Hair Care", "halohaircare.com", "s_contacted", "Beauty", 1800, 1_300_000, "Omnisend"],
    ["Mono Basics", "monobasics.com", "s_audit", "Fashion", 2800, 3_200_000, "Klaviyo"],
    ["Pure Protein Lab", "pureproteinlab.com", "s_audit", "Supplements", 3000, 5_400_000, "Klaviyo"],
    ["Silver Thread", "silverthread.co", "s_call", "Jewelry", 2400, 1_900_000, "Mailchimp"],
    ["Velvet Studio", "velvetstudio.com", "s_call", "Fashion", 4500, 8_700_000, "Klaviyo"],
    ["Root & Ritual", "rootandritual.com", "s_proposal", "Supplements", 2800, 2_300_000, "Klaviyo"],
    ["Dune Eyewear", "duneeyewear.com", "s_proposal", "Accessories", 3500, 3_900_000, "Klaviyo"],
    ["Coastline Kids", "coastlinekids.com", "s_won", "Fashion", 1500, 1_100_000, "Shopify Email"],
    ["Northern Knits", "northernknits.com", "s_won", "Fashion", 2800, 2_800_000, "Klaviyo"],
    ["Peak Hydration", "peakhydration.com", "s_lost", "Supplements", 2200, 1_700_000, "Klaviyo"],
    ["Gilded Grain", "gildedgrain.com", "s_lost", "Jewelry", 1500, 600_000, "Mailchimp"],
  ];
  const sources = ["Referral", "Outbound", "Inbound — website", "LinkedIn", "Klaviyo partner directory", "Event"];
  const leads: Lead[] = leadDefs.map(([company, domain, stageId, niche, value, estRevenue, esp], i) => {
    const fn = firstNames[(i + 3) % firstNames.length];
    const ln = lastNames[(i + 7) % lastNames.length];
    const createdAt = subDays(today, int(8, 70));
    const inStage = subDays(today, int(0, 14));
    const stage = stages.find((s) => s.id === stageId)!;
    return {
      id: `l_${i + 1}`,
      company,
      domain,
      contactName: `${fn} ${ln}`,
      contactRole: pick(["Founder", "Co-founder", "Head of Growth", "CMO", "E-commerce manager"]),
      contactEmail: `${fn.toLowerCase()}@${domain}`,
      contactPhone: `+31 6 ${int(10000000, 99999999)}`,
      stageId,
      value,
      ownerId: i % 3 === 0 ? "u_sophie" : i % 3 === 1 ? "u_sophie" : "u_daan",
      stageEnteredAt: iso(inStage < createdAt ? createdAt : inStage),
      createdAt: iso(createdAt),
      platform: i % 5 === 4 ? "WooCommerce" : i % 4 === 3 ? "Shopify" : "Shopify Plus",
      niche,
      estRevenue,
      currentEsp: esp,
      nextFollowUp: stage.kind === "open" ? iso(addDays(today, int(-2, 9))) : null,
      source: pick(sources),
      notes: [
        {
          id: uid("n"),
          authorId: "u_sophie",
          body:
            stage.kind === "lost"
              ? "Went with an in-house hire. Revisit in Q2."
              : `Email currently ~${int(8, 18)}% of revenue. Big opportunity in flows — no browse abandonment or post-purchase set up.`,
          createdAt: iso(addDays(createdAt, 1)),
        },
      ],
    };
  });

  // ---- Campaigns (30 across current and next month)
  const statusesFuture: CampaignStatus[] = ["idea", "copywriting", "design", "client_review", "approved", "scheduled"];
  const campaignNames: Record<string, string[]> = {
    Fashion: ["New season drop", "Styling edit: 3 ways to wear", "Back in stock", "Weekend essentials", "Behind the seams"],
    Jewelry: ["Gift guide: under €100", "Engraving is back", "The layering edit", "Holiday pre-order"],
    Sneakers: ["Drop alert: Runner 2.0", "Raffle results", "Restock Friday", "Sneaker care 101", "Black Friday early access"],
    Skincare: ["Winter skin routine", "Ingredient spotlight: niacinamide", "Refill program launch", "Black Friday: gift sets"],
    Supplements: ["30-day challenge kickoff", "New flavour launch", "Subscribe & save reminder", "Science of sleep", "Black Friday stack deals"],
  };
  const segments = ["Engaged 90d", "All subscribers", "VIP customers", "Non-purchasers", "Engaged 30d", "Repeat buyers", "Lapsed 120d"];
  const campaigns: Campaign[] = [];
  for (let i = 0; i < 30; i++) {
    const client = clients[i % clients.length];
    // offsets from -8 days to +40 days, a few today
    const offset = i < 3 ? 0 : Math.round(-10 + (i / 30) * 52 + between(-2, 2));
    const sendDate = at(offset, pick([8, 9, 10, 11, 17, 19, 20]), pick([0, 0, 30]));
    const past = offset < 0;
    let status: CampaignStatus;
    if (past) status = "sent";
    else if (offset === 0) status = i === 0 ? "scheduled" : i === 1 ? "client_review" : "approved";
    else if (offset < 4) status = pick(["scheduled", "approved", "client_review", "design"]);
    else if (offset < 14) status = pick(["design", "copywriting", "client_review", "approved"]);
    else status = pick(["idea", "copywriting", "idea"]);
    const names = campaignNames[client.niche] ?? campaignNames.Fashion;
    const name = names[i % names.length];
    const recipients = Math.round(client.listSize * between(0.45, 0.9));
    const openRate = +between(34, 58).toFixed(1);
    const clickRate = +between(1.1, 4.6).toFixed(2);
    const conversionRate = +between(0.08, 0.45).toFixed(2);
    const assignee = status === "design" ? "u_mila" : status === "copywriting" || status === "idea" ? "u_daan" : pick(["u_sophie", "u_daan", "u_mila"]);
    campaigns.push({
      id: `cp_${i + 1}`,
      clientId: client.id,
      name,
      subject:
        {
          "New season drop": "The new collection is here",
          "Back in stock": "It's back (but not for long)",
          "Drop alert: Runner 2.0": "🚨 Runner 2.0 drops Friday 10:00",
          "Winter skin routine": "Your winter skin survival guide",
          "Gift guide: under €100": "Gifts they'll actually keep",
          "30-day challenge kickoff": "Day 1 starts now 💪",
        }[name] ?? `${name} — ${client.name}`,
      previewText: pick(["Open for something new inside.", "Hand-picked for you, this week only.", "A quick note from our team.", "Plus free shipping over €50."]),
      sendAt: sendDate,
      segment: pick(segments),
      assigneeId: assignee,
      status,
      copy:
        status === "idea"
          ? ""
          : `<h3>Hero</h3><p>${name}. Lead with the strongest visual and a single clear benefit.</p><ul><li>Product block: 3 best sellers</li><li>Social proof: 1 review</li><li>CTA: Shop now</li></ul>`,
      designUrl: ["design", "client_review", "approved", "scheduled", "sent"].includes(status) ? "https://www.figma.com/file/demo" : "",
      checklist: {
        links: ["approved", "scheduled", "sent"].includes(status),
        mobile: ["approved", "scheduled", "sent"].includes(status) || (status === "client_review" && rand() > 0.5),
        utm: ["scheduled", "sent"].includes(status) || rand() > 0.6,
        spam: ["scheduled", "sent"].includes(status),
      },
      approval: ["approved", "scheduled", "sent"].includes(status) ? "approved" : status === "client_review" ? (rand() > 0.7 ? "changes_requested" : "pending") : "not_requested",
      comments:
        status === "client_review" || status === "design"
          ? [
              { id: uid("cm"), authorId: "u_daan", body: "Copy is final — subject line A/B: benefit vs. curiosity.", createdAt: iso(subDays(today, 2)) },
              { id: uid("cm"), authorId: "u_mila", body: "First design pass is in Figma. Hero needs the new product shot.", createdAt: iso(subDays(today, 1)) },
            ]
          : [],
      metrics: past
        ? {
            recipients,
            openRate,
            clickRate,
            conversionRate,
            revenue: Math.round(recipients * (conversionRate / 100) * between(55, 95)),
            unsubRate: +between(0.08, 0.32).toFixed(2),
          }
        : undefined,
      createdAt: iso(subDays(today, int(10, 25))),
    });
  }
  void statusesFuture;

  // ---- Tasks (25)
  const taskDefs: [string, number | null, Priority, string, number?, number?][] = [
    ["Finalise Black Friday calendar for Kicks Collective", 0, "urgent", "u_sophie", 2],
    ["Write copy: Glow Theory winter routine", 0, "high", "u_daan", 3],
    ["Design hero for Lumen gift guide", 0, "high", "u_mila", 1],
    ["Send recovery plan to Vital Daily", -1, "urgent", "u_sophie", 4],
    ["QA abandoned cart flow — Purely Skin", -2, "medium", "u_mila", 6],
    ["Prepare audit for Mono Basics", 1, "high", "u_sophie"],
    ["Follow up proposal — Root & Ritual", 1, "high", "u_sophie"],
    ["Subject line brainstorm: Forge Nutrition BF", 2, "medium", "u_daan", 7],
    ["Build browse abandonment flow — Vital Daily", 3, "high", "u_mila", 4],
    ["Monthly report — Noorde Studio", 2, "medium", "u_sophie", 0],
    ["Monthly report — Glow Theory", 3, "medium", "u_sophie", 3],
    ["Write win-back flow copy — Lumen", 4, "medium", "u_daan", 1],
    ["Update template footer — Atelier Mare", 5, "low", "u_mila", 5],
    ["Segment cleanup: sunset unengaged — Kicks", 4, "high", "u_sophie", 2],
    ["Onboarding call — Northern Knits", 6, "high", "u_sophie"],
    ["Copy review: Noorde new season drop", 1, "medium", "u_daan", 0],
    ["Resize product images for Forge launch", 2, "low", "u_mila", 7],
    ["Spam check + seed test for Kicks raffle", 0, "medium", "u_daan", 2],
    ["Pitch deck refresh", 12, "low", "u_sophie"],
    ["Plan December content calendar", 10, "medium", "u_sophie"],
    ["Post-purchase flow design — Purely Skin", 9, "medium", "u_mila", 6],
    ["Collect testimonials for case study", 15, "low", "u_daan"],
    ["Write audit summary for Stride Running", -3, "high", "u_daan"],
    ["Klaviyo account audit — Coastline Kids", 8, "medium", "u_sophie"],
    ["Archive old campaign assets", null, "low", "u_mila"],
  ];
  const tasks: Task[] = taskDefs.map(([title, off, priority, assigneeId, clientIdx], i) => {
    const clientId = clientIdx !== undefined ? clients[clientIdx].id : undefined;
    const linked = clientId ? campaigns.find((c) => c.clientId === clientId && c.status !== "sent") : undefined;
    const done = i === 15 || i === 16;
    return {
      id: `t_${i + 1}`,
      title,
      done,
      priority,
      dueDate: off === null ? null : at(off, 17, 0),
      assigneeId,
      clientId,
      campaignId: i % 3 === 0 ? linked?.id : undefined,
      createdAt: iso(subDays(today, int(1, 12))),
      completedAt: done ? iso(subDays(now, 0)) : undefined,
    };
  });

  // ---- Monthly metrics: 12 months per client
  const metrics: MonthlyMetric[] = [];
  clients.forEach((c, ci) => {
    let list = c.listSize * 0.72;
    const baseOpen = between(38, 52);
    const baseRev = c.retainer * between(5, 11);
    for (let m = 11; m >= 0; m--) {
      const month = subMonths(today, m);
      const growth = 1 + (11 - m) * 0.035;
      const seasonal = [1, 0.85, 0.9, 0.95, 1, 0.92, 0.88, 0.9, 1.05, 1.1, 1.35, 1.5][month.getMonth()];
      const healthDrag = c.health === "at_risk" && m < 3 ? 0.82 : c.health === "attention" && m < 2 ? 0.9 : 1;
      list = list * (1 + between(0.008, 0.04));
      metrics.push({
        clientId: c.id,
        month: format(month, "yyyy-MM"),
        emailsSent: Math.round(list * between(6, 12)),
        openRate: +(baseOpen * healthDrag + between(-3, 3)).toFixed(1),
        clickRate: +(between(1.8, 3.8) * healthDrag).toFixed(2),
        conversionRate: +(between(0.12, 0.38) * healthDrag).toFixed(2),
        revenue: Math.round(baseRev * growth * seasonal * healthDrag * between(0.9, 1.1)),
        listSize: Math.round(m === 0 ? c.listSize : list),
        unsubRate: +between(0.1, 0.35).toFixed(2),
      });
    }
    void ci;
  });

  // ---- Activity feed
  const act = (minsAgo: number, a: Omit<Activity, "id" | "createdAt">): Activity => ({ id: uid("a"), createdAt: iso(new Date(now.getTime() - minsAgo * 60000)), ...a });
  const activities: Activity[] = [
    act(12, { actorId: "u_mila", action: "moved", entityType: "campaign", entityId: "cp_2", entityName: campaigns[1].name, detail: "to Client review", clientId: campaigns[1].clientId }),
    act(38, { actorId: "u_daan", action: "commented on", entityType: "campaign", entityId: "cp_4", entityName: campaigns[3].name, clientId: campaigns[3].clientId }),
    act(64, { actorId: "u_sophie", action: "moved", entityType: "lead", entityId: "l_10", entityName: "Root & Ritual", detail: "to Proposal sent", leadId: "l_10" }),
    act(130, { actorId: "u_sophie", action: "completed", entityType: "task", entityId: "t_16", entityName: tasks[15].title }),
    act(200, { actorId: "u_mila", action: "uploaded", entityType: "file", entityId: "f", entityName: "Product shots — new season.jpg", clientId: "c_1" }),
    act(320, { actorId: "u_daan", action: "scheduled", entityType: "campaign", entityId: "cp_1", entityName: campaigns[0].name, clientId: campaigns[0].clientId }),
    act(60 * 20, { actorId: "u_sophie", action: "won", entityType: "lead", entityId: "l_13", entityName: "Northern Knits", detail: "€2,800 / mo", leadId: "l_13" }),
    act(60 * 26, { actorId: "u_mila", action: "set live", entityType: "flow", entityId: "flow", entityName: "Abandoned cart", detail: "for Glow Theory", clientId: "c_4" }),
    act(60 * 30, { actorId: "u_sophie", action: "added", entityType: "lead", entityId: "l_3", entityName: "Bloom Botanics", leadId: "l_3" }),
    act(60 * 50, { actorId: "u_daan", action: "created", entityType: "campaign", entityId: "cp_20", entityName: campaigns[19].name, clientId: campaigns[19].clientId }),
  ];

  const agency: AgencyProfile = {
    name: "Inbox Studio",
    website: "inboxstudio.co",
    email: "hello@inboxstudio.co",
    currency: "EUR",
    address: "Keizersgracht 123, Amsterdam",
  };

  const integrations: Integration[] = [
    { id: "klaviyo", connected: false },
    { id: "shopify", connected: false },
    { id: "slack", connected: false },
    { id: "gcal", connected: false },
  ];

  return { team, packages, stages, clients, leads, campaigns, tasks, metrics, activities, agency, integrations };
}

export type SeedData = ReturnType<typeof buildSeed>;
