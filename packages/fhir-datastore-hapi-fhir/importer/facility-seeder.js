const got = require('got');
const fetch = require('node-fetch');

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

async function fetchDataFromUrl(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
     return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    throw error;
  }
}

async function extractAndResourcesFromBundleEntryUrls(data) {
  const resources = [];
  for (const item of data.entry) {
    let resource = await fetchDataFromUrl(item.fullUrl);

    if (!resource) {
      resource = item.resource;
      resource.identifier = [{
        use: "official",
        system: "http://moh.bw.org/ext/identifier/mfl-code",
        value: resource.id
      }];
    }
    if(!resource.id){
      resource.id = item.resource.id;
    }
    resources.push(resource);
  }
   
  return resources;
}

async function generateTransactionBundle(data) {
  return {
    resourceType: "Bundle",
    type: "transaction",
    entry: data.map(item => ({
      fullUrl: `https://mfldit.gov.org.bw/api/v1/mfl/fhir/location/${item.id}`,
      resource: item,
      request: {
        method: 'PUT',
        url: `${item.resourceType}/${item.id}`
      }
    }))
  };
}

async function processBundle() {
  try {
    const locationData = await fetchDataFromUrl("https://mfldit.gov.org.bw/api/v1/mfl/fhir/bundle/location");
    const locationResources = await  extractAndResourcesFromBundleEntryUrls(locationData);
    const obtainedBundle = await generateTransactionBundle(locationResources);

    await saveBundle(obtainedBundle); // Call saveBundle function with the parsed bundle
    console.log(`Seeder successfully finished execution!`);
  } catch (error) {
    console.error(`Error processing bundle: ${error.message}`);
    process.exit(1);
  }
}

// Call the async function
processBundle();

