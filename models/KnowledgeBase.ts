import mongoose, { Schema, Document, Model } from "mongoose";

export interface IKnowledgeBase extends Document {
  _id: mongoose.Types.ObjectId;
  category: "Royalty" | "ISBN" | "Printing" | "Distribution" | "Book Status" | "General";
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeBaseSchema: Schema<IKnowledgeBase> = new Schema(
  {
    category: {
      type: String,
      enum: ["Royalty", "ISBN", "Printing", "Distribution", "Book Status", "General"],
      required: true,
      unique: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const KnowledgeBase: Model<IKnowledgeBase> =
  mongoose.models.KnowledgeBase ||
  mongoose.model<IKnowledgeBase>("KnowledgeBase", KnowledgeBaseSchema);

export default KnowledgeBase;
