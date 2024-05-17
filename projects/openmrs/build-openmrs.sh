#! /bin/bash

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
if [[ -n "$mvn_version" ]]; then
    echo "OpenMRS SDK is installed (version: $openmrs_sdk_version)"
else
    echo "OpenMRS SDK is NOT installed. Please install it."
    exit 1
fi

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
