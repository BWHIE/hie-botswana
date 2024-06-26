# IPMS Dictionaries 

## Introduction 
The present work consists of parsing text data into CSV or JSON formats. 
The IPMS dictionaries consist of IPMS locations/facilities and Lab tests.

## Schema
### Locations/Facilities :
Locations and Facilities were parsed into straightforward tabular form in CSV format.
Each column corresponds to a feature that a given facility possesses. 

### Lab tests: 
Due to their complex structure, a different approach was adopted for the Lab tests. A Key-Value paradigm was adopted. 
Each test is a dictionary that has a key and an associated value with most of the values being nested dictionaries themselves. 
This approach was convened with the design of ensuring better interpretability and readability of the Lab tests. 
Tabular forms would have made it nearly impossible to gather insights from the data.

For each test type, a schema was adopted in order to assure some regularity 
to the Data and avoid data discrepancies.

## Installation 
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