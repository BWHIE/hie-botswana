import os
from mllp_client import MLLPClient
import uuid
from hl7apy.core import Message
import logging

CLIENT_PORT = int(os.getenv('CLIENT_PORT', '2576'))  # Default client port to send ADT A04/ORU message

# class Helper:
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
    response.msa.msa_2 = incoming_message.msh.msh_10
    return response

def send_message_to_client(message):
    client = MLLPClient('host.docker.internal', CLIENT_PORT)
    client.send_message(message)
    return