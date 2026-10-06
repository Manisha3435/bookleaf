import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TicketCategory } from "../../models/Ticket";

export interface AIDraftReplyInput {
  authorName: string;
  authorEmail: string;
  bookTitle?: string;
  isbn?: string;
  mrp?: number | null;
  copiesSold?: number | null;
  royaltyEarned?: number;
  royaltyPaid?: number;
  royaltyPending?: number;
  lastRoyaltyPayoutDate?: Date | string | null;
  publicationDate?: Date | string | null;
  bookStatus?: string;
  subject: string;
  description: string;
  category: TicketCategory;
  kbContent: string;
}

export async function generateDraftReply(
  input: AIDraftReplyInput
): Promise<string> {
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY;

  const modelName =
    process.env.AI_MODEL ||
    (process.env.GEMINI_API_KEY ? "gemini-pro" : "gpt-4o-mini");

  const bookContext = input.bookTitle
    ? `Book Title: "${input.bookTitle}"
ISBN: ${input.isbn || "N/A"}
Status: ${input.bookStatus || "Published"}
MRP: ${input.mrp !== null && input.mrp !== undefined ? `₹${input.mrp}` : "N/A"}
Copies Sold: ${input.copiesSold !== null && input.copiesSold !== undefined ? input.copiesSold : "N/A"}
Royalty Earned: ₹${input.royaltyEarned ?? 0}
Royalty Paid: ₹${input.royaltyPaid ?? 0}
Royalty Pending: ₹${input.royaltyPending ?? 0}
Last Payout Date: ${
        input.lastRoyaltyPayoutDate
          ? new Date(input.lastRoyaltyPayoutDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "None / Not yet processed"
      }`
    : "No specific book attached to this general query.";

  if (!apiKey || apiKey === "mock_key_or_user_key" || apiKey.includes("your_")) {
    console.warn("⚠️ AI_API_KEY not set. Using template draft generator.");
    return generateTemplateReply(input);
  }

  const prompt = `You are an empathetic, clear, and professional BookLeaf Author Support Representative.
Draft a complete, ready-to-send support email response to the author.

--- AUTHOR INFORMATION ---
Name: ${input.authorName}
Email: ${input.authorEmail}

--- BOOK INFORMATION ---
${bookContext}

--- TICKET DETAILS ---
Subject: "${input.subject}"
Description: "${input.description}"
Category: ${input.category}

--- RELEVANT BOOKLEAF KNOWLEDGE BASE SECTION ---
${input.kbContent}

--- RULES FOR RESPONSE ---
1. Be polite, empathetic, and professional.
2. Address the author by their name (${input.authorName}).
3. Reference specific book details (e.g. pending royalty amount ₹${input.royaltyPending ?? 0}, last payout date) where relevant.
4. If pending royalty is under ₹1,000 (e.g. ₹850), explain clearly that the minimum threshold for disbursement is ₹1,000, and the balance automatically rolls over to the next billing cycle.
5. If pending royalty is ₹0, explain that all calculated royalties have been paid out to date.
6. If pending royalty is > ₹1,000 with a delayed or old payout date (e.g. >6 months), acknowledge the delay gracefully, state that it has been escalated to the Finance Desk, and provide a 48-hour follow-up timeline.
7. Do not promise fixed payment dates beyond standard 15th monthly cycle or 48h escalation.
8. Sign off as "BookLeaf Support Team".

Draft the email response:`;

  try {
    let draft = "";

    if (apiKey.startsWith("AIza") || modelName.includes("gemini")) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelsToTry = [
        modelName && !modelName.startsWith("gpt") ? modelName : "gemini-1.5-flash",
        "gemini-1.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
      ];
      const uniqueModels = Array.from(new Set(modelsToTry));

      let success = false;
      for (const mName of uniqueModels) {
        try {
          const model = genAI.getGenerativeModel({ model: mName });
          const result = await model.generateContent(prompt);
          draft = result.response.text();
          if (draft) {
            success = true;
            break;
          }
        } catch (err: any) {
          console.warn(`Draft attempt with model '${mName}' failed:`, err?.message || err);
        }
      }

      if (!success) {
        return generateTemplateReply(input);
      }
    } else {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: modelName.startsWith("gpt") ? modelName : "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });
      draft = completion.choices[0]?.message?.content || "";
    }

    return draft.trim();
  } catch (error) {
    console.error("❌ AI Draft Reply generation failed, using template:", error);
    return generateTemplateReply(input);
  }
}

function generateTemplateReply(input: AIDraftReplyInput): string {
  const pending = input.royaltyPending ?? 0;
  const lastPayoutFormatted = input.lastRoyaltyPayoutDate
    ? new Date(input.lastRoyaltyPayoutDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No previous payout";

  let body = "";

  if (input.category.includes("Royalty")) {
    if (pending > 0 && pending < 1000) {
      body = `We reviewed your account for ${
        input.bookTitle ? `'${input.bookTitle}'` : "your published book"
      } and can confirm that your current pending royalty is ₹${pending}. Your last payout recorded was on ${lastPayoutFormatted}.\n\nAs per BookLeaf policy, our minimum automated payout threshold is ₹1,000. Since your pending balance is ₹${pending}, it has automatically rolled over to the next billing cycle. Once your cumulative pending royalty reaches or exceeds ₹1,000, it will be disbursed on the upcoming 15th payout date.`;
    } else if (pending >= 1000) {
      body = `We can see that ₹${pending} is currently pending on your account for ${
        input.bookTitle ? `'${input.bookTitle}'` : "your book"
      }, and your last recorded payout was on ${lastPayoutFormatted}.\n\nSince this amount exceeds our minimum payout threshold, we have escalated this inquiry to our Finance Desk for priority verification. We will follow up with an update within 48 hours.`;
    } else {
      body = `Our records show that your current pending royalty balance for ${
        input.bookTitle ? `'${input.bookTitle}'` : "your book"
      } is ₹0. All calculated earnings to date have been fully processed.`;
    }
  } else if (input.category.includes("ISBN")) {
    body = `Regarding your ISBN query for ${
      input.bookTitle ? `'${input.bookTitle}'` : "your book"
    }, ISBN assignment takes 3 to 7 business days from the date manuscript formatting is approved. Barcodes are generated automatically for approved print files.`;
  } else if (input.category.includes("Printing")) {
    body = `Thank you for contacting us regarding print quality for ${
      input.bookTitle ? `'${input.bookTitle}'` : "your book"
    }. All BookLeaf titles are printed on high-grade 70-80 GSM paper with 300 GSM covers. Standard print-on-demand turnaround is 3-5 business days.`;
  } else if (input.category.includes("Distribution")) {
    body = `Regarding distribution for ${
      input.bookTitle ? `'${input.bookTitle}'` : "your book"
    }, domestic listings (Amazon/Flipkart) go live within 7-10 business days post publication, while global distribution via IngramSpark updates within 14-21 business days.`;
  } else {
    body = `Thank you for reaching out to BookLeaf Author Support regarding your inquiry "${input.subject}". Our team is actively reviewing your request and will provide assistance shortly.`;
  }

  return `Dear ${input.authorName},

Thank you for reaching out to BookLeaf Author Support.

${body}

Please let us know if you have any additional questions!

Warm regards,
BookLeaf Support Desk`;
}
