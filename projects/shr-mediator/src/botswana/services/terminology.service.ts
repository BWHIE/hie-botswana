import { R4 } from '@ahryman40k/ts-fhir-types';
import { IBundle } from '@ahryman40k/ts-fhir-types/lib/R4';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class TerminologyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
  ) {}

  async mapConcepts(labBundle: IBundle): Promise<IBundle> {
    this.logger.log('Mapping Concepts!');

    return await this.addAllCodings(labBundle);
  }

  // Add terminology mappings info to Bundle
  async addAllCodings(labBundle: IBundle): Promise<IBundle> {
    try {
      for (const e of labBundle.entry!) {
        if (
          e.resource &&
          e.resource.resourceType == 'ServiceRequest' &&
          e.resource.code &&
          e.resource.code.coding &&
          e.resource.code.coding.length > 0
        ) {
          this.logger.log`Translating ServiceRequest Codings`;
          e.resource = await this.translateCoding(e.resource);
        }
      }
    } catch (e) {
      this.logger.error(e);
    }
    return labBundle;
  }

  async translateCoding(
    r: R4.IServiceRequest | R4.IDiagnosticReport,
  ): Promise<R4.IServiceRequest | R4.IDiagnosticReport> {
    let ipmsCoding, cielCoding, pimsCoding: any;

    try {
      // Check if any codings exist
      if (r && r.code && r.code.coding && r.code.coding.length > 0) {
        // Extract PIMS and CIEL Codings, if available
        pimsCoding = this.getCoding(r, config.get('bwConfig:pimsSystemUrl'));
        cielCoding = this.getCoding(r, config.get('bwConfig:cielSystemUrl'));
        ipmsCoding = this.getCoding(r, config.get('bwConfig:ipmsSystemUrl'));

        this.logger.log(`PIMS Coding: ${JSON.stringify(pimsCoding)}`);
        this.logger.log(`CIEL Coding: ${JSON.stringify(cielCoding)}`);
        this.logger.log(`IPMS Coding: ${JSON.stringify(ipmsCoding)}`);

        if (ipmsCoding && ipmsCoding.code) {
          // 1. IPMS Resulting Workflow:
          //    Translation from IPMS --> PIMS and CIEL
          pimsCoding = await this.getMappedCode(
            `/orgs/I-TECH-UW/sources/IPMSLAB/mappings/?toConceptSource=PIMSLAB&fromConcept=${ipmsCoding.code}`,
          );

          if (pimsCoding && pimsCoding.code) {
            r.code.coding.push({
              system: config.get('bwConfig:pimsSystemUrl'),
              code: pimsCoding.code,
              display: pimsCoding.display,
            });
          }

          cielCoding = await this.getMappedCode(
            `/orgs/I-TECH-UW/sources/IPMSLAB/mappings/?toConceptSource=CIEL&fromConcept=${ipmsCoding.code}`,
          );

          if (cielCoding && cielCoding.code) {
            r.code.coding.push({
              system: config.get('bwConfig:cielSystemUrl'),
              code: cielCoding.code,
              display: cielCoding.display,
            });
          }
        } else {
          let computedIpmsCoding;
          // Lab Order Workflows
          if (pimsCoding && pimsCoding.code) {
            // 2. PIMS Order Workflow:
            //    Translation from PIMS --> IMPS and CIEL
            computedIpmsCoding = await this.getIpmsCode(
              `/orgs/I-TECH-UW/sources/IPMSLAB/mappings?toConcept=${pimsCoding.code}&toConceptSource=PIMSLAB`,
              pimsCoding.code,
            );

            if (computedIpmsCoding && computedIpmsCoding.code) {
              cielCoding = await this.getMappedCode(
                `/orgs/I-TECH-UW/sources/IPMSLAB/mappings/?toConceptSource=CIEL&fromConcept=${computedIpmsCoding.code}`,
              );
            }

            if (cielCoding && cielCoding.code) {
              r.code.coding.push({
                system: config.get('bwConfig:cielSystemUrl'),
                code: cielCoding.code,
                display: cielCoding.display,
              });
            }
          } else if (cielCoding && cielCoding.code) {
            // 3. OpenMRS Order Workflow:
            //    Translation from CIEL to IPMS
            computedIpmsCoding = await this.getIpmsCode(
              `/orgs/I-TECH-UW/sources/IPMSLAB/mappings?toConcept=${cielCoding.code}&toConceptSource=CIEL`,
              cielCoding.code,
            );
          }

          // Add IPMS Coding if found successfully
          if (computedIpmsCoding && computedIpmsCoding.code) {
            const ipmsOrderTypeExt = {
              url: config.get('bwConfig:ipmsOrderTypeSystemUrl'),
              valueString: computedIpmsCoding.hl7Flag,
            };

            const srCoding = {
              system: config.get('bwConfig:ipmsSystemUrl'),
              code: computedIpmsCoding.mnemonic,
              display: computedIpmsCoding.display,
              extension: [ipmsOrderTypeExt],
            };

            r.code.coding.push(srCoding);
          }
        }

        return r;
      } else {
        this.logger.error(
          'Could not any codings to translate in:\n' + JSON.stringify(r),
        );
        return r;
      }
    } catch (e) {
      this.logger.error(
        `Error whil translating ServiceRequest codings: \n ${JSON.stringify(e)}`,
      );
      return r;
    }
  }

  async getIpmsCode(q: string, c = '') {
    try {
      const ipmsMappings = await this.getOclMapping(q);

      //this.logger.log(`IPMS Mappings: ${JSON.stringify(ipmsMappings)}`)

      // Prioritize "Broader Than Mappings"
      //TODO: Figure out if this is proper way to handle panels / broad to narrow
      let mappingIndex = ipmsMappings.findIndex(
        (x: any) => x.map_type == 'BROADER-THAN' && x.to_concept_code == c,
      );

      // Fall back to "SAME AS"
      if (mappingIndex < 0) {
        mappingIndex = ipmsMappings.findIndex(
          (x: any) => x.map_type == 'SAME-AS' && x.to_concept_code == c,
        );
      }

      if (mappingIndex >= 0) {
        const ipmsCode = ipmsMappings[mappingIndex].from_concept_code;
        const ipmsDisplay =
          ipmsMappings[mappingIndex].from_concept_name_resolved;
        const ipmsCodingInfo: any = await this.getOclMapping(
          `/orgs/I-TECH-UW/sources/IPMSLAB/concepts/${ipmsCode}`,
        );
        // this.logger.log(`IPMS Coding Info: ${JSON.stringify(ipmsCodingInfo)}`)
        let ipmsMnemonic, hl7Flag;
        if (ipmsCodingInfo) {
          ipmsMnemonic = ipmsCodingInfo.names.find(
            (x: any) => x.name_type == 'Short',
          ).name;
          hl7Flag =
            ipmsCodingInfo.extras && ipmsCodingInfo.extras.IPMS_HL7_ORM_TYPE
              ? ipmsCodingInfo.extras.IPMS_HL7_ORM_TYPE
              : 'LAB';
        }

        return {
          code: ipmsCode,
          display: ipmsDisplay,
          mnemonic: ipmsMnemonic,
          hl7Flag: hl7Flag,
        };
      } else {
        return null;
      }
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }
  async getMappedCode(q: string): Promise<any> {
    try {
      const codeMapping = await this.getOclMapping(q);

      //this.logger.log(`Code Mapping: ${JSON.stringify(codeMapping)}`)

      if (codeMapping && codeMapping.length > 0) {
        return {
          code: codeMapping[0].to_concept_code,
          display: codeMapping[0].to_concept_name_resolved,
        };
      } else {
        return {};
      }
    } catch (e) {
      this.logger.error(e);
      return {};
    }
  }

  async getOclMapping(queryString: string): Promise<any[]> {
    const options = { timeout: config.get('bwConfig:requestTimeout') || 1000 };

    this.logger.log(`${config.get('bwConfig:oclUrl')}${queryString}`);

    // TODO: Add retry logic
    const { data } = await this.httpService.axiosRef.get(
      `${config.get('bwConfig:oclUrl')}${queryString}`,
      options,
    );
    return data;
  }

  async getOclConcept(conceptCode: string): Promise<any> {
    const options = { timeout: config.get('bwConfig:requestTimeout') || 1000 };

    // TODO: Add retry logic
    const { data } = await this.httpService.axiosRef.get(
      `${config.get('bwConfig:oclUrl')}/orgs/I-TECH-UW/sources/IPMSLAB/concepts/${conceptCode}`,
      options,
    );

    return data;
  }

  getCoding(
    r: R4.IServiceRequest | R4.IDiagnosticReport,
    system: string,
  ): R4.ICoding {
    if (r.code && r.code.coding) {
      return <R4.ICoding>(
        r.code.coding.find((e) => e.system && e.system == system)
      );
    } else {
      return {};
    }
  }
}
