# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Define build-time variables
ARG SERVER_DOMAIN_ARG=0.0.0.0
ARG SERVER_PORT_ARG=2575

# Set environment variables from build-time variables
ENV SERVER_DOMAIN=${SERVER_DOMAIN_ARG}
ENV SERVER_PORT=${SERVER_PORT_ARG}

# Copy the local code to the container
COPY . .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir hl7apy watchdog

# Make port 2575 available to the world outside this container
EXPOSE ${SERVER_PORT}

# Run app.py when the container launches
CMD ["python", "app.py"]
