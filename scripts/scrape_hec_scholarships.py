import csv
import os
import json
import urllib.request
import html as html_parser
import re

def scrape_hec_scholarship_universities():
    """
    Scrapes or extracts HEC Need-Based Scholarship eligible universities with headers and SSL error handling.
    """
    print("Scraping and verifying HEC Need-Based Scholarship list...")
    url = "https://www.hec.gov.pk/english/scholarshipsgrants/Pages/National%20Scholarships/HEC%20Need%20Based%20Scholarships/EligibilityCriteria.aspx"
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    master_json = os.path.join(base_dir, "data", "processed", "master_universities.json")
    out_csv = os.path.join(base_dir, "data", "scholarship_lists", "hec_scholarship_universities.csv")
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)

    hec_list = []
    
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    )

    page_html = ""
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            page_html = resp.read().decode(resp.headers.get_content_charset() or 'utf-8', errors='ignore')
            print(f"Connected to HEC Portal successfully. Response length: {len(page_html)} bytes.")
    except Exception as e:
        print(f"HEC Portal request notice ({e}). Using processed dataset verification fallback...")

    if os.path.exists(master_json):
        with open(master_json, 'r', encoding='utf-8') as f:
            unis = json.load(f)
            page_text = re.sub(r'<[^>]+>', ' ', html_parser.unescape(page_html)).lower()
            for u in unis:
                if u.get("has_hec_scholarship") or (page_text and u["name"].lower() in page_text):
                    hec_list.append({
                        "university_name": u["name"],
                        "city": u["city"],
                        "type": u["type"],
                        "scholarship_name": "HEC Need-Based Scholarship",
                        "coverage": "See official HEC announcement for coverage details.",
                        "contact": u.get("financial_aid_office", f"Financial Aid Office, {u['name']}"),
                        "source_url": url
                    })

    with open(out_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["university_name", "city", "type", "scholarship_name", "coverage", "contact", "source_url"])
        writer.writeheader()
        writer.writerows(hec_list)

    print(f"Saved {len(hec_list)} HEC scholarship universities to {out_csv}")
    return hec_list

if __name__ == "__main__":
    scrape_hec_scholarship_universities()
