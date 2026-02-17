

# Restore Language Dropdown on Event Editor Page

## Problem
The Language selector (English / French / Bilingual) was removed from the Event Editor form. The `formData.language` field still exists in state (line 80 of `EventEditor.tsx`) and is submitted correctly, but there is no UI control to change it -- it always defaults to "Bilingual".

## Fix

### `src/pages/calendar/EventEditor.tsx`
Add a Language dropdown (Select) in the "Organization" card section (around line 479-569), alongside Ministry, Quarter, Program, Category, and Course selectors. The dropdown will have three options: English, French, and Bilingual.

The select will be inserted as the first field in the Organization card, using the same pattern as the other selects:

```tsx
<div className="space-y-2">
  <Label>{t('calendar.language') || 'Language'}</Label>
  <Select
    value={formData.language}
    onValueChange={(v: ProgramLanguage) => setFormData({ ...formData, language: v })}
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="EN">English</SelectItem>
      <SelectItem value="FR">Fran&ccedil;ais</SelectItem>
      <SelectItem value="Bilingual">{t('calendar.bilingual') || 'Bilingual'}</SelectItem>
    </SelectContent>
  </Select>
</div>
```

No other files need changes -- the `ProgramLanguage` type is already imported and the `formData.language` state is already wired up for submission.

