#! /bin/bash

# =========== Check prerequisites are installed ==============

# Check for Java 8
java_version=$(java -version 2>&1 | grep -oP '(?<=version ")[1.8]+')  
if [[ -n "$java_version" ]]; then
    echo "Java 8 is installed (version: $java_version)"
else
    echo "Java 8 is NOT installed. Please install it."
    exit 1
fi

# Check for Maven
mvn_version=$(mvn -v 2>&1 | grep -oP '(?<=Apache Maven )[^ ]+')
if [[ -n "$mvn_version" ]]; then
    echo "Maven is installed (version: $mvn_version)"
else
    echo "Maven is NOT installed. Please install it."
    exit 1
fi

# Check for OpenMRS SDK
openmrs_sdk_version=$(mvn openmrs-sdk:help 2>&1 | grep -oP '(?<=Version: )[^ ]+')
if [[ -n "$openmrs_sdk_version" ]]; then
    echo "OpenMRS SDK is installed (version: $openmrs_sdk_version)"
else
    echo "OpenMRS SDK is NOT installed. Please install it."
    exit 1
fi

# =========== Remove any existing commits for submodules - Ensure repo is latest ==============

(
    cd openmrs-module-botswanaemr-reports &> /dev/null && 
    git fetch --all &> /dev/null && git reset --hard origin/master &> /dev/null && 
    reports=$(mvn clean install 2>&1 | grep -oP '(?<=Reactor Summary for Botswanaemr Reports )\d+\.\d+\.\d+(-SNAPSHOT)?')
    echo "Updated module version 'openmrs-module-botswanaemr-reports': $reports"
)

(
    cd openmrs-module-botswanaemr.inventory &> /dev/null && 
    git fetch --all &> /dev/null && git reset --hard origin/main &> /dev/null && 
    inventory=$(mvn clean install 2>&1 | grep -oP '(?<=Reactor Summary for Botswana Inventory Module )\d+\.\d+\.\d+(-SNAPSHOT)?')
    echo "Updated module version 'openmrs-module-botswanaemr.inventory': $inventory"
)

(
    cd openmrs-module-labonfhir &> /dev/null && 
    git fetch --all &> /dev/null && git reset --hard origin/main &> /dev/null && 
    labonfhir=$(mvn clean install 2>&1 | grep -oP '(?<=Reactor Summary for Lab on FHIR )\d+\.\d+\.\d+(-SNAPSHOT)?')
    echo "Updated module version 'openmrs-module-labonfhir': $labonfhir"
)

(
    cd openmrs-module-locationbasedaccess &> /dev/null && 
    git fetch --all &> /dev/null && git reset --hard origin/master &> /dev/null && 
    locationbasedaccess=$(mvn clean install 2>&1 | grep -oP '(?<=Reactor Summary for Location Based Access Control )\d+\.\d+\.\d+(-SNAPSHOT)?')
    echo "Updated module version 'openmrs-module-locationbasedaccess': $locationbasedaccess"
)

(
    cd openmrs-module-patientqueueing &> /dev/null && 
    git fetch --all &> /dev/null && git reset --hard origin/master &> /dev/null && 
    patientqueueing=$(mvn clean install 2>&1 | grep -oP '(?<=Reactor Summary for Patient Queueing )\d+\.\d+\.\d+(-SNAPSHOT)?')
    echo "Updated module version 'openmrs-module-patientqueueing': $patientqueueing"
)

# =========== Prompt to confirm manual changes have been done ==============

while true; do
    read -p "Please update the 'openmrs-module-botswanaemr' -> 'openmrs-distro.properties' with the above updated module versions? [y/n]" yn
    case $yn in
        [Yy]* ) break;;
        [Nn]* ) exit;;
        * ) echo "Please answer yes or no.";;
    esac
done

# =========== Run Botswana EMR build steps - Docker output ==============

# Change directory and build OpenMRS distro
cd openmrs-module-botswanaemr || { 
    echo "Directory 'openmrs-module-botswanaemr' not found." 
    exit 1
}

# remove the existing folder to ensure no create conflicts exists
rm -r ~/openmrs/botswanaemr

mvn openmrs-sdk:setup -DserverId=botswanaemr -Ddistro=referenceapplication:2.12.2 -DbatchAnswers="8080,1044,MySQL 5.6 in SDK docker container (requires pre-installed Docker)"

mvn openmrs-sdk:deploy -DserverId=botswanaemr -Dplatform=2.5.0

cp -r configuration ~/openmrs/botswanaemr/configuration

mvn openmrs-sdk:build-distro -DdbSql=./db/initial_db.sql -Ddir=docker -Dreset
