import { fhirR4 } from "@smile-cdr/fhirts";
import { createHash } from "crypto";
import fs from 'fs';


function findUppercaseWords(text: string): string[] {
    // Regular expression to match all uppercase words
    const regex = /\b[A-Z]+\b/g;
    // Use the match method to find all matches
    const matches = text.match(regex);
    // Return the matched words or an empty array if no matches are found
    return matches ? matches : [];
}

export function findReferenceMenmonics(location: fhirR4.Location, facilities: any): fhirR4.Location{
    if (location.name){
        const referenceMnemonic : string[] = findUppercaseWords(location.name);
        if (referenceMnemonic){
            for (const item of facilities) {
               if (item.Column1 == referenceMnemonic[0]){
                const reference = new fhirR4.Reference();
                const theId = createHash('md5')
                .update('Organization/' + item.Column2)
                .digest('hex');
                reference.reference = `Organization/${theId}`
                location.managingOrganization = reference;
               }
              }
            

        }
    }
    return location;

   
}

function initializeTransactionBundle(){
    const myBundle = new fhirR4.Bundle();
    myBundle.resourceType = 'Bundle';
    myBundle.type = 'transaction';
    myBundle.entry = [];
    return myBundle;

}

export function splitBundle(bundle: fhirR4.Bundle){
    const entries = bundle.entry;
    if (entries && entries.length > 0){
        const midpoint = Math.ceil(entries.length / 2);

        // Split the entries array into two parts
        const firstHalfEntries = entries.slice(0, midpoint);
        const secondHalfEntries = entries.slice(midpoint);

        const firstBundle = initializeTransactionBundle();
        const secondBundle = initializeTransactionBundle();

        firstBundle.entry = firstHalfEntries;
        secondBundle.entry = secondHalfEntries
        return [firstBundle, secondBundle];
    } else {
            throw new Error('Bundle must have at least one entry to split.');
        }
            
}
