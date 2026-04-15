-- Part 1: Ministries + Church-level goals

-- Top-level ministries
INSERT INTO ministries (id, name_en, name_fr)
  SELECT gen_random_uuid(), 'Next-Gen Ministry', 'Next-Gen Ministry'
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Next-Gen Ministry');

INSERT INTO ministries (id, name_en, name_fr)
  SELECT gen_random_uuid(), 'Family Care Ministry', 'Family Care Ministry'
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Family Care Ministry');

INSERT INTO ministries (id, name_en, name_fr)
  SELECT gen_random_uuid(), 'Hospitality Services', 'Hospitality Services'
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Hospitality Services');

INSERT INTO ministries (id, name_en, name_fr)
  SELECT gen_random_uuid(), 'Discipleship Ministry', 'Discipleship Ministry'
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Discipleship Ministry');

INSERT INTO ministries (id, name_en, name_fr)
  SELECT gen_random_uuid(), 'Outreach Ministry', 'Outreach Ministry'
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Outreach Ministry');

INSERT INTO ministries (id, name_en, name_fr)
  SELECT gen_random_uuid(), 'Communications Team', 'Communications Team'
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Communications Team');

INSERT INTO ministries (id, name_en, name_fr)
  SELECT gen_random_uuid(), 'MC Music', 'MC Music'
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'MC Music');

-- Sub-department ministries
INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Kids Ministry', 'Kids Ministry',
    (SELECT id FROM ministries WHERE name_en = 'Next-Gen Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Kids Ministry');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Students Ministry', 'Students Ministry',
    (SELECT id FROM ministries WHERE name_en = 'Next-Gen Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Students Ministry');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Young Adults Ministry', 'Young Adults Ministry',
    (SELECT id FROM ministries WHERE name_en = 'Next-Gen Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Young Adults Ministry');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Ladies Ministry', 'Ladies Ministry',
    (SELECT id FROM ministries WHERE name_en = 'Family Care Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Ladies Ministry');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Men''s Ministry', 'Men''s Ministry',
    (SELECT id FROM ministries WHERE name_en = 'Family Care Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Men''s Ministry');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Membership Services', 'Membership Services',
    (SELECT id FROM ministries WHERE name_en = 'Family Care Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Membership Services');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Social Integration', 'Social Integration',
    (SELECT id FROM ministries WHERE name_en = 'Family Care Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Social Integration');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Parking Team', 'Parking Team',
    (SELECT id FROM ministries WHERE name_en = 'Hospitality Services' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Parking Team');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Greeting / Entry Team', 'Greeting / Entry Team',
    (SELECT id FROM ministries WHERE name_en = 'Hospitality Services' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Greeting / Entry Team');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Welcome Center Team', 'Welcome Center Team',
    (SELECT id FROM ministries WHERE name_en = 'Hospitality Services' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Welcome Center Team');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Ushers / Seating Team', 'Ushers / Seating Team',
    (SELECT id FROM ministries WHERE name_en = 'Hospitality Services' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Ushers / Seating Team');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Pastoral & Guest Services', 'Pastoral & Guest Services',
    (SELECT id FROM ministries WHERE name_en = 'Hospitality Services' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Pastoral & Guest Services');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Next Steps Program', 'Next Steps Program',
    (SELECT id FROM ministries WHERE name_en = 'Discipleship Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Next Steps Program');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Small Groups', 'Small Groups',
    (SELECT id FROM ministries WHERE name_en = 'Discipleship Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Small Groups');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Prayer Teams', 'Prayer Teams',
    (SELECT id FROM ministries WHERE name_en = 'Discipleship Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Prayer Teams');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Sacraments & Special Services', 'Sacraments & Special Services',
    (SELECT id FROM ministries WHERE name_en = 'Discipleship Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Sacraments & Special Services');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Evangelism', 'Evangelism',
    (SELECT id FROM ministries WHERE name_en = 'Outreach Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Evangelism');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Missions', 'Missions',
    (SELECT id FROM ministries WHERE name_en = 'Outreach Ministry' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Missions');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Sound & Lights Team', 'Sound & Lights Team',
    (SELECT id FROM ministries WHERE name_en = 'Communications Team' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Sound & Lights Team');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Tech Team', 'Tech Team',
    (SELECT id FROM ministries WHERE name_en = 'Communications Team' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Tech Team');

INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)
  SELECT gen_random_uuid(), 'Creative Team', 'Creative Team',
    (SELECT id FROM ministries WHERE name_en = 'Communications Team' LIMIT 1)
  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = 'Creative Team');

-- Church-level quarterly theme goals
INSERT INTO goals (id, title_en, title_fr, description_en, goal_level, category, status, progress_percent, year, start_date, due_date)
  SELECT gen_random_uuid(),
    'Faith as the Engine of Expansion', 'Faith as the Engine of Expansion',
    'Q1 church-wide theme for Vision 2026',
    'church', 'spiritual', 'not_started', 0, 2026,
    '2026-01-01'::date, '2026-03-31'::date
  WHERE NOT EXISTS (
    SELECT 1 FROM goals WHERE title_en = 'Faith as the Engine of Expansion' AND goal_level = 'church' AND year = 2026
  );

INSERT INTO goals (id, title_en, title_fr, description_en, goal_level, category, status, progress_percent, year, start_date, due_date)
  SELECT gen_random_uuid(),
    'Family as the Foundation of Expansion', 'Family as the Foundation of Expansion',
    'Q2 church-wide theme for Vision 2026',
    'church', 'discipleship', 'not_started', 0, 2026,
    '2026-04-01'::date, '2026-06-30'::date
  WHERE NOT EXISTS (
    SELECT 1 FROM goals WHERE title_en = 'Family as the Foundation of Expansion' AND goal_level = 'church' AND year = 2026
  );

INSERT INTO goals (id, title_en, title_fr, description_en, goal_level, category, status, progress_percent, year, start_date, due_date)
  SELECT gen_random_uuid(),
    'Church as a Mobilized Force', 'Church as a Mobilized Force',
    'Q3 church-wide theme for Vision 2026',
    'church', 'evangelism', 'not_started', 0, 2026,
    '2026-07-01'::date, '2026-09-30'::date
  WHERE NOT EXISTS (
    SELECT 1 FROM goals WHERE title_en = 'Church as a Mobilized Force' AND goal_level = 'church' AND year = 2026
  );

INSERT INTO goals (id, title_en, title_fr, description_en, goal_level, category, status, progress_percent, year, start_date, due_date)
  SELECT gen_random_uuid(),
    'Possession and Consolidation', 'Possession and Consolidation',
    'Q4 church-wide theme for Vision 2026',
    'church', 'operational', 'not_started', 0, 2026,
    '2026-10-01'::date, '2026-12-31'::date
  WHERE NOT EXISTS (
    SELECT 1 FROM goals WHERE title_en = 'Possession and Consolidation' AND goal_level = 'church' AND year = 2026
  );