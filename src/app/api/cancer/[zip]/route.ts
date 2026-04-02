import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MOCK_ZIP_CANCER_DATA } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ zip: string }> }
) {
  const { zip } = await params;

  const supabase = createServiceClient();

  if (!supabase) {
    return NextResponse.json(
      MOCK_ZIP_CANCER_DATA.filter((d) => d.zip_code === zip)
    );
  }

  try {
    const { data, error } = await supabase
      .from("zip_cancer_data")
      .select("*")
      .eq("zip_code", zip)
      .order("cancer_type");

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Cancer API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cancer data" },
      { status: 500 }
    );
  }
}
