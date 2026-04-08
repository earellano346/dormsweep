import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function getSchoolNameFromDomain(domain: string) {
  const base = domain.replace(".edu", "");
  const firstPart = base.split(".")[0] || base;
  return firstPart
    .split(/[-_]/g)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email.toLowerCase().trim();

  if (!email.endsWith(".edu")) {
    return NextResponse.json(
      { error: "Only .edu email addresses are allowed." },
      { status: 400 }
    );
  }

  const domain = email.split("@")[1];

  if (!domain) {
    return NextResponse.json({ error: "Invalid email domain." }, { status: 400 });
  }

  let { data: school, error: schoolLookupError } = await supabase
    .from("schools")
    .select("id, name, domain")
    .ilike("domain", domain)
    .maybeSingle();

  if (schoolLookupError) {
    return NextResponse.json(
      { error: schoolLookupError.message },
      { status: 500 }
    );
  }

  if (!school) {
    const generatedName = getSchoolNameFromDomain(domain);

    const { data: newSchool, error: createSchoolError } = await supabase
      .from("schools")
      .insert([
        {
          name: generatedName,
          domain,
        },
      ])
      .select("id, name, domain")
      .single();

    if (createSchoolError) {
      return NextResponse.json(
        { error: createSchoolError.message },
        { status: 500 }
      );
    }

    school = newSchool;
  }

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        school_id: school.id,
      },
      { onConflict: "id" }
    );

  if (updateProfileError) {
    return NextResponse.json(
      { error: updateProfileError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    school,
  });
}