import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITicketMessage extends Document {
  _id: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: "author" | "admin";
  message: string;
  createdAt: Date;
}

const TicketMessageSchema: Schema<ITicketMessage> = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["author", "admin"], required: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const TicketMessage: Model<ITicketMessage> =
  mongoose.models.TicketMessage ||
  mongoose.model<ITicketMessage>("TicketMessage", TicketMessageSchema);

export default TicketMessage;
