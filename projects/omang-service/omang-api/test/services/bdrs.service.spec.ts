import { Test, TestingModule } from '@nestjs/testing';
import { BDRSService } from '../../src/services/bdrs.service';
import { DeathRepository, BirthRepository } from "../../src/repositories/bdrs-repositories";
import { MasterPatientIndex } from "../../src/services/mpi";
import { Pager } from '../../src/models/omang'
import { BirthModule } from '../../src/modules/birth.module';
import { DeathModule } from '../../src/modules/death.module';
import { MasterPatientIndexModule } from '../../src/modules/mpi.module';
import { UserModule } from '../../src/modules/user.module';
import { BirthRecord } from '../../src/models/birth-record';
import { DeathRecord } from '../../src/models/death-record';
import { FhirAPIResponses } from '../../src/models/fhir-responses';
import { fhirR4 } from '@smile-cdr/fhirts';

describe('BDRSService', () => {
    let bdrsService: BDRSService;
    let mockDeathRepository: DeathRepository;
    let mockBirthRepository : BirthRepository;
    let mockMpi : MasterPatientIndex;


    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [UserModule, BirthModule,DeathModule, MasterPatientIndexModule],
      }).compile();
      
      mockDeathRepository = module.get<DeathRepository>(DeathRepository);
      mockBirthRepository  = module.get<BirthRepository>(BirthRepository);
      mockMpi = module.get<MasterPatientIndex>(MasterPatientIndex);
      bdrsService = new BDRSService( mockDeathRepository, mockBirthRepository, mockMpi);

    });
    

    afterEach(() => {
      jest.clearAllMocks();
    });


    it('should check Database Connectivity and returns True ', async () => {

      jest.spyOn(mockBirthRepository, 'checkStatus');
      jest.spyOn(mockDeathRepository, 'checkStatus');


      const status = true;
      // Act
      const result = await bdrsService.isOnline();

      // Assert
      expect(status).toEqual(result);
      expect(mockBirthRepository.checkStatus).toHaveBeenCalledWith();
      expect(mockDeathRepository.checkStatus).toHaveBeenCalledWith();

  });
  
    it('should return empty birth records by full name ', async () => {

      jest.spyOn(mockBirthRepository, 'getByName');

      // Arrange
      const firstName = 'John';
      const lastName = 'Doe';
      const pager: Pager = {
          pageNum: 1,
          pageSize: 100
      };


      const mockedBirthRecords: BirthRecord[] = [];
      // Act
      const result = await bdrsService.findBirthByFullName(firstName, lastName, pager);

      // Assert
      expect(mockedBirthRecords).toEqual(result);
      expect(mockBirthRepository.getByName).toHaveBeenCalledWith(firstName, lastName, pager);
  });

  it('should return birth records by full name ', async () => {

    jest.spyOn(mockBirthRepository, 'getByName');

      // Arrange
      const lastName = 'SURNAME3';
      const firstName = 'OLEBILE';
      const pager: Pager = {
          pageNum: 1,
          pageSize: 100
      };

      const mockedBirthRecords: BirthRecord[] = [];
      const birthRecord: BirthRecord = new BirthRecord(); 
      birthRecord.ID_NUMBER = '23423423422';
      birthRecord.BIRTH_CERTIFICATE = '654651651651';
      birthRecord.BIRTH_CERTIFICATE_OLD = '65461651';
      birthRecord.FORENAME = 'OLEBILE';
      birthRecord.SURNAME ='SURNAME3';
      birthRecord.DATE_OF_BIRTH = new Date(1992, 7, 27); // Month index is zero-based (0 for January, 1 for February, etc.);
      birthRecord.DISTRICT_OF_BIRTH = '18';
      birthRecord.DISTRICT_OF_BIRTH_NAME = 'CENTRAL-TUTUME'
      birthRecord.FATHER_FORENAME = null;
      birthRecord.FATHER_ID_NUMBER = null;
      birthRecord.FATHER_NATIONALITY = null;
      birthRecord.FATHER_OTHER_NAME = null;
      birthRecord.FATHER_SURNAME = null;
      birthRecord.DATE_OF_COLLECTION = new Date(2019,4,27);
      birthRecord.DATE_OF_ISSUE = new Date(2009,5,18);
      birthRecord.DATE_OF_REGISTRATION = new Date(2009,5,18);
      birthRecord.YEAR_OF_REGISTRATION = '2009';
      birthRecord.MOTHER_AGE = '60';
      birthRecord.MOTHER_FORENAME = null;
      birthRecord.MOTHER_ID_NUMBER = null;
      birthRecord.MOTHER_MARITAL_STATUS = null;
      birthRecord.OTHER_NAME = null;
      birthRecord.MOTHER_SURNAME = null;
      birthRecord.MOTHER_OTHER_NAME = null;
      birthRecord.SEX = 'M';
      birthRecord.TOWN_VILL = 'FRANCISTOW';
      birthRecord.TYPE_OF_BIRTH = null;
      birthRecord.WARD_STREET = null;
      birthRecord.REGISTRATION_NUMBER = '324239022390';

      mockedBirthRecords.push(birthRecord);

      // Act
      const result = await bdrsService.findBirthByFullName(firstName, lastName, pager);

      // Assert
      expect(result).toEqual(mockedBirthRecords);
      expect(mockBirthRepository.getByName).toHaveBeenCalledWith(firstName, lastName, pager);
    }); 

    it('should return empty birth records by last name ', async () => {

      jest.spyOn(mockBirthRepository, 'getByLastName');

      // Arrange
      const lastName = 'Doe';
      const pager: Pager = {
          pageNum: 1,
          pageSize: 100
      };

      const mockedBirthRecords: BirthRecord[] = [];

      // Act
      const result:BirthRecord[] = await bdrsService.findBirthByLastName(lastName, pager);

      // Assert
      expect(result).toEqual(mockedBirthRecords);
      expect(mockBirthRepository.getByLastName).toHaveBeenCalledWith(lastName, pager);
  });

  it('should return birth records by last name ', async () => {

    jest.spyOn(mockBirthRepository, 'getByLastName');

      // Arrange
      const lastName = 'SURNAME3';
      const pager: Pager = {
          pageNum: 1,
          pageSize: 100
      };

      const mockedBirthRecords: BirthRecord[] = [];
      const birthRecord: BirthRecord = new BirthRecord(); 
      birthRecord.ID_NUMBER = '23423423422';
      birthRecord.BIRTH_CERTIFICATE = '654651651651';
      birthRecord.BIRTH_CERTIFICATE_OLD = '65461651';
      birthRecord.FORENAME = 'OLEBILE';
      birthRecord.SURNAME ='SURNAME3';
      birthRecord.DATE_OF_BIRTH = new Date(1992, 7, 27); // Month index is zero-based (0 for January, 1 for February, etc.);
      birthRecord.DISTRICT_OF_BIRTH = '18';
      birthRecord.DISTRICT_OF_BIRTH_NAME = 'CENTRAL-TUTUME'
      birthRecord.FATHER_FORENAME = null;
      birthRecord.FATHER_ID_NUMBER = null;
      birthRecord.FATHER_NATIONALITY = null;
      birthRecord.FATHER_OTHER_NAME = null;
      birthRecord.FATHER_SURNAME = null;
      birthRecord.DATE_OF_COLLECTION = new Date(2019,4,27);
      birthRecord.DATE_OF_ISSUE = new Date(2009,5,18);
      birthRecord.DATE_OF_REGISTRATION = new Date(2009,5,18);
      birthRecord.YEAR_OF_REGISTRATION = '2009';
      birthRecord.MOTHER_AGE = '60';
      birthRecord.MOTHER_FORENAME = null;
      birthRecord.MOTHER_ID_NUMBER = null;
      birthRecord.MOTHER_MARITAL_STATUS = null;
      birthRecord.OTHER_NAME = null;
      birthRecord.MOTHER_SURNAME = null;
      birthRecord.MOTHER_OTHER_NAME = null;
      birthRecord.SEX = 'M';
      birthRecord.TOWN_VILL = 'FRANCISTOW';
      birthRecord.TYPE_OF_BIRTH = null;
      birthRecord.WARD_STREET = null;
      birthRecord.REGISTRATION_NUMBER = '324239022390';
      
      mockedBirthRecords.push(birthRecord);

      // Act
      const result: BirthRecord[]  = await bdrsService.findBirthByLastName(lastName, pager);

      // Assert
      expect(result).toEqual(mockedBirthRecords);
      expect(mockBirthRepository.getByLastName).toHaveBeenCalledWith(lastName, pager);
    }); 


    it('should return birth records by Date Range ', async () => {

      jest.spyOn(mockBirthRepository, 'findBirthsByDate');

      // Arrange
      const startDate = new Date(1994,6,14);
      const endDate = new Date(1994,6,16);
      const pager: Pager = {
          pageNum: 1,
          pageSize: 100
      };

      const mockedBirthRecords: BirthRecord[] = [];
      const birthRecord: BirthRecord = new BirthRecord(); 
      birthRecord.ID_NUMBER = '222717595';
      birthRecord.BIRTH_CERTIFICATE = 'LB23/12374991/1994';
      birthRecord.BIRTH_CERTIFICATE_OLD = 'LB77405/94';
      birthRecord.FORENAME = 'MOOKETSI';
      birthRecord.SURNAME ='MAEBA';
      birthRecord.DATE_OF_BIRTH = new Date(1994,6,15); // Month index is zero-based (0 for January, 1 for February, etc.);
      birthRecord.DISTRICT_OF_BIRTH = '23';
      birthRecord.DISTRICT_OF_BIRTH_NAME = 'KGALAGADI'
      birthRecord.FATHER_FORENAME = null;
      birthRecord.FATHER_ID_NUMBER = null;
      birthRecord.FATHER_NATIONALITY = null;
      birthRecord.FATHER_OTHER_NAME = null;
      birthRecord.FATHER_SURNAME = null;
      birthRecord.DATE_OF_COLLECTION = null;
      birthRecord.DATE_OF_ISSUE = null;
      birthRecord.DATE_OF_REGISTRATION = new Date(1994,8,8);
      birthRecord.YEAR_OF_REGISTRATION = '1994';
      birthRecord.OTHER_NAME = 'JOH';
      birthRecord.MOTHER_ID_NUMBER = null;
      birthRecord.MOTHER_AGE = '26';
      birthRecord.MOTHER_MARITAL_STATUS = 'Single';
      birthRecord.MOTHER_SURNAME = 'MAEBA';
      birthRecord.MOTHER_FORENAME = null;
      birthRecord.MOTHER_OTHER_NAME = null;
      birthRecord.SEX = 'Male';
      birthRecord.TOWN_VILL = null;
      birthRecord.WARD_STREET = null;
      birthRecord.REGISTRATION_NUMBER = '1239251';
      birthRecord.TYPE_OF_BIRTH = 'Live Birth';

      mockedBirthRecords.push(birthRecord);

      // Act
      const result: BirthRecord[]  = await bdrsService.findBirthsByDate(startDate, endDate, pager);

      // console.log(result);

      // Assert
      expect(result).toEqual(mockedBirthRecords);
      expect(mockBirthRepository.findBirthsByDate).toHaveBeenCalledWith(startDate, endDate, pager);
    }); 


    it('should return empty birth records by Date Range ', async () => {

      jest.spyOn(mockBirthRepository, 'findBirthsByDate');

      // Arrange
      const startDate = new Date(2020-6-14);
      const endDate = new Date(2020-6-15);
      const pager: Pager = {
          pageNum: 1,
          pageSize: 100
      };

      const mockedBirthRecords: BirthRecord[] = [];
      // Act
      const result: BirthRecord[]  = await bdrsService.findBirthsByDate(startDate, endDate, pager);

      // Assert
      expect(result).toEqual(mockedBirthRecords);
      expect(mockBirthRepository.findBirthsByDate).toHaveBeenCalledWith(startDate, endDate, pager);
    });  


    it('should return birth records by ID in FHIR format ', async () => {

      jest.spyOn(mockBirthRepository, 'getMany');

       // Arrange
       const id  ='23423423422';
       const pager: Pager = {
           pageNum: 1,
           pageSize: 100
       };

      const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
      const mockEntry : fhirR4.BundleEntry = new fhirR4.BundleEntry();

      const patient : fhirR4.Patient = new fhirR4.Patient();
      patient.resourceType = 'Patient';
      patient.id = '23423423422';

      const firstIdentifier : fhirR4.Identifier = new fhirR4.Identifier();
      firstIdentifier.system = 'http://moh.bw.org/ext/identifier/bcn';
      firstIdentifier.value = '23423423422';

      const secondIdentifier : fhirR4.Identifier = new fhirR4.Identifier();
      secondIdentifier.system = 'http://omang.bw.org/ext/identifier/internalid';
      secondIdentifier.value = '79fcaeba25f20990b19341c3f3f8369f';

      patient.identifier = [firstIdentifier, secondIdentifier];
      patient.active = true;

      const theName : fhirR4.HumanName = new fhirR4.HumanName();
      theName.family = 'SURNAME3';
      theName.given = ['OLEBILE'];

      patient.name = [theName];

      patient.gender = 'male';
      patient.birthDate = '1992-08-26';
      patient.deceasedDateTime = '2019-05-26';

      const theAddress : fhirR4.Address = new fhirR4.Address();
      theAddress.district = 'CENTRAL-TUTUME';
      theAddress.postalCode = '18'
      theAddress.city = 'FRANCISTOW';

      patient.address = [theAddress];

      mockEntry.fullUrl = 'http://moh.bw.org/ext/identifier/bcnPatient23423423422'
      mockEntry.resource = patient;
      mockBundle.entry.push(mockEntry);
      mockBundle.total = 1;


      const result: fhirR4.Bundle  = await bdrsService.getBirthByID([id], pager);

      // Assert
      expect(result.entry[0]).toEqual(mockEntry);
      expect(result.resourceType).toEqual(mockBundle.resourceType);
      expect(result.type).toEqual(mockBundle.type);
      expect(result.total).toEqual(mockBundle.total);
      expect(mockBirthRepository.getMany).toHaveBeenCalledWith([id], pager);
    }); 


    it('should return empty birth records by ID in FHIR format ', async () => {

      jest.spyOn(mockBirthRepository, 'getMany');

       // Arrange
       const id  ='0000000';
       const pager: Pager = {
           pageNum: 1,
           pageSize: 100
       };
       
      const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
      const result: fhirR4.Bundle  = await bdrsService.getBirthByID([id], pager); 
      // Assert
      expect(result.entry).toEqual([]);
      expect(result.resourceType).toEqual(mockBundle.resourceType);
      expect(result.type).toEqual(mockBundle.type);
      expect(result.total).toEqual(mockBundle.total);
      expect(mockBirthRepository.getMany).toHaveBeenCalledWith([id], pager);
    }); 


    it('should return empty death records by full name ', async () => {

      jest.spyOn(mockDeathRepository, 'getByName');

      // Arrange
      const firstName = 'John';
      const lastName = 'Doe';
      const pager: Pager = {
          pageNum: 1,
          pageSize: 100
      };


      const mockedDeathRecords: DeathRecord[] = [];
      // Act
      const result = await bdrsService.findDeathByFullName(firstName, lastName, pager);

      // Assert
      expect(mockedDeathRecords).toEqual(result);
      expect(mockDeathRepository.getByName).toHaveBeenCalledWith(firstName, lastName, pager);
  });

  it('should return death records by full name ', async () => {

    jest.spyOn(mockDeathRepository, 'getByName');

    // Arrange
    const firstName = 'OLEBILE';
    const lastName = 'SURNAME3';
    const pager: Pager = {
        pageNum: 1,
        pageSize: 100
    };


    const mockedDeathRecords: DeathRecord[] = [];
    const deathRecord: DeathRecord = new DeathRecord();
    deathRecord.ID_NUMBER = '23423423422';
    deathRecord.ID_NUMBER_NEXT_OF_KIN = null;
    deathRecord.FORENAME = 'OLEBILE';
    deathRecord.SURNAME = 'SURNAME3';
    deathRecord.DATE_OF_DEATH = new Date(2019,4,27);
    deathRecord.AGE_DAYS = '30';
    deathRecord.AGE_MONTHS ='0';
    deathRecord.AGE_YEARS = '0';
    deathRecord.CAUSE_OF_DEATH = null;
    deathRecord.CODE_ICD10 = null;
    deathRecord.DATE_OF_COLLECTION = new Date(2009,5,18);
    deathRecord.DATE_OF_ISSUE = new Date(2019,4,27);
    deathRecord.DATE_OF_REGISTRATION= new Date(2009,5,18);
    deathRecord.DEATH_CERTIFICATE = '654651651651';
    deathRecord.DISTRICT_OF_DEATH = '18';
    deathRecord.DISTRICT_OF_DEATH_NAME = 'CENTRAL-TUTUME';
    deathRecord.DISTRICT_OF_REGISTRATION = '18';
    deathRecord.FORENAME_NEXT_OF_KIN = null;
    deathRecord.NATIONALITY = 'BW';
    deathRecord.NATIONALITY_NEXT_OF_KIN = null;
    deathRecord.OCCUPATION = 'NOT IN THE LABOUR FORCE (STUDENT)';
    deathRecord.OTHER_NAME = null;
    deathRecord.PLACE_OF_DEATH = null;
    deathRecord.SEX = 'M';
    deathRecord.TOWN_VILL = 'FRANCISTOW';
    deathRecord.TYPE_OF_RELATIONSHIP = null;
    deathRecord.WARD_STREET = null;
    deathRecord.YEAR_OF_REGISTRATION = '2009';

    mockedDeathRecords.push(deathRecord);

    // Act
    const result = await bdrsService.findDeathByFullName(firstName, lastName, pager);

    // Assert
    expect(mockedDeathRecords).toEqual(result);
    expect(mockDeathRepository.getByName).toHaveBeenCalledWith(firstName, lastName, pager);
  });

  it('should return empty death records by last name ', async () => {

    jest.spyOn(mockDeathRepository, 'getByLastName');

    // Arrange
    const lastName = 'Doe';
    const pager: Pager = {
        pageNum: 1,
        pageSize: 100
    };


    const mockedDeathRecords: DeathRecord[] = [];
    // Act
    const result = await bdrsService.findDeathByLastName(lastName, pager);

    // Assert
    expect(mockedDeathRecords).toEqual(result);
    expect(mockDeathRepository.getByLastName).toHaveBeenCalledWith(lastName, pager);
  });

  it('should return death records by last name ', async () => {

    jest.spyOn(mockDeathRepository, 'getByLastName');

    // Arrange
    const lastName = 'SURNAME3';
    const pager: Pager = {
        pageNum: 1,
        pageSize: 100
    };


    const mockedDeathRecords: DeathRecord[] = [];
    const deathRecord: DeathRecord = new DeathRecord();
    deathRecord.ID_NUMBER = '23423423422';
    deathRecord.ID_NUMBER_NEXT_OF_KIN = null;
    deathRecord.FORENAME = 'OLEBILE';
    deathRecord.SURNAME = 'SURNAME3';
    deathRecord.DATE_OF_DEATH = new Date(2019,4,27);
    deathRecord.AGE_DAYS = '30';
    deathRecord.AGE_MONTHS ='0';
    deathRecord.AGE_YEARS = '0';
    deathRecord.CAUSE_OF_DEATH = null;
    deathRecord.CODE_ICD10 = null;
    deathRecord.DATE_OF_COLLECTION = new Date(2009,5,18);
    deathRecord.DATE_OF_ISSUE = new Date(2019,4,27);
    deathRecord.DATE_OF_REGISTRATION= new Date(2009,5,18);
    deathRecord.DEATH_CERTIFICATE = '654651651651';
    deathRecord.DISTRICT_OF_DEATH = '18';
    deathRecord.DISTRICT_OF_DEATH_NAME = 'CENTRAL-TUTUME';
    deathRecord.DISTRICT_OF_REGISTRATION = '18';
    deathRecord.FORENAME_NEXT_OF_KIN = null;
    deathRecord.NATIONALITY = 'BW';
    deathRecord.NATIONALITY_NEXT_OF_KIN = null;
    deathRecord.OCCUPATION = 'NOT IN THE LABOUR FORCE (STUDENT)';
    deathRecord.OTHER_NAME = null;
    deathRecord.PLACE_OF_DEATH = null;
    deathRecord.SEX = 'M';
    deathRecord.TOWN_VILL = 'FRANCISTOW';
    deathRecord.TYPE_OF_RELATIONSHIP = null;
    deathRecord.WARD_STREET = null;
    deathRecord.YEAR_OF_REGISTRATION = '2009';

    mockedDeathRecords.push(deathRecord);

    // Act
    const result = await bdrsService.findDeathByLastName(lastName, pager);

    // Assert
    expect(mockedDeathRecords).toEqual(result);
    expect(mockDeathRepository.getByLastName).toHaveBeenCalledWith(lastName, pager);
  });

  it('should return death records by Date Range ', async () => {

    jest.spyOn(mockDeathRepository, 'findDeathsByDate');

    // Arrange
    const startDate = new Date(2019,4,27);
    const endDate = new Date(2019,4,28);
    const pager: Pager = {
        pageNum: 1,
        pageSize: 100
    };


    const mockedDeathRecords: DeathRecord[] = [];
    const deathRecord: DeathRecord = new DeathRecord();
    deathRecord.ID_NUMBER = '23423423422';
    deathRecord.ID_NUMBER_NEXT_OF_KIN = null;
    deathRecord.FORENAME = 'OLEBILE';
    deathRecord.SURNAME = 'SURNAME3';
    deathRecord.DATE_OF_DEATH = new Date(2019,4,27);
    deathRecord.AGE_DAYS = '30';
    deathRecord.AGE_MONTHS ='0';
    deathRecord.AGE_YEARS = '0';
    deathRecord.CAUSE_OF_DEATH = null;
    deathRecord.CODE_ICD10 = null;
    deathRecord.DATE_OF_COLLECTION = new Date(2009,5,18);
    deathRecord.DATE_OF_ISSUE = new Date(2019,4,27);
    deathRecord.DATE_OF_REGISTRATION= new Date(2009,5,18);
    deathRecord.DEATH_CERTIFICATE = '654651651651';
    deathRecord.DISTRICT_OF_DEATH = '18';
    deathRecord.DISTRICT_OF_DEATH_NAME = 'CENTRAL-TUTUME';
    deathRecord.DISTRICT_OF_REGISTRATION = '18';
    deathRecord.FORENAME_NEXT_OF_KIN = null;
    deathRecord.NATIONALITY = 'BW';
    deathRecord.NATIONALITY_NEXT_OF_KIN = null;
    deathRecord.OCCUPATION = 'NOT IN THE LABOUR FORCE (STUDENT)';
    deathRecord.OTHER_NAME = null;
    deathRecord.PLACE_OF_DEATH = null;
    deathRecord.SEX = 'M';
    deathRecord.TOWN_VILL = 'FRANCISTOW';
    deathRecord.TYPE_OF_RELATIONSHIP = null;
    deathRecord.WARD_STREET = null;
    deathRecord.YEAR_OF_REGISTRATION = '2009';

    mockedDeathRecords.push(deathRecord);

    // Act
    const result = await bdrsService.findDeathsByDate(startDate, endDate, pager);

    // Assert
    expect(mockedDeathRecords).toEqual(result);
    expect(mockDeathRepository.findDeathsByDate).toHaveBeenCalledWith(startDate, endDate, pager);
  });

  it('should return empty death records by Date Range ', async () => {

    jest.spyOn(mockDeathRepository, 'findDeathsByDate');

    // Arrange
    const startDate = new Date(2025,4,27);
    const endDate = new Date(205,4,28);
    const pager: Pager = {
        pageNum: 1,
        pageSize: 100
    };


    const mockedDeathRecords: DeathRecord[] = [];

    // Act
    const result = await bdrsService.findDeathsByDate(startDate, endDate, pager);

    // Assert
    expect(mockedDeathRecords).toEqual(result);
    expect(mockDeathRepository.findDeathsByDate).toHaveBeenCalledWith(startDate, endDate, pager);
  });


  it('should return death records by ID in FHIR format ', async () => {

    jest.spyOn(mockDeathRepository, 'getMany');

     // Arrange
     const id  ='23423423422';
     const pager: Pager = {
         pageNum: 1,
         pageSize: 100
     };

    const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
    const mockEntry : fhirR4.BundleEntry = new fhirR4.BundleEntry();

    const patient : fhirR4.Patient = new fhirR4.Patient();
    patient.resourceType = 'Patient';
    patient.id = '23423423422';

    const firstIdentifier : fhirR4.Identifier = new fhirR4.Identifier();
    firstIdentifier.system = 'http://moh.bw.org/ext/identifier/bcn';
    firstIdentifier.value = '23423423422';

    const secondIdentifier : fhirR4.Identifier = new fhirR4.Identifier();
    secondIdentifier.system = 'http://omang.bw.org/ext/identifier/internalid';
    secondIdentifier.value = '79fcaeba25f20990b19341c3f3f8369f';

    patient.identifier = [firstIdentifier, secondIdentifier];
    patient.active = true;

    const theName : fhirR4.HumanName = new fhirR4.HumanName();
    theName.family = 'SURNAME3';
    theName.given = ['OLEBILE'];

    patient.name = [theName];

    patient.gender = 'male';
    patient.deceasedDateTime = '2019-05-26';

    const theAddress : fhirR4.Address = new fhirR4.Address();
    theAddress.district = 'CENTRAL-TUTUME';
    theAddress.postalCode = '18'
    theAddress.city = 'FRANCISTOW';
    theAddress.country = 'BW';



    patient.address = [theAddress];

    mockEntry.fullUrl = 'http://moh.bw.org/ext/identifier/bcnPatient23423423422'
    mockEntry.resource = patient;
    mockBundle.entry.push(mockEntry);
    mockBundle.total = 1;


  const result: fhirR4.Bundle  = await bdrsService.getDeathByID([id], pager);

    
    // Assert
    expect(result.entry[0]).toEqual(mockEntry);
    expect(result.resourceType).toEqual(mockBundle.resourceType);
    expect(result.type).toEqual(mockBundle.type);
    expect(result.total).toEqual(mockBundle.total);
    expect(mockDeathRepository.getMany).toHaveBeenCalledWith([id], pager);
  }); 


  it('should return empty death records by ID in FHIR format ', async () => {

    jest.spyOn(mockDeathRepository, 'getMany');

     // Arrange
     const id  ='0000000';
     const pager: Pager = {
         pageNum: 1,
         pageSize: 100
     };
     
    const mockBundle: fhirR4.Bundle = FhirAPIResponses.RecordInitialized;
    const result: fhirR4.Bundle  = await bdrsService.getDeathByID([id], pager); 
    // Assert
    expect(result.entry).toEqual([]);
    expect(result.resourceType).toEqual(mockBundle.resourceType);
    expect(result.type).toEqual(mockBundle.type);
    expect(result.total).toEqual(mockBundle.total);
    expect(mockDeathRepository.getMany).toHaveBeenCalledWith([id], pager);
  }); 


    
  });
  