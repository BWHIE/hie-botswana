from .utils import *


def process_first_test(test):
    the_plain = strip_tags(test)
    lines, the_column_names_list = extract_first_column_names(the_plain)
    return lines, the_column_names_list


def process_test(test):
    the_plain = strip_tags(test)

    lines, the_column_names_list = extract_column_names(the_plain)
    return lines, the_column_names_list


def find_word_index(words, indices, target_word):
    for i, word in enumerate(words):
        if word == target_word:
            if i < len(indices):
                return indices[i]
            else:
                return None
    return None


def find_word_by_index(words, indices, target_index):
    for i, index in enumerate(indices):
        if index == target_index:
            if i < len(words):
                return words[i]
            else:
                return None
    return None


def map_values_to_columns(columns, values, indices, value_indices, tolerance):
    # Creating the mapping dictionary
    mapping = {column: "" for column in columns}

    # Iterate over the columns and indices to map the appropriate values
    for i, col in enumerate(columns):
        col_start = indices[i]
        col_end = indices[i + 1] if i + 1 < len(indices) else float('inf')

        # Gather all values that fall within the current column's range
        values_in_range = []
        for j, val_index in enumerate(value_indices):
            if len(values[j]) == 1 and col_start - tolerance <= val_index < col_end + tolerance:

                values_in_range.append(values[j])
            elif col_start <= val_index < col_end:
                values_in_range.append(values[j])

        # Join all values with a space if multiple values exist
        if values_in_range:
            mapping[col] = ' '.join(values_in_range)
    return mapping


def map_text_to_dict(text):
    # Split text into lines and remove any leading/trailing whitespace
    lines = [line.strip() for line in text.split('\n')]

    # Create an empty dictionary to store the key-value pairs
    result_dict = {}

    # Iterate over each line
    for line in lines:
        # If there's only one colon in the line
        if (line.count(':')) == 1:
            # Split the line into key-value pairs based on colon followed by any amount of whitespace
            # key, value = re.split(r':\s*', line)
            key, value = line.split(':', 1)
            result_dict[key.strip()] = value.strip()

        else:
            # Split the line into key-value pairs based on multiple whitespaces
            pairs = re.split(r'\s{4,}', line)
            for i in range(len(pairs)):
                if ':' in pairs[i] or '?' in pairs[i]:
                    # Initialize the value for the current key
                    new_key, new_value = pairs[i].strip().split(':', 1)
                    result_dict[new_key.strip()] = new_value.strip()

    return result_dict


def map_text_to_dict_variant(text):
    # Split text into lines and remove any leading/trailing whitespace
    lines = [line.strip() for line in text.split('\n')]

    # Create an empty dictionary to store the key-value pairs
    result_dict = {}

    # Iterate over each line
    for line in lines:
        # If there's only one colon or question mark in the line
        if (line.count(':') == 1) or (line.count('?') == 1):
            # Split the line into key-value pairs based on colon or question mark followed by any amount of whitespace
            if ':' in line:
                key, value = line.split(':', 1)
            elif '?' in line:
                key, value = line.split('?', 1)
            result_dict[key.strip()] = value.strip()
    return result_dict


def map_text_with_multiple_seperators_to_dict(text):
    # Create an empty dictionary to store the key-value pairs
    result_dict = {}

    # Split text into lines and iterate over each line
    for line in text.split('\n'):
        # Split each line based on colons (':') to extract key-value pairs
        pair1, pair2 = line.split(':', 1)
        key = pair1.strip()

        # Use regular expression to find the index of the next key
        next_key_index = pair2.find('?')
        matches = re.finditer(r'\s{2,}', text)
        indices = [match.start() for match in matches]
        key_index = max(indices)
        value = pair2[:key_index]
        result_dict[key] = value

        if next_key_index != -1:
            # Extract the value up to the next key and remove trailing whitespace
            key = pair2[key_index + 1:next_key_index].strip()
            value = pair2[next_key_index + 1:].strip()
            # Store the key-value pair in the dictionary
            result_dict[key] = value

    return result_dict


def map_lab_sites(value_lines, values, columns, the_indices):
    my_results = []
    for i, (my_line, value) in enumerate(zip(value_lines, values)):
        val_indices = find_indices(my_line, value)
        if val_indices[0] == the_indices[0]:
            i += 1
            break
        my_results.append(value[1])
        i += 1
    my_sites = {columns[0]: my_results}
    return my_sites, i


def update_dict_result_codes(my_dict, lines, columns, key_value):
    global new_value_str
    main_indices = None
    the_index = 0
    for my_line, my_columns in zip(lines, columns):
        my_columns = rextract_columns_names(my_line)
        my_columns = flatten_list(my_columns)
        if ':' in my_line:
            main_indices = find_indices(my_line, my_columns)

        if ':' not in my_line:

            the_indices = find_indices(my_line, my_columns)

            if main_indices is None:
                continue
            if the_indices[0] == main_indices[0] == 8:
                break

            the_set = set(the_indices)

            the_main_set = set(main_indices)
            common_elements = sorted(the_main_set.intersection(the_set))

            # Convert the result back to a list (if needed)
            common_elements = list(common_elements)
            new_value = []
            if len(common_elements) == 1:
                continue

            for element in common_elements:

                my_element = find_word_by_index(my_columns, the_indices, element)
                if my_element is None:
                    continue
                new_value.append(my_element)
                new_value_str = ' '.join(new_value)

            the_key = next(iter(my_dict.keys()))
            the_value = [next(iter(my_dict.values()))]
            if new_value_str:
                the_value = ''.join(the_value)
                the_value = trim_text(the_value)
                the_value = the_value + " , " + new_value_str
                my_dict[the_key] = the_value
                the_index += 1
    reprocess_result_codes(my_dict, key_value)
    return my_dict, the_index


def reprocess_result_codes(the_dict, key_value):
    input_values = the_dict[key_value]
    output_list = [s.strip() for s in input_values.split(',')]
    the_dict[key_value] = output_list
    return the_dict


def update_dict_by_key(lines, columns, current_index, my_key):
    full_dict = {}
    res_group_found = False
    res_group_keys = []
    dict_list = []
    index = 0

    for my_line, my_column in zip(lines, columns):

        if ':' in my_line or '?' in my_line:
            index += 1
            # continue

        if my_key in my_line:

            # If 'RES GRP' is found, set res_group_found to True and store keys
            res_group_found = True
            res_group_keys = my_column
            the_indices = find_indices(my_line, res_group_keys)

        elif res_group_found:
            # If 'RES GRP' was found previously
            my_values = []
            my_lines = []
            res_group_values = my_column
            my_values.append(res_group_values)
            my_lines.append(my_line)

            for value, line in zip(my_values, my_lines):
                val_indices = find_indices(line, value)
                the_dict = map_values_to_columns(res_group_keys, value, the_indices, val_indices, 0)
                the_dict = {key: value for key, value in the_dict.items() if key != 'NAME'}
                dict_list.append(the_dict)
                index += 1
            for d in dict_list:
                d = {key: value for key, value in d.items() if key != 'NAME'}

                # Check if the keys in d match res_group_keys
                if set(d.keys()) == set(res_group_keys):
                    # Combine dictionaries into full_dict
                    for key in res_group_keys:

                        if key not in full_dict:
                            full_dict[key] = []
                        full_dict[key].extend([d.get(key, '')])

                else:
                    new_dict = {}
                    # If keys are not exactly the same, add a new dictionary to full_dict
                    for key in res_group_keys:
                        new_dict[key] = d.get(key, '')
                    full_dict[len(full_dict)] = new_dict

        dict_list = []

    return filter_dict(full_dict), index + current_index


def update_dict(lines, columns, current_index, my_key, key2):
    full_dict = {}
    res_group_found = False
    res_group_keys = []
    index = 0
    occurence = 0

    for my_line, my_column in zip(lines, columns):

        if (':' in my_line or '?' in my_line) and ('ACTIVE?' not in my_line and my_line.count('?') > 1):
            break
        if 'GRPS?' in my_line or 'DEFAULT' in my_line:
            break


        if my_key in my_line:

            # If 'my_key' is found, set res_group_found to True and store keys
            res_group_found = True
            res_group_keys = my_column
            the_indices = find_indices(my_line, res_group_keys)
            if 'RES GRP' in my_line:
                occurence += 1


        elif res_group_found:
            if occurence > 1:
                break
            # If 'my_key' was found previously
            if key2 and key2 in my_line:

                # Nested logic when key2 is found in the line
                nested_values = [my_column]  # Ensure this is a list for iteration
                nested_lines = [my_line]  # Ensure this is a list for iteration
                for value, line in zip(nested_values, nested_lines):
                    val_indices = find_indices(line, value)
                    nested_dict = map_values_to_columns(res_group_keys, value, the_indices, val_indices, 0)
                    nested_dict = {key: value for key, value in nested_dict.items() if key != 'NAME'}
                    index += 1
                    full_dict[index] = nested_dict

                # Append nested_dict_list to dict_list

            else:
                # Handle the case when key2 is not found
                my_values = [my_column]
                my_lines = [my_line]

                for value, line in zip(my_values, my_lines):
                    val_indices = find_indices(line, value)
                    the_dict = map_values_to_columns(res_group_keys, value, the_indices, val_indices, 0)
                    the_dict = {key: value for key, value in the_dict.items() if key != 'NAME'}
                    index += 1
                    full_dict[index] = the_dict

    return filter_dict(full_dict), index + current_index


def update_dict_variant(lines, columns, current_index, my_key, key2,break_key1,break_key2):
    full_dict = {}
    res_group_found = False
    res_group_keys = []
    index = 0

    for my_line, my_column in zip(lines, columns):
        if (':' in my_line or '?' in my_line) and ('ACTIVE?' not in my_line and my_line.count('?') > 1):
            break
        if break_key1 in my_line or break_key2 in my_line:
            break

        if my_key in my_line:
            # If 'my_key' is found, set res_group_found to True and store keys
            res_group_found = True
            res_group_keys = my_column
            the_indices = find_indices(my_line, res_group_keys)

        elif res_group_found:
            # If 'my_key' was found previously
            if key2 and key2 in my_line:

                # Nested logic when key2 is found in the line
                nested_values = [my_column]  # Ensure this is a list for iteration
                nested_lines = [my_line]  # Ensure this is a list for iteration
                for value, line in zip(nested_values, nested_lines):
                    val_indices = find_indices(line, value)
                    nested_dict = map_values_to_columns(res_group_keys, value, the_indices, val_indices, 0)
                    nested_dict = {key: value for key, value in nested_dict.items() if key != 'NAME'}
                    index += 1
                    full_dict[index] = nested_dict

                # Append nested_dict_list to dict_list

            else:
                # Handle the case when key2 is not found
                my_values = [my_column]
                my_lines = [my_line]

                for value, line in zip(my_values, my_lines):
                    val_indices = find_indices(line, value)
                    the_dict = map_values_to_columns(res_group_keys, value, the_indices, val_indices, 0)
                    the_dict = {key: value for key, value in the_dict.items() if key != 'NAME'}
                    index += 1
                    full_dict[index] = the_dict

    return filter_dict(full_dict), index + current_index


def insert_value_dict(fieldname, my_value, my_dict):
    my_dict[fieldname] = my_value

    return my_dict


def update_dict_mic_procedure(lines, columns, current_index, my_key, key2):
    full_dict = {}
    res_group_found = False
    res_group_keys = []
    dict_list = []
    index = 0

    for my_line, my_column in zip(lines, columns):
        if 'REMOVED SPECIAL RESULTS' in my_line:
            break

        if ':' in my_line:
            break

        if my_key in my_line:
            # If 'my_key' is found, set res_group_found to True and store keys
            res_group_found = True
            res_group_keys = my_column
            the_indices = find_indices(my_line, res_group_keys)

        elif res_group_found:
            # If 'my_key' was found previously
            if key2 and key2 in my_line:

                # Nested logic when key2 is found in the line
                nested_dict_list = []
                nested_values = [my_column]  # Ensure this is a list for iteration
                nested_lines = [my_line]  # Ensure this is a list for iteration
                for value, line in zip(nested_values, nested_lines):
                    val_indices = find_indices(line, value)
                    nested_dict = map_values_to_columns(res_group_keys, value, the_indices, val_indices, 0)
                    nested_dict = {key: value for key, value in nested_dict.items() if key != 'NAME'}
                    nested_dict_list.append(nested_dict)

                # Append nested_dict_list to dict_list
                dict_list.append(nested_dict_list)

            else:
                # Handle the case when key2 is not found
                my_values = [my_column]
                my_lines = [my_line]

                for value, line in zip(my_values, my_lines):
                    val_indices = find_indices(line, value)
                    the_dict = map_values_to_columns(res_group_keys, value, the_indices, val_indices, 0)
                    the_dict = {key: value for key, value in the_dict.items() if key != 'NAME'}
                    full_dict[index] = the_dict
                index += 1

    return filter_dict(full_dict), index + current_index


def filter_dict(input_dict):
    filtered_dict = {}

    for key, value in input_dict.items():
        if isinstance(value, list):
            if len(value) == 1:
                # If a value is a list with a single element, convert it to a string
                filtered_dict[key] = value[0]
            elif all(element == '' for element in value):
                # If a value is a list with all elements being empty strings, make it an empty list
                filtered_dict[key] = []
            else:
                # Otherwise, keep the list as it is
                filtered_dict[key] = value
        else:
            # If the value is not a list, keep it as it is
            filtered_dict[key] = value

    # filtered_dict = {key: value for key, value in filtered_dict.items() if key != 'NAME'}
    return filtered_dict


def map_texts_to_dicts(lines, columns, index, my_key):
    result = {}
    lines_iter = iter(lines[index:])
    for line in lines_iter:
        if ':' not in line:
            break
        if ':' in line:
            if my_key not in line:
                if line.count(':') >= 1:
                    result.update(map_text_to_dict(line))
                    index += 1

            else:
                if line:
                    result_codes_dict = map_text_with_multiple_seperators_to_dict(line)
                    dict_with_updated_result_codes, new_index = update_dict_result_codes(result_codes_dict,
                                                                                         lines[index:], columns[index:],
                                                                                         my_key)

                    result.update(dict_with_updated_result_codes)
                    index = index + new_index

    return result, index


def construct_base_dict(field_names, positions, data):
    result_dict = {}
    for i in range(len(field_names)):
        # Determine the start and end positions for slicing
        start = positions[i]
        end = positions[i + 1] if i + 1 < len(positions) else None
        # Extract and clean the corresponding value
        value = data[start:end].strip()
        # Assign the value to the corresponding key in the dictionary
        result_dict[field_names[i]] = value
    return result_dict


def update_dict_again(lines, columns, my_index, key1, key2):
    full_dict = {}
    res_group_found = False
    res_group_keys = []
    index = 0

    for my_line, my_column in zip(lines, columns):
        if ':' in my_line:
            break

        if key1 in my_line:
            # If 'my_key' is found, set res_group_found to True and store keys
            res_group_found = True
            res_group_keys = my_column
            the_indices = find_indices(my_line, res_group_keys)

        elif res_group_found:
            # If 'my_key' was found previously
            if key2 and key2 in my_line:

                # Nested logic when key2 is found in the line
                nested_values = [my_column]  # Ensure this is a list for iteration
                nested_lines = [my_line]  # Ensure this is a list for iteration
                for value, line in zip(nested_values, nested_lines):
                    val_indices = find_indices(line, value)
                    nested_dict = map_values_to_columns(res_group_keys, value, the_indices, val_indices, 0)
                    nested_dict = {key: value for key, value in nested_dict.items() if key != 'NAME'}
                    index += 1
                    full_dict[index] = nested_dict

                # Append nested_dict_list to dict_list

            else:
                # Handle the case when key2 is not found
                my_values = [my_column]
                my_lines = [my_line]

                for value, line in zip(my_values, my_lines):
                    val_indices = find_indices(line, value)
                    the_dict = map_values_to_columns(res_group_keys, value, the_indices, val_indices, 0)
                    the_dict = {key: value for key, value in the_dict.items() if key != 'NAME'}
                    index += 1
                    full_dict[index] = the_dict

    return filter_dict(full_dict), index + my_index
