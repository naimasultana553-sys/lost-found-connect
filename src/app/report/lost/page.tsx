import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ItemForm } from "@/components/ItemForm";
import { BackHeader } from "@/components/BackHeader";

export const metadata: Metadata = { title: "Report Lost Item" };

export default async function ReportLostPage() {
  await requireUser("/report/lost");
  return (
    <>
      <BackHeader title="Report Item" />
      <ItemForm type="lost" />
    </>
  );
}
