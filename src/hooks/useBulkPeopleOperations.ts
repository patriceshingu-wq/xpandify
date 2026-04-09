import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { Person } from '@/hooks/usePeople';

export interface CsvPerson {
  first_name: string;
  last_name: string;
  preferred_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  primary_language?: 'en' | 'fr';
  person_type: 'staff' | 'volunteer' | 'congregant';
  status?: 'active' | 'inactive' | 'on_leave';
  title?: string;
  campus_code?: string;
  supervisor_email?: string;
  ministry_names?: string;
  start_date?: string;
  notes?: string;
  calling_description?: string;
  strengths?: string;
  growth_areas?: string;
}

export interface ImportValidationResult {
  row: number;
  data: CsvPerson;
  errors: string[];
  warnings: string[];
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

const CSV_HEADERS = [
  'first_name',
  'last_name',
  'preferred_name',
  'email',
  'phone',
  'date_of_birth',
  'gender',
  'primary_language',
  'person_type',
  'status',
  'title',
  'campus_code',
  'supervisor_email',
  'ministry_names',
  'start_date',
  'notes',
  'calling_description',
  'strengths',
  'growth_areas',
];

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip the next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentLine.push(currentField.trim());
        if (currentLine.some(f => f !== '')) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
        if (char === '\r') i++; // Skip \n after \r
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }

  // Don't forget the last field and line
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some(f => f !== '')) {
      lines.push(currentLine);
    }
  }

  return lines;
}

export function generateCSVExport(people: Person[], campuses: { id: string; code: string | null }[]): string {
  const campusMap = new Map(campuses.map(c => [c.id, c.code]));

  const rows = people.map(person => [
    escapeCSV(person.first_name),
    escapeCSV(person.last_name),
    escapeCSV(person.preferred_name),
    escapeCSV(person.email),
    escapeCSV(person.phone),
    escapeCSV(person.date_of_birth),
    escapeCSV(person.gender),
    escapeCSV(person.primary_language),
    escapeCSV(person.person_type),
    escapeCSV(person.status),
    escapeCSV(person.title),
    escapeCSV(person.campus_id ? campusMap.get(person.campus_id) : ''),
    escapeCSV(person.supervisor?.id ? '' : ''), // We'd need to look up email - leaving empty for now
    escapeCSV(person.start_date),
    escapeCSV(person.notes),
    escapeCSV(person.calling_description),
    escapeCSV(person.strengths),
    escapeCSV(person.growth_areas),
  ]);

  const csvContent = [
    CSV_HEADERS.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

export function generateCSVTemplate(): string {
  const exampleRow = [
    'John',
    'Doe',
    'Johnny',
    'john.doe@example.com',
    '+1 555 123 4567',
    '1990-01-15',
    'male',
    'en',
    'staff',
    'active',
    'Worship Pastor',
    'MAIN',
    'supervisor@example.com',
    'Worship;Youth',
    '2024-01-01',
    'Some notes here',
    'Called to worship ministry',
    'Leadership, communication',
    'Administration',
  ];

  return [
    CSV_HEADERS.join(','),
    exampleRow.map(escapeCSV).join(','),
  ].join('\n');
}

export function validateCSVData(
  csvText: string,
  existingEmails: Set<string>,
  campusCodes: Map<string, string>,
  supervisorEmails: Map<string, string>,
  ministryNames?: Map<string, string>
): ImportValidationResult[] {
  const lines = parseCSV(csvText);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].map(h => h.toLowerCase().trim());
  const headerIndices: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerIndices[h] = i;
  });

  const results: ImportValidationResult[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const errors: string[] = [];
    const warnings: string[] = [];

    const getValue = (key: string): string => {
      const idx = headerIndices[key];
      return idx !== undefined && idx < row.length ? row[idx] : '';
    };

    const firstName = getValue('first_name');
    const lastName = getValue('last_name');
    const email = getValue('email');
    const personType = getValue('person_type');
    const gender = getValue('gender');
    const language = getValue('primary_language');
    const status = getValue('status');
    const campusCode = getValue('campus_code');
    const supervisorEmail = getValue('supervisor_email');
    const dateOfBirth = getValue('date_of_birth');
    const startDate = getValue('start_date');

    // Required field validation
    if (!firstName) errors.push('first_name is required');
    if (!lastName) errors.push('last_name is required');
    if (!personType) {
      errors.push('person_type is required');
    } else if (!['staff', 'volunteer', 'congregant'].includes(personType)) {
      errors.push(`Invalid person_type: ${personType}. Must be staff, volunteer, or congregant`);
    }

    // Email validation
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Invalid email format: ${email}`);
      } else if (existingEmails.has(email.toLowerCase())) {
        warnings.push(`Email already exists: ${email}`);
      }
    }

    // Gender validation
    if (gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
      errors.push(`Invalid gender: ${gender}`);
    }

    // Language validation
    if (language && !['en', 'fr'].includes(language)) {
      errors.push(`Invalid primary_language: ${language}. Must be en or fr`);
    }

    // Status validation
    if (status && !['active', 'inactive', 'on_leave'].includes(status)) {
      errors.push(`Invalid status: ${status}`);
    }

    // Campus validation
    if (campusCode && !campusCodes.has(campusCode.toUpperCase())) {
      warnings.push(`Unknown campus_code: ${campusCode}`);
    }

    // Supervisor validation
    if (supervisorEmail && !supervisorEmails.has(supervisorEmail.toLowerCase())) {
      warnings.push(`Supervisor email not found: ${supervisorEmail}`);
    }

    // Date validation
    if (dateOfBirth && isNaN(Date.parse(dateOfBirth))) {
      errors.push(`Invalid date_of_birth format: ${dateOfBirth}. Use YYYY-MM-DD`);
    }
    if (startDate && isNaN(Date.parse(startDate))) {
      errors.push(`Invalid start_date format: ${startDate}. Use YYYY-MM-DD`);
    }

    results.push({
      row: i + 1, // 1-indexed for display
      data: {
        first_name: firstName,
        last_name: lastName,
        preferred_name: getValue('preferred_name') || undefined,
        email: email || undefined,
        phone: getValue('phone') || undefined,
        date_of_birth: dateOfBirth || undefined,
        gender: gender as CsvPerson['gender'] || undefined,
        primary_language: (language || 'en') as 'en' | 'fr',
        person_type: personType as CsvPerson['person_type'],
        status: (status || 'active') as CsvPerson['status'],
        title: getValue('title') || undefined,
        campus_code: campusCode || undefined,
        supervisor_email: supervisorEmail || undefined,
        start_date: startDate || undefined,
        notes: getValue('notes') || undefined,
        calling_description: getValue('calling_description') || undefined,
        strengths: getValue('strengths') || undefined,
        growth_areas: getValue('growth_areas') || undefined,
      },
      errors,
      warnings,
    });
  }

  return results;
}

export function useBulkImportPeople() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: async ({
      people,
      campusCodes,
      supervisorEmails,
    }: {
      people: CsvPerson[];
      campusCodes: Map<string, string>;
      supervisorEmails: Map<string, string>;
    }): Promise<ImportResult> => {
      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (let i = 0; i < people.length; i++) {
        const person = people[i];

        try {
          // Resolve campus_id from campus_code
          let campus_id: string | null = null;
          if (person.campus_code) {
            campus_id = campusCodes.get(person.campus_code.toUpperCase()) || null;
          }

          // Resolve supervisor_id from supervisor_email
          let supervisor_id: string | null = null;
          if (person.supervisor_email) {
            supervisor_id = supervisorEmails.get(person.supervisor_email.toLowerCase()) || null;
          }

          const { error } = await supabase.from('people').insert({
            first_name: person.first_name,
            last_name: person.last_name,
            preferred_name: person.preferred_name || null,
            email: person.email || null,
            phone: person.phone || null,
            date_of_birth: person.date_of_birth || null,
            gender: person.gender || null,
            primary_language: person.primary_language || 'en',
            person_type: person.person_type,
            status: person.status || 'active',
            title: person.title || null,
            campus_id,
            supervisor_id,
            start_date: person.start_date || null,
            notes: person.notes || null,
            calling_description: person.calling_description || null,
            strengths: person.strengths || null,
            growth_areas: person.growth_areas || null,
          });

          if (error) {
            result.failed++;
            result.errors.push({ row: i + 2, error: error.message });
          } else {
            result.success++;
          }
        } catch (err) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['people'] });

      if (result.failed === 0) {
        toast.success(t('people.importSuccess').replace('{count}', String(result.success)));
      } else {
        toast.warning(
          t('people.importPartial')
            .replace('{success}', String(result.success))
            .replace('{failed}', String(result.failed))
        );
      }
    },
    onError: (error: Error) => {
      console.error('[useBulkImportPeople] Error:', error);
      toast.error(t('people.importError'));
    },
  });
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
