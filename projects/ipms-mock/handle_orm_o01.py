import logging
import time
import uuid
from threading import Thread
from hl7apy.core import Message, Field
import pprint

from helper import create_ack_response, send_message_to_client

def extract_omang(identifiers_list):
    for identifier in identifiers_list.split("~"):
        logging.debug(identifier)
        # if identifier.startswith("OMANG"):
        if identifier.endswith("^^^^SS^GGC"): # Omang Identifier codes
            logging.debug("Is OMANG ID")
            return identifier.split("^^^^")[0]  # Extract value before component separator
    return None  # Return None if no OMANG identifier is found

def fetch_patient(patient_omang_id, datastore):    
    existing_patient = datastore.get(patient_omang_id)
    if existing_patient:
        logging.info(f"Found existing Patient for '{patient_omang_id}'")
        return existing_patient
    else:
        logging.error(f"Patient not found for '{patient_omang_id}'")
        raise Exception(f"Patient not found for '{patient_omang_id}'")

def handle_orm_o01(incoming_message, datastore):
    # extract omang ID from identifiers list
    omang_id = extract_omang(incoming_message["pid"]['patient_identifier_list'])
    # find (or store) patient in datastore if already processed
    patient = fetch_patient(omang_id, datastore)
    logging.debug(f"Found patient: {patient}")

    # update patient with IPMS stored details
    incoming_message['pid'] = patient

    logging.debug("Received ORM^O01, scheduling ORU^O01 response in 10 seconds")
    Thread(target=schedule_oru_o01_response(incoming_message)).start()
    response = create_ack_response(incoming_message)
    return response.to_mllp()

def schedule_oru_o01_response(data):
    time.sleep(10)
    orm_a01_response_message = create_oru_r01_response_message(data)
    send_message_to_client(orm_a01_response_message)

def create_oru_r01_response_message(data):
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
    oru_r01.msh.MSH_11.value = "D"
    # oru_r01.msh.MSH_12.value = "2.4"  # Adjust if you're using a different version

    # PID Segment (Copy from ORM^O01)
    # oru_r01.pid = oru_r01.add_segment("PID")
    oru_r01.pid = add_pid_segment(oru_r01, data)


    
    # Manual MLLP encoding
    er7_message = oru_r01.to_er7()
    mllp_message = f"{chr(11)}{er7_message}{chr(28)}{chr(13)}"

    return mllp_message

def add_pid_segment(oru_r01, data):
    # Create a PID segment
    pid = oru_r01.add_segment("PID")

    # PID-1: Set ID - PID (SI)
    pid.PID_1.value = "1"  # Sequence number of this PID segment (usually 1)
    
    logging.debug(data["pid"].get("identifiers", {}).get("mr", ""))
    # PID-2: Patient ID - PID (Internal) - MRN
    pid.PID_2.value = data["pid"].get("identifiers", {}).get("mr", "")

    # PID-3: Patient Identifier List (CX)
    # Create PID-3 field
    identifiers_list_string = data["pid"].get("patient_identifier_list", "")
    # Split the string into individual identifiers
    identifiers = identifiers_list_string.split("~")
    # Iterate over the identifiers and add them as repetitions to the PID-3 field
    for identifier in identifiers:
        cx = pid.add_field('PID_3')
        cx.value = identifier

    # PID-5: Patient Name (XPN)
    pid.PID_5.PID_5_1.value = "Murambi"   # Patient's Family Name
    pid.PID_5.PID_5_2.value = "Tawanda"   # Patient's Given Name

    # PID-6: Mother's Maiden Name (XPN)
    pid.PID_6.PID_6_1.value = ""  # Mother's maiden name (family name)

    # PID-7: Date/Time of Birth (DTM)
    pid.PID_7.value = "19880616"  # Patient's birth date (YYYYMMDD)

    # PID-8: Administrative Sex (IS)
    pid.PID_8.value = "M"  # M = Male, F = Female, O = Other, U = Unknown

    # PID-10: Race (CE)
    pid.PID_10.value = "CT"  # Race code (check HL7 tables)

    # PID-11: Patient Address (XAD)
    pid.PID_11.XAD_1.value = "Plot 1011"   # Street Address
    pid.PID_11.XAD_3.value = "Gaborone"     # City
    pid.PID_11.XAD_4.value = "Botswana"    # State/Province
    pid.PID_11.XAD_5.value = "00267"      # Zip or Postal Code

    # PID-13: Phone Number - Home (XTN)
    pid.PID_13.value = ""  # Patient's home phone number

    # PID-14: Phone Number - Business (XTN)
    pid.PID_14.value = ""  # Patient's business phone number

    # PID-16: Marital Status (CE)
    pid.PID_16.value = "M"  # Marital status code (check HL7 tables)

    # PID-17: Religion (CE)
    pid.PID_17.value = ""  # Religion code (check HL7 tables)

    # PID-18: Patient Account Number (CX)
    pid.PID_18.value = ""

    # PID-19: SSN Number - Patient (ST)
    pid.PID_19.value = "ZG0000044218"  # Social Security Number

    return pid
