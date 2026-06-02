import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCSVText } from "@/lib/csv/parser";
import { autoMapColumns } from "@/lib/csv/mapper";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  const { headers, rows, rowCount, errors } = parseCSVText(text);
  const suggestedMappings = autoMapColumns(headers);

  return NextResponse.json({ headers, rows, rowCount, errors, suggestedMappings });
}
