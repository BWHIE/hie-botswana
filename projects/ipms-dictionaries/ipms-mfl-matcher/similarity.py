from helpers import read_csv, fetch_json_from_url, get_nested_value
import jellyfish
import json

def calculate_and_sort_jaro_winkler_distances(mfl_facilities, ipms_facilites, mfl_field, ipms_field, output_file):
    distances = []

    # Iterate through each pair of dictionaries
    for dict_mfl in mfl_facilities:
        for dict_ipms in ipms_facilites:
            # Extract values for comparison
            val_mfl = get_nested_value(dict_mfl, mfl_field)
            val_ipms = dict_ipms[ipms_field]
            
            # Calculate Jaro-Winkler distance
            distance = jellyfish.jaro_winkler_similarity(val_mfl, val_ipms)
            
            # Append distance and pair info to distances list if distance is not 1.0
            if distance != 1.0:
                distances.append({
                    'mflName': val_mfl,
                    # 'ipmsName': val_ipms,
                    'pimsName': val_ipms,
                    'distance': distance
                })

    # Sort distances by the highest distance (descending order)
    distances_sorted = sorted(distances, key=lambda x: x['distance'], reverse=True)

    # Write sorted distances to a JSON file
    with open(output_file, 'w') as f:
        json.dump(distances_sorted, f, indent=4)

    print(f"Distances sorted by highest: {output_file}")

def main(mfl_path, ipms_path, output_path):
    ipms_data = read_csv(ipms_path)
    mfl_data = fetch_json_from_url(mfl_path)
    calculate_and_sort_jaro_winkler_distances(mfl_data, ipms_data, ["resource", "name"], "Name", output_path)

def main_pims(mfl_path, pims_path, output_path):
    pims_data = read_csv(pims_path, 'windows-1252')
    mfl_data = fetch_json_from_url(mfl_path)
    calculate_and_sort_jaro_winkler_distances(mfl_data, pims_data, ["resource", "name"], "Facility", output_path)


    


# the_mfl_path = 'http://mflld.gov.org.bw/api/v1/mfl/fhir/bundle/location'
# the_csv_path = '../ipms-facilities-locations/output/IPMS_Locations_MFL.csv'
# the_output_path = 'similarity-scores.json'

the_mfl_path = 'http://mflld.gov.org.bw/api/v1/mfl/fhir/bundle/location'
the_csv_path = 'pims-dataset.csv'
the_output_path = 'similarity-scores-pims.json'
if __name__ == "__main__":
    # main(the_mfl_path, the_csv_path, the_output_path)

    main_pims(the_mfl_path, the_csv_path, the_output_path)
