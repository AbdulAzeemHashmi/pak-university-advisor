export const tables = [
  {
    name: "universities",
    columns: [
      { name: "name", type: "string" },
      { name: "name_urdu", type: "string" },
      { name: "city", type: "string" },
      { name: "province", type: "string" },
      { name: "type", type: "string" },
      { name: "established_year", type: "int" },
      { name: "website", type: "string" },
      { name: "image_url", type: "string" },
      { name: "ranking", type: "int" },
      { name: "fee_range_max", type: "int" },
      { name: "has_hec_scholarship", type: "bool" },
      { name: "has_usaid_scholarship", type: "bool" },
      { name: "scholarship_programs", type: "multiple" },
      { name: "financial_aid_office", type: "string" },
      { name: "scholarship_details", type: "text" },
      { name: "programs", type: "multiple" }
    ]
  },
  {
    name: "users",
    columns: [
      { name: "email", type: "email", unique: true },
      { name: "password", type: "string" },
      { name: "name", type: "string" },
      { name: "preferences", type: "json" },
      { name: "createdAt", type: "datetime" }
    ]
  },
  {
    name: "shortlists",
    columns: [
      { name: "userId", type: "string" },
      { name: "universityId", type: "string" },
      { name: "addedAt", type: "datetime" }
    ]
  }
];
