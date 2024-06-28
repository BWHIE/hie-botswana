# Shared Health Record Mediator

The project contains 3 main modules : 
- Common : Generic SHR features that can be used across country implementations
- Botswana : Botswana specific module that includes essentially the Lab Workflow handling (Lab Exam Request and Result)
- OpenHIM : OpenHIM mediator module so that the SHR can be accessed through OpenHIM. 

## Definitions

- *MLLP (Minimum Lower Layer Protocol)* is a protocol that is used for sharing HL7 messages and using Transfer Control Protocol (TCP) and Internet Protocol (IP). It transfers information in a stream of bytes and requires a wrapping protocol for communications code.
- *HL7 ADT (Admit, Discharge, and Transfer)* messages are used to communicate patient demographics, visit information, and patient state at a healthcare facility. ADT messages are one of the most widely used and high-volume HL7 message types, as it provides information for many trigger events including patient admissions, registrations, cancellations, updates, discharges, patient data merges, etc.  In a healthcare setting, all patient information is entered into a Hospital Information System (HIS) or Electronic Medical Record (EMR). New patients or updates in these systems are distributed to ancillary systems through ADT messages to maintain synchronization of current patient data.
- *HL7 ORM (Order Entry)* messages are used in healthcare systems to transmit information about orders. This can include orders for tests, procedures, pharmaceuticals, and other services. An ORM message communicates details such as order status, order details, patient information, and scheduling information, allowing different systems within a healthcare facility to coordinate and execute various tasks related to patient care and management. This standard is part of the HL7 (Health Level Seven) suite of protocols, which facilitate the exchange of electronic health information.
- *HL7 Observation Result (ORU)* is an HL7 message used for sharing observational results- including clinical, lab, or other test results- to different systems. An HL7 ORU message contains information about a patient's medical observation. This message is a response generated for the order received from a clinical system.

## Key components
Key Components :
- OpenHIM - Transaction Management, Authorization & Authentication, auditing and logging, mediator support
- Kafka - Asynchronous lab workflow synchronization
- Shared Health Record Mediator - Centralized persistence of lab data and facilitation/synchronization of lab workflows
- HAPI FHIR Store - Storage of FHIR-based data
- MLLP Client - Communication with IPMS through HL7 V2
- Kafka-based Task Runner - Execution of various BW-specific lab workflow tasks such as concept translation, location mapping, etc.
- Client Registry
- FHIR-HL7 V2 Translator API
- OCL (OpenConceptLab) - Used for terminology mappings

## Dependencies
HL7 MLLP Server for the communication with IPMS https://github.com/I-TECH-UW/mllp-server

## API 
The mediator is developed in Node.js / Typescript and starts up 2 services on different ports : 
- *SHR Mediator (PORT = 3000):* The SHR Mediator is the core component responsible for managing shared health records within the OpenHIM framework. It starts up and listens on its configured port (3000 by default) to handle incoming HTTP requests related to health records. The successful startup of the SHR Mediator is logged, signifying its readiness to process and mediate requests, thereby facilitating the efficient exchange and management of health records in a centralized manner.
- *MLLP Interceptor (PORT = 3001):* The MLLP Adapter serves as a crucial component for handling MLLP (Minimum Lower Layer Protocol) messages, commonly used in healthcare information systems for the transmission of HL7 messages. It listens on a dedicated port (3001 by default) for incoming MLLP messages. Upon successful initialization, it logs a message indicating its operational status and readiness to handle MLLP messages, enhancing the interoperability of the SHR system with other healthcare information systems that utilize the MLLP protocol.

## Microservices using Kafka
Kafka Workers 
Initializes a Kafka consumer within the Shared Health Record (SHR) system to process messages from specific Kafka topics: 
- send-adt-to-ipms
- send-orm-to-ipms
- save-pims-patient
- save-ipms-patient
- handle-oru-from-ipms
- handle-adt-from-ipms
- dmq (Dead message queue)

Configures the consumer with details like client ID, broker addresses, and log levels, and assigns it to a 'shr-consumer-group'.

Processes incoming Kafka messages by invoking a workflow specific to each topic, which may include tasks such as data validation, mapping, and sending HL7 messages to other systems.

## HL7 IPMS Interactions

SHR (M) --------ADT^A04-------> IPMS System
SHR (M) <-------ACK------------ IPMS System        
SHR (M) <-------ADT^A04 + MRN-- IPMS System        
SHR (M) --------ORM^O01-------> IPMS System        
SHR (M) <-------ACK------------ IPMS System        
SHR (M) <-------ORU^R01-------- IPMS System        

- SHR sends an ADT^04 message to the IPMS MLLP Server and gets back an ADT message. At a later point IPMS respond with an ADT^04 message with the updated PID identifiers (generated identifiers - MR/PI/HUB - SS is extracted from the incoming patient_ssn_number field)
- SHR can then send an ORM^O01 messageand gets back an ACK message. At a later stage once the lab results are ready, IPMS sends an ORU message (ORU^R01).


## Lab Workflow Use Case

To handle a lab order from the PIMS system :
1. POST {{openhim-http}}/SHR/lab: PIMS sends the Lab bundle to SHR through OpenHIM
2. SHR saves bundle into HAPI FHIR
3. Asynchronously produces the lab order message (bundle) to the “SEND_ADT_TO_IPMS” topic
4. Sends a response back to the client (PIMS or OpenMRS)
5. The SHR consumes the "SEND_ADT_TO_IPMS" Kafka topic message that contains the bundle :
    * Parses the original order bundle from the message value.
    * Enriches this bundle by mapping concepts and locations.
        * Maps concepts: ServiceRequest.code.coding by sending requests sent to OCL :
            * PIMS: Translate from PIMS to CIEL and IPMS
            * OpenMRS: Translate from CIEL to IPMS
        * Map facility IDs: using the ipms_facility_mappings.xlsx sheet
    * Produces a message to the “SAVE_PIMS_PATIENT” Kafka topic.
    * Tries to send an ADT message to IPMS with a retry mechanism for failures.
        * Check if task status = requested 
        * SHR sends HL7 Message to IPMS
        * IPMS sends back ACK (Acknowledgment)
        * Sets task status to accepted (if successful) 
    * Saves the enriched bundle in HAPI FIR only if the ADT message is successfully sent and processed.

The MLLP Interceptor would listen to any incoming HL7 message from IPMS using the MLLP Server : 
1. When it’s an ADT message type, it would produce a message to the “HANDLE_ADT_FROM_IPMS” Kafka topic.
2. When it’s an ORU message type, it translates the HL7 message to FHIR Bundle and it produces a message to the “HANDLE_ORU_FROM_IPMS” Kafka topic. 


The SHR consumes the "HANDLE_ADT_FROM_IPMS" Kafka topic message that contains the IPMS HL7 message :
1. Handles the message : 
    * Translate the HL7 message into a registration FHIR bundle using FHIR Converter through OpenHIM
    * Parse the patient resource to sort out the Omang ID
    * Performs a request to get the Task FHIR resource from HAPI FHIR
2. Produces the patient resource into the “SAVE_IPMS_PATIENT” Kafka topic.
3. Sends the bundle ORM to IPMS 
    * Fetches all service requests from HAPI FHIR for the patient
    * For each service request, it would send a ORM message to the IPMS: 
        * Translates the bundle into HL7 message using FHIR Converter through OpenHIM
        * SHR sends HL7 Message to IPMS
        * IPMS sends back ACK (Acknowledgment)
        * Sets task status to “in-progress” (if successful) 
4. Saves the enrich bundle to HAPI FHIR

The SHR consumes the "SAVE_IPMS_PATIENT" and “SAVE_PIMS_PATIENT” Kafka topics messages and sends a request to OpenCR in order to save the patient.

The SHR consumes the "HANDLE_ORU_FROM_IPMS" Kafka topic message that contains the FHIR Bundle (already translated into IPMS HL7 message) : 
1. Fetches the Patient resource from HAPI FHIR by using the Omang ID as well as all his service requests and tasks.
2. Attaches the service request reference to the diagnostic report and observation.
3. Updates the patient, diagnostic report and observation resources by sending a PUT bundle request to HAPI FHIR.
