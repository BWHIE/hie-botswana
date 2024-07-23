import { R4 } from '@ahryman40k/ts-fhir-types';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { getBundleEntries, getBundleEntry } from '../../common/utils/fhir';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';
import facilityMappings from '../utils/locationMap';

@Injectable()
export class MflService {
  constructor(private readonly logger: LoggerService) {}

  async mapLocations(labBundle: R4.IBundle): Promise<R4.IBundle> {
    this.logger.log('Mapping Locations!');

    return await this.addBwLocations(labBundle);
  }

  //    * This method adds IPMS - specific location mappings to the order bundle based on the ordering
  //   * facility
  //   * @param bundle
  //     * @returns bundle
  //       * /
  // //
  //
  // This method assumes that the Task resource has a reference to the recieving facility
  // under the `owner` field. This is the facility that the lab order is being sent to.
  async addBwLocations(bundle: R4.IBundle): Promise<R4.IBundle> {
    let mappedLocation: R4.ILocation | undefined;
    let mappedOrganization: R4.IOrganization | undefined;

    try {
      this.logger.log('Adding Location Info to Bundle');

      if (bundle && bundle.entry) {
        const task: R4.ITask = <R4.ITask>getBundleEntry(bundle.entry, 'Task');
        const srs: R4.IServiceRequest[] = <R4.IServiceRequest[]>(
          getBundleEntries(bundle.entry, 'ServiceRequest')
        );

        const orderingLocationRef: R4.IReference | undefined = task.location;

        const srOrganizationRefs: (R4.IReference | undefined)[] = srs.map(
          (sr) => {
            if (sr.requester) {
              return sr.requester;
            } else {
              return undefined;
            }
          },
        );

        const locationId = orderingLocationRef?.reference?.split('/')[1];
        const srOrgIds = srOrganizationRefs.map((ref) => {
          return ref?.reference?.split('/')[1];
        });

        const uniqueOrgIds = Array.from(new Set(srOrgIds));

        if (uniqueOrgIds.length != 1 || !locationId) {
          this.logger.error(
            `Wrong number of ordering Organizations and Locations in this bundle:\n${JSON.stringify(
              uniqueOrgIds,
            )}\n${JSON.stringify(locationId)}`,
          );
        }

        let orderingLocation = <R4.ILocation>(
          getBundleEntry(bundle.entry, 'Location', locationId)
        );
        
        //@TODO fix
        let orderingOrganization = <R4.IOrganization>(
          getBundleEntry(bundle.entry, 'Organization', uniqueOrgIds[0])
        );

        if (!orderingLocation) {
          this.logger.warn(
            'Could not find ordering Location! Using Omrs Location instead.',
          );
          orderingLocation = <R4.ILocation>(
            getBundleEntry(bundle.entry, 'Location')
          );
        } else if (orderingLocation) {
            if (!orderingOrganization) {
              this.logger.warn(
                'No ordering Organization found - copying location info!',
              );
              orderingOrganization = {
                resourceType: 'Organization',
                id: crypto
                  .createHash('md5')
                  .update('Organization/' + orderingLocation.name)
                  .digest('hex'),
                identifier: orderingLocation.identifier,
                name: orderingLocation.name,
              };
            } else if (
              !orderingLocation.managingOrganization ||
              orderingLocation.managingOrganization.reference?.split('/')[1] !=
                orderingOrganization.id
            ) {
              this.logger.error(
                'Ordering Organization is not the managing Organziation of Location!',
              );
            }

          mappedLocation = await this.translateLocation(orderingLocation);
          mappedOrganization = {
            resourceType: 'Organization',
            id: crypto
              .createHash('md5')
              .update('Organization/' + mappedLocation.name)
              .digest('hex'),
            identifier: mappedLocation.identifier,
            name: mappedLocation.name,
          };
          const mappedLocationRef: R4.IReference = {
            reference: `Location/${mappedLocation.id}`,
          };
          const mappedOrganizationRef: R4.IReference = {
            reference: `Organization/${mappedOrganization.id}`,
          };

          mappedLocation.managingOrganization = mappedOrganizationRef;

          if (mappedLocation && mappedLocation.id) {
            task.location = mappedLocationRef;

            bundle.entry.push({
              resource: mappedLocation,
              request: {
                method: R4.Bundle_RequestMethodKind._put,
                url: mappedLocationRef.reference,
              },
            });
          }
          if (mappedOrganization && mappedOrganization.id) {
            task.owner = mappedOrganizationRef;
            bundle.entry.push({
              resource: mappedOrganization,
              request: {
                method: R4.Bundle_RequestMethodKind._put,
                url: mappedOrganizationRef.reference,
              },
            });
            for (const sr of srs) {
              sr.performer
                ? sr.performer.push(mappedOrganizationRef)
                : (sr.performer = [mappedOrganizationRef]);
            }
          }
          if (orderingOrganization && orderingOrganization.id) {
            const orderingOrganizationRef: R4.IReference = {
              reference: `Organization/${orderingOrganization.id}`,
            };

            task.requester = orderingOrganizationRef;

            /**
             * //@TODO fix double persistence issues of ordering facilities and locations in the submitted FHIR Bundle.
             */

            // bundle.entry.push({
            //   resource: orderingOrganization,
            //   request: {
            //     method: R4.Bundle_RequestMethodKind._put,
            //     url: orderingOrganizationRef.reference,
            //   },
            // });
          }
          if (orderingLocation && orderingLocation.id) {
            const orderingLocationRef: R4.IReference = {
              reference: `Location/${orderingLocation.id}`,
            };

            // bundle.entry.push({
            //   resource: orderingLocation,
            //   request: {
            //     method: R4.Bundle_RequestMethodKind._put,
            //     url: orderingLocationRef.reference,
            //   },
            // });
          }
        }
      }
    } catch (e) {
      this.logger.error(e);
    }

    return bundle;
  }

  /**
   * @param location
   * @returns R4.ILocation
   */
  async translateLocation(location: R4.ILocation): Promise<R4.ILocation> {
    this.logger.log('Translating Location Data');

    const returnLocation: R4.ILocation = {
      resourceType: 'Location',
    };
    const mappings = await facilityMappings;
    let targetMapping;
    this.logger.log('Facility mappings: ' + mappings.length);

    for (const mapping of mappings) {
      // TODO: Match on system when we decide on MFL system
      if (
        mapping.orderingFacilityMflCode &&
        location.identifier &&
        location.identifier.length > 0 &&
        mapping.orderingFacilityMflCode == location.identifier[0].value
      ) {
        this.logger.log('Matching location by MFL Code');
        targetMapping = mapping;
      } else if (
        mapping.orderingFacilityName &&
        mapping.orderingFacilityName == location.name
      ) {
        this.logger.warn(
          'MFL Code not found. Falling back to matching location by facility name.',
        );
        targetMapping = mapping;
      }
    }

    if (targetMapping) {
      this.logger.log(
        `Mapped location '${location.name}' to '${targetMapping.orderingFacilityMflCode}'|'${targetMapping.orderingFacilityName}'`,
      );

      returnLocation.id = crypto
        .createHash('md5')
        .update('Organization/' + returnLocation.name)
        .digest('hex');
      returnLocation.identifier = [
        {
          system: config.get('bwConfig:ipmsCodeSystemUrl'),
          value: targetMapping.receivingFacility,
        },
      ];

      returnLocation.name = targetMapping.receivingFacility;
      returnLocation.extension = [];
      returnLocation.extension.push({
        url: config.get('bwConfig:ipmsProviderSystemUrl'),
        valueString: targetMapping.provider,
      });
      returnLocation.extension.push({
        url: config.get('bwConfig:ipmsPatientTypeSystemUrl'),
        valueString: targetMapping.patientType,
      });
      returnLocation.extension.push({
        url: config.get('bwConfig:ipmsPatientStatusSystemUrl'),
        valueString: targetMapping.patientStatus,
      });
      returnLocation.extension.push({
        url: config.get('bwConfig:ipmsXLocationSystemUrl'),
        valueString: targetMapping.xLocation,
      });
    } else {
      this.logger.error(
        'Could not find a location mapping for:\n' +
          JSON.stringify(location.name),
      );
    }

    this.logger.log(`Translated Location:\n${JSON.stringify(returnLocation)}`);
    return returnLocation;
  }
}
