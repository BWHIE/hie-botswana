import logging
import time
from threading import Thread
from hl7apy import load_message_profile
from hl7apy.core import Message
from hl7apy.parser import parse_message
from hl7apy.v2_5 import DTM
from hl7apy.mllp import MLLPServer, AbstractHandler, UnsupportedMessageType, InvalidHL7Message
from hl7apy.parser import parse_message
import pprint

from helper import create_ack_response, send_message_to_client

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

def handle_adt_a04(incoming_message):
    # Process ADT message and prepare response
    logging.debug("Handling ADT message")
    message = incoming_message
    data = parse_adt_a04_message(message)

    logging.debug(data)
    logging.debug("Received ADT^A04, scheduling updated ADT^A04 response in 10 seconds")
    Thread(target=schedule_adt_a04_response).start()
    response = create_ack_response(message)
    return response.to_mllp()
    # return

def schedule_adt_a04_response():
    time.sleep(10)
    adt_a04_response_message = create_adt_a04_response_message()
    send_message_to_client(adt_a04_response_message)

def create_adt_a04_response_message():
    adt_a04 = Message("ADT_A01")

    # MSH Segment (Updated)
    adt_a04.msh.MSH_3.value = "ADM"      # Sending Application (Added)
    adt_a04.msh.MSH_5.value = ""         # Receiving Application 
    adt_a04.msh.MSH_7.value = "202209220713"  # Date/Time of Message
    adt_a04.msh.MSH_9.MSH_9_1.value = "ADT"   # Message Type
    adt_a04.msh.MSH_9.MSH_9_2.value = "A04"   # Trigger Event
    adt_a04.msh.MSH_10.value = "279085"       # Message Control ID (Specific value)
    adt_a04.msh.MSH_11.value = "D"        # Processing ID (Added)
    adt_a04.msh.MSH_12.value = "2.4"       # Version ID (Updated)
    adt_a04.msh.MSH_15.value = "AL"       # Accept Acknowledgment Type (Added)
    adt_a04.msh.MSH_16.value = "NE"       # Application Acknowledgment Type (Added)

    # EVN Segment (Updated)
    evn = adt_a04.add_segment("EVN")
    evn.EVN_1.value = "A04"
    evn.EVN_2.value = "202209220713"
    # Removed EVN-3 because it is blank in the target
    evn.EVN_4.value = "INFCE^INTERFACE"
    evn.EVN_5.value = "202209220000"

    # PID Segment (Updated)
    pid = adt_a04.add_segment("PID")
    pid.PID_1.value = "1" #Set ID 

    for identifier in [
        ('GG00042567', "MR", "GGC"),
        ('OMANG3478593', "SS", "GGC"),
        ('GG42456', "PI", "GGC"),
        ('TEST0104070', "HUB", "GGC")
    ]:
        cx = pid.add_field('PID_3')
        cx.CX_1.value = identifier[0]
        cx.CX_5.value = identifier[1]
        cx.CX_4.value = identifier[2]

    # Convert to ER7 and manually add MLLP characters
    er7_message = adt_a04.to_er7()
    # # Manual MLLP encoding
    mllp_message = f"{chr(11)}{er7_message}{chr(28)}{chr(13)}" 

    return mllp_message
