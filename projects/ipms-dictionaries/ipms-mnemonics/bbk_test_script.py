from utilities.helpers import *
from utilities.utils import *

import re
import json

# input file path
html_file_path = 'input/BBK TEST DICTIONARY.htm'

# Output JSON file
output_json_path = 'output/BBK_TEST_DICT.json'

extracted_text = parse_html_file(html_file_path)

lab_tests = re.split(r'<HR\s*size="2"\s*/?>', extracted_text, flags=re.IGNORECASE)
lab_tests = [item for item in lab_tests if item.strip()]
the_lines, column_names_list = process_first_test(lab_tests[0])
first_line = the_lines[0]
first_column = column_names_list[0]
first_indices = find_indices(first_line, first_column)


def execute_steps(lab_test):
    the_lines, the_columns = process_test(lab_test)

    indices_list = []
    the_dict = {}
    the_dict_final = {}
    for myset, line in zip(the_columns, the_lines):
        indices = find_indices(line, myset)
        indices_list.append(indices)

    if len(the_lines) == 1:
        base_dict = construct_base_dict(first_column, first_indices, the_lines[0])
        return base_dict
    the_dict.update(map_values_to_columns(first_column, the_columns[0], first_indices, indices_list[0], 0))
    next_lines = remove_special_characters(the_lines[1])
    next_columns = re.split(r'\s{2,}', next_lines.strip()) if next_lines.strip() else []

    column_indices = find_indices(next_lines, next_columns)

    pattern = r'LAB SITES:'

    # Replacement with 10 spaces
    replacement = ' ' * 10
    the_lines[2] = re.sub(pattern, replacement, the_lines[2])
    the_columns[2] = re.split(r'\s{1,}', the_lines[2].strip()) if the_lines[2].strip() else []

    the_new_dict, the_index = map_lab_sites(the_lines[2:], the_columns[2:], next_columns, column_indices)

    the_dict.update(the_new_dict)

    the_index = the_index + 1

    the_new_dict_one, the_index = map_texts_to_dicts(the_lines, the_columns, the_index, 'RESULT CODES')

    the_new_dict_one.update(
        map_text_to_dict_variant(the_lines[the_index + 1:the_index + 2][0]))  #Map Restrict to List Field manually
    the_index = the_index + 1

    the_dict = insert_value_dict('#', the_new_dict_one, the_dict)
    # the_dict.update(the_new_dict_one)
    # if the_new_dict_one != {}:
    #     the_dict.update(the_new_dict_one)

    # the_dict_final.update(the_dict)
    the_renewed_dict, renewed_index_ = update_dict_variant(the_lines[the_index + 1:], the_columns[the_index + 1:],
                                                           the_index + 1, 'NOR-LO',
                                                           'NOR-HI', 'REFLEX', 'SPEC')

    the_dict = insert_value_dict('RES GRP I', the_renewed_dict, the_dict)

    the_renewed_dict_one, renewed_index_one = update_dict_variant(the_lines[the_index + 1:],
                                                                  the_columns[the_index + 1:],
                                                                  the_index + 1, 'REFLEX', 'SPEC', '(SHORT)', '(LONG)')

    the_dict = insert_value_dict('RES GRP II', the_renewed_dict_one, the_dict)

    # if the_renewed_dict != {}:
    #     the_dict_final.update(the_renewed_dict)
    the_component_dict, component_index = update_dict_variant(the_lines[the_index + 1:], the_columns[the_index + 1:],
                                                              the_index + 1,
                                                              'COMPONENT', 'PROFILE', '(SHORT)', '(LONG)')
    # if the_component_dict != {}:
    #     the_dict_final.update(the_component_dict)

    the_dict = insert_value_dict('COMPONENTS', the_component_dict, the_dict)

    the_renewed_dict_two, renewed_index_two = update_dict_variant(the_lines[the_index:], the_columns[the_index:], index,
                                                                  '(SHORT)', '(LONG)', 'METHOD', 'LOINC')

    the_dict = insert_value_dict('RES GRP III', the_renewed_dict_two, the_dict)

    the_renewed_dict_three, renewed_index_three = update_dict_variant(the_lines[the_index:], the_columns[the_index:],
                                                                      index,
                                                                      'METHOD', 'LOINC', 'LIS SITE', 'DFLT')

    the_dict = insert_value_dict('RES GRP IV', the_renewed_dict_three, the_dict)

    the_lis_dict, lis_index = update_dict_by_key(the_lines[the_index + 1:], the_columns[the_index + 1:], the_index + 1,
                                                 'LIS SITE')

    the_dict = insert_value_dict('LIS SITES', the_lis_dict, the_dict)

    return the_dict


total_dicts = []

for index, test in enumerate(lab_tests[1:len(lab_tests) - 1]):
    final_dict = {'id': index}

    test_dict = execute_steps(test)
    final_dict.update(test_dict)
    total_dicts.append(final_dict)

with open(output_json_path, "w") as json_file:
    json.dump(total_dicts, json_file, indent=4)
