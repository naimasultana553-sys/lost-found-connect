import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ItemForm } from "@/components/ItemForm";

export const metadata: Metadata = { title: "Report Lost Item" };

export default async function ReportLostPage() {
  await requireUser("/report/lost");
  return (
    <div className="px-4 py-10 sm:px-6">
      <ItemForm type="lost" />
    </div>
  );
}
