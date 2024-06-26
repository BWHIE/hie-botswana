# IPMS Dictionaries 

## Introduction 
The present work consists of several utility scripts for gathering/processing medical data.
It comprises scripts for parsing text data into CSV or JSON formats. 
The IPMS dictionaries consist of IPMS locations/facilities and Lab tests. 
Additionally, IPMS facilities/locations were mapped into FHIR resources in order to seed them into Hapi Fhir. 

## Schema
### Locations/Facilities :
Locations and Facilities were parsed into straightforward tabular form in CSV format.
Each column corresponds to a feature that a given facility possesses. 
Moreover we generated another CSV file for the obtained output in order to generate mock MFL codes.
 The scripts can be found in the subfolder `ipms-facilities-locations`.

### Lab tests : 
Due to their complex structure, a different approach was adopted for the Lab tests. A Key-Value paradigm was adopted. 
Each test is a dictionary that has a key and an associated value with most of the values being nested dictionaries themselves. 
This approach was convened with the design of ensuring better interpretability and readability of the Lab tests. 
Tabular forms would have made it nearly impossible to gather insights from the data. 

For each test type, a schema was adopted in order to assure some regularity 
to the Data and avoid data discrepancies.

The scripts can be found in the subfolder `ipms-mnemonics`

## FHIR Locations/Facilities : 
The obtained locations/facilities were mapped into FHIR resources. IPMS location was mapped into FHIR Location resource and IPMS facility was mapped into FHIR Organization resource. The purpose was to generate a `Transaction Bundle` of multiple FHIR resources to be seeded into a `Hapi Fhir Server`.#
### Fhir Bundles:
The initial Bundle was split into 3 bundles because the maximum size for a Docker config file is 1 MB and the initial Bundle's size exceeded that threshold. See `packages/fhir-datastore-hapi-fhir/importer/docker-compose.seeder.yml`. The scripts  for mapping FHIR resources can be found in the subfolder `fhir-ipms-facilities-locations`


## Installation 
### IPMS Lab Tests and Facilities 
Start a Python virtual environment:
```bash 
python3 -m venv venv 
```

```bash 
source venv/bin/activate
```

Install dependencies: 

```bash   
pip install -r requirements.txt 

```
Execute Scripts:
- Lab tests:

Go to the corresponding subfolder: 

```bash   
cd ipms-mnemonics

```
Process Data: 

```bash   
python3 file.py run

```
Note that we introduced a seperate script for each type of test due to data schema differences.

- Facilities:

Go to the corresponding subfolder: 

```bash   
cd ipms-facilities-locations

```
Extract Data: 

```bash   
python3 parser.py run

```
Generate mock MFL codes: 

```bash   
python3 mfl.py run

```
### FHIR IPMS Facilities/Locations

Go to the corresponding subfolder: 

```bash   
cd fhir-ipms-facilities-locations

```

Execute the Script: 

```bash   
yarn start 

```
