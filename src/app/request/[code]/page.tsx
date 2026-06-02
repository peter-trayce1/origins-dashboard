import { Metadata } from "next";
import { SupplierForm } from "./SupplierForm";

export const metadata: Metadata = { title: "Supplier Data Request — OriginsID" };

export default async function RequestPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <SupplierForm code={code} />;
}
