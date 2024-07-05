import { fhirR4 } from "@smile-cdr/fhirts";
import { createHash } from 'crypto';
import { config } from "./config/config";
import { findReferenceMenmonics } from "./utils/utils";


export function generateOrganization(org: any): fhirR4.Organization{
    const organization = new fhirR4.Organization(); 
    organization.resourceType = 'Organization';
    organization.id = '';
    

    const mnemonic_identifier = new fhirR4.Identifier();
    mnemonic_identifier.system = config.get('bwConfig:facilityCodeSystemUrl');
    mnemonic_identifier.value = org.Column1;

    const mfl_identifier = new fhirR4.Identifier()
    mfl_identifier.system = config.get('bwConfig:MflfacilityCodeSystemUrl');
    mfl_identifier.value = org.MFLCode;

    organization.identifier = [mnemonic_identifier, mfl_identifier];

    organization.name = org.Column2



    organization.id = createHash('md5')
      .update('Organization/' + organization.name)
      .digest('hex');

    return organization;

}

export function generateLocation(location: any, facilities: any[]): fhirR4.Location{
  let theLocation = new fhirR4.Location();
  theLocation.resourceType = 'Location';
  theLocation.id = '';

  const mnemonic_identifier = new fhirR4.Identifier();
  mnemonic_identifier.system = config.get('bwConfig:facilityCodeSystemUrl');
  mnemonic_identifier.value = location.Mnemonic;

  const mfl_identifier = new fhirR4.Identifier()
  mfl_identifier.system = config.get('bwConfig:MflfacilityCodeSystemUrl');
  mfl_identifier.value = location.MFLCode;

  theLocation.identifier = [mnemonic_identifier, mfl_identifier];

  if (location.Active == 'Y'){
    theLocation.status = 'active';
  } else if (location.Active == 'N') {
    theLocation.status == 'inactive';
  } 

  theLocation.name = location.Name;

  theLocation = findReferenceMenmonics(theLocation, facilities);


  theLocation.id = createHash('md5')
  .update('Location/' + mnemonic_identifier.value)
  .digest('hex');

  return theLocation;

}

export function generateFacilityBundle(facilities:any[]){
  const myBundle = new fhirR4.Bundle();
  myBundle.resourceType = 'Bundle';
  myBundle.type = 'transaction';
  const orgEntries: fhirR4.BundleEntry[] = []

  // Create a new Bundle entry for each facility 
  facilities.forEach(facility => {
    const orgEntry = new fhirR4.BundleEntry();
    orgEntry.resource = generateOrganization(facility);
    const theOrgRequest = new fhirR4.BundleRequest();
    theOrgRequest.method = 'PUT';
    theOrgRequest.url = `${orgEntry.resource.resourceType}/${orgEntry.resource.id}`;
    orgEntry.request = theOrgRequest;
    orgEntries.push(orgEntry);
   
  });
  myBundle.entry = orgEntries;
  return myBundle;
}

export function generateLocationBundle(locations:any[] , facilities:any[]){
  const myBundle = new fhirR4.Bundle();
  myBundle.resourceType = 'Bundle';
  myBundle.type = 'transaction';
  const locEntries: fhirR4.BundleEntry[] = []

  locations.forEach(location => {

    // Create a new Bundle entry for each location 
    const entry = new fhirR4.BundleEntry();
    entry.resource = generateLocation(location, facilities);
    const theRequest = new fhirR4.BundleRequest();
    theRequest.method = 'PUT';
    theRequest.url = `${entry.resource.resourceType}/${entry.resource.id}`
    entry.request = theRequest
    locEntries.push(entry);

  });

  myBundle.entry = locEntries;
  return myBundle;
}


export function generatePimsLocation(location: any): fhirR4.Location{
  let theLocation = new fhirR4.Location();
  theLocation.resourceType = 'Location';
  theLocation.id = '';

  const pims_identifier = new fhirR4.Identifier()
  pims_identifier.system = config.get('bwConfig:PimsFacilityCodeSystemUrl');
  pims_identifier.value = location.FacilityCode;

  theLocation.identifier = [ pims_identifier];


  theLocation.name = location.Facility;

  theLocation.id = createHash('md5')
  .update('Location/' + location.FacilityID)
  .digest('hex');

  return theLocation;

}


export function generatePimsLocationBundle(locations:any[]){
  const myBundle = new fhirR4.Bundle();
  myBundle.resourceType = 'Bundle';
  myBundle.type = 'transaction';
  const locEntries: fhirR4.BundleEntry[] = []

  locations.forEach(location => {

    // Create a new Bundle entry for each location 
    const entry = new fhirR4.BundleEntry();
    entry.resource = generatePimsLocation(location);
    const theRequest = new fhirR4.BundleRequest();
    theRequest.method = 'PUT';
    theRequest.url = `${entry.resource.resourceType}/${entry.resource.id}`
    entry.request = theRequest
    locEntries.push(entry);

  });

  myBundle.entry = locEntries;
  return myBundle;
}
