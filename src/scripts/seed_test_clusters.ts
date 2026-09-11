import { supabaseAdmin } from "../config/supabase.js";
import { getValidProfileId } from "../services/profile-lookup.js";

async function seedTestClusterComplaints() {
  const profileId = await getValidProfileId();
  console.log("Using Profile ID:", profileId);

  // Check if we already have complaints on Diva - Kalyan
  const { data: existing, error: err } = await supabaseAdmin
    .from("complaints")
    .select("id, department, description, status")
    .in("status", ["open_zonal_head", "open_department_head", "open_coa"]);

  console.log("Current open escalated complaints:", existing?.length || 0);

  // Insert 2 complaints from 2 distinct departments on Diva-Kalyan corridor
  const { data: c1, error: e1 } = await supabaseAdmin
    .from("complaints")
    .insert({
      raised_by: profileId,
      department: "civil",
      description: "[P-WAY Ultrasonic Rail Joint Flaw] Station: Kalyan, Track: Diva – Kalyan, Line: Down Fast Line, Priority: High. Ultrasonic testing detected micro-fracture on fishplate joint KM 48/10.",
      status: "open_zonal_head",
    })
    .select()
    .single();

  const { data: c2, error: e2 } = await supabaseAdmin
    .from("complaints")
    .insert({
      raised_by: profileId,
      department: "electrical",
      description: "[TRD 25kV OHE Dropper Inspection] Station: Kalyan, Track: Diva – Kalyan, Line: Down Fast Line, Priority: High. Contact wire tension loss and damaged dropper assembly at mast KM 48/14.",
      status: "open_zonal_head",
    })
    .select()
    .single();

  console.log("Successfully seeded P-Way complaint:", c1?.id, e1 || "");
  console.log("Successfully seeded TRD / OHE complaint:", c2?.id, e2 || "");
}

seedTestClusterComplaints()
  .then(() => {
    console.log("Done seeding test cluster complaints.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error seeding complaints:", err);
    process.exit(1);
  });
