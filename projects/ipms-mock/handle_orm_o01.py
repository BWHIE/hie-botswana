import logging
import time
import uuid
from threading import Thread
from hl7apy import load_message_profile
from hl7apy.core import Message
from hl7apy.parser import parse_message
from hl7apy.v2_5 import DTM
from hl7apy.mllp import MLLPServer, AbstractHandler, UnsupportedMessageType, InvalidHL7Message
from hl7apy.parser import parse_message
import pprint

from helper import create_ack_response, send_message_to_client

def parse_orm_o01_message(message):
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

def handle_orm_o01(message):
    # Process ORM message and prepare response
    logging.debug("Handling ORM message")
    # data = parse_adt_a04_message(self.incoming_message)

    # logging.debug(data)
    logging.debug("Received ORM^O01, scheduling ORU^O01 response in 10 seconds")
    Thread(target=schedule_oru_o01_response).start()
    response = create_ack_response(message)
    return response.to_mllp()

def schedule_oru_o01_response():
    time.sleep(10)
    orm_a01_response_message = create_oru_r01_response_message()
    send_message_to_client(orm_a01_response_message)

def create_oru_r01_response_message():
    # def create_oru_r01_response_message(self):
    oru_r01 = Message()

    # MSH Segment
    oru_r01.msh.MSH_3.value = "ADM"  # Replace with your system's sending application
    oru_r01.msh.MSH_4.value = "LAB"  # Extract from the incoming ORM^O01 message
    oru_r01.msh.MSH_5.value = ""  # Receiving Application (Optional)
    oru_r01.msh.MSH_7.value = "202406120944"  # Current date/time (YYYYMMDDHHMM)
    oru_r01.msh.MSH_9.MSH_9_1.value = "ORU"
    oru_r01.msh.MSH_9.MSH_9_2.value = "R01"
    oru_r01.msh.MSH_10.value = uuid.uuid4().hex  # Generate a unique message control ID
    oru_r01.msh.MSH_11.value = "P"
    oru_r01.msh.MSH_12.value = "2.4"  # Adjust if you're using a different version

    # PID Segment (Copy from ORM^O01)
    oru_r01.pid = oru_r01.add_segment("PID")
    # oru_r01.pid.PID_1.value = parsed_msg.PID.PID_1.value  # Copy from ORM^O01



    # logging.info("Incoming Message...: %s", self.parsed_msg.PID[:50])
    # for field in self.parsed_msg.PID.children:
    #     oru_r01.pid.add_field(field.name, field.to_er7())

    # # OBR Segment (Copy from ORM^O01 with modifications)
    # obr = oru_r01.add_segment("OBR")
    # for field in orm_o01_message.OBR.children:
    #     obr.add_field(field.name, field.to_er7())

    # # Update OBR-25 with the new value
    # obr.OBR_25.value = "F"
    
    # # OBX Segments
    # for obx_segment in orm_o01_message.OBX.children:
    #     obx = oru_r01.add_segment("OBX")
    #     for field in obx_segment.children:
    #         obx.add_field(field.name, field.to_er7())
    
    # # NTE Segments
    # for nte_segment in orm_o01_message.NTE.children:
    #     nte = oru_r01.add_segment("NTE")
    #     for field in nte_segment.children:
    #         nte.add_field(field.name, field.to_er7())
    
    # Manual MLLP encoding
    er7_message = oru_r01.to_er7()
    mllp_message = f"{chr(11)}{er7_message}{chr(28)}{chr(13)}"

    return mllp_message
