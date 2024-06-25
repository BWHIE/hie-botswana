import logging
import time
from threading import Thread
from hl7apy.core import Message
from helper import create_ack_response, send_message_to_client, generate_code
from datetime import datetime

def store_patient(patient, datastore):    
    existing_patient = datastore.get(patient['ssn_number_patient'])
    if existing_patient:
        logging.info(f"Found existing Patient for '{patient['ssn_number_patient']}'")
        return existing_patient
    else:
        # generate IPMS IDs
        patient["identifiers"] = {}
        patient["identifiers"]["mr"] = generate_code() # Default format (GG000XXXXX)
        patient["identifiers"]["pi"] = generate_code(zeros=0) # No zeros (GGXXXXX)
        patient["identifiers"]["hub"] = generate_code(zeros=1, letters=4, digits=6) # One zero (GG0XXXXX)
        patient["patient_account_number"] = generate_code(zeros=5, letters=2, digits=5) # 5 zeros (ZG00000XXXXX)

        formatted_components = []
        for id_value, id_type, assigning_authority in [
            (patient["identifiers"]["mr"], "MR", "GGC"),
            (patient['ssn_number_patient'], "SS", "GGC"),
            (patient["identifiers"]["pi"], "PI", "GGC"),
            (patient["identifiers"]["hub"], "HUB", "GGC")
        ]:
            # Format each identifier component
            formatted_component = f"{id_value}^^^^{id_type}^{assigning_authority}"
            formatted_components.append(formatted_component)
        
        patient_identifier_list = "~".join(formatted_components)
        patient['patient_identifier_list'] = patient_identifier_list # Stored as a string representation

        datastore.set(patient['ssn_number_patient'], patient)

        logging.info(f"Storing new Patient for '{patient['ssn_number_patient']}'")

    return patient
    

def handle_adt_a04(incoming_message, datastore):
    # find (or store) patient in datastore if already processed
    patient = store_patient(incoming_message["pid"], datastore)

    # update patient with IPMS stored details
    incoming_message['pid'] = patient

    logging.debug("Received ADT^A04, scheduling updated ADT^A04 response in 10 seconds")
    Thread(target=schedule_adt_a04_response(incoming_message)).start()
    response = create_ack_response(incoming_message)
    return response.to_mllp()

def schedule_adt_a04_response(data):
    time.sleep(10)
    adt_a04_response_message = create_adt_a04_response_message(data)
    send_message_to_client(adt_a04_response_message)

def create_adt_a04_response_message(data):
    adt_a04 = Message()
    datetime_now = datetime.now().strftime("%Y%m%d%H%M")

    # MSH Segment (Updated)
    adt_a04.msh.MSH_3.value = "ADM"      # Sending Application (Added)
    adt_a04.msh.MSH_5.value = ""         # Receiving Application 
    # adt_a04.msh.MSH_7.value = "202209220713"  # Date/Time of Message
    adt_a04.msh.MSH_7.value = datetime_now  # Date/Time of Message
    adt_a04.msh.MSH_9.MSH_9_1.value = "ADT"   # Message Type
    adt_a04.msh.MSH_9.MSH_9_2.value = "A04"   # Trigger Event
    adt_a04.msh.MSH_10.value = "279085"       # Message Control ID (Specific value)
    adt_a04.msh.MSH_11.value = "D"        # Processing ID (Added)
    adt_a04.msh.MSH_12.value = "2.4"       # Version ID (Updated)
    adt_a04.msh.MSH_15.value = "AL"       # Accept Acknowledgment Type (Added)
    adt_a04.msh.MSH_16.value = "NE"       # Application Acknowledgment Type (Added)

    # EVN Segment (Updated)
    evn = adt_a04.add_segment("EVN")
    evn.EVN_1.value = ""
    evn.EVN_2.value = datetime_now
    evn.EVN_3.value = ""
    evn.EVN_4.value = ""
    evn.EVN_5.value = "INFCE^INTERFACE"
    evn.EVN_6.value = datetime_now
    evn.EVN_7.value = ""

    # PID Segment (Updated)
    pid = adt_a04.add_segment("PID")
    pid.PID_1.value = "1" #Set ID

    for identifier in [
        (data['pid'].get('identifiers', {}).get("mr", ""), "MR", "GGC"),
        (data['pid'].get('ssn_number_patient', ""), "SS", "GGC"),
        (data['pid'].get('identifiers', {}).get("pi", ""), "PI", "GGC"),
        (data['pid'].get('identifiers', {}).get("hub", ""), "HUB", "GGC")
    ]:
        cx = pid.add_field('PID_3')
        cx.CX_1.value = identifier[0]
        cx.CX_5.value = identifier[1]
        cx.CX_6.value = identifier[2]

    # Convert to ER7 and manually add MLLP characters
    er7_message = adt_a04.to_er7()
    # # Manual MLLP encoding
    mllp_message = f"{chr(11)}{er7_message}{chr(28)}{chr(13)}" 

    return mllp_message
