import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { Agent } from 'https';
import config from 'src/config';
import { Bundle } from 'fhir/r4';
import { fhirR4 } from '@smile-cdr/fhirts';
import { FhirSearchParams } from 'src/utils/fhir-search.pipe';

@Injectable()
export class MpiService {
  private readonly logger = new Logger(MpiService.name);
  private readonly clientRegistryUrl: string;
  private readonly authHeader: string;
  private readonly devMode: boolean;

  constructor(private readonly httpService: HttpService) {
    this.clientRegistryUrl = config.get('ClientRegistry:ApiUrl');
    const authString = ''; //`${client}:${password}`;
    this.authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    this.devMode = config.get('ClientRegistry:devMode') === 'true';
  }

  private getHttpOptions(): AxiosRequestConfig {
    const options: AxiosRequestConfig = {
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/fhir+json',
      },
    };

    if (this.devMode) {
      options.httpsAgent = new Agent({
        rejectUnauthorized: false,
      });
    }

    return options;
  }

  async getPatientById(id: string, clientId: string): Promise<fhirR4.Patient> {
    try {
      const searchResponse =
        await this.httpService.axiosRef.get<fhirR4.Patient>(
          `${this.clientRegistryUrl}/Patient/${id}`,
          {
            headers: {
              'Content-Type': 'application/fhir+json',
              'x-openhim-clientid': clientId,
            },
          },
        );

      return searchResponse.data;
    } catch (error) {
      this.logger.error(
        `Could not get CR patient with ${JSON.stringify(id)} \n ${error}`,
      );
      throw error;
    }
  }

  async searchPatientByIdentifier(
    params: FhirSearchParams,
    clientId: string,
  ): Promise<any> {
    try {
      const searchResponse = await this.httpService.axiosRef.get<Bundle>(
        `${this.clientRegistryUrl}/Patient`,
        {
          params,
          headers: {
            'Content-Type': 'application/fhir+json',
            'x-openhim-clientid': clientId,
          },
        },
      );

      return searchResponse.data;
    } catch (error) {
      this.logger.error(
        `Could not get CR bundle for patient with ${JSON.stringify(params)} \n ${error}`,
      );
      throw error;
    }
  }

  public async pushToClientRegistry(
    bundle: fhirR4.Bundle,
    clientId: string,
  ): Promise<void> {
    for (const entry of bundle.entry) {
      try {
        await this.createPatient(entry.resource as fhirR4.Patient, clientId);
      } catch (error) {
        this.logger.error(`Error creating patient:   ${error}`);
      }
    }
  }

  async createPatient(
    patient: fhirR4.Patient,
    clientId: string,
  ): Promise<{ response: fhirR4.BundleResponse }[]> {
    try {
      // Fix for date default formatting issue in FHIR SDK
      if (patient.birthDate) {
        patient.birthDate = new Date(patient.birthDate)
          .toISOString()
          .split('T')[0];
      }

      const response = await this.httpService.axiosRef.post(
        `${this.clientRegistryUrl}/Patient`,
        patient,
        {
          headers: {
            'Content-Type': 'application/fhir+json',
            'x-openhim-clientid': clientId,
          },
        },
      );
      this.logger.debug(`Created patient!\n ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create patient in CR`, error);
      throw error;
    }
  }
}
