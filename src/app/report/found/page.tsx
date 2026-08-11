import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ItemForm } from "@/components/ItemForm";
import { BackHeader } from "@/components/BackHeader";

export const metadata: Metadata = { title: "Report Found Item" };

export default async function ReportFoundPage() {
  await requireUser("/report/found");
  return (
    <>
      <BackHeader title="Report Item" />
      <ItemForm type="found" />
    </>
  );
}
