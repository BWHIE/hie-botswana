import csv
import json
import requests 
import jellyfish 
from helpers import * 

def extract_unique_elements(csv_data, json_data, csv_name_field, json_name_field, threshold):
    """Extracts elements unique to CSV and JSON based on the 'name' field."""
    json_names = {get_nested_value(item, json_name_field) for item in json_data}
    csv_names = {row[csv_name_field].strip() for row in csv_data}

    csv_not_in_json = []
    json_not_in_csv = []

    for row in csv_data:
        csv_name = row[csv_name_field].strip()
        if not any(is_similar(csv_name, json_name.strip(), threshold) for json_name in json_names):
            csv_not_in_json.append(row)

    for item in json_data:
        json_name = get_nested_value(item, json_name_field).strip()
        if not any(is_similar(json_name.strip(), csv_name, threshold) for csv_name in csv_names):
            json_not_in_csv.append(item)

    csv_not_in_json_dict = {
        'total': len(csv_not_in_json),
        'entries': csv_not_in_json
    }

    json_not_in_csv_dict = {
        'total': len(json_not_in_csv),
        'entries': json_not_in_csv
    }

    return csv_not_in_json_dict, json_not_in_csv_dict

def extract_common_elements(csv_data, json_data, csv_name_field, json_name_field, threshold,field_to_map):
    """Extracts elements common to both CSV and JSON based on the specified name fields."""
    
    common_dict = {}

    common_elements = [
        {field_to_map: row, 'mfl': item}
        for row in csv_data
        for item in json_data
        if is_similar(row[csv_name_field].strip(), get_nested_value(item, json_name_field).strip(), threshold)
    ]

    common_dict['total'] = len(common_elements)
    common_dict['entries'] = common_elements

    return common_dict

def main(csv_file_path, json_file_path, csv_not_in_json_file_path, json_not_in_csv_file_path,common_elements_file_path, threshold, the_field):
    csv_data = read_csv(csv_file_path)
    # json_data = fetch_json_from_url(json_file_path)
    json_data = read_json_file(json_file_path)
    print('JSON Data Length ', len(json_data))
    print(' CSV data length ', len(csv_data))

    csv_not_in_json, json_not_in_csv = extract_unique_elements(csv_data, json_data, 'Name',  ["resource", "name"],threshold)
    common_elements = extract_common_elements(csv_data, json_data, 'Name', ["resource", "name"],threshold, the_field)
   
    # csv_not_in_json, json_not_in_csv = extract_unique_elements(csv_data, json_data, 'Column2',  ["resource", "name"])
    # common_elements = extract_common_elements(csv_data, json_data, 'Column2', ["resource", "name"])

    print('CSV not in JSON Data Length ', len(csv_not_in_json))
    print('JSON not in CSV Data Length ', len(json_not_in_csv))
    print('Common Elements ', len(common_elements))


    # Optionally, write the results to new files
    with open(csv_not_in_json_file_path, mode='w') as output_file:
        json.dump(csv_not_in_json, output_file, indent=4)

    with open(json_not_in_csv_file_path, mode='w') as output_file:
        json.dump(json_not_in_csv, output_file, indent=4)

    with open(common_elements_file_path, mode='w') as output_file:
        json.dump(common_elements, output_file, indent=4)

    print(f"CSV elements not in JSON have been written to {csv_not_in_json_file_path}")
    print(f"JSON elements not in CSV have been written to {json_not_in_csv_file_path}")
    print(f"JSON and CSV common elements have been written to {common_elements_file_path}")

def main_pims(csv_file_path, json_file_path, csv_not_in_json_file_path, json_not_in_csv_file_path,common_elements_file_path, threshold,the_field):
    csv_data = read_csv(csv_file_path, 'windows-1252')
    # json_data = fetch_json_from_url(json_file_path)
    json_data = read_json_file(json_file_path)

    print('JSON Data Length ', len(json_data))
    print(' CSV data length ', len(csv_data))
    csv_not_in_json, json_not_in_csv = extract_unique_elements(csv_data, json_data, 'Facility',  ["resource", "name"],threshold)
    common_elements = extract_common_elements(csv_data, json_data, 'Facility', ["resource", "name"],threshold,the_field)
    print('CSV not in JSON Data Length ', len(csv_not_in_json))
    print('JSON not in CSV Data Length ', len(json_not_in_csv))
    print('Common Elements ', len(common_elements))


    # Optionally, write the results to new files
    with open(csv_not_in_json_file_path, mode='w') as output_file:
        json.dump(csv_not_in_json, output_file, indent=4)

    with open(json_not_in_csv_file_path, mode='w') as output_file:
        json.dump(json_not_in_csv, output_file, indent=4)

    with open(common_elements_file_path, mode='w') as output_file:
        json.dump(common_elements, output_file, indent=4)

    print(f"CSV elements not in JSON have been written to {csv_not_in_json_file_path}")
    print(f"JSON elements not in CSV have been written to {json_not_in_csv_file_path}")
    print(f"JSON and CSV common elements have been written to {common_elements_file_path}")

def write_all_data(data_path, data_url,first_path, second_path):
    data = fetch_json_from_url(data_url)
    csv_data = read_csv(data_path)

    data_json = {
        "total": len(data),
        "entries": data

    }

    data_csv_json = {
        "total": len(csv_data),
        "entries":csv_data
    }

    with open(first_path, mode='w') as output_file:
        json.dump(data_csv_json, output_file, indent=4)

    with open(second_path, mode='w') as output_file:
        json.dump(data_json, output_file, indent=4)


# Define variables
field_name = 'pims' # or 'ipms'


csv_file_path = 'pims-dataset.csv'
# csv_not_in_json_file_path = 'locations/ipms_not_in_mfl_locations.json'
# json_not_in_csv_file_path = 'locations/mfl_not_in_ipms_locations.json'
# common_elements_file_path = 'locations/common_ipms_mfl.json'
my_threshold = 0.982
# json_file_path = 'http://mflld.gov.org.bw/api/v1/mfl/fhir/bundle/location'
json_file_path =  'mfl-dataset.json'
csv_not_in_json_file_path = 'locations/pims_not_in_mfl_locations.json'
json_not_in_csv_file_path = 'locations/mfl_not_in_pims_locations.json'
common_elements_file_path = 'locations/common_pims_mfl.json'
my_threshold = 0.982

# Execute the main function
if __name__ == "__main__":
    # main(csv_file_path, json_file_path, csv_not_in_json_file_path, json_not_in_csv_file_path,common_elements_file_path,my_threshold)
    main_pims(csv_file_path, json_file_path, csv_not_in_json_file_path, json_not_in_csv_file_path,common_elements_file_path,my_threshold,field_name)
