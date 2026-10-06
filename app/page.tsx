import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    const payload = verifyToken(token);
    if (payload?.role === "admin") {
      redirect("/admin/dashboard");
    } else if (payload?.role === "author") {
      redirect("/author/dashboard");
    }
  }

  redirect("/login");
}
