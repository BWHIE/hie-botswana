import csv
from bson import ObjectId

def generate_random_id():
    return str(ObjectId())

def add_random_id_column(input_file, output_file, has_header=True):
    with open(input_file, mode='r', newline='') as infile, open(output_file, mode='w', newline='') as outfile:
        if has_header:
            reader = csv.DictReader(infile)
            fieldnames = reader.fieldnames + ['MFLCode']
            
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for row in reader:
                row['MFLCode'] = generate_random_id()
                writer.writerow(row)
        else:
            reader = csv.reader(infile)
            rows = list(reader)
            max_columns = max(len(row) for row in rows)
            fieldnames = [f'Column{i+1}' for i in range(max_columns)] + ['MFLCode']
            
            writer = csv.writer(outfile)
            writer.writerow(fieldnames)
            
            for row in rows:
                row += [''] * (max_columns - len(row))  # Ensure all rows have the same number of columns
                row.append(generate_random_id())
                writer.writerow(row)


if __name__ == '__main__':
    input_file = 'output/IPMS_Facilities.csv'
    output_file = 'output/IPMS_Facilities_MFL.csv'
    add_random_id_column(input_file, output_file,False)

    # input_file = 'output/IPMS_Locations.csv'
    # output_file = 'output/IPMS_Locations_MFL.csv'
    # add_random_id_column(input_file, output_file,True)