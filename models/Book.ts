import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBook extends Document {
  _id: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  book_id?: string;
  bookIdCode?: string;
  title: string;
  isbn: string;
  genre: string;
  mrp: number | null;
  author_royalty_per_copy?: number;
  authorRoyaltyPerCopy?: number;
  total_copies_sold?: number | null;
  copiesSold?: number | null;
  total_royalty_earned?: number;
  royaltyEarned?: number;
  royalty_paid?: number;
  royaltyPaid?: number;
  royalty_pending?: number;
  royaltyPending?: number;
  last_royalty_payout_date?: Date | null;
  lastRoyaltyPayoutDate?: Date | null;
  publication_date?: Date | null;
  publicationDate?: Date | null;
  print_partner?: string;
  printPartner?: string;
  available_on?: string[];
  availableOn?: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema: Schema<IBook> = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    book_id: { type: String, trim: true, default: "" },
    bookIdCode: { type: String, trim: true, default: "" },
    title: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, trim: true },
    genre: { type: String, required: true, trim: true },
    mrp: { type: Number, default: null },
    author_royalty_per_copy: { type: Number, default: 0 },
    authorRoyaltyPerCopy: { type: Number, default: 0 },
    total_copies_sold: { type: Number, default: 0 },
    copiesSold: { type: Number, default: 0 },
    total_royalty_earned: { type: Number, default: 0 },
    royaltyEarned: { type: Number, default: 0 },
    royalty_paid: { type: Number, default: 0 },
    royaltyPaid: { type: Number, default: 0 },
    royalty_pending: { type: Number, default: 0 },
    royaltyPending: { type: Number, default: 0 },
    last_royalty_payout_date: { type: Date, default: null },
    lastRoyaltyPayoutDate: { type: Date, default: null },
    publication_date: { type: Date, default: null },
    publicationDate: { type: Date, default: null },
    print_partner: { type: String, trim: true, default: "BookLeaf Press" },
    printPartner: { type: String, trim: true, default: "BookLeaf Press" },
    available_on: { type: [String], default: ["BookLeaf Store"] },
    availableOn: { type: [String], default: ["BookLeaf Store"] },
    status: {
      type: String,
      default: "Published & Live",
    },
  },
  { timestamps: true }
);

BookSchema.pre("save", function (next) {
  if (this.book_id && !this.bookIdCode) this.bookIdCode = this.book_id;
  if (this.bookIdCode && !this.book_id) this.book_id = this.bookIdCode;

  if (this.total_copies_sold !== undefined && (this.copiesSold === undefined || this.copiesSold === null)) this.copiesSold = this.total_copies_sold;
  if (this.copiesSold !== undefined && (this.total_copies_sold === undefined || this.total_copies_sold === null)) this.total_copies_sold = this.copiesSold;

  if (this.total_royalty_earned !== undefined) this.royaltyEarned = this.total_royalty_earned;
  if (this.royaltyEarned !== undefined && this.total_royalty_earned === undefined) this.total_royalty_earned = this.royaltyEarned;

  if (this.royalty_paid !== undefined) this.royaltyPaid = this.royalty_paid;
  if (this.royaltyPaid !== undefined && this.royalty_paid === undefined) this.royalty_paid = this.royaltyPaid;

  if (this.royalty_pending !== undefined) this.royaltyPending = this.royalty_pending;
  if (this.royaltyPending !== undefined && this.royalty_pending === undefined) this.royalty_pending = this.royaltyPending;

  if (this.last_royalty_payout_date && !this.lastRoyaltyPayoutDate) this.lastRoyaltyPayoutDate = this.last_royalty_payout_date;
  if (this.lastRoyaltyPayoutDate && !this.last_royalty_payout_date) this.last_royalty_payout_date = this.last_royalty_payout_date;

  if (this.publication_date && !this.publicationDate) this.publicationDate = this.publication_date;
  if (this.publicationDate && !this.publication_date) this.publication_date = this.publication_date;

  if (this.author_royalty_per_copy !== undefined) this.authorRoyaltyPerCopy = this.author_royalty_per_copy;
  if (this.authorRoyaltyPerCopy !== undefined && this.author_royalty_per_copy === undefined) this.author_royalty_per_copy = this.authorRoyaltyPerCopy;

  if (this.print_partner && !this.printPartner) this.printPartner = this.print_partner;
  if (this.printPartner && !this.print_partner) this.print_partner = this.printPartner;

  if (this.available_on && (!this.availableOn || this.availableOn.length === 0)) this.availableOn = this.available_on;
  if (this.availableOn && (!this.available_on || this.available_on.length === 0)) this.available_on = this.availableOn;

  next();
});

const Book: Model<IBook> =
  mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);

export default Book;
