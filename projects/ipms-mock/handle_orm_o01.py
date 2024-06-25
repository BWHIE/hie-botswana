import logging
import time
import uuid
from threading import Thread
from hl7apy.core import Message
from datetime import datetime, timedelta

from helper import create_ack_response, send_message_to_client

def extract_omang(identifiers_list):
    for identifier in identifiers_list.split("~"):
        if identifier.endswith("^^^^SS^GGC"): # Omang Identifier codes
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

    # update patient with IPMS stored details
    incoming_message['pid'] = patient

    logging.debug("Received ORM^O01, scheduling ORU^O01 response in 10 seconds")
    Thread(target=schedule_oru_o01_response, args=(incoming_message,)).start()
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
    add_msh_segment(oru_r01)
    add_pid_segment(oru_r01, data)
    add_obr_segment(oru_r01)
    add_obx_segments(oru_r01)
    add_nte_segments(oru_r01)

    # Manual MLLP encoding
    er7_message = oru_r01.to_er7()
    mllp_message = f"{chr(11)}{er7_message}{chr(28)}{chr(13)}"

    return mllp_message

def add_msh_segment(oru_r01):
    # MSH Segment
    oru_r01.msh.MSH_3.value = "ADM"  # Replace with your system's sending application
    oru_r01.msh.MSH_4.value = "LAB"  # Extract from the incoming ORM^O01 message
    oru_r01.msh.MSH_5.value = ""  # Receiving Application (Optional)
    oru_r01.msh.MSH_7.value = "202406120944"  # Current date/time (YYYYMMDDHHMM)
    oru_r01.msh.MSH_9.MSH_9_1.value = "ORU"
    oru_r01.msh.MSH_9.MSH_9_2.value = "R01"
    oru_r01.msh.MSH_10.value = uuid.uuid4().hex  # Generate a unique message control ID
    oru_r01.msh.MSH_11.value = "D"

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
    pid.PID_5.value = data["pid"].get("patient_name", "")

    # PID-6: Mother's Maiden Name (XPN)
    pid.PID_6.PID_6_1.value = ""  # Mother's maiden name (family name)

    # PID-7: Date/Time of Birth (DTM)
    pid.PID_7.value = data["pid"].get("date_time_of_birth", "")  # Patient's birth date (YYYYMMDD)

    # PID-8: Administrative Sex (IS)
    pid.PID_8.value = data["pid"].get("administrative_sex", "")  # M = Male, F = Female, O = Other, U = Unknown

    # PID-10: Race (CE)
    pid.PID_10.value = data["pid"].get("race", "")  # Race code (check HL7 tables)

    # PID-11: Patient Address (XAD)
    pid.PID_11.value = data["pid"].get("patient_address", "")

    # PID-13: Phone Number - Home (XTN)
    pid.PID_13.value = data["pid"].get("phone_number_home", "")  # Patient's home phone number

    # PID-14: Phone Number - Business (XTN)
    pid.PID_14.value = data["pid"].get("phone_number_business", "")  # Patient's business phone number

    # PID-16: Marital Status (CE)
    pid.PID_16.value = data["pid"].get("marital_status", "")  # Marital status code (check HL7 tables)

    # PID-17: Religion (CE)
    pid.PID_17.value = data["pid"].get("religion", "")  # Religion code (check HL7 tables)

    # PID-18: Patient Account Number (CX)
    pid.PID_18.value = data["pid"].get("patient_account_number", "")

    # PID-19: SSN Number - Patient (ST)
    pid.PID_19.value = data["pid"].get("ssn_number_patient", "")  # Social Security Number

    return pid

def add_obr_segment(oru_r01):
    # Create an OBR segment
    obr = oru_r01.add_segment("OBR")

    # OBR-1: Set ID - OBR
    obr.OBR_1.value = "1"

    # OBR-2: Placer Order Number (EI)
    obr.OBR_2.value = "MOH001^LAB"

    # OBR-3: Filler Order Number (EI)
    obr.OBR_3.value = "68222^LAB"

    # OBR-4: Universal Service Identifier (CE)
    obr.OBR_4.value = "COVID^SARS-CoV-2 PCR^L"

    # OBR-7: Observation Date/Time (TS)
    # obr.OBR_7.value = "202106031400"
    obr.OBR_7.value = (datetime.now()-timedelta(weeks=2)).strftime("%Y%m%d%H%M")

    # OBR-8: Observation End Date/Time (TS)
    obr.OBR_8.value = ""  # Not provided in the example

    # OBR-11: Specimen Action Code (ID)
    obr.OBR_11.value = ""  # Not provided in the example

    # OBR-16: Ordering Provider (XCN)
    obr.OBR_16.value = ""  # Not provided in the example

    # OBR-22: Results Rpt/Status Chng - Date/Time (TS)
    obr.OBR_22.value = (datetime.now()-timedelta(weeks=1)).strftime("%Y%m%d%H%M")

    # OBR-24: Diagnostic Serv Sect ID (ID)
    obr.OBR_24.value = "LAB"

    # OBR-25: Results Status (ID)
    obr.OBR_25.value = "F"

    # OBR-32: Principal Result Interpreter (NDL)
    obr.OBR_32.value = "ZZHGGMMO^Healthpost^Mmopane"

    # OBR-47: Filler Field 1 (varies)
    obr.OBR_47.value = "00049731"

    return obr

def add_obx_segments(oru_r01):
    # OBX-1
    obx1 = oru_r01.add_segment("OBX")
    obx1.OBX_1.value = "1"
    obx1.OBX_2.value = "ST"
    obx1.OBX_3.value = "SARS-CoV-2 PCR^SARS-CoV-2 PCR^L"
    obx1.OBX_5.value = "INCONCLUSIVE"
    obx1.OBX_8.value = "N"
    obx1.OBX_10.value = "A^S"
    obx1.OBX_11.value = "F"
    obx1.OBX_14.value = (datetime.now()-timedelta(weeks=1)).strftime("%Y%m%d%H%M")
    obx1.OBX_15.value = "GNHL^National Health Laboratory^L"

    # OBX-2
    obx2 = oru_r01.add_segment("OBX")
    obx2.OBX_1.value = "2"
    obx2.OBX_2.value = "ST"
    obx2.OBX_3.value = "S-Cov-2 RVW^SARS-CoV-2 PCR REVIEW^L"
    obx2.OBX_5.value = "."
    obx2.OBX_8.value = "N"
    obx2.OBX_10.value = "A^S"
    obx2.OBX_11.value = "F"
    obx2.OBX_14.value = (datetime.now()-timedelta(weeks=1)).strftime("%Y%m%d%H%M")
    obx2.OBX_15.value = "GNHL^National Health Laboratory^L"

    return oru_r01  # Return the updated message object

def add_nte_segments(oru_r01):
    # NTE-1
    nte1 = oru_r01.add_segment("NTE")
    nte1.NTE_1.value = "1"
    nte1.NTE_3.value = ""  # Empty in your example

    # NTE-2
    nte2 = oru_r01.add_segment("NTE")
    nte2.NTE_1.value = "2"
    nte2.NTE_3.value = ""  # Empty in your example

    # NTE-3
    nte3 = oru_r01.add_segment("NTE")
    nte3.NTE_1.value = "3"
    nte3.NTE_3.value = "SARS-CoV-2 PCR Tests Authorised by: MEDITECH"

    # NTE-4
    nte4 = oru_r01.add_segment("NTE")
    nte4.NTE_1.value = "4"
    nte4.NTE_4.value = f"Authorised Date: {(datetime.now()-timedelta(days=2)).strftime('%d/%m/%y %H%M')}"  # Using NTE_4 for comment as in your example

    return oru_r01
