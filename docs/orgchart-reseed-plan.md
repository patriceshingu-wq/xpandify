# Orgchart Reseed Plan — Dry Run

Generated: 2026-05-05T15:53:53.407Z

Source of truth: mcorgchart `/tree` + `/ministries` + `/departments` (cached in `tmp/reseed/orgchart_*.json`).
Xpandify state: CSV exports from prod (cached in `tmp/reseed/*.csv`).

## Summary

- **Keep + relink** xpandify rows: **25**
- **Insert** new xpandify rows for orgchart nodes missing locally: **47**
- **Soft-delete** xpandify rows with no orgchart counterpart: **17**
- Soft-deletes whose attached data has no surviving ancestor (orphan risk): **0**

Total xpandify ministries before: 42. After: 72 active + 17 soft-deleted.

## Target tree (orgchart structure that xpandify will mirror)

- Worship Experience _(ministry, insert 3177f4f1, orgchart_id=we-001)_
  - MC Music _(department, keep 3be68ee3, orgchart_id=wt-001)_
    - MC Music English _(department, keep 465fe65e, orgchart_id=wt-eng-0)_
      - Instrumentalist _(department, insert 8c83f0b1, orgchart_id=vol-076)_
    - MC Music French _(department, keep 38e7b636, orgchart_id=wt-fr-00)_
  - Communication Team _(department, keep 6dd3d295, orgchart_id=mm-001)_
    - Creative Team _(team, keep 05837555, orgchart_id=5842f537)_
    - Social Media _(team, insert adf68604, orgchart_id=f35e748e)_
  - Production Teams _(department, insert 3f021985, orgchart_id=pr-001)_
    - Production Director _(department, insert 3459f0c6, orgchart_id=pr-dir-0)_
    - Sound _(department, keep f50612a7, orgchart_id=pr-aud-0)_
    - Lighting _(department, insert 31a15a94, orgchart_id=pr-light)_
    - Video / Livestream _(department, insert 3e9f0a86, orgchart_id=pr-vid-0)_
    - Presentation _(department, insert d94833fa, orgchart_id=pr-pres-)_
    - Stage / Service Flow _(department, insert 3d4ed790, orgchart_id=pr-stage)_
    - Post Production Team _(department, insert b743eb08, orgchart_id=a836182c)_
  - Hospitality _(department, keep 11111111, orgchart_id=hs-001)_
    - Security _(department, keep 8a2661e2, orgchart_id=hs-sec-0)_
    - Parking _(department, keep 32402d01, orgchart_id=hs-park-)_
    - Greeters _(department, keep e49d7590, orgchart_id=hs-greet)_
      - Greeter Team Lead _(team, insert ac3e998f, orgchart_id=vol-034)_
    - Ushers _(department, keep 1cb97af6, orgchart_id=hs-ush-0)_
      - Usher Team Leader _(team, insert 43e76804, orgchart_id=vol-061)_
      - Ushers Leader _(department, insert b2fa5a4f, orgchart_id=vol-065)_
    - Guest Services _(department, keep a109b62d, orgchart_id=hs-gs-00)_
  - Language Support _(department, insert 920c1fc6, orgchart_id=interp-0)_
  - Service Coordination _(department, insert 4bf43335, orgchart_id=we-sc-00)_
- Prayer Ministry _(ministry, keep 6d6b7797, orgchart_id=pt-001)_
  - Intercession French _(department, insert ca924cba, orgchart_id=f14fea0d)_
  - Pray First _(team, insert 632bd8fb, orgchart_id=b7aa3e74)_
  - Midi en Prière _(team, insert 7b87bebf, orgchart_id=80c7d6f4)_
  - Thrive Now Thursdays (TNT) _(team, insert 5fa69967, orgchart_id=28e04a45)_
  - Friday Night Prayer _(team, insert 378aecfa, orgchart_id=ab21fb15)_
  - Intercession English _(department, insert 9b6e7d24, orgchart_id=9ce9d23b)_
  - End-of-month night prayer _(team, insert f9c7f264, orgchart_id=1324ae0b)_
  - Delivrance Ministry _(department, insert cfbed831, orgchart_id=90d2fcae)_
- Connections Ministry _(ministry, insert 66220f06, orgchart_id=as-001)_
  - Guest Follow-up Lead _(department, insert 49d7ea68, orgchart_id=vol-032)_
  - Next Steps English _(department, keep efafcfae, orgchart_id=ns-001)_
  - Prochaines étapes _(department, insert 6add5c22, orgchart_id=f1a7f3bb)_
  - Membership Management _(department, keep e0051635, orgchart_id=mi-001)_
- Discipleship & Spiritual Formation _(ministry, keep 684a1fd6, orgchart_id=ds-001)_
  - Growth Track _(department, insert 5af5cbf3, orgchart_id=34ec4a36)_
  - Small Groups _(department, keep 11111111, orgchart_id=sg-001)_
  - Leadership Development _(team, insert 6a87cf37, orgchart_id=ld-001)_
  - MC Academy _(department, insert 1d5b88d2, orgchart_id=7381a717)_
  - Sacrements & Weddings _(department, insert 53c49444, orgchart_id=sac-001)_
- Next Gen Ministry _(ministry, insert d7384c19, orgchart_id=ng-001)_
  - Kids Ministry _(department, keep 60475845, orgchart_id=km-001)_
    - Kids Ministry Leader _(department, insert 5f4ed1e1, orgchart_id=vol-137)_
  - Youth Ministry _(department, keep 11111111, orgchart_id=sm-001)_
  - YAM English _(department, insert 78e8b810, orgchart_id=ya-001)_
  - YAM French _(department, insert 465afee0, orgchart_id=5cca8ebc)_
- Pastoral Care & Community Life _(ministry, insert 54295607, orgchart_id=pc-001)_
  - Family Care _(department, keep f417a33f, orgchart_id=fc-001)_
  - Counseling _(department, insert f4feb208, orgchart_id=cn-001)_
  - Hospital Care _(department, insert 9ba03001, orgchart_id=hc-001)_
  - Women's Ministry _(department, insert e81f6ba3, orgchart_id=5f910cf8)_
  - Men's Ministry _(department, keep 424ef162, orgchart_id=d0929316)_
- Outreach & Mission _(ministry, keep dfb94591, orgchart_id=om-001)_
  - Evangelism _(department, keep cea77727, orgchart_id=ev-001)_
  - Community Outreach _(department, insert cdd92da3, orgchart_id=co-001)_
  - Missions _(department, keep f9b1be6a, orgchart_id=gm-001)_
- Operations & Administration _(ministry, insert 3c72d340, orgchart_id=oa-001)_
  - Office Admin _(department, insert 453d4b05, orgchart_id=oadm-001)_
  - Finance _(department, insert 2dcc918d, orgchart_id=fin-001)_
  - Facilities _(department, insert 1c058853, orgchart_id=fac-001)_
  - Technology _(department, keep 5179488b, orgchart_id=tech-001)_
- Church-Wide Initiatives _(ministry, insert c9f62430, orgchart_id=cw-001)_
  - 1SPJ Programs _(team, insert 8d307a84, orgchart_id=ow-001)_
  - 21 Days Program _(team, insert 929796c5, orgchart_id=tod-001)_
  - Easter Celebration _(team, insert 1142ed52, orgchart_id=bcb17673)_

## Keep + relink

| xp id | current name | → new name | new parent | orgchart_id | level |
|---|---|---|---|---|---|
| `6dd3d295` | Communications Team | Communication Team | Worship Experience | `mm-001` | department |
| `05837555` | Creative Team | Creative Team | Communication Team | `5842f537` | team |
| `684a1fd6` | Discipleship Ministry | Discipleship & Spiritual Formation | _(top level)_ | `ds-001` | ministry |
| `cea77727` | Evangelism | Evangelism | Outreach & Mission | `ev-001` | department |
| `f417a33f` | Family Care Ministry | Family Care | Pastoral Care & Community Life | `fc-001` | department |
| `e49d7590` | Greeters Team | Greeters | Hospitality | `hs-greet` | department |
| `11111111` | Hospitality Services | Hospitality | Worship Experience | `hs-001` | department |
| `60475845` | Kids Ministry | Kids Ministry | Next Gen Ministry | `km-001` | department |
| `3be68ee3` | MC Music | MC Music | Worship Experience | `wt-001` | department |
| `465fe65e` | MC Music English | MC Music English | MC Music | `wt-eng-0` | department |
| `38e7b636` | MC Music French | MC Music French | MC Music | `wt-fr-00` | department |
| `e0051635` | Membership Services | Membership Management | Connections Ministry | `mi-001` | department |
| `424ef162` | Men's Ministry | Men's Ministry | Pastoral Care & Community Life | `d0929316` | department |
| `f9b1be6a` | Missions | Missions | Outreach & Mission | `gm-001` | department |
| `efafcfae` | Next Steps Program | Next Steps English | Connections Ministry | `ns-001` | department |
| `dfb94591` | Outreach Ministry | Outreach & Mission | _(top level)_ | `om-001` | ministry |
| `32402d01` | Parking Team | Parking | Hospitality | `hs-park-` | department |
| `a109b62d` | Pastoral & Guest Services | Guest Services | Hospitality | `hs-gs-00` | department |
| `6d6b7797` | Prayer Ministry | Prayer Ministry | _(top level)_ | `pt-001` | ministry |
| `8a2661e2` | Security Team | Security | Hospitality | `hs-sec-0` | department |
| `11111111` | Small Groups | Small Groups | Discipleship & Spiritual Formation | `sg-001` | department |
| `f50612a7` | Sound & Lights Team | Sound | Production Teams | `pr-aud-0` | department |
| `5179488b` | Tech Team | Technology | Operations & Administration | `tech-001` | department |
| `1cb97af6` | Ushers / Seating Team | Ushers | Hospitality | `hs-ush-0` | department |
| `11111111` | Youth Ministry | Youth Ministry | Next Gen Ministry | `sm-001` | department |

## Insert (new xpandify rows for orgchart nodes missing locally)

| new xp id | name | parent | orgchart_id | level |
|---|---|---|---|---|
| `3177f4f1` | Worship Experience | _(top level)_ | `we-001` | ministry |
| `8c83f0b1` | Instrumentalist | MC Music English | `vol-076` | department |
| `adf68604` | Social Media | Communication Team | `f35e748e` | team |
| `3f021985` | Production Teams | Worship Experience | `pr-001` | department |
| `3459f0c6` | Production Director | Production Teams | `pr-dir-0` | department |
| `31a15a94` | Lighting | Production Teams | `pr-light` | department |
| `3e9f0a86` | Video / Livestream | Production Teams | `pr-vid-0` | department |
| `d94833fa` | Presentation | Production Teams | `pr-pres-` | department |
| `3d4ed790` | Stage / Service Flow | Production Teams | `pr-stage` | department |
| `b743eb08` | Post Production Team | Production Teams | `a836182c` | department |
| `ac3e998f` | Greeter Team Lead | Greeters | `vol-034` | team |
| `43e76804` | Usher Team Leader | Ushers | `vol-061` | team |
| `b2fa5a4f` | Ushers Leader | Ushers | `vol-065` | department |
| `920c1fc6` | Language Support | Worship Experience | `interp-0` | department |
| `4bf43335` | Service Coordination | Worship Experience | `we-sc-00` | department |
| `ca924cba` | Intercession French | Prayer Ministry | `f14fea0d` | department |
| `632bd8fb` | Pray First | Prayer Ministry | `b7aa3e74` | team |
| `7b87bebf` | Midi en Prière | Prayer Ministry | `80c7d6f4` | team |
| `5fa69967` | Thrive Now Thursdays (TNT) | Prayer Ministry | `28e04a45` | team |
| `378aecfa` | Friday Night Prayer | Prayer Ministry | `ab21fb15` | team |
| `9b6e7d24` | Intercession English | Prayer Ministry | `9ce9d23b` | department |
| `f9c7f264` | End-of-month night prayer | Prayer Ministry | `1324ae0b` | team |
| `cfbed831` | Delivrance Ministry | Prayer Ministry | `90d2fcae` | department |
| `66220f06` | Connections Ministry | _(top level)_ | `as-001` | ministry |
| `49d7ea68` | Guest Follow-up Lead | Connections Ministry | `vol-032` | department |
| `6add5c22` | Prochaines étapes | Connections Ministry | `f1a7f3bb` | department |
| `5af5cbf3` | Growth Track | Discipleship & Spiritual Formation | `34ec4a36` | department |
| `6a87cf37` | Leadership Development | Discipleship & Spiritual Formation | `ld-001` | team |
| `1d5b88d2` | MC Academy | Discipleship & Spiritual Formation | `7381a717` | department |
| `53c49444` | Sacrements & Weddings | Discipleship & Spiritual Formation | `sac-001` | department |
| `d7384c19` | Next Gen Ministry | _(top level)_ | `ng-001` | ministry |
| `5f4ed1e1` | Kids Ministry Leader | Kids Ministry | `vol-137` | department |
| `78e8b810` | YAM English | Next Gen Ministry | `ya-001` | department |
| `465afee0` | YAM French | Next Gen Ministry | `5cca8ebc` | department |
| `54295607` | Pastoral Care & Community Life | _(top level)_ | `pc-001` | ministry |
| `f4feb208` | Counseling | Pastoral Care & Community Life | `cn-001` | department |
| `9ba03001` | Hospital Care | Pastoral Care & Community Life | `hc-001` | department |
| `e81f6ba3` | Women's Ministry | Pastoral Care & Community Life | `5f910cf8` | department |
| `cdd92da3` | Community Outreach | Outreach & Mission | `co-001` | department |
| `3c72d340` | Operations & Administration | _(top level)_ | `oa-001` | ministry |
| `453d4b05` | Office Admin | Operations & Administration | `oadm-001` | department |
| `2dcc918d` | Finance | Operations & Administration | `fin-001` | department |
| `1c058853` | Facilities | Operations & Administration | `fac-001` | department |
| `c9f62430` | Church-Wide Initiatives | _(top level)_ | `cw-001` | ministry |
| `8d307a84` | 1SPJ Programs | Church-Wide Initiatives | `ow-001` | team |
| `929796c5` | 21 Days Program | Church-Wide Initiatives | `tod-001` | team |
| `1142ed52` | Easter Celebration | Church-Wide Initiatives | `bcb17673` | team |

## Soft-delete + FK retarget

Each row's goals / meetings / events / `people_ministries` get repointed to the **retarget** before the row is soft-deleted (`deleted_at = now()`). The row is preserved for audit and can be restored by the rollback script.

### ⚠️ Needs your decision (had fuzzy candidates)

Each row below has one or more orgchart candidates but no exact name match. Reply with one of:
- `keep <xp_id_short> as <orgchart node title>` to relink to that orgchart node
- `delete <xp_id_short>` to confirm soft-delete
- `delete <xp_id_short> retarget <xp_id_short>` to override the retarget

| xp id | name | candidates | retarget | goals | meetings | events | members |
|---|---|---|---|---:|---:|---:|---:|

### Soft-delete (no orgchart counterpart at all)

| xp id | name | retarget | goals | meetings | events | members |
|---|---|---|---:|---:|---:|---:|
| `4d44210d` | Greeting / Entry Team | Hospitality Services (via ancestor) | 12 | 0 | 0 | 0 |
| `13dfbe9e` | Ladies Ministry | Family Care Ministry (via ancestor) | 9 | 0 | 0 | 0 |
| `d8df6c44` | Social Integration | Family Care Ministry (via ancestor) | 8 | 0 | 0 | 0 |
| `27a35d51` | Students | ORPHAN — needs manual target | 0 | 0 | 0 | 0 |
| `820bd9f0` | Welcome Center Team | Hospitality Services (via ancestor) | 12 | 0 | 0 | 0 |
| `820e31b3` | Young Adults | ORPHAN — needs manual target | 0 | 0 | 0 | 0 |

## Orphan risk

_None._ Every soft-deleted row with attached data has a surviving ancestor.

## Next steps

1. Review this plan. Reply with any retargets you want to override (`X → Y instead`) or rows to keep that I marked for soft-delete.
2. Once approved, the snapshot SQL (file 01) will be generated and committed.
3. You paste file 01 into Supabase Studio, then file 02 (apply).
4. The rollback SQL stays in `scripts/` — only paste if you need to undo.