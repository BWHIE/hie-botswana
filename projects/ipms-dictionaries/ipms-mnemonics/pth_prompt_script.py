from utilities.helpers import *
from utilities.utils import *
import re
import json

# input file path
html_file_path = 'input/PTH PROMPT DICTIONARY.htm'

# Output JSON file
output_json_path = 'output/PTH_PROMPT_DICT_1.json'

extracted_text = parse_html_file(html_file_path)

lab_tests = re.split(r'<HR\s*size="2"\s*/?>', extracted_text, flags=re.IGNORECASE)
lab_tests = [item for item in lab_tests if item.strip()]
the_lines, column_names_list = process_first_test(lab_tests[0])
first_line = the_lines[1]
first_column = column_names_list[1]
first_indices = find_indices(first_line, first_column)


def execute_steps(lab_test):
    the_lines, the_columns = process_test(lab_test)

    indices_list = []
    the_dict = {}
    for myset, line in zip(the_columns, the_lines):
        indices = find_indices(line, myset)
        indices_list.append(indices)

    if len(the_lines) == 1:
        base_dict = construct_base_dict(first_column, first_indices, the_lines[0])
        return base_dict

    the_dict.update(map_values_to_columns(first_column, the_columns[0], first_indices, indices_list[0], 0))

    the_result_dict, result_index = update_dict(the_lines[1:],
                                                the_columns[1:],
                                                1,
                                                'CODE', 'CATEGORY')
    insert_value_dict('DETAILS', the_result_dict, the_dict)
    return the_dict


total_dicts = []
for index, test in enumerate(lab_tests[1:len(lab_tests) - 1]):
    final_dict = {'id': index}

    test_dict = execute_steps(test)
    final_dict.update(test_dict)
    total_dicts.append(final_dict)

with open(output_json_path, "w") as json_file:
    json.dump(total_dicts, json_file, indent=4)
