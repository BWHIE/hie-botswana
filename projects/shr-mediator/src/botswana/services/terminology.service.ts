import { R4 } from '@ahryman40k/ts-fhir-types';
import { IBundle } from '@ahryman40k/ts-fhir-types/lib/R4';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import config from '../../config';
import { LoggerService } from '../../logger/logger.service';
import { Mapping } from './interfaces';

@Injectable()
export class TerminologyService {
  private ipmsToPimsMappings: any[];
  private ipmsToCielMappings: any[];
  private pimsToIpmsMappings: any[];
  private ipmsCodingInfo: any;

  constructor(private readonly logger: LoggerService) {
    this.loadJsonData();
  }

  private async loadJsonData() {
    try {
      this.ipmsToPimsMappings =
        (await this.loadJSONFile('IPMSLAB_to_PIMSLAB.json')) || {};
      this.ipmsToCielMappings =
        (await this.loadJSONFile('IPMSLAB_to_CIEL.json')) || {};
      this.pimsToIpmsMappings =
        (await this.loadJSONFile('PIMSLAB_to_IPMSLAB.json')) || {};
      this.ipmsCodingInfo = (await this.loadJSONFile('IPMS_Coding.json')) || [];

      if (!Array.isArray(this.ipmsCodingInfo)) {
        this.logger.error('IPMS Coding info is not an array');
        this.ipmsCodingInfo = [];
      }
    } catch (error) {
      this.logger.error('Error loading JSON data: ', error);
    }
  }

  private async loadJSONFile(fileName: string): Promise<any> {
    try {
      const dataPath = path.resolve(__dirname, '..', 'ocl_json');
      const filePath = path.join(dataPath, fileName);
      const fileContents = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(fileContents);
    } catch (error) {
      this.logger.error(`Error loading JSON data from ${fileName}: `, error);
      return null; // or return an empty array/object based on expected data structure
    }
  }

  async mapConcepts(labBundle: IBundle): Promise<IBundle> {
    this.logger.log('Mapping Concepts!');

    for (const e of labBundle.entry!) {
      if (
        e.resource &&
        (e.resource.resourceType == 'ServiceRequest' ||
          e.resource.resourceType == 'DiagnosticReport')
      ) {
        if (
          e.resource.code &&
          e.resource.code.coding &&
          e.resource.code.coding.length > 0
        ) {
          this.logger.log(`Translating ${e.resource.resourceType} Codings`);
          e.resource = await this.translateCoding(e.resource);
        } else {
          this.logger.error('Unable to find coding', e);
          throw new BadRequestException(
            `Unable to find coding for ${e.resource.resourceType}.`,
          );
        }
      }
    }
    return labBundle;
  }

  async translateCoding(
    r: R4.IServiceRequest | R4.IDiagnosticReport,
  ): Promise<R4.IServiceRequest | R4.IDiagnosticReport> {
    let ipmsCoding, cielCoding, pimsCoding: any;

    // Check if any codings exist
    if (r && r.code && r.code.coding && r.code.coding.length > 0) {
      // Extract PIMS and CIEL Codings, if available
      pimsCoding = this.getCoding(r, config.get('bwConfig:pimsSystemUrl'));
      cielCoding = this.getCoding(r, config.get('bwConfig:cielSystemUrl'));
      ipmsCoding = this.getCoding(r, config.get('bwConfig:ipmsSystemUrl'));

      this.logger.log(`Codings: ${JSON.stringify(config.get('bwConfig'))}`);
      this.logger.log(`CIEL Coding: ${JSON.stringify(cielCoding)}`);
      this.logger.log(`IPMS Coding: ${JSON.stringify(ipmsCoding)}`);
      this.logger.log(`PIMS Coding: ${JSON.stringify(pimsCoding)}`);

      if (ipmsCoding && ipmsCoding.code) {
        // 1. IPMS Resulting Workflow:
        //    Translation from IPMS --> PIMS and CIEL
        pimsCoding = this.getMappedCodeFromMemory(
          this.ipmsToPimsMappings,
          ipmsCoding.code,
        );

        if (pimsCoding && pimsCoding.code) {
          r.code.coding.push({
            system: config.get('bwConfig:pimsSystemUrl'),
            code: pimsCoding.code,
            display: pimsCoding.display,
          });
        } else {
          throw new BadRequestException(
            `Unable to translate IPMS code to PIMS code : ${ipmsCoding.code}`,
          );
        }

        cielCoding = this.getMappedCodeFromMemory(
          this.ipmsToCielMappings,
          ipmsCoding.code,
        );

        if (cielCoding && cielCoding.code) {
          r.code.coding.push({
            system: config.get('bwConfig:cielSystemUrl'),
            code: cielCoding.code,
            display: cielCoding.display,
          });
        } else {
          throw new BadRequestException(
            `Unable to translate IPMS code to CIEL code : ${ipmsCoding.code}`,
          );
        }
      } else {
        let computedIpmsCoding;
        // Lab Order Workflows
        if (pimsCoding && pimsCoding.code) {
          // 2. PIMS Order Workflow:
          //    Translation from PIMS --> IPMS and CIEL
          computedIpmsCoding = this.getMappedCodeFromMemory(
            this.pimsToIpmsMappings,
            pimsCoding.code,
          );
          this.logger.log(`IPMS Coding: ${JSON.stringify(computedIpmsCoding)}`);

          if (computedIpmsCoding && computedIpmsCoding.code) {
            r.code.coding.push({
              system: config.get('bwConfig:ipmsSystemUrl'),
              code: computedIpmsCoding.code,
              display: computedIpmsCoding.display,
            });
            cielCoding = this.getMappedCodeFromMemory(
              this.ipmsToCielMappings,
              computedIpmsCoding.code,
            );
            if (cielCoding && cielCoding.code) {
              r.code.coding.push({
                system: config.get('bwConfig:cielSystemUrl'),
                code: cielCoding.code,
                display: cielCoding.display,
              });
            } else {
              throw new BadRequestException(
                `Unable to translate PIMS code to CIEL code : ${pimsCoding.code}`,
              );
            }
          } else {
            throw new BadRequestException(
              `Unable to translate PIMS code to IPMS code : ${pimsCoding.code}`,
            );
          }
        } else if (cielCoding && cielCoding.code) {
          // 3. OpenMRS Order Workflow:
          //    Translation from CIEL to IPMS
          computedIpmsCoding = this.getIpmsCodeFromMemory(
            this.ipmsToCielMappings,
            cielCoding.code,
          );

          // Add IPMS Coding if found successfully
          if (computedIpmsCoding && computedIpmsCoding.code) {
            r.code.coding.push({
              system: config.get('bwConfig:ipmsSystemUrl'),
              code: computedIpmsCoding.mnemonic,
              display: computedIpmsCoding.display,
              extension: [
                {
                  url: config.get('bwConfig:ipmsOrderTypeSystemUrl'),
                  valueString: computedIpmsCoding.hl7Flag,
                },
              ],
            });
          } else {
            throw new BadRequestException(
              `Unable to translate CIEL code to IPMS code : ${pimsCoding.code}`,
            );
          }
        } else {
          throw new BadRequestException(
            'Unknown coding for ' + r.resourceType + ' :\n' + JSON.stringify(r),
          );
        }
      }

      return r;
    } else {
      throw new BadRequestException(
        'Could not any codings to translate for ' +
          r.resourceType +
          ':\n' +
          JSON.stringify(r),
      );
    }
  }

  getIpmsCodeFromMemory(mappings: Mapping[], code: string) {
    try {
      // Prioritize "Broader Than Mappings"
      let mappingIndex = mappings.findIndex(
        (x: any) => x.map_type == 'BROADER-THAN' && x.to_concept_code == code,
      );

      // Fall back to "SAME AS"
      if (mappingIndex < 0) {
        mappingIndex = mappings.findIndex(
          (x: any) => x.map_type == 'SAME-AS' && x.to_concept_code == code,
        );
      }
      if (mappingIndex >= 0) {
        const ipmsCode = mappings[mappingIndex].from_concept_code ?? null;
        const ipmsDisplay =
          mappings[mappingIndex].from_concept_name_resolved ?? null;
        const ipmsCodingInfoID = this.ipmsCodingInfo.find(
          (concept: any) => concept.id === ipmsCode,
        );

        let ipmsMnemonic, hl7Flag;
        if (ipmsCodingInfoID) {
          ipmsMnemonic =
            ipmsCodingInfoID.names.find((x: any) => x.name_type == 'Short')
              .name ?? null;
          hl7Flag =
            ipmsCodingInfoID.extras && ipmsCodingInfoID.extras.IPMS_HL7_ORM_TYPE
              ? ipmsCodingInfoID.extras.IPMS_HL7_ORM_TYPE
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

  getMappedCodeFromMemory(mappings: Mapping[], code: string): any {
    try {
      this.logger.log(`Terminology mapping for code: ${code}`);
      const mapping = mappings.find((x: any) => x.from_concept_code === code);

      if (mapping) {
        return {
          code: mapping.to_concept_code ?? null,
          display: mapping.to_concept_name_resolved ?? null,
        };
      } else {
        return {};
      }
    } catch (e) {
      this.logger.error('Could not find any codings to translate');
      return {};
    }
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
