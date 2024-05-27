import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { fhirR4 } from '@smile-cdr/fhirts';
import {ClientRegistry} from '../app-settings.json';
import FHIR from 'fhirclient';

@Injectable()
export class MasterPatientIndex {
  private readonly logger = new Logger(MasterPatientIndex.name);
  private readonly clientRegistryUrl: string;
  private readonly authHeader: string;
  private readonly devMode: boolean;

  constructor(
    private readonly httpService: HttpService,
  ) {
    this.clientRegistryUrl = `${ClientRegistry.OpenhimUrl}${ClientRegistry.CrChannel}`;
    const client = ClientRegistry.OpenhimClient;
    const password = ClientRegistry.OpenhimPassword;
    const authString = `${client}:${password}`;
    this.authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    this.devMode = ClientRegistry.devMode === 'true';
  }

  private getHttpOptions(): AxiosRequestConfig {
    const options: AxiosRequestConfig = {
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/fhir+json',
      },
    };

    if (this.devMode) {
      options.httpsAgent = new (require('https').Agent)({
        rejectUnauthorized: false,
      });
    }

    return options;
  }


    async getSearchBundle(query): Promise<any> {

        let search_bundle:fhirR4.Bundle = null;
        try
        {
            // const fhirClient = new Client({ baseUrl: this.clientRegistryUrl });
            const fhirClient = FHIR.client(this.clientRegistryUrl);
            // const client = new FHIR.client(this.clientRegistryUrl);
        
            let searchResponse = await fhirClient.patient.read({'identifier' : query});
            console.log(searchResponse);

        }
        catch (Exception)
        {
            this.logger.error("Could not get CR bundle for patient with ID " + query + "\n" + Exception);
        }
    }


    async createPatient(patient: any): Promise<any> {
    
        try {
        // Fix for date default formatting issue in FHIR SDK
        if (patient.birthDate) {
            patient.birthDate = new Date(patient.birthDate).toISOString().split('T')[0];
        }
        delete patient.id;

       const fhirClient = FHIR.client(this.clientRegistryUrl);

        // );
        const response = fhirClient.create(patient).then(response => console.log(response));
        this.logger.log('Created patient!\n' + JSON.stringify(response));
        return response;
        } catch (error) {
        this.logger.error('Failed to create patient in CR:', error.stack);
        throw error;
        }
    }

}