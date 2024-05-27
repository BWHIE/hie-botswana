import { ImmigrationService } from '../services/immigration.service';
import { PatientService } from '../services/patient.service';
import { fhirR4 } from '@smile-cdr/fhirts';
export declare class PatientController {
    private readonly immigration;
    private readonly patients;
    private readonly logger;
    constructor(immigration: ImmigrationService, patients: PatientService);
    online(): Promise<Boolean>;
    get(identifier: string): Promise<fhirR4.Bundle>;
    getByID(ID: string): Promise<fhirR4.Bundle>;
    getPatientByFullName(givenNames: string, lastName: string, system: string, pageNum?: number, pageSize?: number): Promise<fhirR4.Bundle>;
}
