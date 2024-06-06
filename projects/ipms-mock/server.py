import os
import uuid
import datetime
import logging
import time
import socket
from threading import Thread
from hl7apy import load_message_profile
from hl7apy.core import Message
from hl7apy.parser import parse_message
from hl7apy.v2_5 import DTM
from hl7apy.mllp import MLLPServer, AbstractHandler, UnsupportedMessageType, InvalidHL7Message
from hl7apy.parser import parse_message
import pprint

# Set up basic configuration for logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Environment variables for server configuration
SERVER_DOMAIN = os.getenv('SERVER_DOMAIN', 'localhost')
SERVER_PORT = int(os.getenv('SERVER_PORT', '2575'))
CLIENT_PORT = int(os.getenv('CLIENT_PORT', '2576'))  # Default client port to send ADT A01 message

_ROOT_PATH = os.path.dirname(os.path.abspath(__file__))

in_memory_db = {}


def parse_adt_a04_message(message):
    """
    Parses an ADT A04 HL7 message using hl7apy.

    Args:
    hl7_message (str): The HL7 message to parse.

    Returns:
    dict: Parsed data from the HL7 message.
    """
    parsed_data = {}
    
    # Prints the nicely formatted dictionary
    pprint.pprint(message)
    try:
        # Extract MSH segment
        msh = message.MSH
        parsed_data['MSH'] = {
            'field_separator': msh.field_separator.value,
            'encoding_characters': msh.encoding_characters.value,
            'sending_application': msh.sending_application.value,
            'sending_facility': msh.sending_facility.value,
            'message_datetime': msh.date_time_of_message.value,
            'message_type': msh.message_type.value,
            'message_control_id': msh.message_control_id.value,
            'processing_id': msh.processing_id.value,
            'version_id': msh.version_id.value,
            'accept_ack_type': msh.accept_acknowledgment_type.value,
            'application_ack_type': msh.application_acknowledgment_type.value
        }

        # Extract EVN segment
        evn = message.EVN
        parsed_data['EVN'] = {
            'event_type_code': evn.event_type_code.value,
            'recorded_datetime': evn.recorded_date_time.value,
            'event_facility': evn.event_facility.value
        }

        # Extract PID segment
        pid = message.PID
        parsed_data['PID'] = {
            'set_id': pid.set_id.value,
            'patient_id': pid.patient_id.value,
            'patient_identifier_list': pid.patient_identifier_list.value,
            'patient_name': pid.patient_name.value,
            'date_of_birth': pid.date_time_of_birth.value,
            'administrative_sex': pid.administrative_sex.value,
            'patient_address': pid.patient_address.value,
            'phone_number_home': pid.phone_number_home.value,
            'phone_number_business': pid.phone_number_business.value,
            'primary_language': pid.primary_language.value,
            'marital_status': pid.marital_status.value,
            'patient_account_number': pid.patient_account_number.value,
            'ssn_number_patient': pid.ssn_number_patient.value
        }

        # Extract PV1 segment
        pv1 = message.PV1
        parsed_data['PV1'] = {
            'set_id': pv1.set_id.value,
            'patient_class': pv1.patient_class.value,
            'assigned_patient_location': pv1.assigned_patient_location.value,
            'admission_type': pv1.admission_type.value,
            'attending_doctor': pv1.attending_doctor.value,
            'visit_number': pv1.visit_number.value,
            'admit_datetime': pv1.admit_date_time.value
        }

        # Extract ROL segment
        rol = message.ROL
        parsed_data['ROL'] = {
            'role_instance_id': rol.role_instance_id.value,
            'role_action_reason': rol.role_action_reason.value,
            'role': rol.role.value,
            'provider_type': rol.provider_type.value,
            'provider_id_number': rol.provider_id_number.value
        }

    except Exception as e:
        print(f"Error parsing HL7 message: {e}")
    
    return parsed_data


class MLLPClient:
    def __init__(self, host, port):
        self.host = host
        self.port = port

    def send_message(self, message):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.connect((self.host, self.port))
            sock.sendall(message.encode('UTF-8'))
            received = sock.recv(1024 * 1024)
            logging.info("Received response: %s", received.decode('UTF-8'))
        finally:
            sock.close()

class HL7Handler(AbstractHandler):
    def __init__(self, message):
        # Parse incoming message based on the message profile
        msg = parse_message(message)
        super(HL7Handler, self).__init__(msg)
        # self.client_address = client_address
        # self.server = server
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
            elif message_type == 'ADT' and (trigger_event in ['A01', 'A02', 'A03', 'A04']):
                response = self.handle_adt(full_message_type)
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
    
    def handle_adt(self, full_message_type):
        # Process ADT message and prepare response
        logging.debug("Handling ADT message")
        if full_message_type == 'ADT^A04':
            data = parse_adt_a04_message(self.incoming_message)

            logging.debug(data)
            logging.debug("Received ADT^A04, scheduling ADT^A01 response in 10 seconds")
            Thread(target=self.schedule_adt_a01_response).start()
        response = self.create_ack_response()
        return response.to_mllp()

    def schedule_adt_a01_response(self):
        time.sleep(10)
        adt_a01_message = self.create_adt_a01_message()
        self.send_message_to_client(adt_a01_message)

    def create_adt_a01_message(self):
        # Create an ADT A01 message based on the ADT A04 message received
        adt_a01 = Message("ADT_A01")
        adt_a01.msh.msh_9 = 'ADT^A01'
        adt_a01.msh.msh_10 = uuid.uuid4().hex
        adt_a01.msh.msh_7 = '20080115153000' #DTM(datetime.datetime.now().strftime('%Y%m%d%H%M%S'))

        # Copy relevant segments from the ADT A04 message
        adt_a01.pid = self.incoming_message.pid
        adt_a01.pv1 = self.incoming_message.pv1

        return adt_a01.to_mllp()

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
    

    def send_message_to_client(self, message):
        client = MLLPClient('host.docker.internal', CLIENT_PORT)
        client.send_message(message)

if __name__ == '__main__':

    # class CustomMLLPServer(MLLPServer):
    #     def send_message(self, client_address, message):
    #         self._send_data(client_address, message)

    # Define handlers for each message type expected
    handlers = {
        'ORM^O01': (HL7Handler,),
        'ORU^R01': (HL7Handler,),
        'ADT^A01': (HL7Handler,),  # Admit a patient
        'ADT^A02': (HL7Handler,),  # Transfer a patient
        'ADT^A03': (HL7Handler,),   # Discharge a patient
        'ADT^A04': (HL7Handler,)   # Register a patient
    }

    # Set up and start the MLLP server
    logging.info("Starting MLLP server on %s:%s", SERVER_DOMAIN, SERVER_PORT)
    server = MLLPServer(SERVER_DOMAIN, SERVER_PORT, handlers)
    server.serve_forever()
    
