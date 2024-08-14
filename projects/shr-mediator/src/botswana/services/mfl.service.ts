import { R4 } from '@ahryman40k/ts-fhir-types';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { getBundleEntries, getBundleEntry } from '../../common/utils/fhir';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MflService {
  constructor(private readonly logger: LoggerService, private readonly httpService: HttpService) {}

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
    let mappedLocation: R4.ILocation | R4.IOrganization | undefined;
    let mappedOrganization: R4.IOrganization | R4.ILocation | undefined;

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
          mappedOrganization = await this.translateLocation(orderingOrganization);

          const mappedLocationRef: R4.IReference = {
            reference: `Location/${mappedLocation.id}`,
          };
          const mappedOrganizationRef: R4.IReference = {
            reference: `Organization/${mappedOrganization.id}`,
          };

          if (mappedLocation.resourceType == 'Location'){
            mappedLocation.managingOrganization = mappedOrganizationRef;
          }
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

          }
          if (orderingLocation && orderingLocation.id) {
            const orderingLocationRef: R4.IReference = {
              reference: `Location/${orderingLocation.id}`,
            };
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
  async translateLocation(location: R4.ILocation | R4.IOrganization): Promise<R4.ILocation | R4.IOrganization> {
    this.logger.log('Translating Location Data');

    const returnLocation: R4.ILocation = {
      resourceType: 'Location',
    };
    let targetMapping: R4.ILocation |  R4.IOrganization |null = null;
    try {
      // First, attempt to find the mapping by identifier
      const identifier = location.identifier?.[0];
      if (identifier) {
          this.logger.log(`Looking up location by identifier: ${JSON.stringify(identifier)}`);
          const { data: fetchedBundleByIdentifier } = await this.httpService.axiosRef.get<R4.IBundle>(
              `${config.get('fhirServer:baseURL')}/${location.resourceType}?identifier=${identifier.value}`
          );

          if (fetchedBundleByIdentifier.entry?.[0]?.resource) {
              targetMapping = fetchedBundleByIdentifier.entry[0].resource as R4.ILocation;
          }
      }

      // If not found, attempt to find the mapping by name
      if (!targetMapping && location.name) {
          this.logger.log(`Looking up location by name: ${location.name}`);
          const { data: fetchedBundleByName } = await this.httpService.axiosRef.get<R4.IBundle>(
              `${config.get('fhirServer:baseURL')}/${location.resourceType}?name=${location.name}`
          );

          if (fetchedBundleByName.entry?.[0]?.resource) {
              targetMapping = fetchedBundleByName.entry[0].resource as R4.ILocation;
          }
      }

      // If target mapping was found, update returnLocation with the target mapping's details
      if (targetMapping) {
        return targetMapping;

      } else {
          this.logger.warn('No matching location found.');
          // Handle the case where no matching location is found
      }
  } catch (error) {
      this.logger.error('Error translating location:', error);
      // Handle the error appropriately
  }

    this.logger.log(`Translated Location:\n${JSON.stringify(returnLocation)}`);
    return returnLocation;
  }
}
