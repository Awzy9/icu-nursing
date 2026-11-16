"""python3 add_labels.py picked.json key:LABELID,... [note-key=note;...]  -> appends LABEL_SOURCES.csv rows from the openFDA picks."""
import csv,json,sys
o=json.load(open(sys.argv[1])); pairs=[p.split(":") for p in sys.argv[2].split(",")]
notes=dict(n.split("=",1) for n in sys.argv[3].split(";")) if len(sys.argv)>3 else {}
w=csv.writer(open("LABEL_SOURCES.csv","a",newline=""))
for k,lid in pairs:
    x=o[k]; of=x["openfda"]; note="US label only (FDA). EMA, MHRA and SFDA labels were not read; indications, warnings and presentations differ by country and by manufacturer"
    if k in notes: note+=". "+notes[k]
    w.writerow([lid,"FDA",of["generic_name"][0],"; ".join(of.get("brand_name",[]))[:80],of["manufacturer_name"][0],x["set_id"],str(x.get("version")),x["effective_time"],f"https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid={x['set_id']}","2026-11-15","Full text of the boxed warning, indications and usage, warnings (and precautions), contraindications and adverse reactions fields as returned by the openFDA drug label API; clinical pharmacology, dosage and administration, how supplied and patient counselling fields were not used","YELLOW: US federal labelling is public, but the label text is the manufacturer's; paraphrase and cite, do not reproduce dosing",note])
print(len(pairs),"rows")
