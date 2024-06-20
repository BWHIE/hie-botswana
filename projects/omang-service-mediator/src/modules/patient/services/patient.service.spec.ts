import { Test, TestingModule } from '@nestjs/testing';
import { BDRSService } from '../../bdrs/services/bdrs.service';
import { ImmigrationService } from '../../immigration/services/immigration.service';
import { PatientService } from './patient.service';
import { OmangService } from '../../omang/services/omang.service';
import { MasterPatientIndex } from '../../mpi/services/mpi';
import { BirthModule } from '../../bdrs/birth/birth.module';
import { DeathModule } from '../../bdrs/death/death.module';
import { ImmigrationModule } from '../../immigration/immigration.module';
import { OmangModule } from '../../omang/omang.module';
import { MasterPatientIndexModule } from '../../mpi/mpi.module';
import { UserModule } from '../../user/user.module';
import { fhirR4 } from '@smile-cdr/fhirts';
import { FhirAPIResponses } from 'src/utils/fhir-responses';
import { Pager } from 'src/utils/pager';

/** Variables mock FHIR Patients  (expected output)*/

// First mock FHIR Patient (ppn system (immigration))

const patientPpn: fhirR4.Patient = new fhirR4.Patient();
patientPpn.resourceType = 'Patient';
patientPpn.id = '987654321';

const firstIdentifierPpn: fhirR4.Identifier = new fhirR4.Identifier();
firstIdentifierPpn.system = 'http://moh.bw.org/ext/identifier/ppn';
firstIdentifierPpn.value = '987654321';

const secondIdentifierPpn: fhirR4.Identifier = new fhirR4.Identifier();
secondIdentifierPpn.system = 'http://omang.bw.org/ext/identifier/internalid';
secondIdentifierPpn.value = '6ebe76c9fb411be97b3b0d48b791a7c9';

patientPpn.identifier = [firstIdentifierPpn, secondIdentifierPpn];
patientPpn.active = true;

const theNamePpn: fhirR4.HumanName = new fhirR4.HumanName();
theNamePpn.family = 'LEE';
theNamePpn.given = ['JAE', 'SUNG'];

patientPpn.name = [theNamePpn];

patientPpn.gender = 'male';
patientPpn.birthDate = '1983-07-17';

const theAddressPpn: fhirR4.Address = new fhirR4.Address();
theAddressPpn.country = 'SOUTH KOREA';
theAddressPpn.postalCode = 'KR';

patientPpn.address = [theAddressPpn];

// Second Mock FHIR Patient (Omang System)

const patientOmang: fhirR4.Patient = new fhirR4.Patient();
patientOmang.resourceType = 'Patient';
patientOmang.id = '255717018';

const firstIdentifierOmang: fhirR4.Identifier = new fhirR4.Identifier();
firstIdentifierOmang.system = 'http://moh.bw.org/ext/identifier/omang';
firstIdentifierOmang.value = '255717018';

const secondIdentifierOmang: fhirR4.Identifier = new fhirR4.Identifier();
secondIdentifierOmang.system = 'http://omang.bw.org/ext/identifier/internalid';
secondIdentifierOmang.value = '09e4ccb2874c950e1953f728789b3b97';

patientOmang.identifier = [firstIdentifierOmang, secondIdentifierOmang];
patientOmang.active = true;

const theNameOmang: fhirR4.HumanName = new fhirR4.HumanName();
theNameOmang.family = 'SURNAME2';
theNameOmang.given = ['IPONENG'];

patientOmang.name = [theNameOmang];

patientOmang.gender = 'male';
patientOmang.birthDate = '1995-01-28';
patientOmang.deceasedDateTime = '2009-06-17';

const theAddressOmang: fhirR4.Address = new fhirR4.Address();
theAddressOmang.district = 'NORTH-EAST';
theAddressOmang.postalCode = '19';

patientOmang.address = [theAddressOmang];

patientOmang.maritalStatus = new fhirR4.CodeableConcept();
patientOmang.maritalStatus.coding = [];
const theCodingOmang = new fhirR4.Coding();
theCodingOmang.system = 'http://hl7.org/fhir/R4/valueset-marital-status.html';
theCodingOmang.code = 'S';
patientOmang.maritalStatus.coding = [theCodingOmang];

// Mock FHIR Patient (BDRS System)
const patientBdrs: fhirR4.Patient = new fhirR4.Patient();
patientBdrs.resourceType = 'Patient';
patientBdrs.id = '23423423422';

const firstIdentifierBdrs: fhirR4.Identifier = new fhirR4.Identifier();
firstIdentifierBdrs.system = 'http://moh.bw.org/ext/identifier/bcn';
firstIdentifierBdrs.value = '23423423422';

const secondIdentifierBdrs: fhirR4.Identifier = new fhirR4.Identifier();
secondIdentifierBdrs.system = 'http://omang.bw.org/ext/identifier/internalid';
secondIdentifierBdrs.value = '79fcaeba25f20990b19341c3f3f8369f';

patientBdrs.identifier = [firstIdentifierBdrs, secondIdentifierBdrs];
patientBdrs.active = true;

const theNameBdrs: fhirR4.HumanName = new fhirR4.HumanName();
theNameBdrs.family = 'SURNAME3';
theNameBdrs.given = ['OLEBILE'];

patientBdrs.name = [theNameBdrs];

patientBdrs.gender = 'male';
patientBdrs.birthDate = '1992-08-26';
patientBdrs.deceasedDateTime = '2019-05-26';

const theAddressBdrs: fhirR4.Address = new fhirR4.Address();
theAddressBdrs.district = 'CENTRAL-TUTUME';
theAddressBdrs.postalCode = '18';
theAddressBdrs.city = 'FRANCISTOW';

patientBdrs.address = [theAddressBdrs];

// Second Mock FHIR Patient (BDRS system)
const patientBdrsOne: fhirR4.Patient = new fhirR4.Patient();
patientBdrsOne.resourceType = 'Patient';
patientBdrsOne.id = '23423423422';

patientBdrsOne.identifier = [firstIdentifierBdrs, secondIdentifierBdrs];
patientBdrsOne.active = true;

patientBdrsOne.name = [theNameBdrs];

patientBdrsOne.gender = 'male';

const theAddressBdrsOne: fhirR4.Address = new fhirR4.Address();
theAddressBdrsOne.district = 'CENTRAL-TUTUME';
theAddressBdrsOne.city = 'FRANCISTOW';

patientBdrsOne.address = [theAddressBdrsOne];

describe('PatientService', () => {
  let patientService: PatientService;
  let mockBdrsService: BDRSService;
  let mockImmigrationService: ImmigrationService;
  let mockOmangService: OmangService;
  let mockMpi: MasterPatientIndex;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        UserModule,
        BirthModule,
        DeathModule,
        OmangModule,
        ImmigrationModule,
        MasterPatientIndexModule,
      ],
      providers: [BDRSService, ImmigrationService, OmangService],
    }).compile();

    mockBdrsService = module.get<BDRSService>(BDRSService);
    mockImmigrationService = module.get<ImmigrationService>(ImmigrationService);
    mockMpi = module.get<MasterPatientIndex>(MasterPatientIndex);
    mockOmangService = module.get<OmangService>(OmangService);
    patientService = new PatientService(
      mockMpi,
      mockOmangService,
      mockBdrsService,
      mockImmigrationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should check Database Connectivity and returns True ', async () => {
    jest.spyOn(mockImmigrationService, 'isOnline');

    const status = true;
    // Act
    const result = await patientService.isOnline();

    // Assert
    expect(status).toEqual(result);
    expect(mockImmigrationService.isOnline).toHaveBeenCalledWith();
  });

  it('should return FHIR Bundle by Searching Identifier and System for Immigration System', async () => {
    jest.spyOn(mockImmigrationService, 'getPatientByPassportNumber');

    const id = '987654321';
    const system = 'http://moh.bw.org/ext/identifier/ppn';

    const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
    const mockEntry: fhirR4.BundleEntry = new fhirR4.BundleEntry();
    mockEntry.resource = patientPpn;
    mockEntry.fullUrl = 'http://moh.bw.org/ext/identifier/ppnPatient987654321';
    mockBundle.entry.push(mockEntry);
    mockBundle.total = 1;

    // Act
    const result = await patientService.getPatientByID(id, system, 1, 1);

    // Assert
    expect(result.entry).toEqual(mockBundle.entry);
    expect(result.resourceType).toEqual(mockBundle.resourceType);
    expect(result.type).toEqual(mockBundle.type);
    expect(result.total).toEqual(mockBundle.total);
    expect(
      mockImmigrationService.getPatientByPassportNumber,
    ).toHaveBeenCalledWith(id, new Pager(1, 1));
  });

  it('should return FHIR Bundle by Searching Identifier and System for Omang System ', async () => {
    jest.spyOn(mockOmangService, 'getOmangByID');

    const id = '255717018';
    const system = 'http://moh.bw.org/ext/identifier/omang';

    const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
    const mockEntry: fhirR4.BundleEntry = new fhirR4.BundleEntry();
    mockEntry.resource = patientOmang;
    mockEntry.fullUrl =
      'http://moh.bw.org/ext/identifier/omangPatient255717018';
    mockBundle.entry.push(mockEntry);
    mockBundle.total = 1;

    // Act
    const result = await patientService.getPatientByID(id, system, 1, 1);

    // Assert
    expect(result.entry).toEqual(mockBundle.entry);
    expect(result.resourceType).toEqual(mockBundle.resourceType);
    expect(result.type).toEqual(mockBundle.type);
    expect(result.total).toEqual(mockBundle.total);
    expect(mockOmangService.getOmangByID).toHaveBeenCalledWith(
      [id],
      new Pager(1, 1),
    );
  });

  it('should return FHIR Bundle by Searching Identifier and System for BDRS system ', async () => {
    jest.spyOn(mockBdrsService, 'getBirthByID');

    // Arrange
    const id = '23423423422';
    const system = 'http://moh.bw.org/ext/identifier/bcn';

    const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
    const mockEntry: fhirR4.BundleEntry = new fhirR4.BundleEntry();
    mockEntry.resource = patientBdrs;
    mockEntry.fullUrl =
      'http://moh.bw.org/ext/identifier/bcnPatient23423423422';
    mockBundle.entry.push(mockEntry);
    mockBundle.total = 1;

    // Act
    const result = await patientService.getPatientByID(id, system, 1, 1);

    // Assert
    expect(result.entry).toEqual(mockBundle.entry);
    expect(result.resourceType).toEqual(mockBundle.resourceType);
    expect(result.type).toEqual(mockBundle.type);
    expect(result.total).toEqual(mockBundle.total);
    expect(mockBdrsService.getBirthByID).toHaveBeenCalledWith(
      [id],
      new Pager(1, 1),
    );
  });

  it('should return an error by Searching Identifier and System for unexisting system ', async () => {
    // Arrange
    const id = '23423423422';
    const system = 'http://moh.bw.org/ext/identifier/NationalSystem';

    // Act
    let result;
    try {
      result = await patientService.getPatientByID(id, system, 1, 1);
    } catch (error) {
      result = error;
    }

    // Assert
    expect(result).toEqual(new Error('System Not Supported'));
  });

  it('should return FHIR Bundle by Full Name for Immigration System', async () => {
    jest.spyOn(mockImmigrationService, 'getByFullName');

    const firstName = 'JAE SUNG';
    const lastName = 'LEE';
    const system = 'http://moh.bw.org/ext/identifier/ppn';
    const pager: Pager = {
      pageNum: 1,
      pageSize: 100,
    };

    const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
    const mockEntry: fhirR4.BundleEntry = new fhirR4.BundleEntry();
    mockEntry.resource = patientPpn;
    mockEntry.fullUrl = 'http://moh.bw.org/ext/identifier/ppnPatient987654321';
    mockBundle.entry.push(mockEntry);
    mockBundle.total = 1;

    // Act
    const result = await patientService.getPatientByFullName(
      firstName,
      lastName,
      system,
      pager,
    );

    // Assert
    expect(result.entry).toEqual(mockBundle.entry);
    expect(result.resourceType).toEqual(mockBundle.resourceType);
    expect(result.type).toEqual(mockBundle.type);
    expect(result.total).toEqual(mockBundle.total);
    expect(mockImmigrationService.getByFullName).toHaveBeenCalledWith(
      firstName,
      lastName,
      pager,
    );
  });

  it('should return FHIR Bundle by Full Name for Omang System', async () => {
    jest.spyOn(mockOmangService, 'findOmangByFullName');

    const firstName = 'IPONENG';
    const lastName = 'SURNAME2';
    const system = 'http://moh.bw.org/ext/identifier/omang';
    const pager: Pager = {
      pageNum: 1,
      pageSize: 100,
    };

    const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
    const mockEntry: fhirR4.BundleEntry = new fhirR4.BundleEntry();
    mockEntry.resource = patientOmang;
    mockEntry.fullUrl =
      'http://moh.bw.org/ext/identifier/omangPatient255717018';
    mockBundle.entry.push(mockEntry);
    mockBundle.total = 1;

    // Act
    const result = await patientService.getPatientByFullName(
      firstName,
      lastName,
      system,
      pager,
    );

    // Assert
    expect(result.entry).toEqual(mockBundle.entry);
    expect(result.resourceType).toEqual(mockBundle.resourceType);
    expect(result.type).toEqual(mockBundle.type);
    expect(result.total).toEqual(mockBundle.total);
    expect(mockOmangService.findOmangByFullName).toHaveBeenCalledWith(
      firstName,
      lastName,
      pager,
    );
  });

  it('should return FHIR Bundle by Full Name for BDRS System', async () => {
    jest.spyOn(mockBdrsService, 'findBirthByFullNameFHIR');

    const firstName = 'OLEBILE';
    const lastName = 'SURNAME3';
    const system = 'http://moh.bw.org/ext/identifier/bcn';
    const pager: Pager = {
      pageNum: 1,
      pageSize: 100,
    };

    const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
    const mockEntry: fhirR4.BundleEntry = new fhirR4.BundleEntry();
    mockEntry.resource = patientBdrsOne;
    mockEntry.fullUrl =
      'http://moh.bw.org/ext/identifier/bcnPatient23423423422';
    mockBundle.entry.push(mockEntry);
    mockBundle.total = 1;

    // Act
    const result = await patientService.getPatientByFullName(
      firstName,
      lastName,
      system,
      pager,
    );

    // Assert
    expect(result.entry).toEqual(mockBundle.entry);
    expect(result.resourceType).toEqual(mockBundle.resourceType);
    expect(result.type).toEqual(mockBundle.type);
    expect(result.total).toEqual(mockBundle.total);
    expect(mockBdrsService.findBirthByFullNameFHIR).toHaveBeenCalledWith(
      firstName,
      lastName,
      pager,
    );
  });

  it('should return an error by Full Name for unexisting system ', async () => {
    // Arrange
    const firstName = 'Harry';
    const lastName = 'Callahan';
    const system = 'http://moh.bw.org/ext/identifier/NationalSystem';
    const pager: Pager = {
      pageNum: 1,
      pageSize: 100,
    };

    // Act
    let result;
    try {
      result = await patientService.getPatientByFullName(
        firstName,
        lastName,
        system,
        pager,
      );
    } catch (error) {
      result = error;
    }

    // Assert
    expect(result).toEqual(new Error('System Not Supported'));
  });
});
