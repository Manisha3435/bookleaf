import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInternalNote extends Document {
  _id: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  note: string;
  createdAt: Date;
}

const InternalNoteSchema: Schema<IInternalNote> = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const InternalNote: Model<IInternalNote> =
  mongoose.models.InternalNote ||
  mongoose.model<IInternalNote>("InternalNote", InternalNoteSchema);

export default InternalNote;
