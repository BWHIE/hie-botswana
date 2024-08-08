const got = require('got');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

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
    console.error(`Could not save bundle: ${error.message}`);
    throw new Error('Could not save bundle to HAPI server!');
  }
}

async function fetchDataFromUrl(url, maxRetries = 3, delay = 2000) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`Attempt ${attempt + 1}: Request failed with status ${response.status}`);
      } else {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1}: An error occurred: ${error.message}`);
    }

    attempt++;

    if (attempt < maxRetries) {
      // Wait for a specified delay before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
}

async function processBundleEntriesAndGenerateTransactionBundle(data) {
  const resources = [];

  for (const item of data.entry) {
    // Fetch the resource from the URL
    let resource = await fetchDataFromUrl(item.fullUrl);

    // Assign identifiers if the resource is a Location or Organization
    if (!resource && item.resource.resourceType === 'Location') {
      resource = item.resource;
      resource.identifier = [{
        use: "official",
        system: process.env.LOCATION_SYSTEM,
        value: resource.id
      }];
    } else if (!resource && item.resource.resourceType === 'Organization') {
      resource = item.resource;
      resource.identifier = [{
        use: "official",
        system: process.env.ORGANIZATION_SYSTEM,
        value: resource.id
      }];
    }

    // Ensure the resource has an ID
    if (!resource.id) {
      resource.id = item.resource.id;
    }

    console.log("mapped resource ", JSON.stringify(resource));

    // Push the resource into the resources array
    resources.push({
      resource: resource,
      request: {
        method: 'POST',
        url: resource.resourceType,
        ifNoneExist: `identifier=${resource.identifier[0].system}|${resource.identifier[0].value}`
      }
    });
  }

  // Return the transaction bundle
  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: resources
  };
}

async function processBundle() {
  try {
    const locationsUrl = process.env.LOCATIONS_URL;
    const organizationUrl = process.env.ORGANIZATIONS_URL;

    const locationData = await fetchDataFromUrl(locationsUrl);
    const locationResources = await  processBundleEntriesAndGenerateTransactionBundle(locationData);

    await saveBundle(locationResources); // Call saveBundle function with the parsed bundle

    const organizationData = await fetchDataFromUrl(organizationUrl);
    const organizationResources = await  processBundleEntriesAndGenerateTransactionBundle(organizationData);

    await saveBundle(organizationResources); // Call saveBundle function with the parsed bundle

    console.log(`Seeder successfully finished execution!`);
  } catch (error) {
    console.error(`Error processing bundle: ${error.message}`);
    process.exit(1);
  }
}

// Call the async function
processBundle();
