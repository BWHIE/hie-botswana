import { Test, TestingModule } from "@nestjs/testing";
import { ImmigrationRecord } from "../models/immigration-record";
import { ImmigrationRepository } from "../../immigration/repositories/immigration-repository";
import { ImmigrationModule } from "../immigration.module";
import { MasterPatientIndexModule } from "../../mpi/mpi.module";
import { UserModule } from "../../user/user.module";
import { ImmigrationService } from "../../immigration/services/immigration.service";
import { MasterPatientIndex } from "../../mpi/services/mpi";
import { fhirR4 } from "@smile-cdr/fhirts";
import { FhirAPIResponses } from "../../../utils/fhir-responses";
import { Pager } from "../../../utils//pager";


/** Variables mock FHIR Patients  (expected output)*/ 

// First FHIR Patient 
const patient : fhirR4.Patient = new fhirR4.Patient();
patient.resourceType = 'Patient';
patient.id = '987654321';

const firstIdentifier : fhirR4.Identifier = new fhirR4.Identifier();
firstIdentifier.system = 'http://moh.bw.org/ext/identifier/ppn';
firstIdentifier.value = '987654321';

const secondIdentifier : fhirR4.Identifier = new fhirR4.Identifier();
secondIdentifier.system = 'http://omang.bw.org/ext/identifier/internalid';
secondIdentifier.value = '6ebe76c9fb411be97b3b0d48b791a7c9';

patient.identifier = [firstIdentifier, secondIdentifier];
patient.active = true;

const theName : fhirR4.HumanName = new fhirR4.HumanName();
theName.family = 'LEE';
theName.given = ['JAE', 'SUNG'];

patient.name = [theName];

patient.gender = 'male';
patient.birthDate = '1983-07-17';

const theAddress : fhirR4.Address = new fhirR4.Address();
theAddress.country = 'SOUTH KOREA';
theAddress.postalCode = 'KR'

patient.address = [theAddress];

const mockImmigrationRecord: ImmigrationRecord = new ImmigrationRecord();
mockImmigrationRecord.PASSPORT_NO = '650051651';
mockImmigrationRecord.BIRTH_COUNTRY_CODE = 'UG';
mockImmigrationRecord.BIRTH_COUNTRY_NAME = 'UGANDA';
mockImmigrationRecord.BIRTH_DATE = new Date(2005,5,18);
mockImmigrationRecord.CITIZENSHIP = 'UGANDAN';
mockImmigrationRecord.CITIZENSHIP_NAME = 'UGANDA';
mockImmigrationRecord.DATE_OF_ENTRY = new Date(2024,0,11);
mockImmigrationRecord.ENTRY_PLACE_CODE = 'SSKIA';
mockImmigrationRecord.ENTRY_PLACE_NAME = 'Sir Seretse Khama International Airport in Gaborone';
mockImmigrationRecord.FIRST_NAME = 'MAU';
mockImmigrationRecord.MIDDLE_NAME = 'KEN';
mockImmigrationRecord.SURNAME = 'DAVE';
mockImmigrationRecord.GENDER = 'Male';
mockImmigrationRecord.MARITAL_STATUS_CODE = 'SGL';
mockImmigrationRecord.MARITAL_STATUS_NAME = 'Single';
mockImmigrationRecord.PASSP_EXPIRY_DATE = new Date(2030,5,18);
mockImmigrationRecord.PASSP_ISSUE_DATE = new Date(2020,5,18);
mockImmigrationRecord.SPOUSE_FIRST_NAME = 'MARIA';
mockImmigrationRecord.SPOUSE_SURNAME = 'ANTOINETTE';

const mockImmigrationRecordOne: ImmigrationRecord = new ImmigrationRecord();
mockImmigrationRecordOne.PASSPORT_NO = '123456789';
mockImmigrationRecordOne.BIRTH_COUNTRY_CODE = 'CN';
mockImmigrationRecordOne.BIRTH_COUNTRY_NAME = 'CHINA';
mockImmigrationRecordOne.BIRTH_DATE = new Date(1990,6,20);
mockImmigrationRecordOne.CITIZENSHIP = 'CHINESE';
mockImmigrationRecordOne.CITIZENSHIP_NAME = 'CHINA';
mockImmigrationRecordOne.DATE_OF_ENTRY = new Date(2024,0,15);
mockImmigrationRecordOne.ENTRY_PLACE_CODE = 'PEK';
mockImmigrationRecordOne.ENTRY_PLACE_NAME = 'Beijing Capital International Airport';
mockImmigrationRecordOne.FIRST_NAME = 'LI';
mockImmigrationRecordOne.MIDDLE_NAME = 'XIU';
mockImmigrationRecordOne.SURNAME = 'WANG';
mockImmigrationRecordOne.GENDER = 'Female';
mockImmigrationRecordOne.MARITAL_STATUS_CODE = 'SGL';
mockImmigrationRecordOne.MARITAL_STATUS_NAME = 'Single';
mockImmigrationRecordOne.PASSP_EXPIRY_DATE = new Date(2025,7,10);
mockImmigrationRecordOne.PASSP_ISSUE_DATE = new Date(2015,7,10);
mockImmigrationRecordOne.SPOUSE_FIRST_NAME = 'ZHANG';
mockImmigrationRecordOne.SPOUSE_SURNAME = 'WEI';

const mockImmigrationRecordTwo: ImmigrationRecord = new ImmigrationRecord();
mockImmigrationRecordTwo.PASSPORT_NO = '777888999';
mockImmigrationRecordTwo.BIRTH_COUNTRY_CODE = 'VN';
mockImmigrationRecordTwo.BIRTH_COUNTRY_NAME = 'VIETNAM';
mockImmigrationRecordTwo.BIRTH_DATE = new Date(1995,3,10);
mockImmigrationRecordTwo.CITIZENSHIP = 'VIETNAMESE';
mockImmigrationRecordTwo.CITIZENSHIP_NAME = 'VIETNAM';
mockImmigrationRecordTwo.DATE_OF_ENTRY = new Date(2024,0,15);
mockImmigrationRecordTwo.ENTRY_PLACE_CODE = 'SGN';
mockImmigrationRecordTwo.ENTRY_PLACE_NAME = 'Tan Son Nhat International Airport';
mockImmigrationRecordTwo.FIRST_NAME = 'LINH';
mockImmigrationRecordTwo.MIDDLE_NAME = 'THI';
mockImmigrationRecordTwo.SURNAME = 'NGUYEN';
mockImmigrationRecordTwo.GENDER = 'Female';
mockImmigrationRecordTwo.MARITAL_STATUS_CODE = 'SGL';
mockImmigrationRecordTwo.MARITAL_STATUS_NAME = 'Single';
mockImmigrationRecordTwo.PASSP_EXPIRY_DATE = new Date(2029,7,30);
mockImmigrationRecordTwo.PASSP_ISSUE_DATE = new Date(2019,7,30);
mockImmigrationRecordTwo.SPOUSE_FIRST_NAME = 'QUANG';
mockImmigrationRecordTwo.SPOUSE_SURNAME = 'TRAN';


describe('ImmigrationService', () => {
    let immigrationService: ImmigrationService;
    let mockImmigrationRepository: ImmigrationRepository;
    let mockMpi : MasterPatientIndex;


    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [UserModule,ImmigrationModule, MasterPatientIndexModule],
      }).compile();
      
      mockImmigrationRepository  = module.get<ImmigrationRepository>(ImmigrationRepository);
      mockMpi = module.get<MasterPatientIndex>(MasterPatientIndex);
      immigrationService = new ImmigrationService( mockImmigrationRepository, mockMpi);

    })

    
    afterEach(() => {
        jest.clearAllMocks();
      });
    
    it('should check Database Connectivity and returns True ', async () => {

    jest.spyOn(mockImmigrationRepository, 'checkStatus');
    // Arrange 
    const status = true;
    // Act
    const result = await immigrationService.isOnline();

    // Assert
    expect(status).toEqual(result);
    expect(mockImmigrationRepository.checkStatus).toHaveBeenCalledWith();
    });

    
    it('should return empty Immigration records By ID ', async () => {

    jest.spyOn(mockImmigrationRepository, 'getMany');
    // Arrange 
    const id  ='0000000';
    const pager: Pager = {
        pageNum: 1,
        pageSize: 100
    };

    // Act
    const result: ImmigrationRecord[] = await immigrationService.getByPassportNo([id], pager);

    // Assert
    expect(result).toEqual([]);
    expect(mockImmigrationRepository.getMany).toHaveBeenCalledWith([id], pager);
    });


    it('should return Immigration records By ID ', async () => {

        jest.spyOn(mockImmigrationRepository, 'getMany');
        // Arrange 
        const id  ='650051651';
        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };

        const mockImmigrationRecords: ImmigrationRecord[] = [];
        mockImmigrationRecords.push(mockImmigrationRecord);
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.getByPassportNo([id], pager);
    
        // Assert
        expect(result).toEqual(mockImmigrationRecords);
        expect(mockImmigrationRepository.getMany).toHaveBeenCalledWith([id], pager);
        });


    it('should return empty Immigration records By ID ', async () => {

        jest.spyOn(mockImmigrationRepository, 'getMany');
        // Arrange 
        const id  ='0000000';
        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.getByPassportNo([id], pager);
    
        // Assert
        expect(result).toEqual([]);
        expect(mockImmigrationRepository.getMany).toHaveBeenCalledWith([id], pager);
        });
    
    it('should return empty Immigration records By Birth Date Range ', async () => {

        jest.spyOn(mockImmigrationRepository, 'findByBirthDate');
        // Arrange 
        const startDate = new Date(1999,0,20);
        const endDate = new Date(1999,0,21);

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.findByBirthDate(startDate, endDate, pager);
    
        // Assert
        expect(result).toEqual([]);
        expect(mockImmigrationRepository.findByBirthDate).toHaveBeenCalledWith(startDate, endDate, pager);
        });

    it('should return Immigration records By Birth Date Range ', async () => {

        jest.spyOn(mockImmigrationRepository, 'findByBirthDate');
        // Arrange 
        const startDate = new Date(2005,5,18);
        const endDate = new Date(2005,5,19);

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };

        const mockImmigrationRecords: ImmigrationRecord[] = [];
        mockImmigrationRecords.push(mockImmigrationRecord);
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.findByBirthDate(startDate, endDate, pager);
    
        // Assert
        expect(result).toEqual(mockImmigrationRecords);
        expect(mockImmigrationRepository.findByBirthDate).toHaveBeenCalledWith(startDate, endDate, pager);
        });



    it('should return Empty Immigration records By Entry Date Range ', async () => {

        jest.spyOn(mockImmigrationRepository, 'findByEntryDate');
        // Arrange 
        const startDate = new Date(2025,0,10)
        const endDate = new Date(2025,0,11)

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };

        // Act
        const result: ImmigrationRecord[] = await immigrationService.findByEntryDate(startDate, endDate, pager);
    
        // Assert
        expect(result).toEqual([]);
        expect(mockImmigrationRepository.findByEntryDate).toHaveBeenCalledWith(startDate, endDate, pager);
        });

    it('should return Immigration records By Entry Date Range ', async () => {

        jest.spyOn(mockImmigrationRepository, 'findByEntryDate');
        // Arrange 
        const startDate = new Date(2024,0,10);
        const endDate = new Date(2024,0,11);

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };

        const mockImmigrationRecords: ImmigrationRecord[] = [];
        mockImmigrationRecords.push(mockImmigrationRecord);
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.findByEntryDate(startDate, endDate, pager);
    
        // Assert
        expect(result).toEqual(mockImmigrationRecords);
        expect(mockImmigrationRepository.findByEntryDate).toHaveBeenCalledWith(startDate, endDate, pager);
        });


    it('should return Empty Immigration records By Passport Expiry Date Range ', async () => {

        jest.spyOn(mockImmigrationRepository, 'findByPassportExpiryDate');

        // Arrange 
        const startDate = new Date(2080,5,18);
        const endDate = new Date(2080,5,20);

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.findByPassportExpiryDate(startDate, endDate, pager);
    
        // Assert
        expect(result).toEqual([]);
        expect(mockImmigrationRepository.findByPassportExpiryDate).toHaveBeenCalledWith(startDate, endDate, pager);
        });
        
    it('should return Immigration records By Passport Expiry Date Range ', async () => {

        jest.spyOn(mockImmigrationRepository, 'findByPassportExpiryDate');

        // Arrange 
        const startDate = new Date(2030,5,18);
        const endDate = new Date(2030,5,20);

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };

        const mockImmigrationRecords: ImmigrationRecord[] = [];
        mockImmigrationRecords.push(mockImmigrationRecord)
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.findByPassportExpiryDate(startDate, endDate, pager);
    
        // Assert
        expect(result).toEqual(mockImmigrationRecords);
        expect(mockImmigrationRepository.findByPassportExpiryDate).toHaveBeenCalledWith(startDate, endDate, pager);
        });



    it('should return empty Immigration records By Country', async () => {

        jest.spyOn(mockImmigrationRepository, 'findByCountry');

        // Arrange 
        const country = 'UNITED STATES OF AMERICA';

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.findByCountry(country, pager);
    
        // Assert
        expect(result).toEqual([]);
        expect(mockImmigrationRepository.findByCountry).toHaveBeenCalledWith(country, pager);
        });


    it('should return Immigration records By Country', async () => {

        jest.spyOn(mockImmigrationRepository, 'findByCountry');

        // Arrange 
        const country = 'UGANDA';

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };

        const mockImmigrationRecords: ImmigrationRecord[] = [];
        mockImmigrationRecords.push(mockImmigrationRecord);
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.findByCountry(country, pager);
    
        // Assert
        expect(result).toEqual(mockImmigrationRecords);
        expect(mockImmigrationRepository.findByCountry).toHaveBeenCalledWith(country, pager);
        });
    

    it('should return empty Immigration records By Sex', async () => {

        jest.spyOn(mockImmigrationRepository, 'findBySex');

        // Arrange 
        const gender = 'Other';

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.findBySex(gender, pager);
    
        // Assert
        expect(result).toEqual([]);
        expect(mockImmigrationRepository.findBySex).toHaveBeenCalledWith(gender, pager);
        });

    it('should return Immigration records By Sex', async () => {

        jest.spyOn(mockImmigrationRepository, 'findBySex');

        // Arrange 
        const gender = 'Female';

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.findBySex(gender, pager);
        const mockImmigrationRecords: ImmigrationRecord[] = [];
        mockImmigrationRecords.push(mockImmigrationRecordOne);
        mockImmigrationRecords.push(mockImmigrationRecordTwo);
    
        // Assert
        expect(result).toEqual(mockImmigrationRecords);
        expect(mockImmigrationRepository.findBySex).toHaveBeenCalledWith(gender, pager);
        });

    it('should return empty Immigration records By Last Name', async () => {

        jest.spyOn(mockImmigrationRepository, 'getByLastName');

        // Arrange 
        const lastName = 'Doe';

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.getByLastName(lastName, pager);

    
        // Assert
        expect(result).toEqual([]);
        expect(mockImmigrationRepository.getByLastName).toHaveBeenCalledWith(lastName, pager);
        });
    
    it('should return Immigration records By Last Name', async () => {

        jest.spyOn(mockImmigrationRepository, 'getByLastName');

        // Arrange 
        const lastName = 'DAVE';

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };

        const mockImmigrationRecords : ImmigrationRecord[] = [];
    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.getByLastName(lastName, pager);
        mockImmigrationRecords.push(mockImmigrationRecord);
    
        // Assert
        expect(result).toEqual(mockImmigrationRecords);
        expect(mockImmigrationRepository.getByLastName).toHaveBeenCalledWith(lastName, pager);
        });

    it('should return empty Immigration records By Full Name', async () => {

        jest.spyOn(mockImmigrationRepository, 'getByName');

        // Arrange 
        const firstName = 'John';
        const lastName = 'Doe';

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };

    
        // Act
        const result: ImmigrationRecord[] = await immigrationService.getByFullNameNonFHIR(firstName,lastName, pager);
    
        // Assert
        expect(result).toEqual([]);
        expect(mockImmigrationRepository.getByName).toHaveBeenCalledWith(firstName, lastName, pager);
        });
    
    it('should return Immigration records By Full Name', async () => {

        jest.spyOn(mockImmigrationRepository, 'getByNameWithMiddleName');

        // Arrange 
        const firstName = 'MAU KEN';
        const lastName = 'DAVE';
        const theFirstName = 'MAU'
        const theMiddleName = 'KEN'

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };

        const mockImmigrationRecords : ImmigrationRecord[] = [];
        mockImmigrationRecords.push(mockImmigrationRecord);

        // Act
        const result: ImmigrationRecord[] = await immigrationService.getByFullNameNonFHIR(firstName, lastName, pager);
    
        // Assert
        expect(result).toEqual(mockImmigrationRecords);
    
        expect(mockImmigrationRepository.getByNameWithMiddleName).toHaveBeenCalledWith(theFirstName, theMiddleName ,lastName, pager);
        });

    it('should return empty Immigration records By Full Name in FHIR Format', async () => {

        jest.spyOn(mockImmigrationRepository, 'getByNameWithMiddleName');

        // Arrange 
        const firstName = 'AHMED YASSINE';
        const lastName = 'BENALI';
        const theFirstName = 'AHMED';
        const theMiddleName = 'YASSINE';

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };

        const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;            
    
        // Act
        const result: fhirR4.Bundle = await immigrationService.getByFullName(firstName, lastName, pager);
    
        // Assert
        expect(result.entry).toEqual([]);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
    
        expect(mockImmigrationRepository.getByNameWithMiddleName).toHaveBeenCalledWith(theFirstName, theMiddleName ,lastName, pager);
        });

    it('should return Immigration records By Full Name in FHIR Format', async () => {

        jest.spyOn(mockImmigrationRepository, 'getByNameWithMiddleName');

        // Arrange 
        const firstName = 'JAE SUNG';
        const lastName = 'LEE';
        const theFirstName = 'JAE';
        const theMiddleName = 'SUNG';

        const pager: Pager = {
            pageNum: 1,
            pageSize: 100
        };

        const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized; 
        const mockEntry: fhirR4.BundleEntry = new fhirR4.BundleEntry();
        mockEntry.resource = patient;
        mockEntry.fullUrl = 'http://moh.bw.org/ext/identifier/ppnPatient987654321';
        mockBundle.entry.push(mockEntry);
        mockBundle.total = 1;

        // Act
        const result: fhirR4.Bundle = await immigrationService.getByFullName(firstName, lastName, pager);
    
        // Assert
        expect(result.entry).toEqual(mockBundle.entry);
        expect(result.resourceType).toEqual(mockBundle.resourceType);
        expect(result.type).toEqual(mockBundle.type);
        expect(result.total).toEqual(mockBundle.total);
    
        expect(mockImmigrationRepository.getByNameWithMiddleName).toHaveBeenCalledWith(theFirstName, theMiddleName ,lastName, pager);
        });          
});

