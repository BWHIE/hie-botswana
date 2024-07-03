import csv 
import requests 
import json
import jellyfish

def read_csv(file_path,the_encoding='utf-8'):
    """Reads a CSV file and returns a dictionary with a specified key field."""
    csv_data = []
    with open(file_path, encoding=the_encoding, mode='r', newline='') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            csv_data.append(row)
    return csv_data


def read_json_file(file_path):
    """
    Reads a JSON file and returns the data.
    
    :param file_path: The path to the JSON file.
    :return: The data parsed from the JSON file.
    """
    with open(file_path, 'r') as file:
        data = json.load(file)
    return data

def fetch_json_from_url(url):
    """
    Fetches and parses JSON data from the given URL.

    Parameters:
    url (str): The URL to fetch the JSON data from.

    Returns:
    dict: Parsed JSON data if the request is successful.
    None: If the request fails.
    """
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an HTTPError for bad responses
        data = response.json()
        if 'entry' in data:
            return data['entry']
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return None
    
def get_nested_value(data, keys):
    """Gets a nested value from a dictionary given a list of keys."""
    for key in keys:
        if isinstance(data, dict) and key in data:
            data = data[key]
        else:
            return None
    if isinstance(data, str):
        return data.strip()  # Strip leading and trailing whitespaces from string values
    return data

def is_similar(name1, name2, threshold):
    return jellyfish.jaro_winkler_similarity(name1, name2) >= threshold
    