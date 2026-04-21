import json

path = "scripts/output/notices_final.json"
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

for d in data:
    if "lat" not in d or not d["lat"]:
        d["lat"] = 37.5665
    if "lng" not in d or not d["lng"]:
        d["lng"] = 126.9780

with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated coordinates in", path)
