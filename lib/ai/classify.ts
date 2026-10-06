import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TicketCategory, TicketPriority } from "../../models/Ticket";

export interface AIClassificationResult {
  category: TicketCategory;
  priority: TicketPriority;
  reason: string;
}

const ALLOWED_CATEGORIES: TicketCategory[] = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
  "Royalty",
  "ISBN",
  "Printing",
  "Distribution",
  "Book Status",
  "General",
];

const ALLOWED_PRIORITIES: TicketPriority[] = ["Critical", "High", "Medium", "Low"];

export async function classifyTicket(
  subject: string,
  description: string
): Promise<AIClassificationResult> {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY;

  const modelName =
    process.env.AI_MODEL ||
    (process.env.GEMINI_API_KEY ? "gemini-pro" : "gpt-4o-mini");

  if (!apiKey || apiKey === "mock_key_or_user_key" || apiKey.includes("your_")) {
    console.warn("⚠️ AI_API_KEY not configured. Using heuristic AI classification fallback.");
    return heuristicClassify(subject, description);
  }

  const prompt = `You are an AI support classifier for BookLeaf Publishing.
Analyze the following support ticket subject and description.

Ticket Subject: "${subject}"
Ticket Description: "${description}"

Classify the ticket into exactly one category and priority level.
Allowed Categories:
- "Royalty & Payments" (for unpaid royalty, bank transfer issues, payout delays, earnings)
- "ISBN & Metadata Issues" (for ISBN registration, barcode generation, book title/author metadata)
- "Printing & Quality" (for physical copy proofing, print quality, paper GSM, binding errors)
- "Distribution & Availability" (for Amazon, Flipkart, IngramSpark listings, global bookstore availability)
- "Book Status & Production Updates" (for manuscript review stage, draft progress, publishing approval status)
- "General Inquiry" (for author profile questions, general help, feedback, minor queries)

Allowed Priorities:
- "Critical" (Severe financial delays >6 months, legal threats, system outages)
- "High" (Unpaid royalties, missing payouts >1,000 INR, publication delays)
- "Medium" (General royalty queries, printing quality questions, distribution sync)
- "Low" (Author bio update requests, minor formatting, general non-urgent questions)

Return strictly valid JSON only (no markdown, no code blocks):
{
  "category": "Royalty & Payments",
  "priority": "High",
  "reason": "Brief 1-sentence explanation"
}`;

  try {
    let responseText = "";

    if (apiKey.startsWith("AIza") || modelName.includes("gemini")) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelsToTry = [
        modelName && !modelName.startsWith("gpt") ? modelName : "gemini-1.5-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
      ];
      // Deduplicate model list while preserving order
      const uniqueModels = Array.from(new Set(modelsToTry));

      let success = false;
      for (const mName of uniqueModels) {
        try {
          const model = genAI.getGenerativeModel({ model: mName });
          const result = await model.generateContent(prompt);
          responseText = result.response.text();
          if (responseText) {
            success = true;
            break;
          }
        } catch (err: any) {
          console.warn(`Attempt with model '${mName}' failed:`, err?.message || err);
        }
      }

      if (!success) {
        return heuristicClassify(subject, description);
      }
    } else {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: modelName.startsWith("gpt") ? modelName : "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      responseText = completion.choices[0]?.message?.content || "";
    }

    const cleanJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    const category = ALLOWED_CATEGORIES.includes(parsed.category)
      ? (parsed.category as TicketCategory)
      : "General Inquiry";

    const priority = ALLOWED_PRIORITIES.includes(parsed.priority)
      ? (parsed.priority as TicketPriority)
      : "Medium";

    return {
      category,
      priority,
      reason: parsed.reason || "Classification performed successfully.",
    };
  } catch (error) {
    console.error("❌ AI Classification failed, using fallback:", error);
    return heuristicClassify(subject, description);
  }
}

/**
 * Heuristic fallback classifier matching exact prompt priority rules.
 */
function heuristicClassify(subject: string, description: string): AIClassificationResult {
  const text = `${subject} ${description}`.toLowerCase();

  let category: TicketCategory = "General Inquiry";
  let priority: TicketPriority = "Medium";
  let reason = "Classified using BookLeaf smart engine.";

  if (
    text.includes("royalty") ||
    text.includes("payout") ||
    text.includes("earning") ||
    text.includes("payment") ||
    text.includes("bank") ||
    text.includes("rupees") ||
    text.includes("₹")
  ) {
    category = "Royalty & Payments";
    if (
      text.includes("6 month") ||
      text.includes("months") ||
      text.includes("overdue") ||
      text.includes("haven't received") ||
      text.includes("not received") ||
      text.includes("urgent") ||
      text.includes("immediately")
    ) {
      priority = "High";
      reason = "Detected pending royalty/payment delay with high urgency indicators.";
    } else {
      priority = "Medium";
      reason = "Detected author inquiry regarding royalty earnings and payouts.";
    }
  } else if (text.includes("isbn") || text.includes("barcode") || text.includes("metadata")) {
    category = "ISBN & Metadata Issues";
    if (text.includes("bio") || text.includes("update author") || text.includes("profile")) {
      priority = "Low";
      reason = "Minor author profile or bio metadata update request.";
    } else {
      priority = "Low";
      reason = "Detected inquiry regarding ISBN assignment or barcode.";
    }
  } else if (text.includes("print") || text.includes("paper") || text.includes("cover") || text.includes("proof") || text.includes("binding") || text.includes("quality")) {
    category = "Printing & Quality";
    priority = "Medium";
    reason = "Detected inquiry regarding book printing or proofing quality.";
  } else if (text.includes("amazon") || text.includes("flipkart") || text.includes("distribut") || text.includes("ingram") || text.includes("availability") || text.includes("store")) {
    category = "Distribution & Availability";
    priority = "Medium";
    reason = "Detected inquiry regarding book availability on online stores.";
  } else if (text.includes("draft") || text.includes("review") || text.includes("status") || text.includes("production") || text.includes("publish")) {
    category = "Book Status & Production Updates";
    priority = "Low";
    reason = "Detected inquiry regarding publication status.";
  } else if (text.includes("bio") || text.includes("author bio") || text.includes("update my")) {
    category = "General Inquiry";
    priority = "Low";
    reason = "Low priority general inquiry (e.g. author bio update).";
  }

  if (text.includes("legal") || text.includes("fraud") || text.includes("critical") || text.includes("breach") || text.includes("court")) {
    priority = "Critical";
    reason = "Flagged critical priority due to legal or security compliance keywords.";
  }

  return { category, priority, reason };
}
