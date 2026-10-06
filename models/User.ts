import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  author_id?: string;
  authorId?: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  joined_date?: Date;
  passwordHash: string;
  role: "author" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    author_id: { type: String, trim: true, default: "" },
    authorId: { type: String, trim: true, default: "" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    joined_date: { type: Date, default: Date.now },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["author", "admin"], default: "author" },
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  if (this.author_id && !this.authorId) {
    this.authorId = this.author_id;
  } else if (this.authorId && !this.author_id) {
    this.author_id = this.authorId;
  }
  next();
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

