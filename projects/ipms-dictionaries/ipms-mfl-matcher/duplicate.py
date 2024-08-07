import pandas as pd
import json
import requests
import jellyfish
from collections import defaultdict
from helpers import * 


def extract_duplicates_to_json_mfl(input_csv, column_name, input_json, with_mfl_path, without_mfl_path,encoding='utf-8'):
    """
    Extracts rows with duplicate values in the specified column from a CSV file and writes them to a JSON file.

    Parameters:
    input_csv (str): The path to the input CSV file.
    column_name (str): The column name to check for duplicate values.
    output_json (str): The path to the output JSON file.
    """
    # Load the CSV file into a DataFrame
    df = pd.read_csv(input_csv,encoding=encoding)
    df.fillna('', inplace=True)

    # Group by the specified column and filter groups with more than one element
    grouped = df.groupby(column_name).filter(lambda x: len(x) > 1).groupby(column_name)

    # # Prepare the data in the desired format, including the count of duplicates
    result = []
    output = {}
    total_duplicates = len(grouped)
    for key, group in grouped:
        result.append({
            column_name: key,
            'count': len(group),
            'records': group.to_dict(orient='records')
        })
    


    with_mfl_count = 0
    without_mfl_count = 0
    with_mfl_output = {
        'totalEntries': with_mfl_count,
        'entries': []
    }
    without_mfl_output = {
        'totalEntries': without_mfl_count,
        'entries': []
    }
    try:
        additional_data = read_json_file(input_json)
        for entry in result:
            matching_mfl_entries = []
            ipms_name = entry[column_name]
            
            for item in additional_data:
                mfl_name = get_nested_value(item, ["resource", "name"])

                if jellyfish.jaro_winkler_similarity(mfl_name, ipms_name) >= 0.982:
                    matching_mfl_entries.append(item)
            
            if matching_mfl_entries and len(matching_mfl_entries) > 0:
                entry['correspondingMfl'] = {
                    'totalMflMatches': len(matching_mfl_entries),
                    'matchingFacilities': matching_mfl_entries
                }
                with_mfl_output['entries'].append(entry)
                with_mfl_output['totalEntries'] += 1
            else:
                without_mfl_output['entries'].append(entry)
                without_mfl_output['totalEntries'] += 1
        
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        additional_data = []

 


    # Write the result to a JSON file
    with open(with_mfl_path, 'w') as json_file:
        json.dump(with_mfl_output, json_file, indent=4)

    with open(without_mfl_path, 'w') as json_file:
        json.dump(without_mfl_output, json_file, indent=4)

    # return result

def find_duplicates_mfl(url, field, path):
    seen = defaultdict(list)
    data = fetch_json_from_url(url)

    for item in data:
        value = get_nested_value(item,field)
        if value is not None:
            seen[value].append(item)

    
    # Filter out groups with more than one item (i.e., duplicates)
    grouped_duplicates = []
    total_duplicates = 0

    for items in seen.values():
        if len(items) > 1:
            grouped_duplicates.append(items)
            total_duplicates += 1

    # Prepare output structure
    output = {
        'total': total_duplicates,
        'entries': grouped_duplicates
    }

    # Write output to a JSON file
    with open(path, 'w') as json_file:
        json.dump(output, json_file, indent=4)

    return output


fhir_locations_url = 'http://mflld.gov.org.bw/api/v1/mfl/fhir/bundle/location'

# IPMS
# csv_path = '../ipms-facilities-locations/output/IPMS_Locations_MFL.csv'
# json_path = './mfl-dataset.json'
# field_name = 'Name'
# output_path = 'duplicates_locations_ipms.json'
# duplicates_with_mfl_output_path = 'ipms_duplicates_with_mfl_locations.json'
# duplicates_without_mfl_output_path = 'ipms_duplicates_without_mfl_locations.json'
# mfl_duplicates_path = 'duplicates_locations_mfl.json'

# PIMS
csv_path = './pims-dataset.csv'
json_path = './mfl-dataset.json'
field_name = 'Facility' # Facility for PIMS or Name for IPMS
output_path = 'duplicates_locations_pims.json'
duplicates_with_mfl_output_path = 'pims_duplicates_with_mfl_locations.json'
duplicates_without_mfl_output_path = 'pims_duplicates_without_mfl_locations.json'
mfl_duplicates_path = 'duplicates_locations_mfl.json'


# extract_duplicates_to_json_mfl(csv_path, field_name, json_path, duplicates_with_mfl_output_path, duplicates_without_mfl_output_path)
extract_duplicates_to_json_mfl(csv_path, field_name, json_path, duplicates_with_mfl_output_path, duplicates_without_mfl_output_path, 'windows-1252')
