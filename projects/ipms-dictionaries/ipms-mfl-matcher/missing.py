import json

def load_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)


def make_hashable(entry):
    """Convert a dictionary to a tuple of sorted key-value pairs, recursively handling nested structures."""
    if isinstance(entry, dict):
        return tuple(sorted((k, make_hashable(v)) for k, v in entry.items()))
    elif isinstance(entry, list):
        return tuple(make_hashable(e) for e in entry)
    return entry

def find_missing_entries(json_file1, json_file2):
    set1 = set(make_hashable(entry) for entry in json_file1['entries'])
    set2 = set(make_hashable(entry) for entry in json_file2['entries'])
    
    missing_entries = set1 - set2
    return [dict(entry) for entry in (dict(e) for e in missing_entries)]

def write_json(data, file_path):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

# Load JSON files
file1 = 'with_mfl_locations_1.json'
file2 = 'with_mfl_locations.json'

json_data1 = load_json(file1)
json_data2 = load_json(file2)

# Find missing entries
missing_entries = find_missing_entries(json_data1, json_data2)

# Write missing entries to a new JSON file
output_file = 'missing_entries.json'
write_json(missing_entries, output_file)