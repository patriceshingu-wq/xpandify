/**
 * Generates a Supabase SQL migration that seeds ministries and goals
 * from the MC Church Leadership Hub data.
 *
 * Usage: node scripts/generate-goals-migration.cjs > supabase/migrations/YYYYMMDD_seed_ministry_goals.sql
 */

// ── Source data (extracted from mc-church-ui/lib/leaders-data/ministries.ts) ──

const QUARTER_DATES = {
  Q1: { start: '2026-01-01', end: '2026-03-31' },
  Q2: { start: '2026-04-01', end: '2026-06-30' },
  Q3: { start: '2026-07-01', end: '2026-09-30' },
  Q4: { start: '2026-10-01', end: '2026-12-31' },
};

const QUARTER_CATEGORIES = {
  Q1: 'spiritual',
  Q2: 'discipleship',
  Q3: 'evangelism',
  Q4: 'operational',
};

const QUARTER_THEMES = {
  Q1: 'Faith as the Engine of Expansion',
  Q2: 'Family as the Foundation of Expansion',
  Q3: 'Church as a Mobilized Force',
  Q4: 'Possession and Consolidation',
};

// 7 top-level ministries with their sub-departments and quarterly goals
const ministries = [
  {
    id: 'next-gen',
    name: 'Next-Gen Ministry',
    quarters: [
      {
        id: 'Q1', focus: 'Spiritual foundations + unified direction across all Next-Gen departments.',
        goals: [
          'Align Kids, Students, and Young Adults around one clear Next-Gen vision and discipleship approach.',
          'Strengthen biblical faithfulness and theological clarity through curriculum alignment.',
          'Recruit, screen, and train volunteers and leaders to build consistency and culture.',
          'Establish safe, well-run environments (policies, processes, accountability).',
        ]
      },
      {
        id: 'Q2', focus: 'Parent partnership + relational strengthening for every age group.',
        goals: [
          'Equip parents/guardians as primary disciplers at home.',
          'Strengthen family engagement points that connect church life to home life.',
          'Provide relational support content for Students and Young Adults (identity, boundaries, healthy relationships).',
          'Create clear transition processes between departments (Kids → Students → Young Adults).',
        ]
      },
      {
        id: 'Q3', focus: 'Activation, evangelism, and visible faith expression (age-appropriate).',
        goals: [
          'Move Next-Gen from participation to ownership through service, outreach, and mission exposure.',
          'Create leadership pipelines for Students and Young Adults (team leads, peer mentors, ministry assistants).',
          'Build pathways for Kids to express faith publicly in healthy, joyful ways.',
        ]
      },
      {
        id: 'Q4', focus: 'Sustainability, leadership depth, and long-term structure.',
        goals: [
          'Consolidate what was built: systems, volunteer teams, curriculum rhythm, and leadership pipeline.',
          'Reduce dependency on a few individuals by developing additional leaders and backups.',
          'Evaluate ministry effectiveness and prepare a scalable 2027 plan.',
        ]
      },
    ],
    subDepartments: [
      {
        id: 'kids', name: 'Kids Ministry',
        quarters: [
          { id: 'Q1', focus: 'Foundations + consistency + safety excellence.', goals: [
            'Strengthen weekly Kids services (worship, teaching, activities) with consistent flow and spiritual clarity.',
            'Build and stabilize volunteer coverage (nursery, classrooms, check-in).',
            'Confirm curriculum by age group with strong biblical foundations.',
            'Reinforce safety, cleanliness, and security standards.',
          ]},
          { id: 'Q2', focus: 'Parent partnership + discipleship at home.', goals: [
            'Improve parent engagement and at-home reinforcement of lessons.',
            'Strengthen family connection points (first-time families, milestones, transitions).',
          ]},
          { id: 'Q3', focus: 'Visible faith expression + serving pipeline (age-appropriate).', goals: [
            'Create outreach-friendly Kids moments that invite families and build community.',
            'Mentor and equip emerging young leaders (helpers, junior volunteers).',
          ]},
          { id: 'Q4', focus: 'Sustainability + seasonal excellence.', goals: [
            'Deliver strong seasonal programs (e.g., Christmas play) with spiritual impact and strong organization.',
            'Consolidate volunteer teams and training for next year.',
          ]},
        ],
      },
      {
        id: 'students', name: 'Students Ministry',
        quarters: [
          { id: 'Q1', focus: 'Spiritual foundation + consistent weekly rhythms.', goals: [
            'Strengthen youth services, small groups, and Bible study rhythms.',
            'Build relational connection and pastoral care structures for students.',
            'Recruit and develop a reliable volunteer leadership team.',
          ]},
          { id: 'Q2', focus: 'Parent partnership + life-issues discipleship.', goals: [
            'Strengthen parent communication and partnership in discipleship at home.',
            'Address real-life issues with biblical truth (identity, purity, decisions, peer pressure).',
          ]},
          { id: 'Q3', focus: 'Leadership activation + outreach.', goals: [
            'Increase student involvement in serving and worship.',
            'Execute camps/mission trips/outreach events that build faith and community impact.',
          ]},
          { id: 'Q4', focus: 'Continuity + transitions + retention.', goals: [
            'Strengthen discipleship continuity and prepare students for transitions (especially seniors).',
            'Consolidate volunteer team health and next-year calendar planning.',
          ]},
        ],
      },
      {
        id: 'young-adults', name: 'Young Adults Ministry',
        quarters: [
          { id: 'Q1', focus: 'Spiritual formation + consistent gathering culture.', goals: [
            'Establish predictable rhythms (worship nights, Bible studies, fellowship).',
            'Build strong community connection and a discipling culture (mentoring, small groups).',
          ]},
          { id: 'Q2', focus: 'Life-stage formation and relational health.', goals: [
            'Provide guidance for major transitions (school, career, relationships, engagement/marriage prep).',
            'Strengthen spiritual habits in daily life (not event-driven Christianity).',
          ]},
          { id: 'Q3', focus: 'Leadership development + outreach expression.', goals: [
            'Activate Young Adults in church-wide serving and community impact.',
            'Develop leaders who can host, teach, lead groups, and serve across departments.',
          ]},
          { id: 'Q4', focus: 'Sustainability + leadership multiplication + next-year roadmap.', goals: [
            'Raise new leaders and reduce dependence on a small core.',
            'Consolidate systems (communications, planning, volunteer coordination, follow-up).',
          ]},
        ],
      },
    ],
  },
  {
    id: 'family-care',
    name: 'Family Care Ministry',
    quarters: [
      { id: 'Q1', focus: 'Build the care foundation: vision, systems, and trained teams.', goals: [
        "Clarify Family Care's vision, department roles, and referral pathways (who handles what).",
        'Establish reliable care systems: intake, triage, follow-up, confidentiality, escalation.',
        'Train leaders/volunteers in hospitality, care basics, and relational discipleship.',
      ]},
      { id: 'Q2', focus: 'Strengthen households, relationships, and church-wide fellowship.', goals: [
        'Deliver initiatives that strengthen families (marriages, parenting support, relational health).',
        'Increase belonging through intentional fellowship and connection points.',
        'Improve care follow-through in partnership with Discipleship pathways.',
      ]},
      { id: 'Q3', focus: 'A caring church visible in unity, hospitality, and support.', goals: [
        'Embed a culture where members actively welcome, include, and care for others.',
        'Equip volunteers and department leaders to serve consistently without burnout.',
        'Support church-wide initiatives by ensuring people are cared for, connected, and followed up.',
      ]},
      { id: 'Q4', focus: 'Sustainable systems, evaluation, and 2027 readiness.', goals: [
        "Evaluate care systems and department health; improve what's weak.",
        'Strengthen crisis response readiness and pastoral care coordination.',
        'Build a scalable 2027 plan (calendar, trainings, leaders, and resourcing).',
      ]},
    ],
    subDepartments: [
      {
        id: 'ladies', name: 'Ladies Ministry',
        quarters: [
          { id: 'Q1', focus: 'Establish strong spiritual rhythms and community connection.', goals: [
            'Launch/strengthen regular gatherings for Bible study, prayer, and fellowship.',
            "Build a clear women's discipleship culture (warm, Word-centered, Spirit-led).",
            'Recruit and organize a volunteer team to support ministry operations.',
          ]},
          { id: 'Q2', focus: 'Mentoring and life-stage discipleship for women.', goals: [
            'Create mentoring opportunities for women across life stages.',
            "Strengthen women's roles in faith at home (prayer, character, parenting support).",
          ]},
          { id: 'Q3', focus: 'Women serving and impacting others.', goals: [
            'Expand service projects and outreach expressions led by women.',
            'Encourage leadership development and participation across church life.',
          ]},
          { id: 'Q4', focus: 'Sustainability and leadership depth.', goals: [
            'Strengthen systems and raise more women leaders.',
            'Finish the year with unity, celebration, and clear next steps.',
          ]},
        ],
      },
      {
        id: 'mens', name: "Men's Ministry",
        quarters: [
          { id: 'Q1', focus: 'Establish discipleship and brotherhood rhythms.', goals: [
            "Launch/strengthen regular men's Bible study, prayer, and fellowship.",
            'Build a culture of integrity and accountability among men.',
            'Identify and develop core leaders to share responsibility.',
          ]},
          { id: 'Q2', focus: 'Men strengthened for family responsibility.', goals: [
            'Support men through life transitions and spiritual challenges.',
            'Equip men to lead spiritually in their homes (as appropriate to their situation).',
          ]},
          { id: 'Q3', focus: 'Men serving and building the church/community.', goals: [
            'Coordinate service projects and visible outreach involvement.',
            'Increase male involvement across church life and departments.',
          ]},
          { id: 'Q4', focus: 'Sustainability, leadership multiplication, and next-year plan.', goals: [
            'Strengthen ministry systems and build a 2027 roadmap.',
            'Celebrate growth and retain momentum.',
          ]},
        ],
      },
      {
        id: 'membership-services', name: 'Membership Services',
        quarters: [
          { id: 'Q1', focus: 'Establish strong systems for care tracking and integration.', goals: [
            'Strengthen member engagement tracking, follow-up, and care documentation.',
            'Improve new member welcoming and integration systems.',
          ]},
          { id: 'Q2', focus: 'Member care across life stages and households.', goals: [
            'Ensure care processes support families, couples, and special needs.',
            'Strengthen hospitality culture church-wide through coordination and visibility.',
          ]},
          { id: 'Q3', focus: 'Caring church culture visible in connection and follow-through.', goals: [
            'Improve follow-up after major services/events (including outreach moments).',
            'Strengthen communications and logistics that support member-related services.',
          ]},
          { id: 'Q4', focus: 'Sustainability, reporting, and 2027 readiness.', goals: [
            'Evaluate member care systems and improve response consistency.',
            'Build a stable calendar and support plan for next year.',
          ]},
        ],
      },
      {
        id: 'social-integration', name: 'Social Integration',
        quarters: [
          { id: 'Q1', focus: 'Build belonging pathways for newcomers (especially immigrants).', goals: [
            'Create a welcoming system that helps newcomers understand church life and find community.',
            'Recruit and train a culturally sensitive volunteer team.',
          ]},
          { id: 'Q2', focus: 'Multicultural and intergenerational unity in the church.', goals: [
            'Create events that build unity across cultures and generations.',
            'Provide practical support guidance for immigrant families adapting to life in America.',
          ]},
          { id: 'Q3', focus: 'Immigrant families engaged in serving and outreach.', goals: [
            'Help immigrant members move from "attending" to "belonging and serving."',
            'Partner with Outreach and Discipleship for community-building mission moments.',
          ]},
          { id: 'Q4', focus: 'Sustainable systems and 2027 roadmap.', goals: [
            'Evaluate integration health and strengthen volunteer leadership depth.',
            'Build an annual calendar of culturally relevant events and rhythms.',
          ]},
        ],
      },
    ],
  },
  {
    id: 'hospitality',
    name: 'Hospitality Services',
    quarters: [
      { id: 'Q1', focus: 'Vision, identity, and clarity of roles across the guest journey.', goals: [
        'Re-establish Hospitality as frontline ministry, not logistics; build spiritual unity and serving identity.',
        'Clarify roles and responsibilities for each team and each service phase (before/during/after).',
        'Stabilize service-day leadership by strengthening Team Leader coverage and expectations.',
      ]},
      { id: 'Q2', focus: 'Structure, volunteer development, scheduling, and training.', goals: [
        'Increase volunteer participation and consistency through a clear onboarding pathway.',
        'Reduce burnout via better structure and scheduling (rotation depth, substitutes, coverage).',
        'Train volunteers for excellence, awareness, and service flow execution (before/during/after).',
      ]},
      { id: 'Q3', focus: 'Relational excellence and guest experience improvements that remove barriers to worship.', goals: [
        'Improve guest experience so guests feel consistently noticed, guided, and respected.',
        'Standardize "high-impact behaviors" across teams (warm greeting, proactive help, clear direction, discreet support).',
        'Strengthen service flow coordination with Worship/Production/Media so services are smooth and distraction-free.',
      ]},
      { id: 'Q4', focus: 'Sustainability, leadership depth, accountability, and readiness for growth.', goals: [
        'Stabilize volunteer teams and leadership structure for long-term consistency.',
        'Strengthen accountability and ownership for service standards and conduct.',
        'Prepare Hospitality to support growth and increased attendance with excellence.',
      ]},
    ],
    subDepartments: [
      {
        id: 'parking', name: 'Parking Team',
        quarters: [
          { id: 'Q1', focus: 'Clarity, readiness, and service-day consistency.', goals: [
            'Establish clear parking roles, zones, and communication expectations (who directs, who welcomes, who assists).',
            'Improve reliability: volunteers arrive on time, know the plan, and execute calmly.',
            'Strengthen safety awareness and escalation habits (observe, communicate, escalate appropriately).',
          ]},
          { id: 'Q2', focus: 'Guest-friendly flow, accessibility, and volunteer development.', goals: [
            'Improve the experience for families, elderly guests, and those with mobility challenges.',
            'Strengthen volunteer consistency through better scheduling and mentoring.',
            'Reduce confusion by improving signage and directions.',
          ]},
          { id: 'Q3', focus: 'High-attendance readiness and excellent first impressions for guests.', goals: [
            'Prepare the Parking Team to support church-wide events with excellence.',
            'Increase capacity: more trained volunteers, faster setup, smoother entry/exit.',
            'Strengthen coordination with Greeters/Entry and Welcome Center so guests are seamlessly handed off.',
          ]},
          { id: 'Q4', focus: 'Sustainability, evaluation, and 2027 readiness.', goals: [
            'Make the Parking Team consistent and sustainable (strong leaders, stable scheduling, clear standards).',
            'Improve safety readiness and reduce recurring bottlenecks.',
            'Produce a clear improvement plan for next year.',
          ]},
        ],
      },
      {
        id: 'greeting-entry', name: 'Greeting / Entry Team',
        quarters: [
          { id: 'Q1', focus: 'Identity, standards, and service-day consistency.', goals: [
            "Establish a shared spiritual identity: greeting is not \"hello,\" it's frontline ministry.",
            'Standardize Entry Team practices (doors, flow, tone, guest identification, escalation).',
            'Build reliable volunteer coverage and clear role assignments each service.',
          ]},
          { id: 'Q2', focus: 'Belonging, accessibility, and guest care with excellence.', goals: [
            'Improve hospitality for families, elderly guests, and visitors unfamiliar with church flow.',
            'Strengthen teamwork with Welcome Center and Ushers for smooth routing.',
            'Reduce congestion and confusion at entry points.',
          ]},
          { id: 'Q3', focus: 'Guest experience excellence during high-attendance and outreach moments.', goals: [
            'Ensure first-time guests feel guided and respected during big Sundays/events.',
            "Strengthen the team's ability to manage flow while maintaining warmth.",
            "Increase the team's capacity through training and leadership development.",
          ]},
          { id: 'Q4', focus: 'Sustainability, quality control, and 2027 readiness.', goals: [
            'Lock in consistent entrance standards across all services.',
            'Strengthen leadership depth (backups for every entrance zone).',
            'Evaluate and improve based on what was learned.',
          ]},
        ],
      },
      {
        id: 'welcome-center', name: 'Welcome Center Team',
        quarters: [
          { id: 'Q1', focus: 'Clarity, readiness, and a consistent "first-time guest" experience.', goals: [
            'Standardize Welcome Center responsibilities and service flow (before/during/after service).',
            'Ensure the Welcome Center is consistently staffed, stocked, and ready 30 minutes before service.',
            'Establish a simple, repeatable process for identifying and assisting first-time guests.',
          ]},
          { id: 'Q2', focus: 'Connection pathways and follow-through for households and newcomers.', goals: [
            'Improve clarity for families and newcomers (Kids routing, service information, facilities orientation).',
            'Strengthen handoffs to Next Steps and other ministries (without "dropping" guests).',
            'Increase the consistency of post-service connection and follow-up support.',
          ]},
          { id: 'Q3', focus: 'High-capacity connection during outreach and high-attendance events.', goals: [
            'Ensure guests from outreach and special events are guided into clear next steps.',
            'Improve speed, warmth, and clarity during high-traffic moments.',
            "Expand the team's capacity through training and apprentice development.",
          ]},
          { id: 'Q4', focus: 'Systems, evaluation, and 2027 readiness.', goals: [
            'Make the Welcome Center sustainable and consistent across services and the full year.',
            'Improve quality control: materials, messaging, and volunteer readiness.',
            'Produce a clear improvement plan for the next year.',
          ]},
        ],
      },
      {
        id: 'ushers', name: 'Ushers / Seating Team',
        quarters: [
          { id: 'Q1', focus: 'Order, role clarity, and consistent sanctuary flow.', goals: [
            'Establish clear usher roles and service-day responsibilities (before/during/after service).',
            'Standardize seating strategy to reduce confusion and support late arrivals.',
            'Reinforce ushers as ministry-minded servants: calm, attentive, spiritually aware.',
          ]},
          { id: 'Q2', focus: 'Care, accessibility, and guest-friendly seating.', goals: [
            'Improve seating experience for families, elderly guests, and those with mobility needs.',
            'Strengthen coordination with Greeting/Entry and Welcome Center for smooth guest handoff.',
            'Reduce stress points (overflow, crowded sections, unclear seating availability).',
          ]},
          { id: 'Q3', focus: 'High-capacity service readiness and event excellence.', goals: [
            'Prepare for high-attendance Sundays and outreach/special events with smooth seating flow.',
            'Improve usher capacity through training, cross-coverage, and apprentice development.',
            'Strengthen service-flow coordination with Pastoral/Worship/Production teams.',
          ]},
          { id: 'Q4', focus: 'Sustainability, leadership depth, and excellence standards.', goals: [
            'Lock in stable usher leadership coverage (section leads + backups).',
            'Improve consistency of service execution and volunteer culture.',
            'Prepare 2027 seating strategy improvements based on real patterns.',
          ]},
        ],
      },
      {
        id: 'pastoral-guest-services', name: 'Pastoral & Guest Services',
        quarters: [
          { id: 'Q1', focus: 'Standards, confidentiality, and a consistent concierge workflow.', goals: [
            'Establish clear role expectations and boundaries: honor-driven service, calm excellence, strict confidentiality.',
            'Standardize the end-to-end concierge workflow for: (1) senior pastor travel out, (2) guest speaker travel in.',
            'Build readiness for service-day support (before/during/after) with minimal disruption.',
          ]},
          { id: 'Q2', focus: 'Relational excellence, consistency of care, and team development.', goals: [
            'Improve consistency in the guest/pastor experience: everyone receives the same standard of care.',
            'Strengthen team coverage and continuity (scheduling, backups, role clarity).',
            'Build an "experience culture" that feels warm, respectful, and pastorally appropriate—not transactional.',
          ]},
          { id: 'Q3', focus: 'Event excellence, scalability, and streamlined guest integration.', goals: [
            'Build capacity to support high-profile weekends, conferences, and multi-guest events without stress.',
            'Strengthen coordination with Communications, Security, Worship/Production, and Pastoral leadership for seamless event flow.',
            'Improve guest integration flow (arrival → preparation → ministry → post-service transitions) while protecting spiritual focus.',
          ]},
          { id: 'Q4', focus: 'Sustainability, quality control, and 2027 readiness.', goals: [
            'Consolidate systems so concierge hospitality is reliable year after year.',
            'Improve quality control through review, feedback, and documented improvements.',
            'Prepare a 2027 roadmap (calendar readiness, budget priorities, team growth plan).',
          ]},
        ],
      },
    ],
  },
  {
    id: 'discipleship',
    name: 'Discipleship Ministry',
    quarters: [
      { id: 'Q1', focus: 'Foundations + unified pathway + leader alignment.', goals: [
        'Clarify and publish a single disciple-making pathway (from newcomer to mature disciple).',
        'Align leaders across all Discipleship departments around one vision, standards, and language.',
        'Establish core discipleship curriculum and personal/group tools for spiritual formation.',
      ]},
      { id: 'Q2', focus: 'Discipleship that strengthens households and deepens church-wide formation.', goals: [
        'Integrate discipleship into family life and key life stages (parents, couples, adults, young believers).',
        'Strengthen accountability and mentoring structures within groups and departments.',
        'Deliver at least one church-wide discipleship emphasis (campaign, retreat, or growth initiative).',
      ]},
      { id: 'Q3', focus: "Formed disciples who multiply disciples and strengthen the church's impact.", goals: [
        'Move people from growth to multiplication (disciples making disciples).',
        'Equip leaders in biblical mentoring and disciple-making skills.',
        'Integrate discipleship into Outreach rhythms (so evangelism connects to follow-up and formation).',
      ]},
      { id: 'Q4', focus: 'Systems, measurement, sustainability, and pastoral care structures.', goals: [
        'Evaluate and improve discipleship systems and engagement metrics.',
        'Strengthen pastoral care and accountability structures for ongoing spiritual formation.',
        'Build a scalable plan and training calendar for 2027.',
      ]},
    ],
    subDepartments: [
      {
        id: 'next-steps', name: 'Next Steps Program',
        quarters: [
          { id: 'Q1', focus: 'Standardize assimilation + strengthen foundations.', goals: [
            'Strengthen welcome and assimilation processes (consistent and volunteer-supported).',
            'Run foundational teaching/membership rhythms with clarity.',
            'Improve first-time guest follow-up and personal connection opportunities.',
          ]},
          { id: 'Q2', focus: 'Connection pathways that retain households and new believers.', goals: [
            'Improve connection for families and couples entering the church.',
            'Increase placements into small groups and serving teams.',
          ]},
          { id: 'Q3', focus: 'Move connected people into participation and service.', goals: [
            'Increase engagement in ministry teams and discipleship communities.',
            'Support Outreach moments by ensuring guests/new believers are connected and followed up.',
          ]},
          { id: 'Q4', focus: 'Measurement + sustainability + consistency.', goals: [
            'Track assimilation outcomes and reduce drop-off.',
            'Build a stable volunteer base and calendar for 2027.',
          ]},
        ],
      },
      {
        id: 'small-groups', name: 'Small Groups',
        quarters: [
          { id: 'Q1', focus: 'Leader recruitment/training + strong launch systems.', goals: [
            'Recruit, train, and support small group leaders.',
            'Establish seasonal themes/curriculum and group resources.',
          ]},
          { id: 'Q2', focus: 'Groups that strengthen families and life-stage discipleship.', goals: [
            'Ensure group offerings serve families, couples, and key life stages.',
            'Strengthen leader care and communication rhythm.',
          ]},
          { id: 'Q3', focus: 'Groups that grow outward and share faith.', goals: [
            'Encourage groups toward service/outreach expressions.',
            'Increase connection of newcomers (from Next Steps) into groups.',
          ]},
          { id: 'Q4', focus: 'Health evaluation + celebration + 2027 readiness.', goals: [
            'Evaluate group health and effectiveness through reporting/feedback.',
            'Celebrate leaders and testimonies; retain and multiply leaders.',
          ]},
        ],
      },
      {
        id: 'prayer-teams', name: 'Prayer Teams',
        quarters: [
          { id: 'Q1', focus: 'Team structure + integrity + consistent gatherings.', goals: [
            'Coordinate and strengthen all prayer team meetings.',
            'Set strong standards for confidentiality and spiritual integrity.',
          ]},
          { id: 'Q2', focus: 'Covering families and the congregation with targeted prayer.', goals: [
            'Strengthen corporate and personal prayer habits across the church.',
            'Provide spiritual covering for families, leaders, and key ministries.',
          ]},
          { id: 'Q3', focus: 'Prayer that fuels outreach and church-wide initiatives.', goals: [
            'Serve as liaison between Prayer Team and church leadership (alignment and covering).',
            'Provide prayer support for outreach, events, and ministry initiatives.',
          ]},
          { id: 'Q4', focus: 'Sustainability + leadership development + continuity.', goals: [
            'Strengthen leadership depth and prevent burnout.',
            'Capture testimonies and build a 2027 prayer plan.',
          ]},
        ],
      },
      {
        id: 'sacraments', name: 'Sacraments & Special Services',
        quarters: [
          { id: 'Q1', focus: 'Order, preparation, and excellence in sacred services.', goals: [
            'Review and strengthen planning and preparation for baptisms and communion.',
            'Ensure materials, setup, volunteers, and protocols are reliable.',
          ]},
          { id: 'Q2', focus: 'Marriage preparation and family milestones.', goals: [
            'Guide couples through pre-marital counseling and wedding preparation.',
            'Coordinate baby dedications with pastoral partnership and care.',
          ]},
          { id: 'Q3', focus: 'Milestones as moments of witness and connection (with reverence).', goals: [
            'Make baptisms and special services clear, welcoming, and discipleship-connected for guests/families.',
            'Strengthen coordination across worship/pastoral teams for excellence.',
          ]},
          { id: 'Q4', focus: 'Sustainability + pastoral sensitivity + improved systems.', goals: [
            'Provide consistent support for funeral services (communication, scheduling, coordination).',
            'Improve administrative strength and prepare 2027 service calendar.',
          ]},
        ],
      },
    ],
  },
  {
    id: 'outreach',
    name: 'Outreach Ministry',
    quarters: [
      { id: 'Q1', focus: 'Spiritual readiness + strategy + systems.', goals: [
        'Establish a clear Outreach vision, language, and operational plan for 2026.',
        'Train and align teams in evangelism basics and follow-up discipline.',
        'Create an integrated calendar for Evangelism and Missions.',
      ]},
      { id: 'Q2', focus: 'Community trust + household engagement + partnerships.', goals: [
        'Strengthen local evangelism through consistent presence and relational connection.',
        'Engage families and multi-generational participation in outreach.',
        'Clarify missions partnerships and communication to the church.',
      ]},
      { id: 'Q3', focus: 'Activation at scale + missions emphasis.', goals: [
        'Mobilize the church into active evangelism (not only events—lifestyle + teams).',
        'Execute a clear missions emphasis (local + global) with measurable participation.',
        'Strengthen training and leadership multiplication.',
      ]},
      { id: 'Q4', focus: 'Sustainability, retention, reporting, and 2027 readiness.', goals: [
        'Consolidate Outreach systems so growth is sustainable year after year.',
        'Evaluate outcomes for Evangelism and Missions and improve weak areas.',
        'Build the 2027 plan and leadership bench.',
      ]},
    ],
    subDepartments: [
      {
        id: 'evangelism', name: 'Evangelism',
        quarters: [
          { id: 'Q1', focus: 'Foundation and training for gospel sharing.', goals: [
            'Train volunteers in gospel clarity and personal testimony.',
            'Establish evangelism event planning processes.',
          ]},
          { id: 'Q2', focus: 'Community presence and family engagement.', goals: [
            'Build consistent community presence.',
            'Engage families in outreach activities.',
          ]},
          { id: 'Q3', focus: 'Large-scale evangelism activation.', goals: [
            'Mobilize church-wide evangelism efforts.',
            'Execute signature outreach season.',
          ]},
          { id: 'Q4', focus: 'Evaluation and 2027 planning.', goals: [
            'Evaluate evangelism effectiveness.',
            'Prepare 2027 evangelism roadmap.',
          ]},
        ],
      },
      {
        id: 'missions', name: 'Missions',
        quarters: [
          { id: 'Q1', focus: 'Partnership clarity and annual planning.', goals: [
            'Clarify missions partnerships and priorities.',
            'Create integrated missions calendar.',
          ]},
          { id: 'Q2', focus: 'Church-wide missions awareness.', goals: [
            'Communicate missions vision to the church.',
            'Engage families in missions support.',
          ]},
          { id: 'Q3', focus: 'Major missions emphasis.', goals: [
            'Execute major missions moment.',
            'Mobilize participation church-wide.',
          ]},
          { id: 'Q4', focus: 'Partnership evaluation and planning.', goals: [
            'Evaluate missions partnerships.',
            'Plan 2027 missions priorities.',
          ]},
        ],
      },
    ],
  },
  {
    id: 'communications',
    name: 'Communications Team',
    quarters: [
      { id: 'Q1', focus: 'Strategy, brand consistency, and reliable weekly communication rhythms.', goals: [
        'Deliver the 2026 Communications Master Plan (channels, cadence, roles, approval workflow).',
        'Standardize church-wide messaging (tone, templates, visual identity, "one voice").',
        'Strengthen internal communications so members stay informed and engaged.',
      ]},
      { id: 'Q2', focus: 'Audience targeting and community engagement (families, newcomers, members).', goals: [
        'Improve targeting: define key audiences (members, newcomers, families, youth, YAM, community).',
        'Increase engagement and clarity around programs that strengthen families and discipleship pathways.',
        'Strengthen external-facing credibility and consistency across platforms.',
      ]},
      { id: 'Q3', focus: 'Visibility, storytelling, and promotion for outreach and church-wide activation.', goals: [
        'Increase church visibility and participation during outreach/missions initiatives.',
        'Strengthen storytelling: testimonies, impact recaps, ministry highlights.',
        'Grow online presence: consistent posting, engagement, and measurable traffic growth.',
      ]},
      { id: 'Q4', focus: 'Sustainability, reputation protection, and next-year readiness.', goals: [
        'Build and test a crisis communication plan and reputation management workflow.',
        'Consolidate systems: asset library, content calendar, SOPs, and training.',
        'Prepare a strong end-of-year communication season (21 Days + Christmas) with excellence.',
      ]},
    ],
    subDepartments: [
      {
        id: 'sound-lights', name: 'Sound & Lights Team',
        quarters: [
          { id: 'Q1', focus: 'Reliability, standards, and team readiness.', goals: [
            'Improve consistency of sound mix and lighting across services (Sunday + midweek).',
            'Establish clear production standards (SOPs) and a stable volunteer rotation.',
            'Reduce technical distractions through preventive maintenance.',
          ]},
          { id: 'Q2', focus: 'Communication, serving culture, and worship-team partnership.', goals: [
            'Strengthen teamwork and communication with Worship, Pastoral, and Hospitality teams.',
            'Improve volunteer care and retention (healthy serving rhythms).',
            'Ensure children/family-related events and special services are supported with consistent quality.',
          ]},
          { id: 'Q3', focus: 'Scalable production for outreach and church-wide initiatives.', goals: [
            'Support higher-volume seasons/events with excellent sound/lighting (outreach, youth, conferences).',
            'Improve portability and rapid setup for off-site or multi-room events if needed.',
            'Raise new operators and apprentices to expand capacity.',
          ]},
          { id: 'Q4', focus: 'Sustainability, excellence systems, and 2027 readiness.', goals: [
            'Lock in sustainable systems (inventory, maintenance, training, scheduling).',
            'Upgrade and/or prioritize equipment needs with a clear budget recommendation.',
            'Deliver peak excellence for year-end moments (21 Days, Christmas services).',
          ]},
        ],
      },
      {
        id: 'tech-team', name: 'Tech Team',
        quarters: [
          { id: 'Q1', focus: 'Stability, documentation, and support foundations.', goals: [
            'Stabilize core tech systems used weekly (presentation, livestream/recording support if applicable, Wi-Fi, computers, printers, ProPresenter/Planning Center or equivalents).',
            'Establish clear support workflows (ticketing/intake, escalation, response times).',
            'Document "how we run Sunday" tech processes to reduce single points of failure.',
          ]},
          { id: 'Q2', focus: 'Adoption, usability, and ministry enablement.', goals: [
            'Improve usability of church tools for staff and key volunteers (training and support).',
            'Strengthen data stewardship and access control (right people have right access).',
            'Ensure family-facing areas (Kids check-in, registration, communication) are dependable.',
          ]},
          { id: 'Q3', focus: 'Scalability for events and outreach + improved responsiveness.', goals: [
            'Prepare systems and support for high-volume seasons/events (outreach, conferences, camps, retreats).',
            'Increase support capacity by training additional tech volunteers and reducing dependence on 1–2 people.',
            'Strengthen digital follow-up workflows (forms, sign-ups, integrations) so outreach results in connection.',
          ]},
          { id: 'Q4', focus: 'Security, sustainability, and 2027 readiness.', goals: [
            'Strengthen cybersecurity basics (account security, backups, device hygiene, access management).',
            'Evaluate systems and recommend improvements with a realistic budget and priorities.',
            'Create a 2027 tech roadmap and training calendar.',
          ]},
        ],
      },
      {
        id: 'creative-team', name: 'Creative Team',
        quarters: [
          { id: 'Q1', focus: 'Creative standards, brand consistency, and production workflow.', goals: [
            'Establish consistent visual identity across church communications (slides, flyers, social, print, stage screens).',
            'Create a reliable creative request and production workflow with clear deadlines.',
            'Build a baseline asset library that supports weekly church rhythms.',
          ]},
          { id: 'Q2', focus: 'Creative that strengthens belonging and discipleship pathways.', goals: [
            'Support ministries that build family and community (Next-Gen, Family Care, Discipleship) with clear, welcoming creative.',
            'Improve newcomer-facing materials and "how to get connected" visuals.',
            'Expand photo/video storytelling of church life (with consent and organization).',
          ]},
          { id: 'Q3', focus: 'Storytelling and campaign support for outreach and activation.', goals: [
            'Strengthen campaign creative for outreach/missions initiatives and major events.',
            "Increase the church's ability to tell impact stories quickly and compellingly.",
            'Expand creative capacity through volunteers and specialization (design, photo, video, editing).',
          ]},
          { id: 'Q4', focus: 'Sustainability, quality control, and 2027 readiness.', goals: [
            'Consolidate systems: asset management, templates, naming conventions, and creative calendar.',
            'Evaluate what produced the most impact and reduce wasted work.',
            'Deliver peak excellence for year-end seasons (21 Days, Christmas, Vision moments).',
          ]},
        ],
      },
    ],
  },
  {
    id: 'mc-music',
    name: 'MC Music',
    quarters: [
      { id: 'Q1', focus: 'Spiritual foundation + standards + dependable weekly execution.', goals: [
        'Re-anchor the ministry in prayer, faith-filled service, integrity, unity, and excellence.',
        'Stabilize weekly worship execution through clear expectations: attendance, punctuality, service conduct, communication standards.',
        'Standardize the "worship + word" coordination process with pastors (sermon series alignment and planning).',
      ]},
      { id: 'Q2', focus: 'Team health, unity, discipleship, and leadership development.', goals: [
        'Strengthen "family culture" inside the team: unity, accountability, pastoral care, and healthy serving rhythms.',
        'Develop leaders and multiply capacity: each Music Leader mentors volunteers toward leadership readiness.',
        'Strengthen onboarding/eligibility expectations so new members are spiritually aligned and consistent.',
      ]},
      { id: 'Q3', focus: 'Worship that evangelizes, mobilizes, and supports major church initiatives.', goals: [
        'Support church-wide outreach and major events with excellence in worship and production.',
        'Strengthen bilingual/cross-cultural worship expression that reflects the whole church body.',
        'Increase capacity by recruiting and training new worship and technical volunteers.',
      ]},
      { id: 'Q4', focus: 'Sustainability, stewardship, systems, and 2027 readiness.', goals: [
        'Consolidate systems: scheduling, standards, training calendar, and leadership coverage.',
        'Strengthen stewardship: equipment maintenance/replacement planning and annual budget execution.',
        'Prepare for year-end high-impact seasons (21 Days, Christmas, Vision moments) with peak excellence.',
      ]},
    ],
    subDepartments: [],
  },
];

// ── SQL Generation ──

function esc(str) {
  return str.replace(/'/g, "''");
}

function generateSQL() {
  const lines = [];

  lines.push(`-- ============================================================================`);
  lines.push(`-- Migration: Seed Ministry Goals from MC Church 2026 Leadership Hub Roadmap`);
  lines.push(`-- Generated by: scripts/generate-goals-migration.cjs`);
  lines.push(`-- ============================================================================`);
  lines.push(`-- This migration:`);
  lines.push(`--   1. Upserts 7 top-level ministries + sub-departments as child ministries`);
  lines.push(`--   2. Creates 4 church-level quarterly theme goals`);
  lines.push(`--   3. Creates ministry-level goals under each church goal`);
  lines.push(`--   4. Creates department-level goals under each ministry goal`);
  lines.push(`-- Idempotent: uses ON CONFLICT DO NOTHING for all inserts.`);
  lines.push(`-- ============================================================================`);
  lines.push(``);
  lines.push(`BEGIN;`);
  lines.push(``);

  // Step 1: Upsert ministries
  lines.push(`-- ── Step 1: Upsert ministries ──`);
  lines.push(`-- Top-level ministries`);
  for (const m of ministries) {
    lines.push(`INSERT INTO ministries (id, name_en, name_fr)`);
    lines.push(`  SELECT gen_random_uuid(), '${esc(m.name)}', '${esc(m.name)}'`);
    lines.push(`  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = '${esc(m.name)}');`);
    lines.push(``);
  }

  lines.push(`-- Sub-department ministries (as children of their parent)`);
  for (const m of ministries) {
    for (const sub of (m.subDepartments || [])) {
      lines.push(`INSERT INTO ministries (id, name_en, name_fr, parent_ministry_id)`);
      lines.push(`  SELECT gen_random_uuid(), '${esc(sub.name)}', '${esc(sub.name)}',`);
      lines.push(`    (SELECT id FROM ministries WHERE name_en = '${esc(m.name)}' LIMIT 1)`);
      lines.push(`  WHERE NOT EXISTS (SELECT 1 FROM ministries WHERE name_en = '${esc(sub.name)}');`);
      lines.push(``);
    }
  }

  // Step 2: Church-level quarterly theme goals
  lines.push(`-- ── Step 2: Church-level quarterly theme goals ──`);
  lines.push(`-- These are the 4 overarching goals for the year, one per quarter.`);
  lines.push(``);

  for (const qid of ['Q1', 'Q2', 'Q3', 'Q4']) {
    const theme = QUARTER_THEMES[qid];
    const dates = QUARTER_DATES[qid];
    const cat = QUARTER_CATEGORIES[qid];
    lines.push(`INSERT INTO goals (id, title_en, title_fr, description_en, goal_level, category, status, progress_percent, year, start_date, due_date)`);
    lines.push(`  SELECT gen_random_uuid(),`);
    lines.push(`    '${esc(theme)}',`);
    lines.push(`    '${esc(theme)}',`);
    lines.push(`    '${esc(qid)} church-wide theme for Vision 2026',`);
    lines.push(`    'church', '${cat}', 'not_started', 0, 2026,`);
    lines.push(`    '${dates.start}'::date, '${dates.end}'::date`);
    lines.push(`  WHERE NOT EXISTS (`);
    lines.push(`    SELECT 1 FROM goals WHERE title_en = '${esc(theme)}' AND goal_level = 'church' AND year = 2026`);
    lines.push(`  );`);
    lines.push(``);
  }

  // Step 3: Ministry-level goals
  lines.push(`-- ── Step 3: Ministry-level goals ──`);
  lines.push(``);

  for (const m of ministries) {
    lines.push(`-- Ministry: ${m.name}`);
    for (const q of m.quarters) {
      const dates = QUARTER_DATES[q.id];
      const cat = QUARTER_CATEGORIES[q.id];
      const theme = QUARTER_THEMES[q.id];
      for (const goal of q.goals) {
        lines.push(`INSERT INTO goals (id, title_en, title_fr, description_en, goal_level, category, status, progress_percent, year, start_date, due_date, owner_ministry_id, parent_goal_id)`);
        lines.push(`  SELECT gen_random_uuid(),`);
        lines.push(`    '${esc(goal)}',`);
        lines.push(`    '${esc(goal)}',`);
        lines.push(`    '${esc(q.focus)}',`);
        lines.push(`    'ministry', '${cat}', 'not_started', 0, 2026,`);
        lines.push(`    '${dates.start}'::date, '${dates.end}'::date,`);
        lines.push(`    (SELECT id FROM ministries WHERE name_en = '${esc(m.name)}' LIMIT 1),`);
        lines.push(`    (SELECT id FROM goals WHERE title_en = '${esc(theme)}' AND goal_level = 'church' AND year = 2026 LIMIT 1)`);
        lines.push(`  WHERE NOT EXISTS (`);
        lines.push(`    SELECT 1 FROM goals WHERE title_en = '${esc(goal)}' AND goal_level = 'ministry' AND year = 2026`);
        lines.push(`      AND owner_ministry_id = (SELECT id FROM ministries WHERE name_en = '${esc(m.name)}' LIMIT 1)`);
        lines.push(`  );`);
        lines.push(``);
      }
    }
  }

  // Step 4: Department-level goals (sub-departments)
  lines.push(`-- ── Step 4: Department-level goals (sub-departments) ──`);
  lines.push(``);

  for (const m of ministries) {
    for (const sub of (m.subDepartments || [])) {
      lines.push(`-- Sub-department: ${sub.name} (under ${m.name})`);
      for (const q of sub.quarters) {
        const dates = QUARTER_DATES[q.id];
        const cat = QUARTER_CATEGORIES[q.id];

        // Find the parent ministry goal for same quarter — use the first ministry goal of this quarter
        // Actually, we link to the church-level theme goal for simplicity in the hierarchy
        const theme = QUARTER_THEMES[q.id];

        for (const goal of q.goals) {
          lines.push(`INSERT INTO goals (id, title_en, title_fr, description_en, goal_level, category, status, progress_percent, year, start_date, due_date, owner_ministry_id, parent_goal_id)`);
          lines.push(`  SELECT gen_random_uuid(),`);
          lines.push(`    '${esc(goal)}',`);
          lines.push(`    '${esc(goal)}',`);
          lines.push(`    '${esc(q.focus)}',`);
          lines.push(`    'department', '${cat}', 'not_started', 0, 2026,`);
          lines.push(`    '${dates.start}'::date, '${dates.end}'::date,`);
          lines.push(`    (SELECT id FROM ministries WHERE name_en = '${esc(sub.name)}' LIMIT 1),`);
          // Parent = church-level theme goal (keeps cascade clean: church → department)
          // But ideally we'd link to the ministry-level goal. Since ministry goals are many per quarter,
          // we link department goals to the church theme for now. The cascade view shows:
          // Church Theme → Ministry Goals (for parent ministry) → Department Goals (for sub-dept)
          lines.push(`    (SELECT id FROM goals WHERE title_en = '${esc(theme)}' AND goal_level = 'church' AND year = 2026 LIMIT 1)`);
          lines.push(`  WHERE NOT EXISTS (`);
          lines.push(`    SELECT 1 FROM goals WHERE title_en = '${esc(goal)}' AND goal_level = 'department' AND year = 2026`);
          lines.push(`      AND owner_ministry_id = (SELECT id FROM ministries WHERE name_en = '${esc(sub.name)}' LIMIT 1)`);
          lines.push(`  );`);
          lines.push(``);
        }
      }
    }
  }

  lines.push(`COMMIT;`);

  return lines.join('\n');
}

// Output
console.log(generateSQL());
