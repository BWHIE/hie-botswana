import { R4 } from '@ahryman40k/ts-fhir-types';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import Client from 'fhirclient/lib/Client';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class IpsService {
  constructor(
    private readonly logger: LoggerService,
    private httpService: HttpService,
  ) {}

  async generateIpsBundle(
    patients: R4.IPatient[],
    shrClient: Client,
    lastUpdated: string,
    system: string,
  ): Promise<R4.IBundle> {
    const patientIdentifiers = this.grabTargetIdentifiers(patients, system);
    const query = new URLSearchParams();

    query.set('subject', patientIdentifiers.join(','));
    query.set('_lastUpdated', lastUpdated);

    // Fetch SHR components
    /**
     * Get Encounters where: relevant to medical summary
     * Get AllergyIntolerance
     * Get observations relevant to problem lists
     * Get observations relevant to immunizations
     * Get observations relevant to diagnostic results
     * Get observations relevant to labs
     * Get plan of care?
     */
    const shrPatients = await shrClient.request<R4.IPatient[]>(
      `Patient?_id=${patientIdentifiers.join(',')}`,
      { flat: true },
    );
    const encounters = await shrClient.request<R4.IEncounter[]>(
      `Encounter?${query}`,
      { flat: true },
    );
    const observations = await shrClient.request<R4.IObservation[]>(
      `Observation?${query}`,
      {
        flat: true,
      },
    );

    const ipsBundle: R4.IBundle = {
      resourceType: 'Bundle',
    };

    const ipsCompositionType: R4.ICodeableConcept = {
      coding: [
        {
          system: 'http://loinc.org',
          code: '60591-5',
          display: 'Patient summary Document',
        },
      ],
    };

    const ipsComposition: R4.IComposition = {
      resourceType: 'Composition',
      type: ipsCompositionType,
      author: [{ display: 'SHR System' }],
      section: [
        {
          title: 'Patient Records',
          entry: shrPatients.map((p: R4.IPatient) => {
            return { reference: `Patient/${p.id!}` };
          }),
        },
        {
          title: 'Encounters',
          entry: encounters.map((e: R4.IEncounter) => {
            return { reference: `Encounter/${e.id!}` };
          }),
        },
        {
          title: 'Observations',
          entry: observations.map((o: R4.IObservation) => {
            return { reference: `Observation/${o.id!}` };
          }),
        },
      ],
    };

    ipsBundle.type = R4.BundleTypeKind._document;
    ipsBundle.entry = [];
    ipsBundle.entry.push(ipsComposition);
    ipsBundle.entry = ipsBundle.entry.concat(shrPatients);
    ipsBundle.entry = ipsBundle.entry.concat(encounters);
    ipsBundle.entry = ipsBundle.entry.concat(observations);

    return ipsBundle;
  }

  async generateSimpleIpsBundle(patientId: string): Promise<R4.IBundle> {
    const ipsBundle: R4.IBundle = {
      resourceType: 'Bundle',
    };

    const ipsCompositionType: R4.ICodeableConcept = {
      coding: [
        {
          system: 'http://loinc.org',
          code: '60591-5',
          display: 'Patient summary Document',
        },
      ],
    };

    // Fetch SHR components
    /**
     * Get Encounters where: relevant to medical summary
     * Get AllergyIntolerance
     * Get observations relevant to problem lists
     * Get observations relevant to immunizations
     * Get observations relevant to diagnostic results
     * Get observations relevant to labs
     * Get plan of care?
     */
    try {
      // TODO: get pagination implemented
      const { data: searchBundle } =
        await this.httpService.axiosRef.get<R4.IBundle>(
          `${config.get('fhirServer:baseURL')}/Patient?_id=${patientId}&_include=*&_revinclude=*`,
          {
            auth: {
              username: config.get('fhirServer:username'),
              password: config.get('fhirServer:password'),
            },
          },
        );

      const ipsSections: any = {
        Patient: [],
        Encounter: [],
        ServiceRequest: [],
        DiagnosticResult: [],
        Observation: [],
      };

      if (searchBundle && searchBundle.entry && searchBundle.entry.length > 0) {
        searchBundle.entry.map((e) => {
          if (e.resource) {
            const resourceType = e.resource.resourceType;
            const resourceKey = resourceType.toString() as keyof any;

            if (
              !ipsSections[resourceKey] ||
              ipsSections[resourceKey].length == 0
            ) {
              ipsSections[resourceKey] = [];
            }

            ipsSections[resourceKey].push(e.resource);
          }
        });
      }

      if (ipsSections['Patient'] && ipsSections['Patient'].length == 1) {
        const ipsComposition: R4.IComposition = {
          resourceType: 'Composition',
          type: ipsCompositionType,
          author: [{ display: 'SHR System' }],
          subject: { reference: `Patient/${ipsSections['Patient'][0].id}` },
          section: [
            {
              title: 'Patient Records',
              entry: ipsSections['Patient'].map((p: R4.IPatient) => {
                return { reference: `Patient/${p.id!}` };
              }),
            },
            {
              title: 'Encounters',
              entry: ipsSections['Encounter'].map((e: R4.IEncounter) => {
                return { reference: `Encounter/${e.id!}` };
              }),
            },
            {
              title: 'Service Requests',
              entry: ipsSections['ServiceRequest'].map(
                (sr: R4.IServiceRequest) => {
                  return { reference: `ServiceRequest/${sr.id!}` };
                },
              ),
            },
            {
              title: 'Diagnostic Reports',
              entry: ipsSections['DiagnosticReport'].map(
                (dr: R4.IDiagnosticReport) => {
                  return { reference: `DiagnosticReport/${dr.id!}` };
                },
              ),
            },
            {
              title: 'Observations',
              entry: ipsSections['Observation'].map((o: R4.IObservation) => {
                return { reference: `Observation/${o.id!}` };
              }),
            },
          ],
        };

        ipsBundle.type = R4.BundleTypeKind._document;
        ipsBundle.entry = [];
        ipsBundle.entry.push(ipsComposition);

        const bundleTypes = [
          'Patient',
          'Encounter',
          'ServiceRequest',
          'DiagnosticReport',
          'Observation',
        ];
        bundleTypes.forEach((rt: string) => {
          if (
            ipsSections[rt] &&
            ipsSections[rt].length > 0 &&
            ipsBundle.entry
          ) {
            ipsBundle.entry = ipsBundle.entry.concat(ipsSections[rt]);
          }
        });
      } else {
        // TODO: Return Error Bundle
        this.logger.error(`Cant generate IPS for patient ${patientId}`);
      }
    } catch (e) {
      this.logger.error(`Cant generate IPS for patient ${patientId}:\n${e}`);
    }
    return ipsBundle;
  }

  generateUpdateBundle(
    values: R4.IDomainResource[][],
    lastUpdated?: string,
    location?: string,
  ): R4.IBundle {
    let patients: R4.IPatient[] = <R4.IPatient[]>values[0];
    const encounters: R4.IEncounter[] = <R4.IEncounter[]>values[1];
    const observations: R4.IObservation[] = <R4.IObservation[]>values[2];

    // Filter patients here since location is not queryable
    if (patients.length > 0 && location) {
      patients = patients.filter((p: R4.IPatient) => {
        if (
          p.identifier &&
          p.identifier.length > 0 &&
          p.identifier[0].extension
        ) {
          return p.identifier[0].extension[0].valueReference!.reference!.includes(
            location,
          );
        } else {
          return false;
        }
      });
    }

    const ipsBundle: R4.IBundle = {
      resourceType: 'Bundle',
    };

    // let ipsCompositionType: R4.ICodeableConcept = {
    //     coding: [{ system: "http://loinc.org", code: "60591-5", display: "Patient summary Document" }]
    // };

    const ipsCompositionType: R4.ICodeableConcept = {
      text: 'iSantePlus Instance Update Bundle',
    };

    const ipsComposition: R4.IComposition = {
      resourceType: 'Composition',
      type: ipsCompositionType,
      author: [{ display: 'SHR System' }],
      section: [
        {
          title: 'Patients',
          entry: patients.map((p: R4.IPatient) => {
            return { reference: `Patient/${p.id!}` };
          }),
        },
        {
          title: 'Encounters',
          entry: encounters.map((e: R4.IEncounter) => {
            return { reference: `Encounter/${e.id!}` };
          }),
        },
        {
          title: 'Observations',
          entry: observations.map((o: R4.IObservation) => {
            return { reference: `Observation/${o.id!}` };
          }),
        },
      ],
    };

    // Create Document Bundle
    ipsBundle.type = R4.BundleTypeKind._document;
    ipsBundle.entry = [];
    ipsBundle.entry.push(ipsComposition);
    ipsBundle.entry = ipsBundle.entry.concat(patients);
    ipsBundle.entry = ipsBundle.entry.concat(encounters);
    ipsBundle.entry = ipsBundle.entry.concat(observations);

    return ipsBundle;
  }

  grabTargetIdentifiers(patients: R4.IPatient[], system: string): string[] {
    // Filter results for unique idenitifers with the correct system
    return patients
      .map<string>((patient) => {
        if (patient.identifier) {
          const targetId = patient.identifier.find((i: R4.IIdentifier) => {
            return i.system && i.system === system;
          });

          if (targetId && targetId.value) {
            const uuid = targetId.value.split('/').pop();
            if (uuid) {
              return uuid;
            }
          }
        }
        return '';
      })
      .filter((i) => i != '');
  }

  async getRelatedResources(
    patientId: string,
    resourceType: string,
  ): Promise<R4.IResource[]> {
    // TODO: Consider bulk export
    const query = new URLSearchParams();

    query.set('subject', `Patient/${patientId}`);

    const { data: resources } = await this.httpService.axiosRef.get<
      R4.IResource[]
    >(`${config.get('fhirServer:baseURL')}/${resourceType}?${query}`, {
      auth: {
        username: config.get('fhirServer:username'),
        password: config.get('fhirServer:password'),
      },
    });

    return <R4.IResource[]>resources;
  }
}
