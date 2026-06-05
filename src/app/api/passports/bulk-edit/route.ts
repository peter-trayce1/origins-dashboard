import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────

type BulkMode = "scalar" | "append" | "material_extras" | "claim";

interface BulkEditBody {
  passport_ids: string[];
  mode: BulkMode;
  // scalar: column name + value on passports table
  field?: string;
  value?: unknown;
  // material_extras: column name (or "trim_notes" for nested trim sub-keys)
  extras_field?: string;
  extras_value?: unknown;
  trim_field?: string;       // sub-key within trim_notes JSON
  // append: target table + new row data (passport_id injected server-side)
  array_field?: string;
  item?: Record<string, unknown>;
  // claim: push a claim string into sustainability_claims
  claim_text?: string;
  claim_mode?: "verified" | "self_declared";
  claim_evidence_url?: string;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: BulkEditBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { passport_ids, mode } = body;

  if (!passport_ids?.length) {
    return NextResponse.json({ error: "No passport IDs provided" }, { status: 400 });
  }
  if (!mode) {
    return NextResponse.json({ error: "Missing mode" }, { status: 400 });
  }

  // ── Resolve brand for auth check ──────────────────────────────────────────
  const { data: member } = await supabase
    .from("organisation_members")
    .select("organisation_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .maybeSingle();

  if (!member) return NextResponse.json({ error: "No organisation" }, { status: 403 });

  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("organisation_id", member.organisation_id)
    .limit(1)
    .maybeSingle();

  if (!brand) return NextResponse.json({ error: "No brand" }, { status: 403 });

  // Verify every requested passport belongs to this brand
  const { data: owned } = await supabase
    .from("passports")
    .select("id")
    .in("id", passport_ids)
    .eq("brand_id", brand.id);

  if (!owned || owned.length !== passport_ids.length) {
    return NextResponse.json({ error: "Unauthorized access to some passports" }, { status: 403 });
  }

  // ── Perform operation ──────────────────────────────────────────────────────

  const bulk_action_id = crypto.randomUUID();
  let affected = 0;

  try {
    // ── Scalar: direct UPDATE on passports table ──────────────────────────
    if (mode === "scalar") {
      const { field, value } = body;
      if (!field) return NextResponse.json({ error: "Missing field" }, { status: 400 });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("passports") as any)
        .update({ [field]: value ?? null })
        .in("id", passport_ids);

      if (error) throw error;
      affected = passport_ids.length;
    }

    // ── Material extras: upsert passport_material_extras ─────────────────
    else if (mode === "material_extras") {
      const { extras_field, extras_value, trim_field } = body;

      const { data: existing } = await supabase
        .from("passport_material_extras")
        .select("*")
        .in("passport_id", passport_ids);

      const upserts: Record<string, unknown>[] = passport_ids.map((passportId) => {
        const row = (existing?.find((e) => e.passport_id === passportId) ?? {}) as Record<string, unknown>;
        let patch: Record<string, unknown>;

        if (trim_field) {
          const currentTrim = (row.trim_notes as Record<string, string> | null) ?? {};
          patch = { trim_notes: { ...currentTrim, [trim_field]: extras_value } };
        } else {
          patch = { [extras_field!]: extras_value };
        }

        return { ...row, passport_id: passportId, ...patch };
      });

      const { error } = await supabase
        .from("passport_material_extras")
        .upsert(upserts, { onConflict: "passport_id" });

      if (error) throw error;
      affected = passport_ids.length;
    }

    // ── Append: INSERT new row into a child table for every passport ──────
    else if (mode === "append") {
      const { array_field, item } = body;
      if (!array_field || !item) {
        return NextResponse.json({ error: "Missing array_field or item" }, { status: 400 });
      }

      const rows = passport_ids.map((id) => ({ ...item, passport_id: id }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(array_field) as any).insert(rows);
      if (error) throw error;
      affected = passport_ids.length;
    }

    // ── Claim: push string into sustainability_claims array ───────────────
    else if (mode === "claim") {
      const { claim_text, claim_mode, claim_evidence_url } = body;
      if (!claim_text) return NextResponse.json({ error: "Missing claim_text" }, { status: 400 });

      const { data: passports } = await supabase
        .from("passports")
        .select("id, sustainability_claims, claim_evidence_urls")
        .in("id", passport_ids);

      const updates = (passports ?? []).map((p) => {
        const claims: string[] = Array.isArray(p.sustainability_claims)
          ? [...(p.sustainability_claims as string[])]
          : [];
        if (!claims.includes(claim_text)) claims.push(claim_text);

        const update: Record<string, unknown> = { id: p.id, sustainability_claims: claims };

        if (claim_mode === "verified") {
          const urls: Record<string, string> = {
            ...((p.claim_evidence_urls as Record<string, string>) ?? {}),
          };
          urls[claim_text] = claim_evidence_url ?? "";
          update.claim_evidence_urls = urls;
        }

        return update;
      });

      // Update each passport individually (claims arrays differ per passport)
      await Promise.allSettled(
        updates.map((u) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.from("passports") as any)
            .update({ sustainability_claims: u.sustainability_claims, claim_evidence_urls: u.claim_evidence_urls })
            .eq("id", u.id as string)
        )
      );

      affected = passport_ids.length;
    }

    else {
      return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
    }

  } catch (err) {
    console.error("[bulk-edit] operation failed:", err);
    return NextResponse.json({ error: "Bulk edit failed" }, { status: 500 });
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  const fieldChanged =
    body.field ??
    body.array_field ??
    body.extras_field ??
    (body.trim_field ? `trim_notes.${body.trim_field}` : undefined) ??
    (body.claim_text ? "sustainability_claims" : undefined) ??
    "unknown";

  const newValue = body.value ?? body.item ?? body.extras_value ?? body.claim_text ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("audit_logs") as any).insert({
    user_id: user.id,
    organisation_id: member.organisation_id,
    action: "passport.bulk_edited",
    resource_type: "passport",
    metadata: {
      bulk_action_id,
      passport_ids,
      mode,
      field_changed: fieldChanged,
      new_value: typeof newValue === "object" ? JSON.stringify(newValue) : String(newValue ?? ""),
      affected_count: affected,
    } as Record<string, unknown>,
  });

  return NextResponse.json({ success: true, affected });
}
