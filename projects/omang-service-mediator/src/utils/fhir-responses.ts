import { v4 as uuidv4 } from 'uuid'; // Import uuid library for generating UUIDs
import { fhirR4 } from '@smile-cdr/fhirts';

export class FhirAPIResponses {
  public static get RecordInitialized(): fhirR4.Bundle {
    // Create a new Bundle object
    const bundle: fhirR4.Bundle = {
      resourceType: 'Bundle',
      id: uuidv4(), // Generate a unique ID for the bundle
      meta: {
        lastUpdated: new Date().toISOString(), // Use ISO string for precise time representation
      },
      type: 'searchset',
      total: 0,
      entry: [], // Initialize entry as an empty array
    };
    return bundle;
  }
}
