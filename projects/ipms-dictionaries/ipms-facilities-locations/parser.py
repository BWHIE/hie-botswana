import csv
import re


def parse_line(line):
    # Split the line and filter empty elements
    regex = r"^\s*([0-9.]+)?\s*([A-Z]+)\s+([A-z 0-9\-]+)\s+([YN])\s+([OI])"

    match = re.match(regex, line)
    print(line)
    if match:
        # Extract each group
        #number = match.group(1)  # Capturing a number (possibly float)
        mnemonic = match.group(2)    # Capturing a code (uppercase letters)
        name = match.group(3).strip()  # Capturing a description
        name = re.sub(r'\s{2,}', '\t', name)
        name = re.sub(r'\t{2,}', '\t', name)
        tmp = name.split("\t")
        if len(tmp) == 2 and re.search(r"^(([A-Z]+)|(.*?)(\d+\-?(-\d+(-\d+)?)?))$", tmp[1]):
            name = tmp[0]
            old_id = tmp[1]
        else:
            old_id = ''


        # Search for the pattern
        match2 = re.search(r"^(.*?)(\d+\-?(-\d+(-\d+)?)?)$", name)

        if match2:
            name = match2.group(1).strip()  # Remove any trailing spaces
            old_id = match2.group(2)

        active = match.group(4)  # Capturing a Yes/No flag
        facility_type = match.group(5)  # Capturing an O/I flag
        print(mnemonic, name, active, facility_type)
        return mnemonic, name, old_id, active, facility_type
    else:
        return None

def process_file(input_file, output_file):
    with open(input_file, 'r') as file, open(output_file, 'w', newline='') as out_file:
        csv_writer = csv.writer(out_file)
        # Write headers
        csv_writer.writerow(['Mnemonic', 'Name', 'Old ID', 'Active', 'Type', 'Category'])
        
        # Iterate through the file line by line
        for line in file:
            line = line.strip()
            # print(line)
            if line.startswith('DATE') or line.startswith('SORT') or line.startswith('KAGTSH'):
                continue
            parsed = parse_line(line)
            if parsed:
                mnemonic, name, old_id, active, facility_type = parsed
                category = "Remote" if mnemonic.startswith('X') else "Local"
                csv_writer.writerow([mnemonic, name, old_id, active, facility_type, category])

# Replace 'input.txt' with your actual file path
process_file('input/IPMS_Locations.txt', 'output/IPMS_Locations.csv')
#process_file('sample.txt', 'sample_output.csv')
