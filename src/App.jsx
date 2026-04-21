import { useState, useRef, useEffect, useCallback } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const PERSONAS_CONFIG = {
  sarah: {
    id:"sarah", name:"Sarah Chen", role:"Senior Wealth Advisor", avatar:"SC",
    color:"#0f4c35", accent:"#16a34a", light:"#f0fdf4",
    mcps:["Salesforce CRM","Portfolio Engine","Core Banking","Outlook 365"],
    greeting:"Good morning, Sarah.",
    suggestions:[
      "Who needs attention this week?",
      "Any RRSP contribution room gaps?",
      "Clients not contacted in 30+ days",
      "Draft a market update for tech-heavy portfolios"
    ]
  },
  marcus: {
    id:"marcus", name:"Marcus Williams", role:"AML Analyst", avatar:"MW",
    color:"#7c2d12", accent:"#ea580c", light:"#fff7ed",
    mcps:["Transaction Monitor","KYC Platform","FINTRAC Gateway","Risk Engine"],
    greeting:"Good morning, Marcus.",
    suggestions:[
      "Today's high-risk flags",
      "FINTRAC deadlines today?",
      "Open STR case summary",
      "Velocity spikes this week"
    ]
  },
  rachel: {
    id:"rachel", name:"Rachel Okonkwo", role:"Compliance Officer", avatar:"RO",
    color:"#1e3a5f", accent:"#2563eb", light:"#eff6ff",
    mcps:["Comms Review","OSC/CIRO Regulatory DB","Policy Vault","Outlook 365"],
    greeting:"Good morning, Rachel.",
    suggestions:[
      "Regulatory changes this week?",
      "What's blocking the current campaign?",
      "Open CIRO deadlines",
      "Draft AI disclosure memo"
    ]
  }
};

// ─── MOCKED MCP DATA ─────────────────────────────────────────────────────────
// In production these would be live queries to each MCP server.
// Each dataset represents what that MCP would return on a morning scan.

const MOCK_MCP_DATA = {
  sarah: {
    "Salesforce CRM": {
      clients_needing_contact: [
        { id:"WS-4421089", name:"David Chen",    last_contact_days:47, notes:"Expressed concern about market volatility in last call", rrsp_deadline_days:8 },
        { id:"WS-3312044", name:"Priya Kapoor",  last_contact_days:12, notes:"Anxiety about tech concentration flagged", upcoming_call:true },
        { id:"WS-5512088", name:"Amara Nwosu",   last_contact_days:61, notes:"On maternity leave — gentle outreach only", auto_invest_paused:true },
        { id:"WS-2201974", name:"James Keller",  last_contact_days:90, notes:"Passive investor, responds to email", idle_cash_flag:true },
        { id:"WS-7734521", name:"Marcus Reid",   last_contact_days:46, notes:"First-time buyer, excited about home purchase" },
        { id:"WS-6621044", name:"Aisha Mohammed",last_contact_days:48, notes:"Actively saving, responds well to proactive outreach" }
      ]
    },
    "Portfolio Engine": {
      drawdowns: [
        { id:"WS-4421089", name:"David Chen",    drawdown_pct:-11.2, top_losers:["NVDA","AMD","TSLA"] },
        { id:"WS-3312044", name:"Priya Kapoor",  drawdown_pct:-8.6,  tech_pct:74 },
        { id:"WS-2209871", name:"James Wu",       drawdown_pct:-3.1,  tech_pct:71 },
        { id:"WS-5501233", name:"Wei Zhang",      drawdown_pct:-2.4,  tech_pct:70 }
      ],
      concentration_alerts: [
        { id:"WS-3312044", name:"Priya Kapoor",  sector:"Technology", pct:74, threshold:70, portfolio_value:198000 },
        { id:"WS-2209871", name:"James Wu",       sector:"Technology", pct:71, threshold:70, portfolio_value:445200 },
        { id:"WS-5501233", name:"Wei Zhang",      sector:"Technology", pct:70, threshold:70, portfolio_value:89500 }
      ],
      trigger:"NVDA +8.4% this week pushed three accounts past single-sector threshold"
    },
    "Core Banking": {
      idle_cash: [
        { id:"WS-2201974", name:"James Keller", cash_amount:82000, idle_days:93, account:"TFSA" }
      ],
      fhsa_gaps: [
        { id:"WS-7734521", name:"Marcus Reid",    available_room:8000, status:"first_time_buyer", pre_approved_mortgage:true, deadline_days:29 },
        { id:"WS-6621044", name:"Aisha Mohammed", available_room:8000, status:"first_time_buyer", actively_saving:true,        deadline_days:29 }
      ]
    },
    "Outlook 365": {
      todays_calls: ["WS-3312044 (Priya Kapoor) — 2:00 PM"],
      emails_sent_today: 0,
      unread_client_messages: 2
    }
  },
  marcus: {
    "Transaction Monitor": {
      high_confidence_flags: [
        {
          case_id:"TXN-2847", client_id:"WS-7731029", client_name:"Robert Beaumont",
          pattern:"structuring", confidence:0.94,
          transactions:[
            { type:"wire_in",  amount:47000, source:"TD Bank",          timestamp:"2025-03-01 09:14" },
            { type:"transfer_out", amount:46800, destination:"crypto_exchange", timestamp:"2025-03-01 14:32" }
          ],
          intermediary:"Cayman Islands — flagged jurisdiction",
          fintrac_window_hours:24, window_expires:"2025-03-02 14:32",
          prior_sars:1
        }
      ],
      medium_confidence_flags: [
        {
          case_id:"WS-8832011", client_id:"WS-8832011", client_name:"Mei-Ling Park",
          pattern:"velocity_spike", confidence:0.61,
          account_age_weeks:6,
          transactions_48h:12, total_volume_48h:38400, avg_txn:3200,
          pattern_detail:"E-transfer in from 4 distinct senders → consolidated outbound wire",
          kyc_status:"basic_only", income_verified:false
        }
      ],
      auto_cleared_overnight: {
        count:14,
        breakdown:[
          { type:"payroll_deposits", count:6, avg:3100 },
          { type:"recurring_bills",  count:5, avg:890  },
          { type:"known_etransfer_network", count:3, avg:450 }
        ],
        edge_cases:2, edge_case_confidence_range:"38–39%"
      }
    },
    "KYC Platform": {
      profiles: {
        "WS-7731029":{ name:"Robert Beaumont", risk_rating:"medium_high", kyc_complete:true,  onboarded:"2021-06-12", prior_sars:1 },
        "WS-8832011":{ name:"Mei-Ling Park",   risk_rating:"medium",      kyc_complete:false, onboarded:"2025-01-15", income_unverified:true }
      }
    },
    "FINTRAC Gateway": {
      open_cases:1, pending_strs:0, last_filing:"2025-02-18",
      reporting_deadlines:[
        { case_id:"TXN-2847", deadline:"2025-03-02 14:32", hours_remaining:22 }
      ]
    },
    "Risk Engine": {
      daily_risk_score:7.4, threshold:6.0, elevated:true,
      top_risk_drivers:["TXN-2847 (structuring, high confidence)","WS-8832011 (velocity, KYC gap)"]
    }
  },
  rachel: {
    "Comms Review": {
      pending_campaigns:[
        {
          campaign:"Spring Mortgage Refinance Campaign",
          launch_date:"2025-03-07", days_to_launch:5,
          emails_total:3, emails_cleared:2, emails_flagged:1,
          flagged_item:{
            subject:"Email #3 — Main offer email",
            flagged_phrase:"This mortgage rate is right for you",
            reason:"Suitability language — implies individualized recommendation without assessment",
            suggested_fix:"Replace with: 'Competitive mortgage rates available for qualified applicants'"
          }
        }
      ]
    },
    "OSC/CIRO Regulatory DB": {
      recent_notices:[
        {
          notice:"OSC Staff Notice 11-940",
          published:"2025-02-14",
          title:"Guidance on AI-Assisted Client Communications",
          requirement:"AI-drafted or AI-reviewed communications require disclosure statement + human review attestation",
          effective:"immediately",
          affected_campaigns_est:4
        }
      ],
      applicable_rules:[
        { rule:"OSC Rule 31-103 s.13.2", topic:"Suitability — requires individualized client assessment before recommendation" },
        { rule:"CIRO Rule 3400",          topic:"Supervisory procedures for client communications" }
      ]
    },
    "Policy Vault": {
      open_filings:[
        {
          filing:"CIRO Quarterly Compliance Report Q4 2024",
          due_date:"2025-03-08", days_remaining:6,
          sections_total:8, sections_ai_prefilled:6, sections_need_input:2,
          pending_sections:[
            { section:4, name:"Complaint Log Attestation", detail:"3 complaints Q4, all resolved. Officer signature required." },
            { section:7, name:"Training Records Narrative", detail:"2 staff completed modules 4 days late. Written explanation required." }
          ]
        }
      ]
    },
    "Outlook 365": {
      upcoming_deadlines:[
        { item:"CIRO Q4 filing",                due:"2025-03-08", days:6 },
        { item:"Spring Campaign launch approval", due:"2025-03-07", days:5 }
      ],
      unread_legal_emails:1
    }
  }
};

// ─── ORCHESTRATOR PROMPT ─────────────────────────────────────────────────────
function buildOrchestratorPrompt(persona, mcpData) {
  return `You are a morning intelligence orchestrator for a financial platform. Your job is to read data from multiple MCP sources and decide the 3 most important action tiles for ${persona.name}, ${persona.role} at Wealthsimple.

TODAY'S DATA FROM MCP SOURCES:
${JSON.stringify(mcpData, null, 2)}

PERSONA CONTEXT:
- Name: ${persona.name}
- Role: ${persona.role}  
- Data access: ${persona.mcps.join(", ")}
- She/he should ONLY see data from their authorized sources

TASK: Analyze all data and return exactly 3 tiles as a JSON array. Prioritize by urgency — what needs action today first.

Each tile must follow this exact schema:
{
  "id": "tile_[1|2|3]",
  "urgency": "high" | "medium" | "low",
  "label": "Short category label (2-3 words, e.g. 'Urgent Attention', 'STR Filing Required')",
  "headline": "Sharp action-oriented headline under 10 words with specific data",
  "blurb": "2-3 sentences. Specific numbers, names, deadlines. Tell them exactly what the AI found.",
  "sources": ["Array of MCP source names that contributed to this tile"],
  "chips": ["4 suggested follow-up actions the user might want to take"],
  "keyFacts": [
    { "label": "Fact label", "value": "Fact value — specific and concrete" }
  ],
  "orchestratorReasoning": "1-2 sentences explaining why the AI surfaced this as a priority today vs other signals in the data",
  "suggestedAction": "The single most important next action — specific and direct",
  "drillPrompt": "Full system prompt for the drill-down chat. Include all relevant data from the MCP feeds for this tile, the persona's role, what actions they can take, and that they CANNOT access other personas' data. When producing drafts/forms, label them 'DRAFT — Awaiting your approval'."
}

ORDERING RULES:
1. Legal deadlines with time windows (FINTRAC, regulatory filings) = always first if present
2. Direct client impact (drawdowns, missed contact with upcoming deadline) = second
3. Compliance blockers (campaign launch at risk) = third  
4. Proactive opportunities = lowest priority

Return ONLY the raw JSON array. No markdown, no explanation, no backticks.`;
}

// ─── TILE GENERATION HOOK ────────────────────────────────────────────────────
// Demo mode: routing animation runs then surfaces pre-built tiles instantly.
// Total load time: ~1.5s — fast enough to feel snappy, long enough to show the scan.
function useTileOrchestrator(persona) {
  const [tiles,     setTiles]     = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [routing,   setRouting]   = useState(false);
  const [routeStep, setRouteStep] = useState(0);

  const generate = useCallback(async () => {
    setLoading(true);
    setRouting(true);
    setRouteStep(0);
    setTiles(null);

    // Step through each MCP source — spread evenly across 5s total
    for (let i = 0; i <= persona.mcps.length; i++) {
      await new Promise(r => setTimeout(r, 900));
      setRouteStep(i);
    }
    // "Synthesizing..." hold
    await new Promise(r => setTimeout(r, 600));
    setRouting(false);

    // Surface pre-built tiles — no API call needed for demo
    setTiles(FALLBACK_TILES[persona.id]);
    setLoading(false);
  }, [persona.id]);

  useEffect(() => { generate(); }, [generate]);

  return { tiles, loading, routing, routeStep, error: null, refresh: generate };
}

// ─── FALLBACK TILES ──────────────────────────────────────────────────────────
// Used if API fails — ensures demo never breaks
const FALLBACK_TILES = {
  sarah: [
    {
      id:"tile_1", urgency:"high", label:"Urgent Attention",
      headline:"4 clients need contact today",
      blurb:"David Chen is down 11.2% with an RRSP deadline in 8 days and no contact in 47 days. Priya Kapoor expressed anxiety on her last call and has a call booked today. Two others have flags that warrant outreach before week-end.",
      sources:["Portfolio Engine","Salesforce CRM","Core Banking"],
      chips:["Who should I call first?","Draft email to David Chen","Talking points for Priya's call","Book follow-ups for all four"],
      keyFacts:[
        {label:"Highest priority", value:"David Chen — RRSP deadline in 8 days, -11.2%, 47 days no contact"},
        {label:"Today's call", value:"Priya Kapoor — 2:00 PM, tech concentration at 74%"},
        {label:"Long overdue", value:"Amara Nwosu — 61 days, TFSA auto-invest paused"},
        {label:"Idle cash", value:"James Keller — $82,000 idle 90+ days"}
      ],
      orchestratorReasoning:"David Chen has three compounding risk signals firing simultaneously — drawdown, tax deadline, and contact gap. Ranked #1 by urgency score.",
      suggestedAction:"Call David Chen before market open. RRSP deadline in 8 days is time-bound.",
      drillPrompt:`You are an AI assistant for Sarah Chen, Senior Wealth Advisor at Wealthsimple. Sources: Portfolio Engine, Salesforce CRM, Core Banking, Outlook 365. 4 clients need urgent contact: David Chen (WS-4421089, -11.2%, RRSP deadline 8 days, 47 days no contact), Priya Kapoor (WS-3312044, -8.6%, anxiety noted, call today 2PM), Amara Nwosu (WS-5512088, TFSA auto-invest paused, 61 days no contact, on maternity leave), James Keller (WS-2201974, $82K idle 90 days). Help Sarah prioritize, prepare talking points, draft emails. When drafting emails write full text and label "DRAFT EMAIL — Awaiting your approval". You cannot access AML or compliance data.`
    },
    {
      id:"tile_2", urgency:"medium", label:"Concentration Alert",
      headline:"3 clients above 70% tech exposure",
      blurb:"NVDA +8.4% this week pushed Priya Kapoor, James Wu, and Wei Zhang past the 70% single-sector threshold simultaneously. Combined portfolio value affected: $732,700. All three need contact before Friday.",
      sources:["Portfolio Engine","Salesforce CRM"],
      chips:["Draft personalized emails for all three","Which is highest risk?","Rebalancing options to suggest","Have any of them already called in?"],
      keyFacts:[
        {label:"Priya Kapoor",  value:"74% tech, $198,000 — last contact 12 days ago"},
        {label:"James Wu",     value:"71% tech, $445,200 — last contact 3 days ago (may be aware)"},
        {label:"Wei Zhang",    value:"70% tech, $89,500 — last contact 31 days ago"},
        {label:"Trigger",      value:"NVDA +8.4% this week"}
      ],
      orchestratorReasoning:"All three crossed the threshold in the same week due to NVDA's run. Batching outreach now is more efficient than handling callbacks when clients notice the drawdown themselves.",
      suggestedAction:"Reach out before market open Friday. James Wu was contacted recently — may deprioritize.",
      drillPrompt:`You are an AI assistant for Sarah Chen, Senior Wealth Advisor at Wealthsimple. Sources: Portfolio Engine, Salesforce CRM. 3 clients crossed 70% tech concentration this week: Priya Kapoor (74%, $198K, last contact 12 days), James Wu (71%, $445K, 3 days), Wei Zhang (70%, $89.5K, 31 days). Trigger: NVDA +8.4%. Draft personalized emails per client, tailored to their contact recency. Label drafts "DRAFT EMAIL — Awaiting your approval". You cannot access AML or compliance data.`
    },
    {
      id:"tile_3", urgency:"low", label:"Opportunity",
      headline:"2 clients have $8,000 FHSA room — 29 days left",
      blurb:"Marcus Reid and Aisha Mohammed both opened FHSAs in January with no contributions since. Year-end deadline is 29 days away. Both are first-time buyers — proactive outreach reinforces the relationship at a high-engagement moment.",
      sources:["Core Banking","Salesforce CRM"],
      chips:["Draft FHSA emails for both","What tax angle to lead with?","What else do I know about their situations?","Best time to reach each?"],
      keyFacts:[
        {label:"Marcus Reid",    value:"$8,000 available, pre-approved mortgage, last contact 46 days"},
        {label:"Aisha Mohammed", value:"$8,000 available, actively saving, last contact 48 days"},
        {label:"Deadline",       value:"December 31 — 29 days remaining"},
        {label:"Benefit",        value:"Tax-deductible contribution + tax-free growth on withdrawal"}
      ],
      orchestratorReasoning:"Both accounts have been open since January with zero activity. Year-end creates a natural reason to reach out without feeling intrusive.",
      suggestedAction:"Frame as year-end tax optimization opportunity. Warm, personalized outreach.",
      drillPrompt:`You are an AI assistant for Sarah Chen, Senior Wealth Advisor at Wealthsimple. Sources: Core Banking, Salesforce CRM. Marcus Reid (WS-7734521, $8K FHSA room, first-time buyer, pre-approved mortgage, 46 days no contact) and Aisha Mohammed (WS-6621044, $8K FHSA room, first-time buyer, actively saving, 48 days). Year-end deadline 29 days. Draft warm personalized emails per client. Label "DRAFT EMAIL — Awaiting your approval". You cannot access AML or compliance data.`
    }
  ],
  marcus: [
    {
      id:"tile_1", urgency:"high", label:"STR Filing Required",
      headline:"TXN-2847 — FINTRAC window expires in 22 hours",
      blurb:"Robert Beaumont transferred $47,000 in via TD Bank wire and $46,800 out to a crypto exchange the same day, routed through a Cayman Islands intermediary. Transaction pattern is consistent with structuring. This is the last day of the 24-hour FINTRAC reporting window.",
      sources:["Transaction Monitor","KYC Platform","FINTRAC Gateway"],
      chips:["Walk me through the full case","Generate the FINTRAC STR form","What makes this structuring vs. coincidence?","Show the full transaction timeline"],
      keyFacts:[
        {label:"Case ID",          value:"TXN-2847"},
        {label:"Client",           value:"Robert Beaumont (WS-7731029) — Medium-High KYC risk"},
        {label:"Pattern",          value:"$47K in → $46.8K out, same day, Cayman intermediary"},
        {label:"Risk Score",       value:"High — structuring pattern identified"},
        {label:"Prior history",    value:"1 prior SAR (2022, resolved)"},
        {label:"FINTRAC deadline", value:"Today — 22 hours remaining"}
      ],
      orchestratorReasoning:"Time-bound regulatory filing with high confidence score and prior SAR history. Legal obligation — cannot be deferred.",
      suggestedAction:"Review AI brief and submit STR to FINTRAC Gateway before end of day.",
      drillPrompt:`You are an AI assistant for Marcus Williams, AML Analyst at Wealthsimple. Sources: Transaction Monitor, KYC Platform, FINTRAC Gateway, Risk Engine. Case TXN-2847: Robert Beaumont (WS-7731029), KYC risk Medium-High, $47,000 in via wire from TD Bank on 2025-03-01 at 09:14, $46,800 out to crypto exchange same day at 14:32, Cayman Islands intermediary flagged, transaction pattern consistent with structuring (same-day cycle, near-identical amounts, flagged intermediary), 1 prior SAR (2022 resolved), 24hr FINTRAC window expires today. When Marcus is ready to file, produce a complete pre-filled FINTRAC STR with all required sections labeled "FINTRAC STR FORM — Pre-filled, awaiting your approval": Section 1 Reporting Entity (Wealthsimple Financial Inc., FINTRAC ID 12994-WS), Section 2 Subject Information (from KYC), Section 3 Transaction Details, Section 4 Suspicious Indicators, Section 5 Narrative. You cannot access portfolio or compliance data.`
    },
    {
      id:"tile_2", urgency:"medium", label:"Pattern Review",
      headline:"New account — velocity spike, KYC incomplete",
      blurb:"Mei-Ling Park's account is 6 weeks old. 12 transactions totalling $38,400 arrived in 48 hours from 4 distinct senders, then consolidated outbound. Income is unverified. Pattern resembles layering but AI confidence is 61% — human judgment required.",
      sources:["Transaction Monitor","KYC Platform","Risk Engine"],
      chips:["Does this look like layering?","What KYC is missing?","Initiate enhanced due diligence","Should I file a SAR or wait?"],
      keyFacts:[
        {label:"Client",          value:"Mei-Ling Park (WS-8832011) — account 6 weeks old"},
        {label:"Activity",        value:"12 transactions, $38,400 in 48 hours, avg $3,200"},
        {label:"Pattern",         value:"E-transfer in from 4 senders → consolidated outbound wire"},
        {label:"KYC gap",         value:"Basic only — income source unverified"},
        {label:"AI confidence",   value:"61% — below STR threshold, above monitoring threshold"}
      ],
      orchestratorReasoning:"61% confidence sits below the auto-flag threshold but above the ignore threshold. New account age + KYC gap elevates risk. Human review warranted.",
      suggestedAction:"Assess whether enhanced due diligence or voluntary SAR is appropriate.",
      drillPrompt:`You are an AI assistant for Marcus Williams, AML Analyst at Wealthsimple. Sources: Transaction Monitor, KYC Platform, Risk Engine. Case WS-8832011, Mei-Ling Park. Account opened 2025-01-15 (6 weeks old). 12 transactions in 48 hours totalling $38,400, average $3,200. Pattern: e-transfer in from 4 distinct senders then consolidated outbound wire. KYC status: basic only, income unverified. Risk Engine: Medium, escalation pending. AI confidence: 61% (below STR threshold). Help Marcus assess if EDD, voluntary SAR, or account restriction is warranted. If proceeding with any formal step, produce a pre-filled form labeled "FORM — Pre-filled, awaiting your approval". You cannot access portfolio or compliance data.`
    },
    {
      id:"tile_3", urgency:"low", label:"Queue Summary",
      headline:"14 routine flags auto-cleared overnight",
      blurb:"The AI resolved 14 low-risk flags from the overnight queue — payroll deposits, recurring bills, known e-transfer networks. All logged with confidence scores. Two edge cases at 38–39% confidence are available for spot-check if you want to verify the AI's reasoning.",
      sources:["Transaction Monitor","Risk Engine"],
      chips:["Show me the 2 edge cases","Confirm audit log is complete","Anything I should escalate?","Export queue summary for record"],
      keyFacts:[
        {label:"Auto-cleared",   value:"14 flags — payroll (6), recurring bills (5), known network (3)"},
        {label:"Method",         value:"Pattern match vs 24-month historical baseline"},
        {label:"Audit trail",    value:"All logged with confidence scores in FINTRAC Gateway"},
        {label:"Edge cases",     value:"2 flags at 38–39% confidence — just below threshold"}
      ],
      orchestratorReasoning:"Routine clearances are surfaced for transparency and audit readiness, not action. Two edge cases are flagged in case Marcus wants to spot-check the AI's judgment.",
      suggestedAction:"Spot-check 2 edge cases if time permits. No required action.",
      drillPrompt:`You are an AI assistant for Marcus Williams, AML Analyst at Wealthsimple. Sources: Transaction Monitor, Risk Engine. Overnight queue: 14 flags auto-cleared — payroll deposits (6, avg $3,100), recurring bill payments (5, avg $890), known e-transfer network (3, avg $450). 2 edge cases at 38-39% confidence just below the STR threshold. All logged with confidence scores. Help Marcus review edge cases and confirm audit readiness for FINTRAC examination. You cannot access portfolio or compliance data.`
    }
  ],
  rachel: [
    {
      id:"tile_1", urgency:"high", label:"Launch Blocker",
      headline:"Campaign cannot launch — 1 email flagged",
      blurb:"The Spring Mortgage Refinance Campaign launches Friday. 3 emails were reviewed. 2 cleared. Email #3 contains 'This mortgage rate is right for you' — a suitability claim under OSC Rule 31-103 s.13.2. One sentence is blocking a Friday launch.",
      sources:["Comms Review","OSC/CIRO Regulatory DB"],
      chips:["Show the flagged phrase in full context","Approve the fix and issue clearance","What exactly does OSC 31-103 say?","Are the other 2 emails fully clear?"],
      keyFacts:[
        {label:"Campaign",       value:"Spring Mortgage Refinance — launches Friday March 7"},
        {label:"Status",         value:"2 of 3 emails cleared — 1 blocking"},
        {label:"Flagged phrase", value:"'This mortgage rate is right for you'"},
        {label:"Rule",           value:"OSC Rule 31-103, s.13.2 — suitability requires individualized assessment"},
        {label:"Suggested fix",  value:"'Competitive mortgage rates available for qualified applicants'"},
        {label:"Risk",           value:"Medium — regulatory review triggered if sent as-is"}
      ],
      orchestratorReasoning:"A launched campaign with a suitability violation creates direct regulatory exposure. Fix is low-effort; impact of inaction is material.",
      suggestedAction:"Approve the suggested fix, apply it, issue compliance clearance for Friday launch.",
      drillPrompt:`You are an AI assistant for Rachel Okonkwo, Compliance Officer at Wealthsimple. Sources: Comms Review, OSC/CIRO Regulatory DB, Policy Vault, Outlook 365. Spring Mortgage Refinance Campaign launches Friday March 7. 3 emails reviewed: Email #1 and #2 cleared. Email #3 flagged — phrase 'This mortgage rate is right for you' is a suitability claim under OSC Rule 31-103, s.13.2, which requires individualized client assessment before any suitability recommendation. Suggested fix: replace with 'Competitive mortgage rates available for qualified applicants'. When Rachel approves, produce full COMPLIANCE CLEARANCE DOCUMENT labeled "COMPLIANCE CLEARANCE — Awaiting your approval and signature" including: officer name, date, campaign name, flagged phrase, approved replacement, regulatory basis, human review attestation. You cannot access AML or portfolio data.`
    },
    {
      id:"tile_2", urgency:"medium", label:"Filing Deadline",
      headline:"CIRO Q4 report due in 6 days — 2 sections need you",
      blurb:"The Q4 2024 CIRO Quarterly Compliance Report is due March 8. AI pre-filled 6 of 8 sections from the audit trail. Section 4 needs your attestation on three resolved complaints. Section 7 needs a written narrative explaining two late training completions.",
      sources:["OSC/CIRO Regulatory DB","Policy Vault","Outlook 365"],
      chips:["Draft the Section 7 training narrative","What exactly do I attest in Section 4?","Show me the pre-filled sections","Ready to submit the full report"],
      keyFacts:[
        {label:"Filing",          value:"CIRO Q4 2024 Quarterly Compliance Report"},
        {label:"Due date",        value:"March 8 — 6 days"},
        {label:"Sections done",   value:"6 of 8 — AI pre-filled from audit trail"},
        {label:"Section 4",       value:"Complaint log attestation — 3 complaints Q4, all resolved"},
        {label:"Section 7",       value:"Training narrative — 2 staff completed modules 4 days late"}
      ],
      orchestratorReasoning:"6-day window is tight with the campaign launch also on Friday. Section 7 narrative will take judgment — surfacing early to avoid a deadline crunch.",
      suggestedAction:"Draft Section 7 narrative first, then sign Section 4 attestation. Submit by Thursday to allow review buffer.",
      drillPrompt:`You are an AI assistant for Rachel Okonkwo, Compliance Officer at Wealthsimple. Sources: OSC/CIRO Regulatory DB, Policy Vault, Outlook 365. CIRO Q4 2024 Quarterly Compliance Report due March 8 (6 days). Sections 1–3, 5, 6, 8 are pre-filled from audit trail. Section 4: Complaint Log Attestation — 3 complaints received Q4, all resolved within policy timeframes, officer signature required. Section 7: Training Records Narrative — 2 staff (names withheld) completed mandatory compliance modules 4 days past deadline due to leave overlap; remedial completion confirmed. When ready to produce the full submission, label it "CIRO QUARTERLY SUBMISSION — Pre-filled, awaiting your approval". You cannot access AML or portfolio data.`
    },
    {
      id:"tile_3", urgency:"low", label:"Regulatory Watch",
      headline:"New OSC guidance — AI comms need disclosure",
      blurb:"OSC Staff Notice 11-940 (Feb 14) requires disclosure statements on AI-assisted client communications, effective immediately. The Friday mortgage campaign is unaffected (not AI-drafted). The upcoming RRSP campaign may need a disclosure clause added before launch.",
      sources:["OSC/CIRO Regulatory DB"],
      chips:["Which Q1 campaigns are affected?","Draft the AI disclosure memo","What disclosure language does OSC recommend?","Update the campaign review checklist"],
      keyFacts:[
        {label:"Notice",          value:"OSC Staff Notice 11-940 — published Feb 14, 2025"},
        {label:"Requirement",     value:"AI-drafted or AI-reviewed comms need disclosure + human review attestation"},
        {label:"Effective",       value:"Immediately — applies to all new campaigns"},
        {label:"Friday campaign", value:"Unaffected — mortgage campaign was human-drafted"},
        {label:"At risk",         value:"RRSP campaign (est. 4 Q1 campaigns total using AI copy)"}
      ],
      orchestratorReasoning:"Friday campaign is clear. RRSP campaign is in prep — now is the right time to update the review checklist before it becomes a blocker.",
      suggestedAction:"Update campaign checklist template to require AI disclosure clause. Draft memo for legal sign-off.",
      drillPrompt:`You are an AI assistant for Rachel Okonkwo, Compliance Officer at Wealthsimple. Sources: OSC/CIRO Regulatory DB, Policy Vault. OSC Staff Notice 11-940 (Feb 14, 2025): AI-assisted client communications require explicit disclosure statement and human review attestation, effective immediately. Applies to all campaigns where AI assisted in drafting or review. Friday mortgage campaign is unaffected (human-drafted). RRSP campaign (in prep) and est. 3 other Q1 campaigns may be affected. When drafting a policy memo, produce full document labeled "POLICY MEMO DRAFT — Awaiting your approval" suitable for legal distribution. You cannot access AML or portfolio data.`
    }
  ]
};


// ─── MOCK CHAT RESPONSES ─────────────────────────────────────────────────────
// Pre-written responses for all demo chips + common follow-ups.
// Matched by keyword so free-form variants also hit the right response.
// isAction:true responses trigger the Approve & Submit UI automatically.

const MOCK_RESPONSES = [

  // ── SARAH — Urgent Attention tile ─────────────────────────────────────────
  {
    match: ["draft email to david", "email david", "email for david"],
    persona: "sarah",
    isAction: true,
    content: `DRAFT EMAIL — Awaiting your approval

To: david.chen@email.com
Subject: Quick check-in — RRSP deadline & your portfolio

Hi David,

I wanted to reach out personally given a few things I've been tracking on your account.

Your portfolio has seen some pressure over the past few weeks — down about 11.2% — largely driven by the tech names we hold. I know market swings like this can be unsettling, and I want to make sure you're feeling good about your positioning.

I also noticed your RRSP contribution deadline is coming up in 8 days. Given where your account sits, it might be worth a quick conversation before you decide whether to contribute, and if so, how much.

I'd love to connect this week — even 20 minutes would be helpful. I'll send a calendar invite separately.

Warm regards,
Sarah Chen
Senior Wealth Advisor, Wealthsimple`
  },

  {
    match: ["set up meeting", "meeting invite", "calendar invite", "book meeting", "schedule meeting"],
    persona: "sarah",
    isAction: true,
    content: `DRAFT MEETING INVITE — Awaiting your approval

To: david.chen@email.com
Subject: Portfolio & RRSP Review — 20 min this week

Hi David,

I've sent a calendar invite for a 20-minute call to review your portfolio and RRSP options before the deadline. Please feel free to suggest an alternative time if this doesn't work.

——
📅 Proposed: Thursday, March 6 at 10:00 AM EST
🔗 Wealthsimple Video Call (link will be generated on confirmation)
⏱ Duration: 20 minutes
📋 Agenda: Portfolio positioning review + RRSP contribution decision

Looking forward to speaking with you.

Sarah Chen
Senior Wealth Advisor, Wealthsimple`
  },

  {
    match: ["who should i call", "who to call first", "who needs attention", "prioritize", "call first"],
    persona: "sarah",
    content: `Based on urgency scoring across your four flagged clients, here's the recommended order:

**1. David Chen — Act today**
Three signals firing at once: -11.2% drawdown, RRSP deadline in 8 days, 47 days no contact. The RRSP window is time-bound — this one can't slip to next week.

**2. Priya Kapoor — Today at 2:00 PM (already booked)**
Tech concentration hit 74% this week. She flagged anxiety on her last call, so lead with reassurance before getting into rebalancing options.

**3. Amara Nwosu — This week**
61 days no contact and her TFSA auto-invest is paused. She's on maternity leave — keep it brief and warm, not transactional.

**4. James Keller — By Friday**
$82K sitting idle for 90+ days. Low urgency but a clear opportunity. An email is fine.

Start with David Chen's email and meeting invite now — want me to draft both?`
  },

  {
    match: ["talking points for priya", "priya talking points", "priya call", "prepare for priya"],
    persona: "sarah",
    content: `Here are talking points for Priya's 2:00 PM call today:

**Open with reassurance (first 2 minutes)**
- Acknowledge the market has been choppy, especially in tech
- Normalize her concern — NVDA moving 8%+ in a week is unusual
- "Your long-term thesis hasn't changed. What we're seeing is volatility, not a structural shift."

**Address the concentration (middle)**
- Her tech exposure is now at 74% — above our 70% internal threshold
- Frame it as an opportunity to review, not a problem she created
- Suggest a light diversification into one or two non-correlated sectors (financials, infrastructure)
- Have 2–3 rebalancing scenarios ready; let her choose the pace

**Close with a plan (last 2 minutes)**
- Agree on a specific next step — even small: "Let's move 5% into a diversified ETF this week"
- Book a 30-day follow-up before you hang up

**Avoid**
- Projections or market predictions
- Saying "it'll bounce back" — she's heard that before

Want me to draft a follow-up email to send after the call?`
  },

  {
    match: ["book follow-up", "follow-up meetings", "follow ups for all", "follow up for all"],
    persona: "sarah",
    content: `Here's a suggested follow-up schedule for all four clients:

**David Chen** → Meeting this week (sending invite now) + RRSP decision by March 9
**Priya Kapoor** → Post-call email today, rebalancing review in 2 weeks
**Amara Nwosu** → Brief check-in email this week, full review when she's back from leave
**James Keller** → Email this week exploring TFSA or RRSP options for idle cash

Want me to draft the emails for Amara and James now while David and Priya are handled?`
  },

  // ── SARAH — Concentration Alert tile ──────────────────────────────────────
  {
    match: ["draft emails for all three", "draft personalized emails", "email all three"],
    persona: "sarah",
    isAction: true,
    content: `DRAFT EMAIL — Awaiting your approval

——— EMAIL 1: Priya Kapoor ———
To: priya.kapoor@email.com
Subject: Your portfolio this week — a quick note

Hi Priya,

Following up on our conversation — I wanted to flag that with NVDA's strong run this week, your tech allocation has moved to 74%. That's just above our internal 70% threshold.

Given we talked about your comfort with concentration risk, I'd suggest we take 30 minutes to look at a light rebalance. No urgency — but worth doing before it drifts further.

Are you free later this week?

Sarah

——— EMAIL 2: James Wu ———
To: james.wu@email.com
Subject: Tech allocation update — FYI

Hi James,

I know we just spoke a few days ago, so apologies for the quick follow-up — but NVDA's move this week pushed your tech exposure to 71%, which crosses our internal review threshold.

You may already be tracking this. Just wanted to make sure it was on your radar. Happy to discuss if you'd like to talk through options.

Sarah

——— EMAIL 3: Wei Zhang ———
To: wei.zhang@email.com
Subject: Portfolio note — tech concentration

Hi Wei,

Hope you're well. I wanted to flag that your portfolio's tech exposure just reached 70% — right at our internal threshold — driven largely by NVDA this week.

It's been a while since we connected (about a month). Would love to catch up and walk through your current positioning. Let me know if you have 20 minutes this week.

Sarah`
  },

  // ── SARAH — FHSA tile ─────────────────────────────────────────────────────
  {
    match: ["draft fhsa emails", "fhsa email", "email fhsa"],
    persona: "sarah",
    isAction: true,
    content: `DRAFT EMAIL — Awaiting your approval

——— EMAIL 1: Marcus Reid ———
To: marcus.reid@email.com
Subject: Year-end reminder — your FHSA has $8,000 available

Hi Marcus,

Exciting news on the home purchase front — I saw you're pre-approved and actively looking. I wanted to flag that your FHSA still has $8,000 in contribution room available before December 31.

Contributing now means a tax deduction this year and tax-free growth toward your down payment. Given your timeline, this could be meaningful.

Happy to walk through the numbers if you'd like — even a quick 15-minute call this week.

Sarah

——— EMAIL 2: Aisha Mohammed ———
To: aisha.mohammed@email.com
Subject: Your FHSA — $8,000 available before year-end

Hi Aisha,

Wanted to send a quick note before the holidays get busy — your FHSA has $8,000 of contribution room remaining this year.

Since you're actively saving for your first home, this is a great way to reduce your taxable income now and keep that money growing tax-free for your purchase. The deadline is December 31.

Let me know if you'd like to talk through how it fits into your savings plan.

Sarah`
  },

  // ── MARCUS — STR Filing tile ───────────────────────────────────────────────
  {
    match: ["walk me through", "walk through the case", "explain the case", "tell me about txn", "txn-2847"],
    persona: "marcus",
    content: `Here's the full case summary for TXN-2847:

**Subject**
Robert Beaumont (WS-7731029) — KYC risk rated Medium-High. Onboarded June 2021. One prior SAR filed in 2022, resolved with no further action.

**What triggered the flag**
On March 1st, $47,000 arrived via wire transfer from TD Bank at 9:14 AM. The same day at 2:32 PM, $46,800 was transferred out to a crypto exchange — with a Cayman Islands entity listed as the intermediary.

**Why this is structuring**
The near-identical in/out amounts (98.5% of inbound funds moved same-day), the speed of the transfer cycle, and the flagged Cayman intermediary are the three primary indicators. The Risk Engine flagged this as high priority — the combination of same-day cycle, near-identical amounts, and flagged intermediary jurisdiction meets the threshold for reasonable grounds to suspect.

**The $200 gap**
This is consistent with a fee-skimming pattern — the intermediary retaining a small amount. It's not exculpatory; it's actually a known structuring signature.

**Why the deadline matters**
Under PCMLTFA, we have 24 hours from the transaction date to file an STR with FINTRAC. The clock started March 1 at 2:32 PM — we have approximately 22 hours remaining.

**Prior SAR context**
The 2022 SAR was related to a different pattern (cash structuring) and was resolved. However, it establishes a risk history that strengthens the case for filing today.

Ready to generate the pre-filled FINTRAC STR form? Just say the word.`
  },

  {
    match: ["file the str", "generate the fintrac", "fintrac str form", "file str", "submit str"],
    persona: "marcus",
    isAction: true,
    content: `FINTRAC STR FORM — Pre-filled, awaiting your approval

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUSPICIOUS TRANSACTION REPORT
Financial Transactions and Reports Analysis Centre of Canada
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1 — REPORTING ENTITY
Entity Name: Wealthsimple Financial Inc.
FINTRAC Registration ID: 12994-WS
Report Type: Suspicious Transaction Report (STR)
Report Date: March 2, 2025
Reporting Officer: Marcus Williams, AML Analyst

SECTION 2 — SUBJECT INFORMATION
Full Name: Robert Beaumont
Client ID: WS-7731029
KYC Risk Rating: Medium-High
Account Opened: June 12, 2021
Prior STR/SAR History: 1 prior SAR (2022, resolved)

SECTION 3 — TRANSACTION DETAILS
Transaction 1:
  Type: Incoming wire transfer
  Amount: CAD $47,000.00
  Source: TD Bank
  Date/Time: 2025-03-01 at 09:14 EST

Transaction 2:
  Type: Outbound transfer
  Amount: CAD $46,800.00
  Destination: Crypto exchange (name on file)
  Intermediary: Cayman Islands entity — flagged jurisdiction
  Date/Time: 2025-03-01 at 14:32 EST

SECTION 4 — SUSPICIOUS INDICATORS
☑ Rapid movement of funds (same-day cycle, in and out within 5 hours)
☑ Near-identical amounts (98.5% of inbound funds transferred out same day)
☑ Use of flagged jurisdiction intermediary (Cayman Islands)
☑ Prior SAR history on account (2022, resolved)
☑ Transaction pattern consistent with structuring to avoid reporting thresholds

SECTION 5 — NARRATIVE
On March 1, 2025, client Robert Beaumont (WS-7731029) received a wire transfer of CAD $47,000 from TD Bank. Within five hours, $46,800 was transferred outbound through a Cayman Islands intermediary to a crypto exchange. The near-identical amounts, same-day cycle, and flagged intermediary jurisdiction are consistent with a structuring pattern designed to move funds while avoiding detection thresholds. The client has one prior SAR on file from 2022. Based on review of transaction records, KYC profile, and prior history, the reporting officer has determined that reasonable grounds exist to suspect this transaction is related to a money laundering offence. This report is filed within the 24-hour PCMLTFA reporting window.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  },

  {
    match: ["what makes this structuring", "why is this structuring", "structuring vs coincidence", "explain structuring"],
    persona: "marcus",
    content: `Three elements together make this structuring rather than coincidence:

**1. Same-day cycle with near-identical amounts**
$47,000 in, $46,800 out — 98.5% of funds moved within 5 hours. Legitimate business transactions don't typically show this pattern. The $200 retention is consistent with intermediary fee skimming, which is itself a structuring signature.

**2. Flagged jurisdiction intermediary**
The Cayman Islands entity isn't illegal on its own, but it's a jurisdiction with known use in layering schemes. Combined with the transaction pattern, it elevates the risk significantly.

**3. Prior SAR history**
Robert Beaumont had a cash structuring SAR in 2022. That case resolved, but it establishes a risk profile. A second structuring pattern in three years is a meaningful escalation.

**What would make it coincidence?**
If Beaumont had a documented reason for the transfer — a property purchase, a business payment, a scheduled crypto investment — that context would change the picture. KYC shows no such documented purpose. That's the gap.

All three factors together meet the reasonable grounds threshold under PCMLTFA. Ready to proceed with the STR?`
  },

  {
    match: ["transaction timeline", "show timeline", "show the transactions"],
    persona: "marcus",
    content: `Full transaction timeline for TXN-2847 / Robert Beaumont (WS-7731029):

**March 1, 2025**

09:14 EST — Incoming wire, CAD $47,000
  Source: TD Bank (verified sender on file)
  Reference: WS-WIRE-20250301-4421
  Status: Cleared normally, no initial flag

14:32 EST — Outbound transfer, CAD $46,800
  Destination: Crypto exchange (name on file)
  Intermediary: Cayman Islands entity (flagged jurisdiction)
  Transfer fee retained by intermediary: ~$200
  Status: Completed

14:33 EST — Risk Engine flag triggered
  Pattern: Rapid transfer cycle
  Risk Engine: High — structuring pattern
  24-hour FINTRAC window opened: 14:32 EST March 1

**March 2, 2025 (today)**

~14:32 EST — FINTRAC reporting deadline
  Hours remaining: approximately 22

No additional account activity since the outbound transfer.`
  },

  // ── MARCUS — Pattern Review tile ──────────────────────────────────────────
  {
    match: ["does this look like layering", "is this layering", "layering pattern"],
    persona: "marcus",
    content: `The pattern is consistent with layering, but confidence is 61% — here's the breakdown:

**What fits the layering profile**
- Multiple source senders (4 distinct e-transfer originators) consolidating into one account
- Consolidated outbound wire shortly after — "collect and move" is a classic layering step
- Account is 6 weeks old — new accounts are frequently used as pass-through vehicles
- KYC is incomplete: income unverified, so source of funds is unclear

**What doesn't confirm it conclusively**
- $38,400 total over 48 hours is below typical layering thresholds
- E-transfers from 4 senders could be legitimate (rent collection, shared expenses, freelance payments)
- Without income verification, we can't rule out a legitimate reason

**The KYC gap is the real problem**
If we had income verification, we could assess whether these deposits are plausible. Without it, we can't clear the account — but we also don't have enough to file a mandatory STR.

**Recommendation**
Initiate Enhanced Due Diligence: request income documentation and explanation of the 4 senders. If Mei-Ling Park can't provide satisfactory answers within 5 business days, escalate to voluntary SAR. Want me to draft the EDD request?`
  },

  {
    match: ["what kyc is missing", "kyc gap", "missing kyc", "kyc incomplete"],
    persona: "marcus",
    content: `Here's what's missing from Mei-Ling Park's KYC profile (WS-8832011):

**Required for full KYC — not on file:**
- Income verification (employment letter or NOA)
- Source of funds declaration
- Employer or business details

**On file (basic KYC only):**
- Government-issued ID ✓
- Address verification ✓
- Date of birth ✓
- SIN (partial, on file) ✓

**Why it matters for this case**
The 4 e-transfer senders can't be assessed without knowing if Park has a plausible income source that explains them. A freelancer or gig worker could legitimately receive from 4 parties. An account used for layering would show the same pattern.

The income gap is what prevents us from clearing this — and what makes EDD the right next step rather than immediate SAR filing.

Want me to draft the EDD documentation request to send to the client?`
  },

  // ── MARCUS — Queue Summary tile ───────────────────────────────────────────
  {
    match: ["show the 2 edge cases", "edge cases", "show edge cases"],
    persona: "marcus",
    content: `Here are the 2 overnight edge cases flagged for spot-check:

**Edge Case 1 — WS-3341082**
Amount: $4,200 e-transfer inbound
AI decision: Cleared as recurring payroll
Confidence: 39%
Why it's borderline: Sender name partially matches a known payroll processor but the amount is 18% higher than the prior 6 months average. AI cleared it based on the overall pattern, but the variance is worth a second look.

**Edge Case 2 — WS-5512901**
Amount: $3,800 cash deposit
AI decision: Cleared vs 24-month baseline
Confidence: 38%
Why it's borderline: Client historically deposits $2,000–$2,500 monthly in cash. $3,800 is a new high. No other risk indicators on the account. AI cleared it as a one-time variance, but it's outside the normal range.

**My assessment**
Both decisions look defensible. Edge Case 1 warrants a note in the file about the amount variance. Edge Case 2 is a statistical outlier but not a behavioral one.

If you confirm both, I can log the review and mark the queue complete. Want to proceed?`
  },

  // ── RACHEL — Launch Blocker tile ──────────────────────────────────────────
  {
    match: ["show flagged phrase", "flagged phrase", "show the flagged", "what's flagged", "which email"],
    persona: "rachel",
    content: `Here's Email #3 in full context, with the flagged phrase highlighted:

——— EMAIL #3 — Main Offer Email ———

Subject: Unlock a better mortgage rate this spring

Hi [First Name],

Spring is the busiest season for home purchases and refinancing — and rates are moving. Whether you're buying your first home or looking to optimize your current mortgage, Wealthsimple has options worth exploring.

❌ FLAGGED: "This mortgage rate is right for you."

Our team is here to help you navigate your options with no pressure and full transparency.

[CTA: Explore mortgage rates]

———

**Why it's flagged**
"This mortgage rate is right for you" implies a suitability assessment has been made — that this specific rate is appropriate for this specific client. Under OSC Rule 31-103 s.13.2, suitability requires an individualized assessment. A mass-blast email cannot constitute one.

**The fix**
Replace with: "Competitive mortgage rates available for qualified applicants."

This language presents rates as available (not recommended), which doesn't trigger the suitability rule. Emails #1 and #2 are fully cleared.

Ready to approve the fix and issue clearance?`
  },

  {
    match: ["approve fix", "approve the fix", "issue clearance", "approve and clear", "clear the campaign"],
    persona: "rachel",
    isAction: true,
    content: `COMPLIANCE CLEARANCE — Awaiting your approval and signature

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPLIANCE CLEARANCE DOCUMENT
Wealthsimple Financial Inc. — Legal & Compliance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Compliance Officer: Rachel Okonkwo
Date: March 2, 2025
Campaign: Spring Mortgage Refinance Campaign
Scheduled Launch: Friday, March 7, 2025

REVIEW SUMMARY
Emails reviewed: 3
Emails cleared without changes: 2 (Email #1, Email #2)
Emails requiring amendment: 1 (Email #3)

AMENDMENT RECORD
Email #3 — Main Offer Email
  Flagged phrase: "This mortgage rate is right for you."
  Regulatory basis: OSC Rule 31-103, s.13.2 — Suitability Obligation
  Risk assessment: Mass-blast language implying individualized suitability recommendation without prior assessment
  Approved replacement: "Competitive mortgage rates available for qualified applicants."
  Amendment status: Approved

ATTESTATION
I, Rachel Okonkwo, Compliance Officer, hereby attest that:
1. All three campaign emails have been reviewed for regulatory compliance
2. The amendment to Email #3 has been reviewed and approved
3. The amended campaign is cleared for launch on March 7, 2025
4. This review was conducted in accordance with CIRO Rule 3400 supervisory procedures

[ Signature line ]
Rachel Okonkwo — Compliance Officer
Wealthsimple Financial Inc.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  },

  {
    match: ["what rule applies", "what does osc", "osc 31-103", "explain the rule"],
    persona: "rachel",
    content: `The applicable rule is **OSC Rule 31-103, Section 13.2 — Suitability Obligation**.

**What it requires**
Before making a recommendation or taking an action that could reasonably be considered a recommendation, a registered firm must take reasonable steps to ensure the recommendation is suitable for the specific client based on their individual circumstances.

**Why "right for you" triggers it**
The phrase "this mortgage rate is right for you" does two things that create exposure:
1. It implies a recommendation has been made ("right for you")
2. It implies that recommendation is personalized ("for you")

A mass email campaign cannot perform an individualized suitability assessment. If a client relies on that phrase and the rate turns out to be unsuitable for their situation, Wealthsimple has a documented liability.

**Why the replacement works**
"Competitive mortgage rates available for qualified applicants" is informational, not advisory. It describes what exists, not what's recommended. It doesn't imply personalization. It passes the OSC test.

**The broader pattern to watch**
Any language using "right for you," "perfect for your situation," "we recommend," or "based on your profile" in a mass communication should be flagged. The rule requires individual assessment — marketing language that implies it without performing it is the exposure.

Ready to approve the fix?`
  },

  // ── RACHEL — CIRO Filing tile ─────────────────────────────────────────────
  {
    match: ["draft section 7", "section 7 narrative", "training narrative", "write section 7"],
    persona: "rachel",
    isAction: true,
    content: `CIRO QUARTERLY SUBMISSION — Pre-filled, awaiting your approval

SECTION 7 — Training Records Narrative (DRAFT)

During Q4 2024, two staff members completed mandatory compliance training modules four days past the designated completion deadline of November 30, 2024.

The delay was attributable to an overlap in scheduled leave during the final week of November. Both employees were on pre-approved personal leave during the original deadline window. Remedial completion was confirmed by December 4, 2024 — within five business days of the original deadline.

No substantive compliance knowledge gap resulted from the delay. Both employees passed the module assessments with scores above the required threshold. Updated completion records have been logged in the firm's training management system.

Going forward, the compliance team has implemented a 10-business-day advance notification for upcoming training deadlines to allow for leave conflict resolution before the deadline window closes.

——— END SECTION 7 ———

Note: Sections 1–3, 5, 6, and 8 have been pre-filled from the Q4 audit trail and are ready for your review. Section 4 (Complaint Log Attestation) still requires your signature once you've reviewed the three Q4 complaints on file (all resolved).`
  },

  {
    match: ["what to attest in section 4", "section 4", "complaint attestation", "attest section 4"],
    persona: "rachel",
    content: `Section 4 requires you to personally attest to the following:

**The three Q4 complaints on file:**

1. **Complaint #WS-C-2024-087** (October)
   Client alleged a delay in TFSA transfer processing. Resolved in 6 business days — within our SLA. Client notified of resolution.

2. **Complaint #WS-C-2024-091** (November)
   Client disputed a fee charge on a managed portfolio. Fee was correctly applied per the client agreement. Client provided with fee schedule documentation. Resolved, client accepted.

3. **Complaint #WS-C-2024-098** (December)
   Client reported difficulty accessing statements through the app. Technical issue confirmed; resolved by the product team within 48 hours. Client follow-up completed.

**What your attestation confirms:**
- All three complaints were received and logged within required timeframes
- Each was investigated and resolved in accordance with CIRO Rule 3100 (Complaints Handling)
- No complaints warranted escalation to CIRO or external review
- The complaint log is accurate and complete as of December 31, 2024

Ready to generate the full submission with both sections included?`
  },

  // ── RACHEL — Bottom orchestrator chat ────────────────────────────────────
  {
    match: ["what's blocking the current campaign", "blocking the current campaign", "what is blocking", "blocking the campaign", "campaign blocked", "campaign blocker"],
    persona: "rachel",
    content: `I checked across Comms Review, OSC/CIRO Regulatory DB, and Policy Vault. Here is what is blocking the Spring Mortgage Refinance Campaign from launching Friday:

**The issue**
Email #3 — the main offer email — contains the phrase "This mortgage rate is right for you." That is a suitability claim under OSC Rule 31-103, s.13.2. A mass-blast email cannot constitute an individualized client assessment. If it goes out as written, it creates direct regulatory exposure.

**Status**
Emails #1 and #2 are fully cleared. Email #3 is the only blocker. The campaign cannot launch until it is resolved.

**The fix**
Replace the flagged phrase with: "Competitive mortgage rates available for qualified applicants." This is informational language — it describes what is available without implying a personalized recommendation.

**What needs to happen**
You review and approve the fix, then issue a compliance clearance document. Once that is signed, the campaign is clear for Friday launch.

Want me to prepare the clearance document now?`
  },

  // ── GENERAL FALLBACKS ─────────────────────────────────────────────────────
  {
    match: ["done", "submitted", "approved", "confirm", "looks good", "send it"],
    persona: "any",
    content: `Done — submitted and logged.`
  }
];

// ─── MOCK RESPONSE MATCHER ────────────────────────────────────────────────────
function findMockResponse(text, personaId) {
  const lower = text.toLowerCase();
  for (const r of MOCK_RESPONSES) {
    if (r.persona !== "any" && r.persona !== personaId) continue;
    if (r.match.some(kw => lower.includes(kw))) return r;
  }
  return null;
}

// ─── STREAMING CLAUDE CALL ────────────────────────────────────────────────────
async function streamClaude(messages, system, onChunk) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:1200, stream:true, system,
      messages: messages
        .filter(m => m.role && m.content && !m.isAction)
        .map(m => ({ role:m.role, content:m.content }))
    })
  });
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          const d = JSON.parse(line.slice(6));
          if (d.delta?.text) { full += d.delta.text; onChunk(full); }
        } catch {}
      }
    }
  }
  return full;
}

// ─── CHAT HOOK ───────────────────────────────────────────────────────────────
function useChat(system, sources, onApproved, personaId) {
  const [msgs,    setMsgs]    = useState([]);
  const [busy,    setBusy]    = useState(false);
  const [routing, setRouting] = useState(false);
  const [rStep,   setRStep]   = useState(0);

  const resolveResponse = (mock) => {
    if (mock.isAction) {
      return {
        isAction:true, content:mock.content, pending:true,
        approve: () => {
          setMsgs(p2 => p2.map((m, i) => i === p2.length - 1 ? {...m, pending:false, done:true} : m));
          setTimeout(() => {
            setMsgs(p2 => [...p2, { role:"assistant", content:"Done — submitted and logged." }]);
            if (onApproved) onApproved();
          }, 400);
        },
        edit: () => setMsgs(p2 => [...p2, { role:"assistant", content:"Of course — what would you like to change?" }])
      };
    }
    return { role:"assistant", content:mock.content };
  };

  const send = async (text, extraCtx = "") => {
    const next = [...msgs, { role:"user", content:text }];
    setMsgs(next);
    setBusy(true);
    setRouting(true);
    setRStep(0);
    // Animate through sources
    for (let i = 0; i <= sources.length; i++) {
      await new Promise(r => setTimeout(r, 180));
      setRStep(i);
    }
    await new Promise(r => setTimeout(r, 200));
    setRouting(false);

    // Check mock responses first — instant, no API call needed
    const mock = findMockResponse(text, personaId);
    if (mock) {
      // Simulate a brief "thinking" pause so it feels natural on screen
      await new Promise(r => setTimeout(r, 400));
      setMsgs(p => [...p, resolveResponse(mock)]);
      setBusy(false);
      return;
    }

    // Fallback to live API for anything not in the mock bank
    setMsgs(p => [...p, { role:"assistant", content:"", stream:true }]);
    try {
      let out = "";
      await streamClaude(next, system + (extraCtx ? `\n\n${extraCtx}` : ""), chunk => {
        out = chunk;
        setMsgs(p => {
          const u = [...p];
          const li = u.length - 1;
          if (u[li]?.stream) u[li] = { role:"assistant", content:chunk, stream:true };
          return u;
        });
      });
      const isAct = /awaiting your approval|pre-filled|draft (email|form|memo|document|clearance|submission)/i.test(out);
      setMsgs(p => {
        const u = [...p];
        const li = u.length - 1;
        if (isAct) {
          u[li] = {
            isAction:true, content:out, pending:true,
            approve: () => {
              setMsgs(p2 => p2.map((m, i) => i === li ? {...m, pending:false, done:true} : m));
              setTimeout(() => {
                setMsgs(p2 => [...p2, { role:"assistant", content:"Done — submitted and logged." }]);
                if (onApproved) onApproved();
              }, 400);
            },
            edit: () => setMsgs(p2 => [...p2, { role:"assistant", content:"Of course — what would you like to change?" }])
          };
        } else {
          u[li] = { role:"assistant", content:out };
        }
        return u;
      });
    } catch {
      setMsgs(p => { const u=[...p]; u[u.length-1] = { role:"assistant", content:"Connection error — please try again." }; return u; });
    }
    setBusy(false);
  };

  return { msgs, busy, routing, rStep, send };
}

// ─── UI PRIMITIVES ───────────────────────────────────────────────────────────
const URGENCY = {
  high:   { label:"Urgent", dot:"#ef4444", tc:"#dc2626" },
  medium: { label:"Today",  dot:"#f59e0b", tc:"#b45309" },
  low:    { label:"FYI",    dot:"#94a3b8", tc:"#64748b" }
};

function Pill({ label, color }) {
  return (
    <span style={{
      fontSize:9, fontWeight:700, letterSpacing:"0.06em",
      padding:"2px 8px", borderRadius:99,
      background:color+"22", color,
      fontFamily:"monospace", textTransform:"uppercase", whiteSpace:"nowrap"
    }}>{label}</span>
  );
}

function RoutingBar({ sources, accent, on, step }) {
  if (!on) return null;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:5, flexWrap:"wrap",
      padding:"7px 12px", background:"#f8f8f8", borderRadius:8,
      marginBottom:10, border:"1px solid #ebebeb"
    }}>
      <span style={{ fontSize:9, color:"#bbb", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.08em" }}>
        Querying
      </span>
      {sources.map((src, i) => (
        <span key={src} style={{
          fontSize:9.5, fontFamily:"monospace", fontWeight:700,
          color: i < step ? accent : i === step ? accent+"99" : "#ccc",
          transition:"color 0.3s",
          display:"flex", alignItems:"center", gap:3
        }}>
          {i < step ? "✓" : i === step ? "▸" : "○"} {src}
          {i < sources.length - 1 && <span style={{ color:"#ddd", margin:"0 2px" }}>→</span>}
        </span>
      ))}
      {step >= sources.length && (
        <span style={{ fontSize:9.5, color:accent, fontWeight:700, marginLeft:4 }}>
          Synthesizing...
        </span>
      )}
    </div>
  );
}

function SkeletonTile() {
  return (
    <div style={{
      background:"#fff", border:"1px solid #eee", borderRadius:14,
      padding:"20px", display:"flex", flexDirection:"column", gap:10
    }}>
      {[80, 120, 60, 40].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 10 : i === 1 ? 16 : 10,
          width:`${w}%`, borderRadius:6,
          background:"#f0f0f0",
          animation:"shimmer 1.4s ease infinite"
        }}/>
      ))}
    </div>
  );
}

function ThinkingDots({ accent }) {
  return (
    <div style={{ display:"flex", gap:5, padding:"9px 13px", background:"#f0f0f0", borderRadius:16, width:"fit-content", marginTop:2 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:6, height:6, borderRadius:99, background:accent,
          animation:`dp 1.2s ${i*0.2}s infinite`
        }}/>
      ))}
    </div>
  );
}

// ─── BUBBLE ───────────────────────────────────────────────────────────────────
function Bubble({ msg, accent }) {
  const isUser = msg.role === "user";
  if (msg.isAction) {
    return (
      <div style={{ margin:"10px 0", padding:"14px 16px", borderRadius:12, border:`1.5px solid ${accent}55`, background:accent+"0a" }}>
        <div style={{ fontSize:9.5, fontWeight:800, letterSpacing:"0.1em", color:accent, marginBottom:8, textTransform:"uppercase" }}>
          Action Ready — Awaiting Your Approval
        </div>
        <div style={{
          fontSize:11.5, color:"#1a1a1a", lineHeight:1.8, whiteSpace:"pre-wrap",
          fontFamily:"'Courier New',monospace", background:"#fff",
          padding:"10px 12px", borderRadius:8, border:"1px solid #eee",
          maxHeight:260, overflowY:"auto"
        }}>{msg.content}</div>
        {msg.pending && (
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <button onClick={msg.approve} style={{ padding:"7px 18px", borderRadius:8, border:"none", background:accent, color:"#fff", fontWeight:700, fontSize:12.5, cursor:"pointer" }}>
              Approve & Submit
            </button>
            <button onClick={msg.edit} style={{ padding:"7px 18px", borderRadius:8, border:"1.5px solid #ddd", background:"#fff", color:"#666", fontWeight:600, fontSize:12.5, cursor:"pointer" }}>
              Edit
            </button>
          </div>
        )}
        {msg.done && <div style={{ marginTop:8, fontSize:12, color:"#16a34a", fontWeight:700 }}>✓ Submitted and logged</div>}
      </div>
    );
  }
  return (
    <div style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start", margin:"4px 0" }}>
      <div style={{
        maxWidth:"84%", padding:"9px 13px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
        background: isUser ? accent : "#f0f0f0",
        color: isUser ? "#fff" : "#1a1a1a",
        fontSize:13.5, lineHeight:1.65, whiteSpace:"pre-wrap"
      }}>
        {msg.content || <span style={{ opacity:0.3 }}>...</span>}
      </div>
    </div>
  );
}

function ChatInput({ onSend, busy, accent, placeholder, autoFocus }) {
  const [v, setV] = useState("");
  const ref = useRef(null);
  useEffect(() => { if (autoFocus && ref.current) setTimeout(() => ref.current?.focus(), 80); }, [autoFocus]);
  const go = () => { if (!v.trim() || busy) return; onSend(v.trim()); setV(""); };
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
      <textarea
        ref={ref} value={v}
        onChange={e => setV(e.target.value)} rows={2}
        onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); go(); } }}
        placeholder={placeholder || "Ask a question or request an action..."}
        style={{
          flex:1, padding:"10px 13px", borderRadius:10,
          border:`1.5px solid ${busy ? accent+"99" : "#e0e0e0"}`,
          fontSize:13.5, resize:"none", outline:"none",
          fontFamily:"inherit", lineHeight:1.5, background:"#fff"
        }}/>
      <button onClick={go} disabled={busy || !v.trim()} style={{
        width:42, height:42, borderRadius:10, border:"none",
        background: (!v.trim() || busy) ? "#e0e0e0" : accent,
        color:"#fff", fontSize:17, cursor:busy?"wait":"pointer",
        flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center"
      }}>↑</button>
    </div>
  );
}

// ─── TILE CARD ────────────────────────────────────────────────────────────────
function TileCard({ tile, persona, onOpen, fb, setFb }) {
  const u = URGENCY[tile.urgency] || URGENCY.low;
  const done = fb==="done", skip = fb==="skip", acted = done||skip;

  return (
    <div style={{
      background: done?"#f0fdf4" : skip?"#fafafa" : "#fff",
      border:`1px solid ${done?"#bbf7d0" : skip?"#e5e5e5" : tile.urgency==="high" ? persona.accent+"55" : "#e8e8e8"}`,
      borderRadius:14, padding:"20px", position:"relative", overflow:"hidden",
      transition:"all 0.25s", opacity:acted?0.7:1,
      display:"flex", flexDirection:"column"
    }}>
      {tile.urgency==="high" && !acted && (
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:persona.accent, borderRadius:"14px 14px 0 0" }}/>
      )}
      {done && (
        <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"#16a34a", borderRadius:"14px 14px 0 0" }}/>
      )}

      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
        <div style={{ width:6, height:6, borderRadius:99, background: done?"#16a34a" : skip?"#ccc" : u.dot, flexShrink:0 }}/>
        <span style={{ fontSize:9.5, fontWeight:800, letterSpacing:"0.1em", color: done?"#16a34a" : skip?"#bbb" : u.tc, textTransform:"uppercase" }}>
          {done?"Done" : skip?"Skipped" : u.label}
        </span>
        <span style={{ color:"#ddd", fontSize:10 }}>·</span>
        <span style={{ fontSize:9.5, fontWeight:600, color:"#ccc", textTransform:"uppercase", letterSpacing:"0.06em" }}>{tile.label}</span>
      </div>

      <div style={{ fontSize:15, fontWeight:700, color:acted?"#aaa":"#111", marginBottom:6, lineHeight:1.3 }}>{tile.headline}</div>
      <div style={{ fontSize:12.5, color:acted?"#ccc":"#666", lineHeight:1.6, marginBottom:14, flex:1 }}>{tile.blurb}</div>

      {/* Source pills */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:16 }}>
        {(tile.sources||[]).map(s => <Pill key={s} label={s} color={acted?"#bbb":persona.accent}/>)}
      </div>

      {!acted ? (
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => onOpen(tile)} style={{
            flex:1, padding:"9px 14px", borderRadius:9, border:"none",
            background:persona.accent, color:"#fff", fontWeight:700, fontSize:12.5, cursor:"pointer"
          }}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
            Review & Act →
          </button>
          <button onClick={()=>setFb("done")} title="Mark done" style={{
            width:36, height:36, borderRadius:9, border:"1.5px solid #bbf7d0",
            background:"#f0fdf4", color:"#16a34a", fontSize:16, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, flexShrink:0
          }}>✓</button>
          <button onClick={()=>setFb("skip")} title="Not helpful" style={{
            width:36, height:36, borderRadius:9, border:"1.5px solid #e5e5e5",
            background:"#fafafa", color:"#bbb", fontSize:18, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, flexShrink:0
          }}>×</button>
        </div>
      ) : (
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11.5, color:done?"#16a34a":"#aaa", fontWeight:600 }}>
            {done ? "✓ AI will reinforce this signal" : "✗ AI will recalibrate this tile"}
          </span>
          <button onClick={()=>setFb(null)} style={{ marginLeft:"auto", fontSize:11, color:"#bbb", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

// ─── DRILL DOWN ───────────────────────────────────────────────────────────────
function DrillDown({ tile, persona, onClose, onDone }) {
  const { msgs, busy, routing, rStep, send } = useChat(
    tile.drillPrompt || `You are an AI assistant for ${persona.name}, ${persona.role} at Wealthsimple. Sources: ${persona.mcps.join(", ")}. When producing drafts, label them "DRAFT — Awaiting your approval".`,
    tile.sources || persona.mcps,
    () => setTimeout(() => onDone(tile.id), 600),
    persona.id
  );
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs, busy]);

  const facts = tile.keyFacts || [];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", flexDirection:"column", background:"#fff" }}>
      {/* Header */}
      <div style={{ height:52, background:persona.color, display:"flex", alignItems:"center", padding:"0 24px", gap:14, flexShrink:0 }}>
        <button onClick={onClose} style={{
          background:"rgba(255,255,255,0.15)", border:"none", borderRadius:7,
          padding:"6px 14px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer"
        }}>← Back</button>
        <div style={{ width:1, height:20, background:"rgba(255,255,255,0.2)" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:99, background:URGENCY[tile.urgency]?.dot||"#94a3b8" }}/>
          <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.1em", color:"rgba(255,255,255,0.6)", textTransform:"uppercase" }}>{tile.label}</span>
          <span style={{ color:"rgba(255,255,255,0.3)" }}>·</span>
          <span style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{tile.headline}</span>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
          {(tile.sources||[]).map(s => <Pill key={s} label={s} color="rgba(255,255,255,0.65)"/>)}
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {/* LEFT — Chat */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", borderRight:"1px solid #eee" }}>
          <div style={{ padding:"10px 18px", borderBottom:"1px solid #f5f5f5", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:99, background:persona.accent, animation:"pulse 2s infinite" }}/>
            <span style={{ fontSize:11, fontWeight:700, color:persona.color }}>Orchestrator Chat</span>
            <span style={{ fontSize:10, color:"#ccc", marginLeft:"auto" }}>Tile context loaded · {persona.mcps.join(" · ")}</span>
          </div>

          <div ref={ref} style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
            <RoutingBar sources={tile.sources||[]} accent={persona.accent} on={routing} step={rStep}/>

            {msgs.length===0 && !routing && (
              <div>
                <p style={{ color:"#bbb", fontSize:13, fontStyle:"italic", marginBottom:14 }}>Brief loaded. What would you like to do?</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {(tile.chips||[]).map(c => (
                    <button key={c} onClick={() => send(c)} style={{
                      padding:"10px 14px", borderRadius:9,
                      border:`1.5px solid ${persona.accent}44`,
                      background:persona.light, color:persona.color,
                      fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left", transition:"background 0.15s"
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background=persona.accent+"22"}
                    onMouseLeave={e=>e.currentTarget.style.background=persona.light}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => <Bubble key={i} msg={m} accent={persona.accent}/>)}
            {busy && !routing && <ThinkingDots accent={persona.accent}/>}
          </div>

          <div style={{ padding:"12px 20px 18px", borderTop:"1px solid #f0f0f0", background:"#fff" }}>
            <ChatInput onSend={send} busy={busy} accent={persona.accent} autoFocus/>
          </div>
        </div>

        {/* RIGHT — Intelligence Brief */}
        <div style={{ width:360, overflowY:"auto", background:"#fafafa", flexShrink:0 }}>
          <div style={{ padding:"18px 22px", borderBottom:"1px solid #eee" }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.1em", color:"#ccc", textTransform:"uppercase", marginBottom:6 }}>
              Intelligence Brief
            </div>
            <div style={{ fontSize:13, color:"#777", lineHeight:1.6 }}>{tile.blurb}</div>
          </div>

          {/* Key Facts */}
          {facts.length > 0 && (
            <div style={{ padding:"16px 22px", borderBottom:"1px solid #eee" }}>
              <div style={{ fontSize:10, fontWeight:800, color:"#ccc", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Key Facts</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {facts.map((f, i) => (
                  <div key={i} style={{ background:"#fff", borderRadius:9, padding:"9px 12px", border:"1px solid #eee" }}>
                    <div style={{ fontSize:9.5, fontWeight:700, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{f.label}</div>
                    <div style={{ fontSize:12.5, color:"#333", lineHeight:1.5 }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orchestrator Reasoning */}
          {tile.orchestratorReasoning && (
            <div style={{ padding:"16px 22px", borderBottom:"1px solid #eee" }}>
              <div style={{ fontSize:10, fontWeight:800, color:"#ccc", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Why This Surfaced Today</div>
              <div style={{ fontSize:12.5, color:"#555", lineHeight:1.6, fontStyle:"italic" }}>{tile.orchestratorReasoning}</div>
            </div>
          )}

          {/* Suggested Action */}
          {tile.suggestedAction && (
            <div style={{ padding:"16px 22px" }}>
              <div style={{ fontSize:10, fontWeight:800, color:"#ccc", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Suggested Action</div>
              <div style={{
                fontSize:13, color:persona.color, fontWeight:600, lineHeight:1.6,
                background:persona.light, padding:"10px 13px", borderRadius:9, border:`1px solid ${persona.accent}33`
              }}>{tile.suggestedAction}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM CHAT ──────────────────────────────────────────────────────────────
function BottomChat({ persona, open, toggle }) {
  const sys = `You are an AI orchestrator for ${persona.name}, ${persona.role} at Wealthsimple. You have access to: ${persona.mcps.join(", ")}. Help explore data, surface insights, and take actions. When producing any draft, label it "DRAFT — Awaiting your approval". Only access data within ${persona.name}'s role permissions.`;
  const { msgs, busy, routing, rStep, send } = useChat(sys, persona.mcps, null, persona.id);
  const ref = useRef(null);
  useEffect(() => { if (ref.current && open) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs, busy, open]);

  return (
    <div style={{ background:"#fff", borderTop:"1px solid #e5e5e5", flexShrink:0 }}>
      <div onClick={toggle} style={{
        height:46, display:"flex", alignItems:"center", padding:"0 24px", gap:10,
        cursor:"pointer", userSelect:"none",
        background:open ? persona.color : "#fff", transition:"background 0.2s"
      }}>
        <div style={{ width:7, height:7, borderRadius:99, background:open?"rgba(255,255,255,0.7)":persona.accent, animation:"pulse 2s infinite" }}/>
        <span style={{ fontSize:13, fontWeight:700, color:open?"#fff":persona.color }}>Ask the Orchestrator</span>
        {!open && (
          <span style={{ fontSize:12, color:"#bbb" }}>
            {msgs.length > 0
              ? `${msgs.length} message${msgs.length>1?"s":""} in session`
              : `— ask anything across ${persona.mcps.length} sources`}
          </span>
        )}
        <span style={{ marginLeft:"auto", fontSize:13, color:open?"rgba(255,255,255,0.5)":"#ccc", display:"inline-block", transform:open?"rotate(180deg)":"none", transition:"transform 0.2s" }}>▾</span>
      </div>

      <div style={{ height:open?360:0, overflow:"hidden", transition:"height 0.25s ease", display:"flex", flexDirection:"column" }}>
        {open && (
          <>
            <div ref={ref} style={{ flex:1, overflowY:"auto", padding:"12px 24px", minHeight:0 }}>
              <RoutingBar sources={persona.mcps} accent={persona.accent} on={routing} step={rStep}/>
              {msgs.length===0 && !routing && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {persona.suggestions.map(s => (
                    <button key={s} onClick={()=>send(s)} style={{
                      padding:"6px 13px", borderRadius:99,
                      border:`1.5px solid ${persona.accent}44`,
                      background:persona.light, color:persona.color,
                      fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap"
                    }}>{s}</button>
                  ))}
                </div>
              )}
              {msgs.map((m, i) => <Bubble key={i} msg={m} accent={persona.accent}/>)}
              {busy && !routing && <ThinkingDots accent={persona.accent}/>}
            </div>
            <div style={{ padding:"8px 24px 14px", borderTop:"1px solid #f5f5f5" }}>
              <ChatInput onSend={send} busy={busy} accent={persona.accent} placeholder={`Ask across ${persona.mcps.join(", ")}...`}/>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [pid,      setPid]      = useState("sarah");
  const [drill,    setDrill]    = useState(null);
  const [fb,       setFb]       = useState({});
  const [chatOpen, setChatOpen] = useState(false);

  const persona = PERSONAS_CONFIG[pid];
  const { tiles, loading, routing, routeStep, error, refresh } = useTileOrchestrator(persona);

  const now = new Date().toLocaleDateString("en-CA", { weekday:"long", month:"long", day:"numeric" });
  const urgentLeft = (tiles||[]).filter(t => t.urgency==="high" && !fb[t.id]).length;

  const handleDone = id => { setFb(x => ({...x, [id]:"done"})); setDrill(null); };

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", fontFamily:"'DM Sans',system-ui,sans-serif", background:"#f4f4f2", overflow:"hidden" }}>

      {/* ── NAV ── */}
      <div style={{ height:52, background:"#0f172a", display:"flex", alignItems:"center", padding:"0 24px", gap:16, flexShrink:0 }}>
        <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#22c55e,#3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:"#0f172a" }}>W</div>
        <span style={{ color:"#fff", fontWeight:700, fontSize:14 }}>Wealthsimple Intelligence</span>
        <span style={{ color:"#ffffff33", fontSize:13 }}>/</span>
        <span style={{ color:"#ffffff55", fontSize:13 }}>Orchestrated Platform</span>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:16 }}>
          <span style={{ color:"#ffffff44", fontSize:11 }}>{now}</span>
          <div style={{ display:"flex", alignItems:"center", gap:7, background:"#ffffff0e", borderRadius:8, padding:"5px 12px" }}>
            <div style={{ width:6, height:6, borderRadius:99, background: loading ? "#f59e0b" : "#22c55e", animation:"pulse 2s infinite" }}/>
            <span style={{ color:"#fff", fontSize:11, fontWeight:600 }}>
              {loading ? "Orchestrator Running..." : "Orchestrator Active"}
            </span>
          </div>
        </div>
      </div>

      {/* ── PERSONA TABS ── */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e8e8e8", display:"flex", alignItems:"stretch", padding:"0 24px", gap:2, flexShrink:0 }}>
        {Object.values(PERSONAS_CONFIG).map(q => {
          const active = pid === q.id;
          return (
            <button key={q.id}
              onClick={() => { setPid(q.id); setDrill(null); setChatOpen(false); setFb({}); }}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 18px", background:"none", border:"none", borderBottom:`2.5px solid ${active?q.accent:"transparent"}`, cursor:"pointer", transition:"all 0.15s" }}>
              <div style={{ width:32, height:32, borderRadius:99, background:active?q.color:"#ebebeb", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10.5, fontWeight:800, color:active?"#fff":"#aaa", flexShrink:0 }}>{q.avatar}</div>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontSize:13, fontWeight:700, color:active?q.color:"#555", lineHeight:1.2 }}>{q.name}</div>
                <div style={{ fontSize:10.5, color:"#bbb" }}>{q.role}</div>
              </div>
            </button>
          );
        })}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, padding:"0 6px" }}>
          {persona.mcps.map(m => <Pill key={m} label={m} color={persona.accent}/>)}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"28px 28px 16px", minHeight:0 }}>

        {/* Greeting */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:20, fontWeight:800, color:"#111", letterSpacing:"-0.02em" }}>{persona.greeting}</div>
          <div style={{ fontSize:13, color:"#999", marginTop:3 }}>
            {loading
              ? <span style={{ color:persona.accent, fontWeight:600 }}>Scanning {persona.mcps.join(", ")}...</span>
              : urgentLeft > 0
                ? <><span style={{ color:"#dc2626", fontWeight:700 }}>{urgentLeft} urgent item{urgentLeft>1?"s":""}</span> · Orchestrator scanned {persona.mcps.length} sources.</>
                : `Orchestrator scanned ${persona.mcps.length} sources. No urgent items.`}
          </div>
        </div>

        {/* Routing animation while loading */}
        {loading && (
          <div style={{ marginBottom:20 }}>
            <RoutingBar sources={persona.mcps} accent={persona.accent} on={routing} step={routeStep}/>
            {!routing && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0" }}>
                <ThinkingDots accent={persona.accent}/>
                <span style={{ fontSize:12, color:persona.accent, fontWeight:600, marginLeft:4 }}>Prioritizing tiles...</span>
              </div>
            )}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{ marginBottom:16, padding:"10px 14px", background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:8, fontSize:12, color:"#92400E", display:"flex", alignItems:"center", gap:10 }}>
            <span>⚠ API unavailable — showing cached intelligence.</span>
            <button onClick={refresh} style={{ marginLeft:"auto", fontSize:11, color:"#92400E", background:"none", border:"1px solid #fed7aa", borderRadius:6, padding:"3px 10px", cursor:"pointer" }}>Retry</button>
          </div>
        )}

        {/* Tiles */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {loading
            ? [1,2,3].map(i => <SkeletonTile key={i}/>)
            : (tiles||[]).map(tile => (
                <TileCard
                  key={tile.id} tile={tile} persona={persona}
                  onOpen={t => setDrill(t)}
                  fb={fb[tile.id] || null}
                  setFb={state => setFb(x => ({...x, [tile.id]:state}))}/>
              ))
          }
        </div>

        {/* Feedback note */}
        {Object.values(fb).some(Boolean) && (
          <div style={{ marginTop:18, padding:"10px 16px", background:"#fff", borderRadius:10, border:"1px solid #eee" }}>
            <span style={{ fontSize:12, color:"#999" }}>
              Feedback recorded. The orchestrator will recalibrate {persona.name}'s morning tiles based on your signals.
            </span>
          </div>
        )}

        {/* Architecture footnote */}
        {!loading && tiles && (
          <div style={{ marginTop:24, padding:"12px 16px", background:"#fff", borderRadius:10, border:"1px solid #eee", display:"flex", gap:20 }}>
            <div style={{ fontSize:10, color:"#ccc", lineHeight:1.6 }}>
              <span style={{ fontWeight:800, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.06em" }}>Production architecture</span><br/>
              MCP connections are authenticated per persona role. Each source enforces RBAC at the data layer — the orchestrator cannot request data outside the persona's authorization scope. All AI reasoning steps are logged for regulatory audit.
            </div>
            <div style={{ fontSize:10, color:"#ccc", lineHeight:1.6, borderLeft:"1px solid #eee", paddingLeft:20 }}>
              <span style={{ fontWeight:800, color:"#bbb", textTransform:"uppercase", letterSpacing:"0.06em" }}>This prototype</span><br/>
              MCP data is mocked. RBAC enforced via system prompt scoping. Tile prioritization and draft outputs are pre-built for this demo — in production both would be live API calls against real MCP feeds.
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM CHAT ── */}
      <BottomChat key={pid} persona={persona} open={chatOpen} toggle={() => setChatOpen(o => !o)}/>

      {/* ── DRILL DOWN ── */}
      {drill && (
        <DrillDown tile={drill} persona={persona} onClose={() => setDrill(null)} onDone={handleDone}/>
      )}

      <style>{`
        @keyframes dp { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.9} }
        * { box-sizing:border-box }
        ::-webkit-scrollbar { width:3px; height:3px }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:99px }
        ::-webkit-scrollbar-track { background:transparent }
        button:focus { outline:none }
        textarea:focus { border-color:inherit }
      `}</style>
    </div>
  );
}
