import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const CreateUserSchema = z.object({
  author_id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  phone: z.string().optional(),
  city: z.string().optional(),
  joined_date: z.string().optional(),
  role: z.enum(["author", "admin"]).optional().default("author"),
});

export const UpdateUserSchema = z.object({
  author_id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  phone: z.string().optional(),
  city: z.string().optional(),
  joined_date: z.string().optional(),
  role: z.enum(["author", "admin"]).optional(),
});

export const CreateBookSchema = z.object({
  authorId: z.string().optional(),
  book_id: z.string().optional(),
  bookIdCode: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  isbn: z.string().min(1, "ISBN is required"),
  genre: z.string().min(1, "Genre is required"),
  mrp: z.number().nullable().optional(),
  author_royalty_per_copy: z.number().optional(),
  authorRoyaltyPerCopy: z.number().optional(),
  total_copies_sold: z.number().nullable().optional(),
  copiesSold: z.number().nullable().optional(),
  total_royalty_earned: z.number().optional(),
  royaltyEarned: z.number().optional(),
  royalty_paid: z.number().optional(),
  royaltyPaid: z.number().optional(),
  royalty_pending: z.number().optional(),
  royaltyPending: z.number().optional(),
  publication_date: z.string().nullable().optional(),
  publicationDate: z.string().nullable().optional(),
  last_royalty_payout_date: z.string().nullable().optional(),
  lastRoyaltyPayoutDate: z.string().nullable().optional(),
  print_partner: z.string().optional(),
  printPartner: z.string().optional(),
  available_on: z.array(z.string()).optional(),
  availableOn: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export const UpdateBookSchema = CreateBookSchema.partial();

export const CreateTicketSchema = z.object({
  bookId: z.string().optional().nullable(),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z
    .enum([
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
    ])
    .optional()
    .default("General Inquiry"),
  priority: z
    .enum(["Critical", "High", "Medium", "Low"])
    .optional()
    .default("Medium"),
});

export const CreateMessageSchema = z.object({
  message: z.string().min(1, "Message content cannot be empty"),
});

export const CreateInternalNoteSchema = z.object({
  note: z.string().min(1, "Internal note cannot be empty"),
});

export const UpdateTicketSchema = z.object({
  category: z
    .enum([
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
    ])
    .optional(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  status: z
    .enum(["Open", "In Progress", "Waiting for Author", "Resolved", "Closed"])
    .optional(),
  assignedTo: z.string().nullable().optional(),
});
