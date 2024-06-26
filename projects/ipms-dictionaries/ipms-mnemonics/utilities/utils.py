from io import StringIO
from html.parser import HTMLParser
from bs4 import BeautifulSoup
import re


class MLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text = StringIO()

    def handle_data(self, d):
        self.text.write(d)

    def get_data(self):
        return self.text.getvalue()


def strip_tags(html):
    s = MLStripper()
    s.feed(html)
    return s.get_data()


def find_indices(input_string, names_list):
    indices = []
    start_index = 0
    for name in names_list:
        index = input_string.find(name, start_index)
        if index != -1:
            indices.append(index)
            start_index = index + len(name)  # Update start_index for next search
        else:
            indices.append(None)
    return indices


def remove_special_characters(text):
    # Regular expression to match special characters delimited by spaces from both sides
    pattern = r'(?<=\s)[^\w\s+](?=\s)'
    # Replace matched patterns with empty string
    return re.sub(pattern, '', text)


def trim_text(text):
    text = re.sub(r'\s+', ' ', text.strip())
    return text


def extract_first_column_names(header_line):
    # Split the header line based on consecutive spaces (assuming columns are separated by at least two spaces)

    lines = [line for line in header_line.split('\n') if line.strip()]

    first_line = lines[0].split()
    first_line = [item.strip() for item in first_line if item.strip() and not re.match(r'^[\W_]*$', item)]
    results = [first_line]
    first_cleaned_line = remove_special_characters(lines[0])
    # Adjusted pattern to include '#'
    cleaned_lines = [first_cleaned_line]

    for line in lines[1:]:
        # Splitting the line based on multiple spaces using regular expression
        result = re.split(r'\s{1,}', line)
        # Removing empty strings from the result
        result = [item.strip() for item in result if item.strip()]
        results.append(result)
        cleaned_line = remove_special_characters(line)  # Adjusted pattern to include '#'
        cleaned_lines.append(cleaned_line)
    return cleaned_lines, results


def extract_column_names(value_header_line):
    # Split the header line based on consecutive spaces (assuming columns are separated by at least two spaces)
    lines = [line for line in value_header_line.split('\n') if line.strip()]
    results = []
    for line in lines:
        # Splitting the line based on multiple spaces using regular expression
        #result = re.split(r'\s{2,}', line
        result = line.split()
        # Removing empty strings from the result
        result = [item.strip() for item in result if item.strip() and not re.match(r'^[\W_]*$', item)]
        results.append(result)
    return lines, results


def rextract_columns_names(value_header_line):
    lines = [line for line in value_header_line.split('\n') if line.strip()]
    results = []
    for line in lines:
        # Splitting the line based on multiple spaces using regular expression
        result = re.split(r'\s{2,}', line)
        # result = result.split()
        # Removing empty strings from the result
        result = [item.strip() for item in result if item.strip()]
        results.append(result)
    return results


def flatten_list(nested_list):
    if isinstance(nested_list, list) and any(isinstance(item, list) for item in nested_list):
        return [item for sublist in nested_list for item in sublist]
    else:
        return nested_list


# Function to parse input file and extract text
def parse_html_file(file_path):
    with open(file_path, 'r', encoding='windows-1252') as file:
        html_text = file.read()

        # Parse the input
        soup = BeautifulSoup(html_text, 'html.parser')
        # Find the first occurrence of the <table> tag
        table_tag = soup.find('table')

        # If <table> tag is found, find the first <pre> tag within it and skip it
        if table_tag:
            pre_tag = table_tag.find('pre')
            if pre_tag:
                pre_tag.extract()  # Remove the <pre> tag and its contents

            # Get the input string starting from the first <table> tag
            parsed_html = str(table_tag) + ''.join(str(tag) for tag in table_tag.find_next_siblings())
            return parsed_html
        else:
            print("No <table> tag found in the input file.")
            return None
