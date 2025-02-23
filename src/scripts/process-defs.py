import json

def process_definitions(data):
    for entry in data:
        if "def" not in entry:
            continue
            
        definitions = entry["def"]
        seen = set(definitions)
        new_terms = []
        
        for d in definitions:
            if '(' in d:
                processed = d.split('(')[0].strip()
                if processed and processed not in seen:
                    new_terms.append(processed)
                    seen.add(processed)
            if '-' in d:
                processed = d.replace('-', ' ')
                if processed and processed not in seen:
                    new_terms.append(processed)
                    seen.add(processed)
        
        entry["def"].extend(new_terms)
    
    return data

if __name__ == "__main__":
    input_path = "src/data/word-bank/defs.json"
    output_path = "src/data/word-bank/defs2.json"
    
    with open(input_path, 'r') as f:
        data = json.load(f)
    
    processed_data = process_definitions(data)
    
    with open(output_path, 'w') as f:
        json.dump(processed_data, f, indent=4, ensure_ascii=False)