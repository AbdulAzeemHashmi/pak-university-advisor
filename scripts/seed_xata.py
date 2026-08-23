import os
import json
import urllib.request
import urllib.parse

def seed_xata():
    """
    Seeds the Xata database with records from data/processed/master_universities.json if XATA_API_KEY is configured.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    master_json = os.path.join(base_dir, "data", "processed", "master_universities.json")
    
    api_key = os.environ.get("XATA_API_KEY")
    db_url = os.environ.get("XATA_DATABASE_URL")
    
    if not api_key or not db_url:
        print("XATA_API_KEY or XATA_DATABASE_URL not set in environment. Skipping remote Xata seeding.")
        print("Application will seamlessly use data/processed/master_universities.json local dataset!")
        return

    print(f"Connecting to Xata database at {db_url}...")
    with open(master_json, 'r', encoding='utf-8') as f:
        unis = json.load(f)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    success_count = 0
    for u in unis:
        req = urllib.request.Request(
            f"{db_url}/tables/universities/data",
            data=json.dumps(u).encode('utf-8'),
            headers=headers,
            method="POST"
        )
        try:
            with urllib.request.urlopen(req) as resp:
                if resp.status in (200, 201):
                    success_count += 1
        except Exception as e:
            print(f"Failed to seed {u['name']}: {e}")

    print(f"Successfully seeded {success_count} records to Xata.")

if __name__ == "__main__":
    seed_xata()
