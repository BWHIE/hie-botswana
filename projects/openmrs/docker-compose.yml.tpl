version: "3.7"

services:
  db:
    image: mysql:8.0
    container_name: openmrs-mysql
    command: "mysqld --character-set-server=utf8 --collation-server=utf8_general_ci"
    environment:
      MYSQL_DATABASE: openmrs
      MYSQL_USER: ${OPENMRS_DB_USER:-openmrs}
      MYSQL_PASSWORD: ${OPENMRS_DB_PASSWORD:-openmrs}
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-openmrs}
      MYSQL_LOG_BIN_TRUST_FUNCTION_CREATORS: 1
    volumes:
      - db-data:/var/lib/mysql
      - ./dbdump:/docker-entrypoint-initdb.d

  web:
    build: web
    container_name: openmrs-web
    depends_on:
      - db
    ports:
      - "8085:8080"
    environment:
      OMRS_CONFIG_MODULE_WEB_ADMIN: "true"
      OMRS_CONFIG_AUTO_UPDATE_DATABASE: "false"
      OMRS_CONFIG_CREATE_TABLES: "false"
      OMRS_CONFIG_CONNECTION_SERVER: db
      OMRS_CONFIG_CONNECTION_URL: ${OPENMRS_DB_URL:-jdbc:mysql://localhost:3306/openmrs}
      OMRS_CONFIG_CONNECTION_DATABASE: ${OPENMRS_DB_NAME:-openmrs}
      OMRS_CONFIG_CONNECTION_USERNAME: ${OPENMRS_DB_USER:-root}
      OMRS_CONFIG_CONNECTION_PASSWORD: ${OPENMRS_DB_PASSWORD:-openmrs}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8085/openmrs"]
      timeout: 5s
    logging:
      options:
        max-size: "10m"
        max-file: "3" 
    volumes:
      - openmrs-data:/openmrs/data/
      - ./web/:/usr/local/tomcat/.OpenMRS
      - ./web/modules/:/usr/local/tomcat/.OpenMRS/modules/ # used to mount persistent docker volume for modules
      - ./web/owa/:/usr/local/tomcat/.OpenMRS/owa/     # used to mount persistent docker volume for owa
      - ./web/configuration:/usr/local/tomcat/.OpenMRS/configuration/     # used to mount persistent docker volume for configuration

volumes:
  db-data:
  openmrs-data:
