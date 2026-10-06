import { TokenPayload } from "./jwt";

/**
 * Checks if the user can access a book.
 * Admins can access all books.
 * Authors can ONLY access their own books (matching authorId).
 * Correctly extracts authorId whether populated or unpopulated.
 */
export function canAccessBook(user: TokenPayload, book: any): boolean {
  if (user.role === "admin") return true;
  if (!book || !book.authorId) return false;
  const bookAuthorId = book.authorId._id
    ? book.authorId._id.toString()
    : book.authorId.toString();
  return bookAuthorId === user.userId;
}

/**
 * Checks if the user can access a ticket.
 * Admins can access all tickets.
 * Authors can ONLY access their own tickets (matching authorId).
 * Correctly extracts authorId whether populated or unpopulated.
 */
export function canAccessTicket(user: TokenPayload, ticket: any): boolean {
  if (user.role === "admin") return true;
  if (!ticket || !ticket.authorId) return false;
  const ticketAuthorId = ticket.authorId._id
    ? ticket.authorId._id.toString()
    : ticket.authorId.toString();
  return ticketAuthorId === user.userId;
}
