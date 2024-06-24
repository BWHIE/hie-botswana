import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

export interface FhirSearchParams {
  identifier?: string; // Patient identifier (expected to include a system and value separated by '|')
  given?: string; // Given names (first names or initials)
  family?: string; // Family name (last name or surname)
  gender?: 'male' | 'female'; // Gender with strict type options
  birthdate?: string; // Birthdate in YYYY-MM-DD format
  _page?: number; // Page number for pagination (positive integer)
  _count?: number; // Number of records per page (positive integer, usually capped)
}

@Injectable()
export class FhirSearchParamsValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): FhirSearchParams {
    if (value.identifier && !value.identifier.includes('|')) {
      throw new BadRequestException(
        'Identifier must include a system and value separated by "|"',
      );
    }

    if (value.birthdate && !/^\d{4}-\d{2}-\d{2}$/.test(value.birthdate)) {
      throw new BadRequestException(
        'Birthdate must be in the format YYYY-MM-DD',
      );
    }

    if (
      value.gender &&
      !['male', 'female'].includes(value.gender.toLowerCase())
    ) {
      throw new BadRequestException('Gender must be one of "male", "female"');
    }

    if (
      value._page &&
      (!Number.isInteger(Number(value._page)) || Number(value._page) < 1)
    ) {
      throw new BadRequestException('_page must be a positive integer');
    }

    const maxPageSize = 200; // Set a reasonable limit to avoid performance issues
    if (
      value._count &&
      (!Number.isInteger(Number(value._count)) ||
        Number(value._count) < 1 ||
        Number(value._count) > maxPageSize)
    ) {
      throw new BadRequestException(
        `_count must be a positive integer and cannot be more than ${maxPageSize}`,
      );
    }

    // Ensure at least one search parameter is provided
    if (
      !value.identifier &&
      !value.given &&
      !value.family &&
      !value.gender &&
      !value.birthdate
    ) {
      throw new BadRequestException(
        'At least one search parameter must be provided',
      );
    }

    return value;
  }
}
