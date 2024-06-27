const got = require('got'); 

async function postWithRetry(fhirUrl, options, retryLimit = 5, timeout = 30000) {
  for (let attempt = 1; attempt <= retryLimit; attempt++) {
    try {
      const response = await got.post(fhirUrl, options).json();
      return response; // If request is successful, return the response
    } catch (error) {
      console.error(`Attempt ${attempt} failed`);

      // Sleep for a given amount of time
      await new Promise(resolve => setTimeout(resolve, timeout));

      if (error instanceof got.HTTPError) {
        // Handle HTTP errors (4xx and 5xx response codes)
        console.error(`HTTP Error: ${error.response.statusCode}`);
      } else if (error instanceof got.RequestError) {
        // Handle network errors or other request issues
        console.error(`Request Error: ${error.message}`);
      } else {
        // Handle any other errors that might occur
        console.error(`Unknown Error: ${error}`);
      }

      // If we are on the last attempt, re-throw the error
      if (attempt === retryLimit) {
        console.error('All retries failed');
        throw error;
      }
    }
  }
}

async function saveBundle(bundle) {
  try {
    const ret = await postWithRetry("http://hapi-fhir:8080/fhir", { json: bundle });
    console.log(`Saved bundle to FHIR store!`);
    return ret;
  } catch (error) {
    console.error(`Could not save bundle: ${error.response.body}`);

    throw new HapiError('Could not save bundle to hapi server!');
  }
}


async function processBundles() {
  const facilityData = require('./facility_bundle.json');
  const firstLocationData = require('./location_bundle_part1.json');
  const secondLocationData = require('./location_bundle_part2.json');

  try {
    await saveBundle(facilityData); // Call saveBundle function with the parsed bundle
    console.log(`Seeder successfully finished execution!`);
  } catch (error) {
    console.error(`Error processing bundle: ${error.message}`);
    process.exit(1);
  }

  try {
    await saveBundle(firstLocationData); // Call saveBundle function with the parsed bundle
    console.log(`Seeder successfully finished execution!`);
  } catch (error) {
    console.error(`Error processing bundle: ${error.message}`);
    process.exit(1);
  }

  try {
    await saveBundle(secondLocationData); // Call saveBundle function with the parsed bundle
    console.log(`Seeder successfully finished execution!`);
  } catch (error) {
    console.error(`Error processing bundle: ${error.message}`);
    process.exit(1);
  }
}

// Call the async function
processBundles();

