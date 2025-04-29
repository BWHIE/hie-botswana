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


# TEMP: Download the required files first
# echo "Downloading latest properties files..."
# curl -L "https://bitbucket.org/botswana-emrs/botswanaemr-docker/raw/main/docker/openmrs-distro.properties" -o openmrs-distro.properties || {
#     echo "Failed to download openmrs-distro.properties"
#     exit 1
# }

# curl -L "https://bitbucket.org/botswana-emrs/botswanaemr-docker/raw/main/docker/openmrs-runtime.properties" -o openmrs-runtime.properties || {
#     echo "Failed to download openmrs-runtime.properties"
#     exit 1
# }

# =========== Build the new distro / docker files ==============
# Change directory and build OpenMRS distro
cd openmrs-module-botswanaemr || { 
    echo "Directory 'openmrs-module-botswanaemr' not found." 
    exit 1
}

# remove the existing folder to ensure no create conflicts exists
rm -r ~/openmrs/botswanaemr

# TEMP: Download and replace the initial_db.sql file
echo "Downloading latest initial_db.sql..."
curl -L "https://bitbucket.org/botswana-emrs/botswanaemr-docker/raw/main/docker/dbdump/initial_db.sql" -o db/initial_db.sql || {
    echo "Failed to download initial_db.sql"
    exit 1
}

# TEMP: Comment out the labonfhir module - currently has a loading time issue
# sed -i -r 's/^(omod\.labonfhir=).*/#&/' openmrs-distro.properties

mvn openmrs-sdk:build-distro -DdbSql=./db/initial_db.sql -Ddir=docker -Dreset

# copy the updated docker-compose template to use
cp ../docker-compose.yml.tpl docker/docker-compose.yml
