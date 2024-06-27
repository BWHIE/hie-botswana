import os
import uuid
import logging
import random
import string
from mllp_client import MLLPClient
from hl7apy.core import Message

MLLP_CLIENT_HOST = str(os.getenv('MLLP_CLIENT_HOST', 'host.docker.internal'))  # Default client host to send ADT A04/ORU message
MLLP_CLIENT_PORT = int(os.getenv('MLLP_CLIENT_PORT', '2576'))  # Default client port to send ADT A04/ORU message

def create_error_response(self, error_msg):
    logging.warning("Creating error response: %s", error_msg)
    response = self.create_ack_response()
    response.msa.msa_1 = 'AE'  # Error acknowledgment code
    response.err.err_1 = error_msg
    return response.to_mllp()

def create_ack_response(incoming_message):
    # Common method to create an ACK response for any message type
    response = Message("ACK")
    response.msh.msh_9 = 'ACK'
    response.msh.msh_10 = uuid.uuid4().hex
    response.msa.msa_1 = 'AA'  # Acknowledgment code
    response.msa.msa_2 = incoming_message['msh']['message_control_id']
    return response

def send_message_to_client(message):
    # Ensure the hl7 message ends with a \r to indicate the end of the message content
    message += '\r'

    client = MLLPClient(MLLP_CLIENT_HOST, MLLP_CLIENT_PORT)
    client.send_message(message)
    return

def generate_code(letters=2, zeros=3, digits=5):
    letters_part = ''.join(random.choices(string.ascii_uppercase, k=letters))
    zeros_part = "0" * zeros  # Create a string of zeros
    digits_part = ''.join(random.choices(string.digits, k=digits))
    return f"{letters_part}{zeros_part}{digits_part}"
