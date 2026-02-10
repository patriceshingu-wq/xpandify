
-- Create Q2, Q3, Q4 2026 quarters
INSERT INTO public.quarters (year, quarter_number, theme_en, theme_fr, start_date, end_date)
VALUES
  (2026, 2, 'Q2 2026', 'T2 2026', '2026-04-01', '2026-06-30'),
  (2026, 3, 'Q3 2026', 'T3 2026', '2026-07-01', '2026-09-30'),
  (2026, 4, 'Q4 2026', 'T4 2026', '2026-10-01', '2026-12-31');

-- Fix Q1 2026 end_date
UPDATE public.quarters SET end_date = '2026-03-31' WHERE year = 2026 AND quarter_number = 1;

-- "At His Feet" Q1 (March 23-29), Q2 (June 22-28), Q3 (Sep 21-27)
INSERT INTO public.events (title_en, title_fr, description_en, description_fr, date, is_all_day, language, quarter_id, status)
VALUES
  ('At His Feet', 'À Ses Pieds', 'A week of focused worship, prayer, and seeking God''s presence', 'Une semaine d''adoration concentrée, de prière et de recherche de la présence de Dieu', '2026-03-23', true, 'EN', (SELECT id FROM public.quarters WHERE year = 2026 AND quarter_number = 1), 'Planned'),
  ('At His Feet', 'À Ses Pieds', 'A week of focused worship, prayer, and seeking God''s presence', 'Une semaine d''adoration concentrée, de prière et de recherche de la présence de Dieu', '2026-06-22', true, 'EN', (SELECT id FROM public.quarters WHERE year = 2026 AND quarter_number = 2), 'Planned'),
  ('At His Feet', 'À Ses Pieds', 'A week of focused worship, prayer, and seeking God''s presence', 'Une semaine d''adoration concentrée, de prière et de recherche de la présence de Dieu', '2026-09-21', true, 'EN', (SELECT id FROM public.quarters WHERE year = 2026 AND quarter_number = 3), 'Planned');

-- "One Week at Jesus' Feet" Q1, Q2, Q3
INSERT INTO public.events (title_en, title_fr, description_en, description_fr, date, is_all_day, language, quarter_id, status)
VALUES
  ('One Week at Jesus'' Feet', 'Une Semaine aux Pieds de Jésus', 'French-language intensive week of worship and prayer', 'Semaine intensive francophone d''adoration et de prière', '2026-03-23', true, 'FR', (SELECT id FROM public.quarters WHERE year = 2026 AND quarter_number = 1), 'Planned'),
  ('One Week at Jesus'' Feet', 'Une Semaine aux Pieds de Jésus', 'French-language intensive week of worship and prayer', 'Semaine intensive francophone d''adoration et de prière', '2026-06-22', true, 'FR', (SELECT id FROM public.quarters WHERE year = 2026 AND quarter_number = 2), 'Planned'),
  ('One Week at Jesus'' Feet', 'Une Semaine aux Pieds de Jésus', 'French-language intensive week of worship and prayer', 'Semaine intensive francophone d''adoration et de prière', '2026-09-21', true, 'FR', (SELECT id FROM public.quarters WHERE year = 2026 AND quarter_number = 3), 'Planned');

-- "21 Days of Prayer" - US Thanksgiving 2026 = Nov 26, Monday after = Nov 30, ends Dec 20
INSERT INTO public.events (title_en, title_fr, description_en, description_fr, date, is_all_day, language, quarter_id, status)
VALUES ('21 Days of Prayer', '21 Jours de prière', 'Three weeks of focused prayer and fasting', 'Trois semaines de prière et de jeûne concentrés', '2026-11-30', true, 'Bilingual', (SELECT id FROM public.quarters WHERE year = 2026 AND quarter_number = 4), 'Planned');

-- Delete converted programs
DELETE FROM public.programs WHERE code IN ('AFJ', '1SPJ', '21DAYS');
