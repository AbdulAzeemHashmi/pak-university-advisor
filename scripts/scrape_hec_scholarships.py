import csv
import os
import json

def scrape_hec_scholarship_universities():
    """
    Parses HEC Need-Based Scholarship target universities from the master dataset and generates scholarship list.
    """
    print("Generating HEC Need-Based Scholarship list...")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    master_json = os.path.join(base_dir, "data", "processed", "master_universities.json")
    out_csv = os.path.join(base_dir, "data", "scholarship_lists", "hec_scholarship_universities.csv")
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)

    hec_list = []
    if os.path.exists(master_json):
        with open(master_json, 'r', encoding='utf-8') as f:
            unis = json.load(f)
            for u in unis:
                if u.get("has_hec_scholarship"):
                    hec_list.append({
                        "university_name": u["name"],
                        "city": u["city"],
                        "type": u["type"],
                        "scholarship_name": "HEC Need-Based Scholarship",
                        "coverage": "Full Tuition + Monthly Stipend",
                        "contact": u.get("financial_aid_office", "")
                    })

    with open(out_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["university_name", "city", "type", "scholarship_name", "coverage", "contact"])
        writer.writeheader()
        writer.writerows(hec_list)

    print(f"Saved {len(hec_list)} HEC scholarship universities to {out_csv}")
    return hec_list

if __name__ == "__main__":
    scrape_hec_scholarship_universities()
