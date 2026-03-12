/**
 * @module @organizoptera/core/validation/organization-validator
 * @description Validation rules for organization entities
 */

import type {
  CreateSchoolNetworkDto,
  UpdateSchoolNetworkDto,
  CreateSchoolDto,
  UpdateSchoolDto,
  CreateStudentDto,
  UpdateStudentDto,
  CreateTeacherDto,
  UpdateTeacherDto,
} from '@organizoptera/types';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: ValidationErrorCode;
}

export type ValidationErrorCode =
  | 'REQUIRED'
  | 'MIN_LENGTH'
  | 'MAX_LENGTH'
  | 'INVALID_FORMAT'
  | 'INVALID_VALUE'
  | 'DUPLICATE'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_DATE';

/**
 * Validation utilities
 */
const validators = {
  required: (value: unknown, field: string): ValidationError | null => {
    if (value === undefined || value === null || value === '') {
      return { field, message: `${field} is required`, code: 'REQUIRED' };
    }
    return null;
  },

  minLength: (value: string, min: number, field: string): ValidationError | null => {
    if (value && value.length < min) {
      return {
        field,
        message: `${field} must be at least ${min} characters`,
        code: 'MIN_LENGTH',
      };
    }
    return null;
  },

  maxLength: (value: string, max: number, field: string): ValidationError | null => {
    if (value && value.length > max) {
      return {
        field,
        message: `${field} must be at most ${max} characters`,
        code: 'MAX_LENGTH',
      };
    }
    return null;
  },

  email: (value: string, field: string): ValidationError | null => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { field, message: `${field} must be a valid email`, code: 'INVALID_EMAIL' };
    }
    return null;
  },

  phone: (value: string, field: string): ValidationError | null => {
    // Brazilian phone format or international
    if (value && !/^[\d\s\-+()]+$/.test(value)) {
      return { field, message: `${field} must be a valid phone number`, code: 'INVALID_PHONE' };
    }
    return null;
  },

  slug: (value: string, field: string): ValidationError | null => {
    if (value && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      return {
        field,
        message: `${field} must be a valid slug (lowercase letters, numbers, and hyphens)`,
        code: 'INVALID_FORMAT',
      };
    }
    return null;
  },

  date: (value: unknown, field: string): ValidationError | null => {
    if (value) {
      const date = value instanceof Date ? value : new Date(value as string);
      if (isNaN(date.getTime())) {
        return { field, message: `${field} must be a valid date`, code: 'INVALID_DATE' };
      }
    }
    return null;
  },
};

/**
 * Validate CreateSchoolNetworkDto
 */
export function validateCreateSchoolNetwork(dto: CreateSchoolNetworkDto): ValidationResult {
  const errors: ValidationError[] = [];

  const nameRequired = validators.required(dto.name, 'name');
  if (nameRequired) errors.push(nameRequired);

  const nameMin = validators.minLength(dto.name, 2, 'name');
  if (nameMin) errors.push(nameMin);

  const nameMax = validators.maxLength(dto.name, 200, 'name');
  if (nameMax) errors.push(nameMax);

  const slugRequired = validators.required(dto.slug, 'slug');
  if (slugRequired) errors.push(slugRequired);

  const slugFormat = validators.slug(dto.slug, 'slug');
  if (slugFormat) errors.push(slugFormat);

  const slugMax = validators.maxLength(dto.slug, 100, 'slug');
  if (slugMax) errors.push(slugMax);

  return { valid: errors.length === 0, errors };
}

/**
 * Validate UpdateSchoolNetworkDto
 */
export function validateUpdateSchoolNetwork(dto: UpdateSchoolNetworkDto): ValidationResult {
  const errors: ValidationError[] = [];

  if (dto.name !== undefined) {
    const nameMin = validators.minLength(dto.name, 2, 'name');
    if (nameMin) errors.push(nameMin);

    const nameMax = validators.maxLength(dto.name, 200, 'name');
    if (nameMax) errors.push(nameMax);
  }

  if (dto.slug !== undefined) {
    const slugFormat = validators.slug(dto.slug, 'slug');
    if (slugFormat) errors.push(slugFormat);

    const slugMax = validators.maxLength(dto.slug, 100, 'slug');
    if (slugMax) errors.push(slugMax);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate CreateSchoolDto
 */
export function validateCreateSchool(dto: CreateSchoolDto): ValidationResult {
  const errors: ValidationError[] = [];

  const networkRequired = validators.required(dto.networkId, 'networkId');
  if (networkRequired) errors.push(networkRequired);

  const nameRequired = validators.required(dto.name, 'name');
  if (nameRequired) errors.push(nameRequired);

  const nameMin = validators.minLength(dto.name, 2, 'name');
  if (nameMin) errors.push(nameMin);

  const nameMax = validators.maxLength(dto.name, 200, 'name');
  if (nameMax) errors.push(nameMax);

  const slugRequired = validators.required(dto.slug, 'slug');
  if (slugRequired) errors.push(slugRequired);

  const slugFormat = validators.slug(dto.slug, 'slug');
  if (slugFormat) errors.push(slugFormat);

  if (dto.email) {
    const emailFormat = validators.email(dto.email, 'email');
    if (emailFormat) errors.push(emailFormat);
  }

  if (dto.phone) {
    const phoneFormat = validators.phone(dto.phone, 'phone');
    if (phoneFormat) errors.push(phoneFormat);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate UpdateSchoolDto
 */
export function validateUpdateSchool(dto: UpdateSchoolDto): ValidationResult {
  const errors: ValidationError[] = [];

  if (dto.name !== undefined) {
    const nameMin = validators.minLength(dto.name, 2, 'name');
    if (nameMin) errors.push(nameMin);

    const nameMax = validators.maxLength(dto.name, 200, 'name');
    if (nameMax) errors.push(nameMax);
  }

  if (dto.slug !== undefined) {
    const slugFormat = validators.slug(dto.slug, 'slug');
    if (slugFormat) errors.push(slugFormat);
  }

  if (dto.email !== undefined) {
    const emailFormat = validators.email(dto.email, 'email');
    if (emailFormat) errors.push(emailFormat);
  }

  if (dto.phone !== undefined) {
    const phoneFormat = validators.phone(dto.phone, 'phone');
    if (phoneFormat) errors.push(phoneFormat);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate CreateStudentDto
 */
export function validateCreateStudent(dto: CreateStudentDto): ValidationResult {
  const errors: ValidationError[] = [];

  const schoolRequired = validators.required(dto.schoolId, 'schoolId');
  if (schoolRequired) errors.push(schoolRequired);

  const firstNameRequired = validators.required(dto.firstName, 'firstName');
  if (firstNameRequired) errors.push(firstNameRequired);

  const firstNameMin = validators.minLength(dto.firstName, 1, 'firstName');
  if (firstNameMin) errors.push(firstNameMin);

  const firstNameMax = validators.maxLength(dto.firstName, 100, 'firstName');
  if (firstNameMax) errors.push(firstNameMax);

  const lastNameRequired = validators.required(dto.lastName, 'lastName');
  if (lastNameRequired) errors.push(lastNameRequired);

  const lastNameMin = validators.minLength(dto.lastName, 1, 'lastName');
  if (lastNameMin) errors.push(lastNameMin);

  const lastNameMax = validators.maxLength(dto.lastName, 100, 'lastName');
  if (lastNameMax) errors.push(lastNameMax);

  if (dto.email) {
    const emailFormat = validators.email(dto.email, 'email');
    if (emailFormat) errors.push(emailFormat);
  }

  if (dto.guardianEmail) {
    const guardianEmailFormat = validators.email(dto.guardianEmail, 'guardianEmail');
    if (guardianEmailFormat) errors.push(guardianEmailFormat);
  }

  if (dto.guardianPhone) {
    const guardianPhoneFormat = validators.phone(dto.guardianPhone, 'guardianPhone');
    if (guardianPhoneFormat) errors.push(guardianPhoneFormat);
  }

  if (dto.birthDate) {
    const birthDateFormat = validators.date(dto.birthDate, 'birthDate');
    if (birthDateFormat) errors.push(birthDateFormat);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate UpdateStudentDto
 */
export function validateUpdateStudent(dto: UpdateStudentDto): ValidationResult {
  const errors: ValidationError[] = [];

  if (dto.firstName !== undefined) {
    const firstNameMin = validators.minLength(dto.firstName, 1, 'firstName');
    if (firstNameMin) errors.push(firstNameMin);

    const firstNameMax = validators.maxLength(dto.firstName, 100, 'firstName');
    if (firstNameMax) errors.push(firstNameMax);
  }

  if (dto.lastName !== undefined) {
    const lastNameMin = validators.minLength(dto.lastName, 1, 'lastName');
    if (lastNameMin) errors.push(lastNameMin);

    const lastNameMax = validators.maxLength(dto.lastName, 100, 'lastName');
    if (lastNameMax) errors.push(lastNameMax);
  }

  if (dto.email !== undefined && dto.email !== null) {
    const emailFormat = validators.email(dto.email, 'email');
    if (emailFormat) errors.push(emailFormat);
  }

  if (dto.guardianEmail !== undefined && dto.guardianEmail !== null) {
    const guardianEmailFormat = validators.email(dto.guardianEmail, 'guardianEmail');
    if (guardianEmailFormat) errors.push(guardianEmailFormat);
  }

  if (dto.guardianPhone !== undefined && dto.guardianPhone !== null) {
    const guardianPhoneFormat = validators.phone(dto.guardianPhone, 'guardianPhone');
    if (guardianPhoneFormat) errors.push(guardianPhoneFormat);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate CreateTeacherDto
 */
export function validateCreateTeacher(dto: CreateTeacherDto): ValidationResult {
  const errors: ValidationError[] = [];

  const schoolRequired = validators.required(dto.schoolId, 'schoolId');
  if (schoolRequired) errors.push(schoolRequired);

  const firstNameRequired = validators.required(dto.firstName, 'firstName');
  if (firstNameRequired) errors.push(firstNameRequired);

  const firstNameMin = validators.minLength(dto.firstName, 1, 'firstName');
  if (firstNameMin) errors.push(firstNameMin);

  const firstNameMax = validators.maxLength(dto.firstName, 100, 'firstName');
  if (firstNameMax) errors.push(firstNameMax);

  const lastNameRequired = validators.required(dto.lastName, 'lastName');
  if (lastNameRequired) errors.push(lastNameRequired);

  const lastNameMin = validators.minLength(dto.lastName, 1, 'lastName');
  if (lastNameMin) errors.push(lastNameMin);

  const lastNameMax = validators.maxLength(dto.lastName, 100, 'lastName');
  if (lastNameMax) errors.push(lastNameMax);

  if (dto.email) {
    const emailFormat = validators.email(dto.email, 'email');
    if (emailFormat) errors.push(emailFormat);
  }

  if (dto.phone) {
    const phoneFormat = validators.phone(dto.phone, 'phone');
    if (phoneFormat) errors.push(phoneFormat);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate UpdateTeacherDto
 */
export function validateUpdateTeacher(dto: UpdateTeacherDto): ValidationResult {
  const errors: ValidationError[] = [];

  if (dto.firstName !== undefined) {
    const firstNameMin = validators.minLength(dto.firstName, 1, 'firstName');
    if (firstNameMin) errors.push(firstNameMin);

    const firstNameMax = validators.maxLength(dto.firstName, 100, 'firstName');
    if (firstNameMax) errors.push(firstNameMax);
  }

  if (dto.lastName !== undefined) {
    const lastNameMin = validators.minLength(dto.lastName, 1, 'lastName');
    if (lastNameMin) errors.push(lastNameMin);

    const lastNameMax = validators.maxLength(dto.lastName, 100, 'lastName');
    if (lastNameMax) errors.push(lastNameMax);
  }

  if (dto.email !== undefined && dto.email !== null) {
    const emailFormat = validators.email(dto.email, 'email');
    if (emailFormat) errors.push(emailFormat);
  }

  if (dto.phone !== undefined && dto.phone !== null) {
    const phoneFormat = validators.phone(dto.phone, 'phone');
    if (phoneFormat) errors.push(phoneFormat);
  }

  return { valid: errors.length === 0, errors };
}
