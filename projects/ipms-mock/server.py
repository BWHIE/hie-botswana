import os
import logging
from hl7apy.parser import parse_message
from hl7apy.v2_5 import DTM
from hl7apy.mllp import MLLPServer, AbstractHandler, UnsupportedMessageType
from hl7apy import parser

from handle_adt_a04 import handle_adt_a04
from handle_orm_o01 import handle_orm_o01
from helper import create_error_response

from datastore import DataStore
datastore = DataStore()

# Set up basic configuration for logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Environment variables for server configuration
SERVER_DOMAIN = os.getenv('SERVER_DOMAIN', 'localhost')
SERVER_PORT = int(os.getenv('SERVER_PORT', '2575'))

_ROOT_PATH = os.path.dirname(os.path.abspath(__file__))

def process_hl7_message(hl7_message_string):
    try:
        # 1. Sanitize the message
        hl7_message_string = hl7_message_string.strip()

        # 2. Check if message starts with MSH segment
        if not hl7_message_string.startswith('MSH'):
            logging.warning("Invalid HL7 message: Does not start with MSH segment.")
            return None

        # 3. Parse the HL7 message
        hl7_object = parser.parse_message(hl7_message_string, None, False)

        # 4. Extract segments with their key-value components using field names
        extracted_data = {}
        extracted_segment_string = """"""
        for segment in hl7_object.children:
            segment_data = {}
            extracted_segment_string += "\n" + segment.value
            for field in segment.children:
                field_key = field.name.lower()  # Get the property name (e.g., msh_1)
                field_value = field.value  # Get the field value
                if hasattr(field, 'long_name') and field.long_name is not None:
                    long_name = field.long_name.replace(" ", "_").replace("/", "").lower()  

                    # if key exists, value is part of an list - append
                    if long_name in segment_data:
                        segment_data[long_name] += f"~{field_value}" # concat the extra list item with tilde seperated
                    else:
                        segment_data[long_name] = field_value # Use the long name as the key
                else:
                    segment_data[field_key] = field_value # Use the property name as the key
            extracted_data[segment.name.lower()] = segment_data

        # (Optional) Log the extracted data as JSON
        logging.info(f"Incoming HL7 message: {extracted_segment_string}")

        return extracted_data
    
    except Exception as e:
        logging.error(f"Error parsing HL7 message: {e}")
        return None

class HL7Handler(AbstractHandler):
    def __init__(self, message):
        parsed_message = process_hl7_message(message)
        super(HL7Handler, self).__init__(parsed_message)

    def reply(self):
        logging.info(f"Parsed HL7 message: {self.incoming_message}")

        try:
            # Properly extract message_type
            full_message_type = self.incoming_message['msh']['message_type']

            logging.info('Handling message type: %s', full_message_type)

            if full_message_type == 'ORM^O01':
                response = handle_orm_o01(self.incoming_message, datastore)
            elif full_message_type == 'ADT^A04':
                response = handle_adt_a04(self.incoming_message, datastore)
            else:
                raise UnsupportedMessageType(
                    f"Unsupported message type: {full_message_type}")
        except Exception as e:
            logging.error("Error handling message: %s", str(e))
            response = create_error_response(str(e))
        return response

if __name__ == '__main__':
    # Define handlers for each message type expected
    handlers = {
        'ORM^O01': (HL7Handler,),
        'ADT^A04': (HL7Handler,)   # Register a patient
    }

    # Set up and start the MLLP server
    logging.info("Starting MLLP server on %s:%s", SERVER_DOMAIN, SERVER_PORT)
    server = MLLPServer(SERVER_DOMAIN, SERVER_PORT, handlers)
    server.serve_forever()
    
