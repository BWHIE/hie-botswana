import {readCsv, saveData} from './utils/helpers';
import {generateFacilityBundle, generateLocationBundle, generatePimsLocationBundle} from './bundle';
import { splitBundle } from './utils/utils';

const facilities = readCsv('../ipms-facilities-locations/output/IPMS_Facilities_MFL.csv');
const locations = readCsv('../ipms-facilities-locations/output/IPMS_Locations_MFL.csv');
const pimsLocations = readCsv('../ipms-mfl-matcher/pims-dataset.csv');



const theFacilityBundle = generateFacilityBundle(facilities[0]);
saveData('./facility_bundle.json',theFacilityBundle);


const theLocationBundle = generateLocationBundle(locations[0], facilities[0]);
const thePimsLocationBundle = generatePimsLocationBundle(pimsLocations[0]);

try {
  const [firstHalfBundle, secondHalfBundle] = splitBundle(theLocationBundle);
  saveData('./location_bundle_part1.json',firstHalfBundle);
  saveData('./location_bundle_part2.json',secondHalfBundle);
  saveData('./pims_location_bundle.json',thePimsLocationBundle);



} catch (error) {
  console.error('Error splitting bundle:', error);
}
