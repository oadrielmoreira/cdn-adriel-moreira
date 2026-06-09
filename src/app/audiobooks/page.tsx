import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AudiobooksList } from "./AudiobooksList";

export const dynamic = "force-dynamic";

export default async function AudiobooksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const canManage = session.role === "ADMIN" || session.canUpload === true;

  return <AudiobooksList canManage={canManage} />;
}
