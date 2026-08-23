import csv
import os
import json

def scrape_usaid_scholarship_universities():
    """
    Parses USAID Merit and Needs-Based Scholarship partner universities from the master dataset.
    """
    print("Generating USAID MNBSP partner university list...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    master_json = os.path.join(base_dir, "data", "processed", "master_universities.json")
    out_csv = os.path.join(base_dir, "data", "scholarship_lists", "usaid_scholarship_universities.csv")
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)

    usaid_list = []
    if os.path.exists(master_json):
        with open(master_json, 'r', encoding='utf-8') as f:
            unis = json.load(f)
            for u in unis:
                if u.get("has_usaid_scholarship"):
                    usaid_list.append({
                        "university_name": u["name"],
                        "city": u["city"],
                        "focal_person": f"USAID Focal Officer - {u['name']}",
                        "coverage": "Full Tuition + Lodging + Stipend",
                        "source": "USAID MNBSP"
                    })

    with open(out_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["university_name", "city", "focal_person", "coverage", "source"])
        writer.writeheader()
        writer.writerows(usaid_list)

    print(f"Saved {len(usaid_list)} USAID MNBSP partner universities to {out_csv}")
    return usaid_list

if __name__ == "__main__":
    scrape_usaid_scholarship_universities()
