import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePeople } from '@/hooks/usePeople';
import { useCampuses } from '@/hooks/useCampuses';
import { useMinistries } from '@/hooks/useMinistries';
import {
  validateCSVData,
  generateCSVTemplate,
  downloadCSV,
  useBulkImportPeople,
  ImportValidationResult,
} from '@/hooks/useBulkPeopleOperations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = 'upload' | 'preview' | 'result';

export function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useBulkImportPeople();

  const { data: existingPeople } = usePeople();
  const { data: campuses } = useCampuses();
  const { data: ministries } = useMinistries();

  const [step, setStep] = useState<ImportStep>('upload');
  const [csvContent, setCsvContent] = useState<string>('');
  const [validationResults, setValidationResults] = useState<ImportValidationResult[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('upload');
      setCsvContent('');
      setValidationResults([]);
      setImportResult(null);
    }
  }, [open]);

  const existingEmails = new Set(
    (existingPeople || [])
      .filter(p => p.email)
      .map(p => p.email!.toLowerCase())
  );

  const campusCodes = new Map(
    (campuses || [])
      .filter(c => c.code)
      .map(c => [c.code!.toUpperCase(), c.id])
  );

  const supervisorEmails = new Map(
    (existingPeople || [])
      .filter(p => p.email)
      .map(p => [p.email!.toLowerCase(), p.id])
  );

  const ministryNameMap = new Map(
    (ministries || []).map(m => [m.name_en.toLowerCase(), m.id])
  );

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    downloadCSV(template, 'people_import_template.csv');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);

      const results = validateCSVData(text, existingEmails, campusCodes, supervisorEmails, ministryNameMap);
      setValidationResults(results);
      setStep('preview');
    };
    reader.readAsText(file);

    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const handleImport = async () => {
    const validPeople = validationResults
      .filter(r => r.errors.length === 0)
      .map(r => r.data);

    if (validPeople.length === 0) return;

    const result = await importMutation.mutateAsync({
      people: validPeople,
      campusCodes,
      supervisorEmails,
      ministryNames: ministryNameMap,
    });

    setImportResult(result);
    setStep('result');
  };

  const errorCount = validationResults.filter(r => r.errors.length > 0).length;
  const warningCount = validationResults.filter(r => r.warnings.length > 0 && r.errors.length === 0).length;
  const validCount = validationResults.filter(r => r.errors.length === 0).length;

  const formContent = (
    <div className="space-y-4">
      <Tabs value={step} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" disabled={step !== 'upload'}>
            1. {t('people.importUpload')}
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={step === 'upload'}>
            2. {t('people.importPreview')}
          </TabsTrigger>
          <TabsTrigger value="result" disabled={step !== 'result'}>
            3. {t('people.importResult')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>{t('people.importInstructions')}</AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              {t('people.downloadTemplate')}
            </Button>
          </div>

          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{t('people.importDropzone')}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-success" />
              {validCount} {t('people.importValid')}
            </Badge>
            {warningCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3 w-3 text-warning" />
                {warningCount} {t('people.importWarnings')}
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {errorCount} {t('people.importErrors')}
              </Badge>
            )}
          </div>

          {errorCount > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t('people.importErrorsWillSkip')}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="h-[300px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">{t('people.importRow')}</TableHead>
                  <TableHead>{t('common.name')}</TableHead>
                  <TableHead>{t('common.email')}</TableHead>
                  <TableHead>{t('common.type')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationResults.map((result) => (
                  <TableRow
                    key={result.row}
                    className={
                      result.errors.length > 0
                        ? 'bg-destructive/5'
                        : result.warnings.length > 0
                        ? 'bg-warning/5'
                        : ''
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {result.errors.length > 0 ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : result.warnings.length > 0 ? (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                        {result.row}
                      </div>
                    </TableCell>
                    <TableCell>
                      {result.data.first_name} {result.data.last_name}
                      {result.errors.length > 0 && (
                        <p className="text-xs text-destructive mt-1">{result.errors.join('; ')}</p>
                      )}
                      {result.warnings.length > 0 && result.errors.length === 0 && (
                        <p className="text-xs text-warning mt-1">{result.warnings.join('; ')}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{result.data.email || '-'}</TableCell>
                    <TableCell className="text-sm capitalize">{result.data.person_type}</TableCell>
                    <TableCell className="text-sm capitalize">{result.data.status || 'active'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStep('upload');
                setCsvContent('');
                setValidationResults([]);
              }}
            >
              {t('common.back')}
            </Button>
            <Button
              onClick={handleImport}
              disabled={validCount === 0 || importMutation.isPending}
            >
              {importMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('people.importButton').replace('{count}', String(validCount))}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="result" className="space-y-4 mt-4">
          {importResult && (
            <>
              <div className="text-center py-6">
                <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-3" />
                <h3 className="text-lg font-medium">{t('people.importComplete')}</h3>
                <p className="text-muted-foreground mt-1">
                  {t('people.importSummary')
                    .replace('{success}', String(importResult.success))
                    .replace('{failed}', String(importResult.failed))}
                </p>
              </div>

              <div className="flex justify-center">
                <Button onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{t('people.bulkImport')}</DrawerTitle>
            <DrawerDescription>{t('people.bulkImportDescription')}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('people.bulkImport')}</DialogTitle>
          <DialogDescription>{t('people.bulkImportDescription')}</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
