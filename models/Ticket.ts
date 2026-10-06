import mongoose, { Schema, Document, Model } from "mongoose";

export type TicketCategory =
  | "Royalty & Payments"
  | "ISBN & Metadata Issues"
  | "Printing & Quality"
  | "Distribution & Availability"
  | "Book Status & Production Updates"
  | "General Inquiry"
  | "Royalty"
  | "ISBN"
  | "Printing"
  | "Distribution"
  | "Book Status"
  | "General";

export type TicketPriority = "Critical" | "High" | "Medium" | "Low";

export type TicketStatus =
  | "Open"
  | "In Progress"
  | "Waiting for Author"
  | "Resolved"
  | "Closed";

export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId | null;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: mongoose.Types.ObjectId | null;
  aiGenerated: boolean;
  aiClassification?: {
    category: TicketCategory;
    priority: TicketPriority;
    reason: string;
  };
  aiPriority?: TicketPriority;
  aiDraftReply?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema<ITicket> = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: Schema.Types.ObjectId, ref: "Book", default: null },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      default: "General Inquiry",
    },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Waiting for Author", "Resolved", "Closed"],
      default: "Open",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    aiGenerated: { type: Boolean, default: false },
    aiClassification: {
      category: String,
      priority: String,
      reason: String,
    },
    aiPriority: { type: String },
    aiDraftReply: { type: String, default: "" },
  },
  { timestamps: true }
);

const Ticket: Model<ITicket> =
  mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema);

export default Ticket;
