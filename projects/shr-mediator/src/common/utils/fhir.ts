import { R4 } from '@ahryman40k/ts-fhir-types';

export enum ResourceType {
  Account = 'Account',
  ActivityDefinition = 'ActivityDefinition',
  AdverseEvent = 'AdverseEvent',
  AllergyIntolerance = 'AllergyIntolerance',
  Appointment = 'Appointment',
  AppointmentResponse = 'AppointmentResponse',
  AuditEvent = 'AuditEvent',
  Basic = 'Basic',
  Binary = 'Binary',
  BiologicallyDerivedProduct = 'BiologicallyDerivedProduct',
  BodyStructure = 'BodyStructure',
  Bundle = 'Bundle',
  CapabilityStatement = 'CapabilityStatement',
  CarePlan = 'CarePlan',
  CareTeam = 'CareTeam',
  CatalogEntry = 'CatalogEntry',
  ChargeItem = 'ChargeItem',
  ChargeItemDefinition = 'ChargeItemDefinition',
  Claim = 'Claim',
  ClaimResponse = 'ClaimResponse',
  ClinicalImpression = 'ClinicalImpression',
  CodeSystem = 'CodeSystem',
  Communication = 'Communication',
  CommunicationRequest = 'CommunicationRequest',
  CompartmentDefinition = 'CompartmentDefinition',
  Composition = 'Composition',
  ConceptMap = 'ConceptMap',
  Condition = 'Condition',
  Consent = 'Consent',
  Contract = 'Contract',
  Coverage = 'Coverage',
  CoverageEligibilityRequest = 'CoverageEligibilityRequest',
  CoverageEligibilityResponse = 'CoverageEligibilityResponse',
  DetectedIssue = 'DetectedIssue',
  Device = 'Device',
  DeviceDefinition = 'DeviceDefinition',
  DeviceMetric = 'DeviceMetric',
  DeviceRequest = 'DeviceRequest',
  DeviceUseStatement = 'DeviceUseStatement',
  DiagnosticReport = 'DiagnosticReport',
  DocumentManifest = 'DocumentManifest',
  DocumentReference = 'DocumentReference',
  DomainResource = 'DomainResource',
  EffectEvidenceSynthesis = 'EffectEvidenceSynthesis',
  Encounter = 'Encounter',
  Endpoint = 'Endpoint',
  EnrollmentRequest = 'EnrollmentRequest',
  EnrollmentResponse = 'EnrollmentResponse',
  EpisodeOfCare = 'EpisodeOfCare',
  EventDefinition = 'EventDefinition',
  Evidence = 'Evidence',
  EvidenceVariable = 'EvidenceVariable',
  ExampleScenario = 'ExampleScenario',
  ExplanationOfBenefit = 'ExplanationOfBenefit',
  FamilyMemberHistory = 'FamilyMemberHistory',
  Flag = 'Flag',
  Goal = 'Goal',
  GraphDefinition = 'GraphDefinition',
  Group = 'Group',
  GuidanceResponse = 'GuidanceResponse',
  HealthcareService = 'HealthcareService',
  ImagingStudy = 'ImagingStudy',
  Immunization = 'Immunization',
  ImmunizationEvaluation = 'ImmunizationEvaluation',
  ImmunizationRecommendation = 'ImmunizationRecommendation',
  ImplementationGuide = 'ImplementationGuide',
  InsurancePlan = 'InsurancePlan',
  Invoice = 'Invoice',
  Library = 'Library',
  Linkage = 'Linkage',
  List = 'List',
  Location = 'Location',
  Measure = 'Measure',
  MeasureReport = 'MeasureReport',
  Media = 'Media',
  Medication = 'Medication',
  MedicationAdministration = 'MedicationAdministration',
  MedicationDispense = 'MedicationDispense',
  MedicationKnowledge = 'MedicationKnowledge',
  MedicationRequest = 'MedicationRequest',
  MedicationStatement = 'MedicationStatement',
  MedicinalProduct = 'MedicinalProduct',
  MedicinalProductAuthorization = 'MedicinalProductAuthorization',
  MedicinalProductContraindication = 'MedicinalProductContraindication',
  MedicinalProductIndication = 'MedicinalProductIndication',
  MedicinalProductIngredient = 'MedicinalProductIngredient',
  MedicinalProductInteraction = 'MedicinalProductInteraction',
  MedicinalProductManufactured = 'MedicinalProductManufactured',
  MedicinalProductPackaged = 'MedicinalProductPackaged',
  MedicinalProductPharmaceutical = 'MedicinalProductPharmaceutical',
  MedicinalProductUndesirableEffect = 'MedicinalProductUndesirableEffect',
  MessageDefinition = 'MessageDefinition',
  MessageHeader = 'MessageHeader',
  MolecularSequence = 'MolecularSequence',
  NamingSystem = 'NamingSystem',
  NutritionOrder = 'NutritionOrder',
  Observation = 'Observation',
  ObservationDefinition = 'ObservationDefinition',
  OperationDefinition = 'OperationDefinition',
  OperationOutcome = 'OperationOutcome',
  Organization = 'Organization',
  OrganizationAffiliation = 'OrganizationAffiliation',
  Parameters = 'Parameters',
  Patient = 'Patient',
  PaymentNotice = 'PaymentNotice',
  PaymentReconciliation = 'PaymentReconciliation',
  Person = 'Person',
  PlanDefinition = 'PlanDefinition',
  Practitioner = 'Practitioner',
  PractitionerRole = 'PractitionerRole',
  Procedure = 'Procedure',
  Provenance = 'Provenance',
  Questionnaire = 'Questionnaire',
  QuestionnaireResponse = 'QuestionnaireResponse',
  RelatedPerson = 'RelatedPerson',
  RequestGroup = 'RequestGroup',
  ResearchDefinition = 'ResearchDefinition',
  ResearchElementDefinition = 'ResearchElementDefinition',
  ResearchStudy = 'ResearchStudy',
  ResearchSubject = 'ResearchSubject',
  Resource = 'Resource',
  RiskAssessment = 'RiskAssessment',
  RiskEvidenceSynthesis = 'RiskEvidenceSynthesis',
  Schedule = 'Schedule',
  SearchParameter = 'SearchParameter',
  ServiceRequest = 'ServiceRequest',
  Slot = 'Slot',
  Specimen = 'Specimen',
  SpecimenDefinition = 'SpecimenDefinition',
  StructureDefinition = 'StructureDefinition',
  StructureMap = 'StructureMap',
  Subscription = 'Subscription',
  Substance = 'Substance',
  SubstanceNucleicAcid = 'SubstanceNucleicAcid',
  SubstancePolymer = 'SubstancePolymer',
  SubstanceProtein = 'SubstanceProtein',
  SubstanceReferenceInformation = 'SubstanceReferenceInformation',
  SubstanceSourceMaterial = 'SubstanceSourceMaterial',
  SubstanceSpecification = 'SubstanceSpecification',
  SupplyDelivery = 'SupplyDelivery',
  SupplyRequest = 'SupplyRequest',
  Task = 'Task',
  TerminologyCapabilities = 'TerminologyCapabilities',
  TestReport = 'TestReport',
  TestScript = 'TestScript',
  ValueSet = 'ValueSet',
  VerificationResult = 'VerificationResult',
  VisionPrescription = 'VisionPrescription',
}

export function getResourceTypeEnum(resourceType: string): ResourceType {
  if (isValidResourceType(resourceType)) {
    return <ResourceType>resourceType;
  } else {
    throw new Error(`Invalid resource type ${resourceType}`);
  }
}

export function isValidResourceType(resourceType: string): boolean {
  return resourceType in ResourceType;
}

export function invalidBundle(resource: any): boolean {
  return (
    !resource.resourceType ||
    (resource.resourceType && resource.resourceType !== 'Bundle') ||
    !resource.entry ||
    (resource.entry && resource.entry.length === 0)
  );
}

export function invalidBundleMessage(): any {
  return {
    resourceType: 'OperationOutcome',
    issue: [
      {
        severity: 'error',
        code: 'processing',
        diagnostics: 'Invalid bundle submitted',
      },
    ],
    response: {
      status: 400,
    },
  };
}

export function getTaskStatus(
  labBundle: R4.IBundle,
): R4.TaskStatusKind | undefined {
  let taskResult, task;

  try {
    taskResult = labBundle.entry!.find((entry) => {
      return entry.resource && entry.resource.resourceType == 'Task';
    });

    if (taskResult) {
      task = <R4.ITask>taskResult.resource!;

      return task.status!;
    }
  } catch (error) {
    // @TODO: should we throw here ?
    console.error(`Could not get Task status for task:\n${task}`);
    return undefined;
  }
}

export function setTaskStatus(
  labBundle: R4.IBundle,
  status: R4.TaskStatusKind,
): R4.IBundle {
  let taskIndex, task;

  try {
    taskIndex = labBundle.entry!.findIndex((entry) => {
      return entry.resource && entry.resource.resourceType == 'Task';
    });

    if (labBundle.entry && labBundle.entry.length > 0 && taskIndex >= 0) {
      (<R4.ITask>labBundle.entry[taskIndex].resource!).status = status;
    }
    return labBundle;
  } catch (error) {
    // @TODO: should we throw here ?
    console.error(`Could not get Task status for task:\n${task}`);
    return labBundle;
  }
}

export function getBundleEntry(
  entries: R4.IBundle_Entry[],
  type: string,
  id?: string,
): R4.IResource | undefined {
  const entry = entries.find((entry) => {
    return (
      entry.resource &&
      entry.resource.resourceType == type &&
      (!id || entry.resource.id == id)
    );
  });

  return entry?.resource;
}

export function getBundleEntries(
  entries: R4.IBundle_Entry[],
  type: string,
  id?: string,
): (R4.IResource | undefined)[] {
  return entries
    .filter((entry) => {
      return (
        entry.resource &&
        entry.resource.resourceType == type &&
        (!id || entry.resource.id == id)
      );
    })
    .map((entry) => {
      return entry.resource;
    });
}
