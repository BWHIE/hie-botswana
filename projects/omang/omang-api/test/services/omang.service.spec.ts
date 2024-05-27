import { Test, TestingModule } from '@nestjs/testing';
import { OmangRepository } from '../../src/repositories/omang-repository';
import { OmangModule } from '../../src/modules/omang.module';
import { OmangService } from '../../src/services/omang.service';
import { MasterPatientIndex } from "../../src/services/mpi";
import { Omang, Pager } from '../../src/models/omang'
import { MasterPatientIndexModule } from '../../src/modules/mpi.module';
import { FhirAPIResponses } from '../../src/models/fhir-responses';
import { fhirR4 } from '@smile-cdr/fhirts';
import { UserModule } from '../../src/modules/user.module';

/** Variables mock FHIR Patients  (expected output)*/ 

// First FHIR Patient 
const patient : fhirR4.Patient = new fhirR4.Patient();
patient.resourceType = 'Patient';
patient.id = '210711926';

const firstIdentifier : fhirR4.Identifier = new fhirR4.Identifier();
firstIdentifier.system = 'http://moh.bw.org/ext/identifier/omang';
firstIdentifier.value = '210711926';

const secondIdentifier : fhirR4.Identifier = new fhirR4.Identifier();
secondIdentifier.system = 'http://omang.bw.org/ext/identifier/internalid';
secondIdentifier.value = '7f6a9adff36252b32ab9e672c551b06f';

patient.identifier = [firstIdentifier, secondIdentifier];
patient.active = true;

const theName : fhirR4.HumanName = new fhirR4.HumanName();
theName.family = 'SURNAME3';
theName.given = ['OLEBILE'];

patient.name = [theName];

patient.gender = 'male';
patient.birthDate = '1992-08-26';

const theAddress : fhirR4.Address = new fhirR4.Address();
theAddress.district = 'CENTRAL-TUTUME';
theAddress.postalCode = '18'

patient.address = [theAddress];

patient.maritalStatus = new fhirR4.CodeableConcept();
patient.maritalStatus.coding = [];
const theCoding = new fhirR4.Coding();
theCoding.system = "http://hl7.org/fhir/R4/valueset-marital-status.html"
theCoding.code = 'S'
patient.maritalStatus.coding = [theCoding];


// Second FHIR Patient
const patientOne : fhirR4.Patient = new fhirR4.Patient();
patientOne.resourceType = 'Patient';
patientOne.id = '210713925';

const firstIdentifierOne : fhirR4.Identifier = new fhirR4.Identifier();
firstIdentifierOne.system = 'http://moh.bw.org/ext/identifier/omang';
firstIdentifierOne.value = '210713925';

const secondIdentifierOne : fhirR4.Identifier = new fhirR4.Identifier();
secondIdentifierOne.system = 'http://omang.bw.org/ext/identifier/internalid';
secondIdentifierOne.value = '966ed5bce68e14de6c08d141afa17b99';

patientOne.identifier = [firstIdentifierOne, secondIdentifierOne];
patientOne.active = true;

const theNameOne : fhirR4.HumanName = new fhirR4.HumanName();
theNameOne.family = 'SURNAME3';
theNameOne.given = ['OLEBILE'];

patientOne.name = [theNameOne];

patientOne.gender = 'male';
patientOne.birthDate = '1992-08-26';

const theAddressOne : fhirR4.Address = new fhirR4.Address();
theAddressOne.district = 'CENTRAL-TUTUME';
theAddressOne.postalCode = '18';

patientOne.address = [theAddressOne];

patientOne.maritalStatus = new fhirR4.CodeableConcept();
patientOne.maritalStatus.coding = [];
const theCodingOne = new fhirR4.Coding();
theCodingOne.system = "http://hl7.org/fhir/R4/valueset-marital-status.html";
theCodingOne.code = 'S';
patientOne.maritalStatus.coding = [theCodingOne];


// Third FHIR Patient
const patientTwo : fhirR4.Patient = new fhirR4.Patient();
patientTwo.resourceType = 'Patient';
patientTwo.id = '255717018';

const firstIdentifierTwo : fhirR4.Identifier = new fhirR4.Identifier();
firstIdentifierTwo.system = 'http://moh.bw.org/ext/identifier/omang';
firstIdentifierTwo.value = '255717018';

const secondIdentifierTwo : fhirR4.Identifier = new fhirR4.Identifier();
secondIdentifierTwo.system = 'http://omang.bw.org/ext/identifier/internalid';
secondIdentifierTwo.value = '09e4ccb2874c950e1953f728789b3b97';

patientTwo.identifier = [firstIdentifierTwo, secondIdentifierTwo];
patientTwo.active = true;

const theNameTwo : fhirR4.HumanName = new fhirR4.HumanName();
theNameTwo.family = 'SURNAME2';
theNameTwo.given = ['IPONENG'];

patientTwo.name = [theNameTwo];

patientTwo.gender = 'male';
patientTwo.birthDate = '1995-01-28';
patientTwo.deceasedDateTime = '2009-06-17';

const theAddressTwo : fhirR4.Address = new fhirR4.Address();
theAddressTwo.district = 'NORTH-EAST';
theAddressTwo.postalCode = '19';

patientTwo.address = [theAddressTwo];

patientTwo.maritalStatus = new fhirR4.CodeableConcept();
patientTwo.maritalStatus.coding = [];
const theCodingTwo = new fhirR4.Coding();
theCodingTwo.system = "http://hl7.org/fhir/R4/valueset-marital-status.html";
theCodingTwo.code = 'S';
patientTwo.maritalStatus.coding = [theCodingTwo];


/** Variables mock Omang Records  (expected output)*/ 

// First Omang Record 
const mockOmangRecord: Omang = new Omang();
mockOmangRecord.IdNo = '210711926';
mockOmangRecord.FirstName = 'OLEBILE';
mockOmangRecord.Surname = 'SURNAME3';
mockOmangRecord.BirthDate = new Date(1992,7,27);
mockOmangRecord.BirthDateUnknown = 'False';
mockOmangRecord.BirthPlace = 'FRANCISTOW';
mockOmangRecord.DistrictName = 'CENTRAL-TUTUME';
mockOmangRecord.PersonStatus = 'LIVE';
mockOmangRecord.PostalAddress = null;
mockOmangRecord.ResidentialAddress = null;
mockOmangRecord.DistrictCode = '18';
mockOmangRecord.Sex = 'M';
mockOmangRecord.SpouseName  = null;
mockOmangRecord.CitizenStatusCode = 'CITZ';
mockOmangRecord.CitizenStatusDate = new Date(2009,5,18);
mockOmangRecord.DeathCertificateNo = null;
mockOmangRecord.DeceasedDate = null;
mockOmangRecord.DeceasedDateUnknown = null;
mockOmangRecord.MaritalStatusCode = 'SGL';
mockOmangRecord.MaritalStatusDescription = 'Single';
mockOmangRecord.ChangeDate = new Date(2009,5,18);
mockOmangRecord.ExpiryDate = new Date(2019,4,27);

// Second Omang Record 
const mockOmangRecordOne: Omang = new Omang();
mockOmangRecordOne.IdNo = '210713925';
mockOmangRecordOne.FirstName = 'OLEBILE';
mockOmangRecordOne.Surname = 'SURNAME3';
mockOmangRecordOne.BirthDate = new Date(1992,7,27);
mockOmangRecordOne.BirthDateUnknown = 'false';
mockOmangRecordOne.BirthPlace = 'FRANCISTOW';
mockOmangRecordOne.DistrictName = 'CENTRAL-TUTUME';
mockOmangRecordOne.PersonStatus = 'LIVE';
mockOmangRecordOne.PostalAddress = null;
mockOmangRecordOne.ResidentialAddress = null;
mockOmangRecordOne.DistrictCode = '18';
mockOmangRecordOne.Sex = 'M';
mockOmangRecordOne.SpouseName  = null;
mockOmangRecordOne.CitizenStatusCode = 'CITZ';
mockOmangRecordOne.CitizenStatusDate = new Date(2009,5,18);
mockOmangRecordOne.DeathCertificateNo = null;
mockOmangRecordOne.DeceasedDate = null;
mockOmangRecordOne.DeceasedDateUnknown = null;
mockOmangRecordOne.MaritalStatusCode = 'SGL';
mockOmangRecordOne.MaritalStatusDescription = 'Single';
mockOmangRecordOne.ChangeDate = new Date(2009,5,18);
mockOmangRecordOne.ExpiryDate = new Date(2019,4,27);

// Third Omang Record
const mockOmangRecordTwo: Omang = new Omang();
mockOmangRecordTwo.IdNo = '255717018';
mockOmangRecordTwo.FirstName = 'IPONENG';
mockOmangRecordTwo.Surname = 'SURNAME2';
mockOmangRecordTwo.BirthDate = new Date(1995,0,29);
mockOmangRecordTwo.BirthDateUnknown = 'false';
mockOmangRecordTwo.BirthPlace = 'FRANCISTOW';
mockOmangRecordTwo.DistrictName = 'NORTH-EAST';
mockOmangRecordTwo.PersonStatus = 'DEAD';
mockOmangRecordTwo.PostalAddress = null;
mockOmangRecordTwo.ResidentialAddress = null;
mockOmangRecordTwo.DistrictCode = '19';
mockOmangRecordTwo.Sex = 'M';
mockOmangRecordTwo.SpouseName  = null;
mockOmangRecordTwo.CitizenStatusCode = 'CITZ';
mockOmangRecordTwo.CitizenStatusDate = new Date(2012,9,5);
mockOmangRecordTwo.DeathCertificateNo = null;
mockOmangRecordTwo.DeceasedDate = new Date(2009,5,18);
mockOmangRecordTwo.DeceasedDateUnknown = null;
mockOmangRecordTwo.MaritalStatusCode = 'SGL';
mockOmangRecordTwo.MaritalStatusDescription = 'Single';
mockOmangRecordTwo.ChangeDate = new Date(2012,9,5);
mockOmangRecordTwo.ExpiryDate = new Date(2022,9,4);

describe('OmangService', () => {
    let omangService: OmangService;
    let mockOmangRepository: OmangRepository;
    let mockMpi : MasterPatientIndex;


    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [UserModule,OmangModule, MasterPatientIndexModule],
      }).compile();
      
      mockOmangRepository  = module.get<OmangRepository>(OmangRepository);
      mockMpi = module.get<MasterPatientIndex>(MasterPatientIndex);
      omangService = new OmangService( mockOmangRepository, mockMpi);

    })
    
    afterEach(() => {
        jest.clearAllMocks();
      });
    
    it('should check Database Connectivity and returns True ', async () => {

    jest.spyOn(mockOmangRepository, 'checkStatus');
    // Arrange 
    const status = true;
    // Act
    const result = await omangService.isOnline();

    // Assert
    expect(status).toEqual(result);
    expect(mockOmangRepository.checkStatus).toHaveBeenCalledWith();
    });


    it('should return Omang records by ID in FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getMany');
  
         // Arrange
         const id  ='210711926';
         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };
  
        const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
        const mockEntry : fhirR4.BundleEntry = new fhirR4.BundleEntry();
  
        mockEntry.fullUrl = 'http://moh.bw.org/ext/identifier/omangPatient210711926'
        mockEntry.resource = patient;
        mockBundle.entry.push(mockEntry);
        mockBundle.total = 1;

        // Act
        const result: fhirR4.Bundle  = await omangService.getOmangByID([id], pager);

        // Assert
        expect(result.entry).toEqual(mockBundle.entry);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
        expect(mockOmangRepository.getMany).toHaveBeenCalledWith([id], pager);
    });



    it('should return empty Omang records by ID in FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getMany');
  
         // Arrange
         const id  ='0000000';
         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        // Act 
        const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
        const result: fhirR4.Bundle  = await omangService.getOmangByID([id], pager); 
        // Assert
        expect(result.entry).toEqual([]);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
        expect(mockOmangRepository.getMany).toHaveBeenCalledWith([id], pager);
      });
      
      it('should return Omang records by ID in Non FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getMany');
  
         // Arrange
         const id  ='210711926';
         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };
         
        const mockOmangRecords : Omang[] = [];
       

        mockOmangRecords.push(mockOmangRecord);

        // Act 
        const result: Omang[] = await omangService.getOmangByIDNonFHIR([id], pager); 

        // Assert
        expect(result).toEqual(mockOmangRecords) 
        expect(mockOmangRepository.getMany).toHaveBeenCalledWith([id], pager);
      }); 

      it('should return empty Omang records by ID in Non FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getMany');
  
         // Arrange
         const id  ='0000000';
         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };
         

        // Act 
        const result: Omang[] = await omangService.getOmangByIDNonFHIR([id], pager); 

        // Assert
        expect(result).toEqual([]) 
        expect(mockOmangRepository.getMany).toHaveBeenCalledWith([id], pager);
      }); 

      it('should return empty Omang records by Changed Date Range in Non FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getChanged');
  
         // Arrange
         const startDate  = new Date(2010,5,18);
         const endDate  = new Date(2010,5,19);

         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };
         

        // Act 
        const result: Omang[] = await omangService.findOmangByChangeDateNonFHIR(startDate, endDate, pager);

        // Assert
        expect(result).toEqual([]) 
        expect(mockOmangRepository.getChanged).toHaveBeenCalledWith(startDate, endDate, pager);
      }); 


      it('should return Omang records by Changed Date Range in Non FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getChanged');
  
         // Arrange
         const startDate  = new Date(2009,5,18);
         const endDate  = new Date(2009,5,19);

         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };


        const mockOmangRecords : Omang[] = [];
        mockOmangRecords.push(mockOmangRecord,mockOmangRecordOne,mockOmangRecordTwo); 

        // Act 
        const result: Omang[] = await omangService.findOmangByChangeDateNonFHIR(startDate, endDate, pager);

        // Assert
        expect(result).toEqual(mockOmangRecords) 
        expect(mockOmangRepository.getChanged).toHaveBeenCalledWith(startDate, endDate, pager);
      }); 


      it('should return empty Omang records by Changed Date Range in FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getChanged');
  
         // Arrange
         const startDate  = new Date(2010,5,18);
         const endDate  = new Date(2010,5,19);

         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;      

        // Act 
        const result: fhirR4.Bundle = await omangService.findOmangByChangeDate(startDate, endDate, pager);

        expect(result.entry).toEqual([]);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
        expect(mockOmangRepository.getChanged).toHaveBeenCalledWith(startDate, endDate, pager);

      }); 


      it('should return Omang records by Changed Date Range in FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getChanged');
  
         // Arrange
         const startDate  = new Date(2009,5,18);
         const endDate  = new Date(2009,5,19);

         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;


        const mockEntry : fhirR4.BundleEntry = new fhirR4.BundleEntry();
  
        mockEntry.fullUrl = 'http://moh.bw.org/ext/identifier/omangPatient210711926'
        mockEntry.resource = patient;

        const mockEntryOne : fhirR4.BundleEntry = new fhirR4.BundleEntry();
  
        mockEntryOne.fullUrl = 'http://moh.bw.org/ext/identifier/omangPatient210713925';
        mockEntryOne.resource = patientOne;


        const mockEntryTwo : fhirR4.BundleEntry = new fhirR4.BundleEntry();
  
        mockEntryTwo.fullUrl = 'http://moh.bw.org/ext/identifier/omangPatient255717018';
        mockEntryTwo.resource = patientTwo;

        mockBundle.entry.push(mockEntry, mockEntryOne, mockEntryTwo)
        mockBundle.total = 3

        // Act 
        const result: fhirR4.Bundle = await omangService.findOmangByChangeDate(startDate, endDate, pager);

        expect(result.entry).toEqual(mockBundle.entry);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
        expect(mockOmangRepository.getChanged).toHaveBeenCalledWith(startDate, endDate, pager);

      }); 


      it('should return empty Omang records by Deceased Date Range in Non FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getDeceased');
  
         // Arrange
         const startDate  = new Date(2010,5,18);
         const endDate  = new Date(2010,5,19);

         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        
        // Act 
        const result: Omang[] = await omangService.findOmangByDeceasedDateNonFHIR(startDate, endDate, pager);

        // Assert
        expect(result).toEqual([]) 
        expect(mockOmangRepository.getDeceased).toHaveBeenCalledWith(startDate, endDate, pager);
      }); 


      it('should return Omang records by Deceased Date Range in Non FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getDeceased');
  
         // Arrange
         const startDate  = new Date(2009,5,18);
         const endDate  = new Date(2009,5,19);

         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        const mockOmangRecords: Omang[] = []
        mockOmangRecords.push(mockOmangRecordTwo);

        // Act 
        const result: Omang[] = await omangService.findOmangByDeceasedDateNonFHIR(startDate, endDate, pager);

        // Assert
        expect(result).toEqual(mockOmangRecords) 
        expect(mockOmangRepository.getDeceased).toHaveBeenCalledWith(startDate, endDate, pager);
      }); 

      it('should return empty Omang records by Deceased Date Range in FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getDeceased');
  
         // Arrange
         const startDate  = new Date(2010,5,18);
         const endDate  = new Date(2010,5,19);

         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };
        
        // Act 
        const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;      

        // Act 
        const result: fhirR4.Bundle = await omangService.findOmangByDeceasedDate(startDate, endDate, pager);

        expect(result.entry).toEqual([]);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
        expect(mockOmangRepository.getDeceased).toHaveBeenCalledWith(startDate, endDate, pager);

      }); 


      it('should return Omang records by Deceased Date Range in  FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getDeceased');
  
         // Arrange
         const startDate  = new Date(2009,5,18);
         const endDate  = new Date(2009,5,19);

         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

         const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
         const mockEntry : fhirR4.BundleEntry = new fhirR4.BundleEntry();
  
         mockEntry.fullUrl = 'http://moh.bw.org/ext/identifier/omangPatient255717018';
         mockEntry.resource = patientTwo;
 
         mockBundle.entry.push(mockEntry)
         mockBundle.total = 1

        // Act 
        const result: fhirR4.Bundle = await omangService.findOmangByDeceasedDate(startDate, endDate, pager);

        // Assert
        expect(result.entry).toEqual(mockBundle.entry);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
        expect(mockOmangRepository.getDeceased).toHaveBeenCalledWith(startDate, endDate, pager);
      }); 


      it('should empty return Omang records by Last Name in Non FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getByLastName');
  
         // Arrange
         const lastName  = 'Doe';

         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        // Act 
        const result: Omang[] = await omangService.findOmangByLastNameNonFHIR(lastName, pager);

        // Assert
        expect(result).toEqual([]);
        expect(mockOmangRepository.getByLastName).toHaveBeenCalledWith(lastName, pager);
      }); 

  
      it('should return Omang records by Last Name in Non FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getByLastName');
  
         // Arrange
         const lastName  = 'SURNAME2';

         const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        const mockOmangRecords: Omang[] = []
        mockOmangRecords.push(mockOmangRecordTwo);

        // Act 
        const result: Omang[] = await omangService.findOmangByLastNameNonFHIR(lastName, pager);

        // Assert
        expect(result).toEqual(mockOmangRecords);
        expect(mockOmangRepository.getByLastName).toHaveBeenCalledWith(lastName, pager);
      }); 


      it('should empty return Omang records by Last Name in FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getByLastName');
  
         // Arrange
        const lastName  = 'Doe';

        const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized; 

        // Act 
        const result: fhirR4.Bundle = await omangService.findOmangByLastName(lastName, pager);

        // Assert
        expect(result.entry).toEqual([]);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
        expect(mockOmangRepository.getByLastName).toHaveBeenCalledWith(lastName, pager);
      }); 


      it('should return Omang records by Last Name in FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getByLastName');
  
         // Arrange
        const lastName  = 'SURNAME2';

        const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized; 
        const mockEntry : fhirR4.BundleEntry = new fhirR4.BundleEntry();
  
        mockEntry.fullUrl = 'http://moh.bw.org/ext/identifier/omangPatient255717018'
        mockEntry.resource = patientTwo;
        mockBundle.entry.push(mockEntry);
        mockBundle.total = 1;

        // Act 
        const result: fhirR4.Bundle = await omangService.findOmangByLastName(lastName, pager);


        // Assert
        expect(result.entry).toEqual(mockBundle.entry);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
        expect(mockOmangRepository.getByLastName).toHaveBeenCalledWith(lastName, pager);
      }); 

      it('should return Empty Omang records by Full Name in Non FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getByName');
  
         // Arrange
        const firstName = 'John';
        const lastName  = 'Doe';

        const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        // Act 
        const result: Omang[] = await omangService.findOmangByFullNameNonFHIR(firstName, lastName, pager);

        // Assert
        expect(result).toEqual([]);
        expect(mockOmangRepository.getByName).toHaveBeenCalledWith(firstName, lastName, pager);
      }); 

      it('should return Empty Omang records by Full Name in Non FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getByName');
  
         // Arrange
        const firstName = 'IPONENG';
        const lastName  = 'SURNAME2';

        const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        const mockOmangRecords: Omang[] = [];
        mockOmangRecords.push(mockOmangRecordTwo);

        // Act 
        const result: Omang[] = await omangService.findOmangByFullNameNonFHIR(firstName, lastName, pager);
    

        // Assert
        expect(result).toEqual(mockOmangRecords);
        expect(mockOmangRepository.getByName).toHaveBeenCalledWith(firstName, lastName, pager);
      }); 

      it('should return Empty Omang records by Full Name in FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getByName');
  
         // Arrange
        const firstName = 'John';
        const lastName  = 'Doe';

        const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized; 

        // Act 
        const result: fhirR4.Bundle = await omangService.findOmangByFullName(firstName, lastName, pager);


        // Assert
        expect(result.entry).toEqual([]);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
        expect(mockOmangRepository.getByName).toHaveBeenCalledWith(firstName, lastName, pager);
      }); 

      it('should return Omang records by Full Name in FHIR format ', async () => {

        jest.spyOn(mockOmangRepository, 'getByName');
  
         // Arrange
        const firstName = 'IPONENG';
        const lastName  = 'SURNAME2';

        const pager: Pager = {
             pageNum: 1,
             pageSize: 100
         };

        const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized; 
        const mockEntry : fhirR4.BundleEntry = new fhirR4.BundleEntry();
  
        mockEntry.fullUrl = 'http://moh.bw.org/ext/identifier/omangPatient255717018'
        mockEntry.resource = patientTwo;
        mockBundle.entry.push(mockEntry);
        mockBundle.total = 1;

        // Act 
        const result: fhirR4.Bundle = await omangService.findOmangByFullName(firstName, lastName, pager);


        // Assert
        expect(result.entry).toEqual(mockBundle.entry);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
        expect(mockOmangRepository.getByName).toHaveBeenCalledWith(firstName, lastName, pager);
      }); 
    
});
