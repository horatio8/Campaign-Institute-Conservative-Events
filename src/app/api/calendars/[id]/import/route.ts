import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";

// Expects Content-Type: text/csv or form-data with "file" field.
// Header row required; must include at minimum "email". Optional: "name", "phone", "tags".
// Tags are semicolon-separated.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: { type: "unauthenticated", message: "Sign in." } },
      { status: 401 }
    );
  }
  const { id } = await params;
  const m = await prisma.calendarMember.findUnique({
    where: { calendarId_userId: { calendarId: id, userId: user.id } },
  });
  if (!m || !["owner", "admin", "manager"].includes(m.role)) {
    return NextResponse.json(
      { error: { type: "forbidden", message: "Not permitted." } },
      { status: 403 }
    );
  }

  let csvText = "";
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: { type: "validation_error", message: "No file uploaded." } },
        { status: 400 }
      );
    }
    csvText = await file.text();
  } else {
    csvText = await req.text();
  }

  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return NextResponse.json(
      { error: { type: "validation_error", message: "CSV needs a header row and at least one data row." } },
      { status: 400 }
    );
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf("email");
  if (emailIdx === -1) {
    return NextResponse.json(
      { error: { type: "validation_error", message: 'Missing "email" column.' } },
      { status: 400 }
    );
  }
  const nameIdx = header.indexOf("name");
  const phoneIdx = header.indexOf("phone");
  const tagsIdx = header.indexOf("tags");

  let imported = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const email = (r[emailIdx] ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;

    const person = await prisma.person.upsert({
      where: { calendarId_email: { calendarId: id, email } },
      create: {
        calendarId: id,
        email,
        name: nameIdx >= 0 ? r[nameIdx]?.trim() || null : null,
        phone: phoneIdx >= 0 ? r[phoneIdx]?.trim() || null : null,
      },
      update: {
        name: nameIdx >= 0 ? r[nameIdx]?.trim() || null : undefined,
        phone: phoneIdx >= 0 ? r[phoneIdx]?.trim() || null : undefined,
      },
    });
    imported += 1;

    if (tagsIdx >= 0 && r[tagsIdx]) {
      const tags = r[tagsIdx]
        .split(";")
        .map((t) => t.trim())
        .filter(Boolean);
      for (const name of tags) {
        const tag = await prisma.personTag.upsert({
          where: { calendarId_name: { calendarId: id, name } },
          create: { calendarId: id, name },
          update: {},
        });
        await prisma.personTagAssignment.upsert({
          where: { personId_tagId: { personId: person.id, tagId: tag.id } },
          create: { personId: person.id, tagId: tag.id },
          update: {},
        });
      }
    }
  }

  return NextResponse.json({ ok: true, imported });
}
