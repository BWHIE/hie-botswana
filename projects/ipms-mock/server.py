import os
import uuid
import datetime
import logging
from hl7apy import load_message_profile
from hl7apy.core import Message
from hl7apy.parser import parse_message
from hl7apy.v2_5 import DTM
from hl7apy.mllp import MLLPServer, AbstractHandler, UnsupportedMessageType, InvalidHL7Message

# Set up basic configuration for logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Environment variables for server configuration
SERVER_DOMAIN = os.getenv('SERVER_DOMAIN', 'localhost')
SERVER_PORT = int(os.getenv('SERVER_PORT', '2575'))

_ROOT_PATH = os.path.dirname(os.path.abspath(__file__))


class HL7Handler(AbstractHandler):
    def __init__(self, message):
        # Parse incoming message based on the message profile
        msg = parse_message(message)
        super(HL7Handler, self).__init__(msg)
        logging.info("Handler initialized for message: %s", message[:50])

    def reply(self):
        logging.info('Received message: %s', self.incoming_message.to_er7())
        try:
            # Properly extract message_code and trigger_event
            message_type = self.incoming_message.msh.msh_9.msg_1.value
            trigger_event = self.incoming_message.msh.msh_9.msg_2.value
            full_message_type = f'{message_type}^{trigger_event}'

            logging.info('Handling message type: %s', full_message_type)

            if message_type == 'ORM' and trigger_event == 'O01':
                response = self.handle_orm()
            elif message_type == 'ORU' and trigger_event == 'R01':
                response = self.handle_oru()
            elif message_type == 'ADT' and (trigger_event in ['A01', 'A02', 'A03']):
                response = self.handle_adt()
            else:
                raise UnsupportedMessageType(
                    f"Unsupported message type: {full_message_type}")
        except Exception as e:
            logging.error("Error handling message: %s", str(e))
            response = self.create_error_response(str(e))
        return response

    def handle_orm(self):
        # Process ORM message and prepare response
        logging.debug("Handling ORM message")
        response = self.create_ack_response()
        return response.to_mllp()

    def handle_oru(self):
        # Process ORU message and prepare response
        logging.debug("Handling ORU message")
        response = self.create_ack_response()
        return response.to_mllp()

    def handle_adt(self):
        # Process ADT message and prepare response
        logging.debug("Handling ADT message")
        response = self.create_ack_response()
        return response.to_mllp()

    def create_ack_response(self):
        # Common method to create an ACK response for any message type
        response = Message("ACK")
        response.msh.msh_9 = 'ACK'
        response.msh.msh_10 = uuid.uuid4().hex
        response.msa.msa_1 = 'AA'  # Acknowledgment code
        response.msa.msa_2 = self.incoming_message.msh.msh_10
        return response

    def create_error_response(self, error_msg):
        logging.warning("Creating error response: %s", error_msg)
        response = self.create_ack_response()
        response.msa.msa_1 = 'AE'  # Error acknowledgment code
        response.err.err_1 = error_msg
        return response.to_mllp()

if __name__ == '__main__':
    # Define handlers for each message type expected
    handlers = {
        'ORM^O01': (HL7Handler,),
        'ORU^R01': (HL7Handler,),
        'ADT^A01': (HL7Handler,),  # Admit a patient
        'ADT^A02': (HL7Handler,),  # Transfer a patient
        'ADT^A03': (HL7Handler,)   # Discharge a patient
    }

    # Set up and start the MLLP server
    logging.info("Starting MLLP server on %s:%s", SERVER_DOMAIN, SERVER_PORT)
    server = MLLPServer(SERVER_DOMAIN, SERVER_PORT, handlers)
    server.serve_forever()
