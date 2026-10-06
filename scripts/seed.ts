import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import connectToDatabase from "../lib/mongodb";
import User from "../models/User";
import Book from "../models/Book";
import Ticket from "../models/Ticket";
import TicketMessage from "../models/TicketMessage";
import KnowledgeBase from "../models/KnowledgeBase";

async function seed() {
  console.log("🌱 Starting BookLeaf database seeding...");
  await connectToDatabase();

  const authorsPath = path.join(process.cwd(), "data", "authors.json");
  const booksPath = path.join(process.cwd(), "data", "books.json");

  const rawAuthors = JSON.parse(fs.readFileSync(authorsPath, "utf-8"));
  const rawBooks = JSON.parse(fs.readFileSync(booksPath, "utf-8"));

  // 1. Seed Users (1 Admin + 10 Authors)
  console.log("👤 Seeding Users...");
  const userEmailToIdMap = new Map<string, any>();

  for (const userRecord of rawAuthors) {
    const passwordHash = await bcrypt.hash(userRecord.password, 10);
    const existingUser = await User.findOne({ email: userRecord.email });

    const userData = {
      author_id: userRecord.author_id,
      authorId: userRecord.author_id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone || "",
      city: userRecord.city || "",
      joined_date: userRecord.joined_date ? new Date(userRecord.joined_date) : new Date(),
      role: userRecord.role,
      passwordHash: passwordHash,
    };

    if (existingUser) {
      Object.assign(existingUser, userData);
      await existingUser.save();
      userEmailToIdMap.set(userRecord.email, existingUser._id);
    } else {
      const newUser = await User.create(userData);
      userEmailToIdMap.set(userRecord.email, newUser._id);
    }
  }

  console.log(`✅ Seeded ${userEmailToIdMap.size} users.`);

  // 2. Seed Books (18 Books)
  console.log("📚 Seeding Books...");
  let bookCount = 0;
  const bookCodeToIdMap = new Map<string, any>();

  for (const bookRecord of rawBooks) {
    const authorId = userEmailToIdMap.get(bookRecord.authorEmail);
    if (!authorId) {
      console.warn(`⚠️ Warning: Author ${bookRecord.authorEmail} not found for book ${bookRecord.title}`);
      continue;
    }

    const bookCode = bookRecord.book_id || bookRecord.bookIdCode;
    const existingBook = await Book.findOne({
      $or: [{ book_id: bookCode }, { bookIdCode: bookCode }],
    });

    const bookData = {
      authorId: authorId,
      book_id: bookCode,
      bookIdCode: bookCode,
      title: bookRecord.title,
      isbn: bookRecord.isbn,
      genre: bookRecord.genre,
      mrp: bookRecord.mrp,
      author_royalty_per_copy: bookRecord.author_royalty_per_copy ?? 0,
      authorRoyaltyPerCopy: bookRecord.author_royalty_per_copy ?? 0,
      total_copies_sold: bookRecord.total_copies_sold ?? bookRecord.copiesSold ?? 0,
      copiesSold: bookRecord.copiesSold ?? bookRecord.total_copies_sold ?? 0,
      total_royalty_earned: bookRecord.total_royalty_earned ?? bookRecord.royaltyEarned ?? 0,
      royaltyEarned: bookRecord.royaltyEarned ?? bookRecord.total_royalty_earned ?? 0,
      royalty_paid: bookRecord.royalty_paid ?? bookRecord.royaltyPaid ?? 0,
      royaltyPaid: bookRecord.royaltyPaid ?? bookRecord.royalty_paid ?? 0,
      royalty_pending: bookRecord.royalty_pending ?? bookRecord.royaltyPending ?? 0,
      royaltyPending: bookRecord.royaltyPending ?? bookRecord.royalty_pending ?? 0,
      last_royalty_payout_date: bookRecord.last_royalty_payout_date
        ? new Date(bookRecord.last_royalty_payout_date)
        : bookRecord.lastRoyaltyPayoutDate
        ? new Date(bookRecord.lastRoyaltyPayoutDate)
        : null,
      lastRoyaltyPayoutDate: bookRecord.lastRoyaltyPayoutDate
        ? new Date(bookRecord.lastRoyaltyPayoutDate)
        : bookRecord.last_royalty_payout_date
        ? new Date(bookRecord.last_royalty_payout_date)
        : null,
      publication_date: bookRecord.publication_date
        ? new Date(bookRecord.publication_date)
        : bookRecord.publicationDate
        ? new Date(bookRecord.publicationDate)
        : null,
      publicationDate: bookRecord.publicationDate
        ? new Date(bookRecord.publicationDate)
        : bookRecord.publication_date
        ? new Date(bookRecord.publication_date)
        : null,
      print_partner: bookRecord.print_partner || bookRecord.printPartner || "BookLeaf Press",
      printPartner: bookRecord.printPartner || bookRecord.print_partner || "BookLeaf Press",
      available_on: bookRecord.available_on || bookRecord.availableOn || ["BookLeaf Store"],
      availableOn: bookRecord.availableOn || bookRecord.available_on || ["BookLeaf Store"],
      status: bookRecord.status || "Published & Live",
    };

    if (existingBook) {
      Object.assign(existingBook, bookData);
      await existingBook.save();
      bookCodeToIdMap.set(bookCode, existingBook._id);
    } else {
      const newBook = await Book.create(bookData);
      bookCodeToIdMap.set(bookCode, newBook._id);
    }
    bookCount++;
  }

  console.log(`✅ Seeded ${bookCount} books.`);

  // 3. Seed Knowledge Base
  console.log("📖 Seeding Knowledge Base sections...");
  const kbFiles = [
    { file: "royalty.md", category: "Royalty", title: "Royalty Policy & Payout Guidelines" },
    { file: "isbn.md", category: "ISBN", title: "ISBN Registration Process" },
    { file: "printing.md", category: "Printing", title: "Printing & Proofing Specifications" },
    { file: "distribution.md", category: "Distribution", title: "Worldwide Distribution & Listing" },
    { file: "book-status.md", category: "Book Status", title: "Book Status Lifecycle & Draft Rules" },
    { file: "general.md", category: "General", title: "General Support & Escalations" },
  ];

  for (const kb of kbFiles) {
    const filePath = path.join(process.cwd(), "knowledge-base", kb.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      await KnowledgeBase.findOneAndUpdate(
        { category: kb.category },
        { title: kb.title, content: content },
        { upsert: true, new: true }
      );
    }
  }
  console.log(`✅ Seeded ${kbFiles.length} Knowledge Base articles.`);

  // 4. Seed Initial Sample Tickets
  console.log("🎟️ Seeding Sample Tickets & Conversations...");
  const kavitaId = userEmailToIdMap.get("kavita@example.com");
  const arjunId = userEmailToIdMap.get("arjun@example.com");
  const ananyaId = userEmailToIdMap.get("ananya@example.com");
  const nagpurBookId = bookCodeToIdMap.get("BK001");
  const echoesBookId = bookCodeToIdMap.get("BK002");
  const windsBookId = bookCodeToIdMap.get("BK003");

  // Ticket 1: Kavita ₹850 Royalty Query (Threshold edge case)
  if (kavitaId && nagpurBookId) {
    let t1 = await Ticket.findOne({ subject: "Query regarding pending payout for The Nagpur Notebooks" });
    if (!t1) {
      t1 = await Ticket.create({
        authorId: kavitaId,
        bookId: nagpurBookId,
        subject: "Query regarding pending payout for The Nagpur Notebooks",
        description: "Hello, I noticed that my account shows ₹850 pending for my book 'The Nagpur Notebooks'. However, I did not receive any credit on the 15th of this month. Could you please check why the payment wasn't released?",
        category: "Royalty",
        priority: "Medium",
        status: "Open",
        aiGenerated: true,
        aiClassification: {
          category: "Royalty",
          priority: "Medium",
          reason: "Author is inquiring about a pending royalty balance of ₹850 that was not disbursed on the 15th."
        },
        aiPriority: "Medium",
        aiDraftReply: "Dear Kavita,\n\nThank you for reaching out to BookLeaf Author Support regarding your book 'The Nagpur Notebooks'.\n\nWe checked your account details and can see that your currently pending royalty balance is ₹850, with your last recorded payout processed on 15 November 2025.\n\nAs per BookLeaf's Royalty Policy, the minimum threshold for monthly bank disbursements is ₹1,000. Because your current balance of ₹850 is below this threshold, it has automatically rolled over to the next billing cycle. Rest assured, as soon as your total pending royalty reaches ₹1,000 or above, it will be disbursed on the upcoming 15th payout date.\n\nPlease let us know if you have any additional questions!\n\nWarm regards,\nBookLeaf Support Desk"
      });

      await TicketMessage.create({
        ticketId: t1._id,
        senderId: kavitaId,
        senderRole: "author",
        message: "Hello, I noticed that my account shows ₹850 pending for my book 'The Nagpur Notebooks'. However, I did not receive any credit on the 15th of this month. Could you please check why the payment wasn't released?",
      });
    }
  }

  // Ticket 2: Arjun Overdue Royalty Query (Critical/High overdue case)
  if (arjunId && echoesBookId) {
    let t2 = await Ticket.findOne({ subject: "Overdue Pending Royalty Payment of ₹4,200" });
    if (!t2) {
      t2 = await Ticket.create({
        authorId: arjunId,
        bookId: echoesBookId,
        subject: "Overdue Pending Royalty Payment of ₹4,200",
        description: "I have ₹4,200 pending in royalties for 'Echoes of the Sahyadri' and my last payout was way back in May 2025. It has been several months. Please disburse this immediately.",
        category: "Royalty",
        priority: "High",
        status: "Open",
        aiGenerated: true,
        aiClassification: {
          category: "Royalty",
          priority: "High",
          reason: "Author has a significant pending royalty of ₹4,200 that exceeds the ₹1,000 threshold and has an old last payout date (May 2025)."
        },
        aiPriority: "High",
        aiDraftReply: "Dear Arjun,\n\nThank you for bringing this to our attention. We sincerely apologize for the delay in processing your pending royalty payment of ₹4,200 for 'Echoes of the Sahyadri'.\n\nSince your last recorded payout date was 10 May 2025 and your balance exceeds our ₹1,000 threshold, this request has been prioritized and escalated to our Finance Desk for manual verification.\n\nWe are investigating the payout hold and will provide a full resolution update within 48 hours.\n\nBest regards,\nBookLeaf Author Support Team"
      });

      await TicketMessage.create({
        ticketId: t2._id,
        senderId: arjunId,
        senderRole: "author",
        message: "I have ₹4,200 pending in royalties for 'Echoes of the Sahyadri' and my last payout was way back in May 2025. It has been several months. Please disburse this immediately.",
      });
    }
  }

  // Ticket 3: Ananya Payout Query
  if (ananyaId && windsBookId) {
    let t3 = await Ticket.findOne({ subject: "Royalty breakdown for Whispering Winds of Bengal" });
    if (!t3) {
      t3 = await Ticket.create({
        authorId: ananyaId,
        bookId: windsBookId,
        subject: "Royalty breakdown for Whispering Winds of Bengal",
        description: "Could you confirm my last payout date and current pending royalty balance?",
        category: "Royalty",
        priority: "Medium",
        status: "Open",
        aiGenerated: true,
        aiClassification: {
          category: "Royalty",
          priority: "Medium",
          reason: "Author is asking for a breakdown of royalty earned, paid, and pending balance."
        },
        aiPriority: "Medium",
        aiDraftReply: "Dear Ananya,\n\nWe can see that ₹3,570 is currently pending on your account for 'Whispering Winds of Bengal', and your last recorded payout was on 15 October 2025. Total royalty earned to date is ₹7,570 with ₹4,000 already disbursed.\n\nIf you have any further questions, feel free to write to us.\n\nWarm regards,\nBookLeaf Support Desk"
      });

      await TicketMessage.create({
        ticketId: t3._id,
        senderId: ananyaId,
        senderRole: "author",
        message: "Could you confirm my last payout date and current pending royalty balance?",
      });
    }
  }

  console.log("✅ Seed completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
