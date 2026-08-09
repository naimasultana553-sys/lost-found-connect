import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ItemForm } from "@/components/ItemForm";

export const metadata: Metadata = { title: "Report Found Item" };

export default async function ReportFoundPage() {
  await requireUser("/report/found");
  return (
    <div className="px-4 py-10 sm:px-6">
      <ItemForm type="found" />
    </div>
  );
}
