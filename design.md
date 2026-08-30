# OCEAN SENTINEL — Averra-Style Incidents Dashboard

## CRITICAL: Match Averra B2B Dashboard Exactly

Reference: https://www.behance.net/gallery/246765881/Averra-B2B-Invoice-Platform-UX-UI

---

## EXACT COLORS (No deviations)

Light Mode:
- Page background: #FFFFFF (PURE WHITE, not off-white)
- Sidebar background: #FFFFFF with right border: 1px solid #F0F0F0
- Card background: #FFFFFF
- Card border: 1px solid #F0F0F0 (very light gray, barely visible)
- Primary action/cyan: #0EA5E9 (Marine Cyan)
- Heading text: #1A1D23
- Body text: #4B5563
- Muted text: #9CA3AF
- Border color: #E5E7EB

Dark Mode:
- Page background (Base): #090D16 (Deep Ocean Black)
- Sidebar/Surface background: #151F33 (Midnight Slate)
- Card: #151F33 (Midnight Slate)
- Card border (Secondary): #64748B (Steel Gray)
- Primary (Cyan): #0EA5E9 (Marine Cyan)
- Spill Critical (Crimson): #DC2626 (Spill Crimson)
- Vessel Normal (Emerald): #10B981 (Safe Emerald)
- Text Primary (Ice): #F8FAFC (Pure Ice)
- Text Muted (Fog): #94A3B8 (Fog Slate)

---

## SIDEBAR (Exact Averra Style)

- Width: 240px
- Background: white (light) / #13151D (dark)
- Border-right: 1px solid #F0F0F0 (light) / #252830 (dark)
- Logo: "OCEAN SENTINEL" in bold 16px, "MARITIME INTELLIGENCE" in 11px muted uppercase
- Menu items: 14px, color #6B7280
- Active item: background rgba(0,184,148,0.06), color #00B894, font-weight 600
- Active item LEFT BORDER: 3px solid #00B894
- Menu icon: 18px, stroke-width 1.5
- Spacing between items: 4px
- Section headers ("MAIN MENU", "INVESTIGATION"): 11px, uppercase, #9CA3AF, letter-spacing 0.5px

---

## TOP HEADER BAR

- Height: 64px
- Background: white / #1A1D27
- Border-bottom: 1px solid #F0F0F0 / #252830
- Left: "INCIDENTS" text with alert icon, font-weight 600
- Right: "SYSTEM ONLINE" with small green dot (6px circle, background #00B894, box-shadow 0 0 6px rgba(0,184,148,0.4))

---

## PAGE HEADER

- Padding: 32px 40px 24px
- Icon: Warning triangle in green circle (40px, bg rgba(0,184,148,0.1))
- Title: "Incidents Dashboard" — 28px, font-weight 700, color #1A1D23
- Subtitle: "Monitor and investigate..." — 15px, color #6B7280, margin-top 8px

---

## SEARCH/FILTER BAR (Inside Card)

- Card: white bg, border 1px solid #F0F0F0, border-radius 12px, padding 16px 20px
- Search input: height 44px, bg #F9FAFB, border 1px solid #E5E7EB, border-radius 8px
- Input focus: border-color #00B894, box-shadow 0 0 0 3px rgba(0,184,148,0.1)
- Dropdown: same style as input, width 160px
- "Showing X of X" text: 13px, color #6B7280
- RESULTS label: 11px, uppercase, #9CA3AF, letter-spacing 0.5px

---

## TABLE (Critical — Match Averra's Clean Look)

Table Card:
- Background: white / #1A1D27
- Border: 1px solid #F0F0F0 / #252830
- Border-radius: 12px
- Overflow: hidden
- No outer shadow (keep flat)

Table Header:
- Background: #FAFBFC (very subtle gray) / #1E2130 (dark)
- Text: 11px, uppercase, #9CA3AF, letter-spacing 0.5px, font-weight 600
- Height: 48px
- Padding: 0 20px
- Border-bottom: 1px solid #F0F0F0 / #252830

Table Rows:
- Height: 72px (generous)
- Padding: 0 20px
- Border-bottom: 1px solid #F0F0F0 (between rows only)
- Hover: background #FAFBFC (light) / #1E2130 (dark)
- Transition: background 150ms ease

Table Cells:
- Padding: 16px 20px
- Vertical-align: middle

---

## DATA STYLING IN TABLE

Incident ID:
- Font: 'JetBrains Mono', monospace
- Size: 14px
- Weight: 600
- Color: #00B894 (green, clickable)
- Cursor: pointer

Date:
- Size: 14px
- Color: #4B5563

Location:
- Place name: 14px, #1A1D23, font-weight 500
- Coordinates: 12px, #9CA3AF, margin-top 2px, font-family monospace

Status Badge:
- Padding: 4px 12px
- Border-radius: 100px (pill)
- Font-size: 12px
- Font-weight: 600
- Text-transform: uppercase
- Letter-spacing: 0.3px

Status Colors:
- ACTIVE: bg #DCFCE7, color #16A34A
- INVESTIGATING: bg #FEF3C7, color #D97706
- RESOLVED: bg #DBEAFE, color #2563EB

Confidence:
- Size: 14px
- Weight: 600
- Color: #00B894

Severity Badge:
- Same pill style as status
- HIGH: bg #FEE2E2, color #DC2626
- MEDIUM: bg #FEF3C7, color #EA580C
- LOW: bg #DCFCE7, color #16A34A

Vessel Name:
- Size: 14px
- Weight: 500
- Color: #1A1D23

Spill Area:
- Value: 16px, font-weight 700, color #1A1D23
- Unit: 12px, color #9CA3AF, margin-left 2px

Action Button:
- Size: 36px circle
- Border: 1px solid #E5E7EB
- Background: white
- Icon: #6B7280
- Hover: border-color #00B894, color #00B894, background rgba(0,184,148,0.04)
- Transition: all 150ms ease

---

## BUTTONS (Averra Style)

Primary Button:
- Height: 40px
- Padding: 0 20px
- Background: #00B894
- Color: white
- Border-radius: 8px
- Font-size: 14px
- Font-weight: 600
- Hover: background #00A381, transform translateY(-1px), box-shadow 0 4px 12px rgba(0,184,148,0.25)
- Transition: all 200ms ease

Secondary Button:
- Same dimensions
- Background: white
- Border: 1px solid #E5E7EB
- Color: #4B5563
- Hover: border-color #D1D5DB, background #F9FAFB

---

## THEME TOGGLE

- Size: 40px circle
- Border: 1px solid #E5E7EB
- Background: white / #1A1D27
- Icon: sun/moon, 18px
- Position: fixed in top-right of header area
- Hover: background #F9FAFB / #252830
- Transition: all 200ms ease

---

## TYPOGRAPHY

- Primary: Inter (Google Fonts)
- Monospace: JetBrains Mono (for IDs, coordinates)
- Heading weight: 700
- Body weight: 400
- Label weight: 600
- Line height: 1.5

---

## ANIMATIONS

- Page load: content fades in 300ms
- Table rows: staggered fade-in 50ms each
- Hover transitions: 150ms ease
- Theme toggle: 200ms color transition
- Button hover: 200ms ease with slight lift

---

## KEY DIFFERENCES FROM CURRENT BUILD

1. Use PURE WHITE background, not off-white
2. Add proper card shadows (very subtle)
3. Increase table row height to 72px
4. Add more padding (20px minimum)
5. Make badges more rounded (full pill)
6. Use #00B894 green instead of #2D8A56
7. Add monospace font for IDs
8. Make table header uppercase and smaller
