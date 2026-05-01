# Calendar & Booking System: Resident Soft

เอกสารนี้อธิบายระบบ Calendar และการจองงานซ่อมของ Resident Soft ทั้งฝั่งช่าง (Technician Dashboard) และฝั่งลูกบ้าน (Tickets / Report Issue)

---

## 1. ภาพรวมระบบ (System Overview)

```
[ลูกบ้าน] Report Issue → เลือกวันที่ + Slot
                              ↓
                    บันทึกลง DB (scheduledDate, scheduledSlot)
                              ↓
[ช่าง] Technician Dashboard Calendar → เห็นงานที่ถูกจองในแต่ละวัน
```

**โครงสร้างข้อมูล (MaintenanceTicket):**
| Field | Type | ตัวอย่าง |
|---|---|---|
| `scheduledDate` | String? | `"2026-05-15"` |
| `scheduledSlot` | String? | `"Morning"` หรือ `"Afternoon"` |

**Time Slots:**
- **Morning** — 09:00–12:00
- **Afternoon** — 13:00–17:00
- **Capacity ต่อช่างต่อ Slot** — 3 งาน
- **Capacity รวมของ Slot** — `จำนวนช่างที่ว่างใน slot x 3`

**ตัวอย่าง Capacity แบบหลายช่าง:**
- ช่างว่าง 1 คน → รับได้ 3 งาน
- ช่างว่าง 2 คน → รับได้ 6 งาน
- ถ้ามีช่าง 2 คน แต่ block ไป 1 คนในช่วงเช้า → ช่วงเช้าจะเหลือรับได้ 3 งาน

---

## 2. Technician Dashboard Calendar (ฝั่งช่าง)

**ไฟล์:** `src/screens/TechnicianDashboard.tsx`

### 2.1 ฟีเจอร์ที่มีอยู่

- **Monthly Calendar Grid** — แสดงปฏิทินรายเดือน navigated ด้วยปุ่ม ←/→
- **Light / Dark Theme Toggle** — ปุ่ม ☀️/🌙 สลับ theme ของ calendar
- **AM/PM Slot Bars** — แต่ละวันมี 2 แถบเล็ก (เช้า/บ่าย) แสดงสถานะ:

| สีแถบ | ความหมาย |
|---|---|
| 🟢 Green | Slot ว่าง (ไม่มีงาน) |
| 🔵 Blue | มีงานของฉันอยู่ใน slot |
| 🟡 Amber | มี Pool task รออยู่ |
| ⬛ Gray | Blocked / วันหยุด |

- **Cell Background:**
  - 🟢 เขียวอ่อน = ว่างทั้งวัน (Available)
  - 🟣 Indigo = วันนี้ (Today)
  - 🔵 น้ำเงิน = วันที่เลือก (Selected)
  - ⬜ เทา = Off Day / Blocked
- **Amber dot มุมซ้ายบน** = วันที่มี Pool task รอรับ
- **Indigo dot มุมขวาบน** = วันนี้ (Today indicator)

- **Daily Detail Panel** (ด้านขวา) — เมื่อเลือกวัน จะแสดง:
  - Slot เช้า: งานของฉัน / Pool task / ว่าง / Blocked
  - Slot บ่าย: เช่นเดียวกัน
  - กดที่ task card เพื่อดูรายละเอียดหรือ Claim งาน

- **Set Availability Modal** — ปุ่ม "Availability" เปิด modal ตั้งค่า:
  - Working Days (เลือกวันที่ทำงาน)
  - Block Slot (ลา / ล็อควัน)

### 2.2 พฤติกรรมปัจจุบัน

- `workingDays` และ `blockedSlots` ถูกบันทึกลง Database แล้ว
- เมื่อ refresh หน้าเว็บ ข้อมูล availability ของช่างจะยังอยู่
- การ block ของช่างเป็น **รายคน** ไม่ได้ block ช่างคนอื่นตามไปด้วย
- ถ้ามีหลายช่าง ระบบจะนับเฉพาะช่างที่ว่างจริงในแต่ละ slot เพื่อคำนวณ capacity รวม

**หมายเหตุ:** Technician Dashboard ตอนนี้ยังแสดงงานในลักษณะ pool/claim เหมือนเดิม ยังไม่ได้ assign งานให้ช่างอัตโนมัติตั้งแต่ตอนลูกบ้านจอง

---

## 3. User Booking Calendar (ฝั่งลูกบ้าน)

**ไฟล์:** `src/screens/Tickets.tsx`

### 3.1 ฟีเจอร์ที่มีอยู่ (Level 2 — ใช้งานจริง)

เมื่อลูกบ้านกด "Report Issue" จะเห็น Mini Calendar ใน Modal:

- **Mini Calendar Grid** — นำทางเดือนด้วย ←/→
- **Dot indicator 2 จุดต่อวัน** (จุดซ้าย = เช้า, จุดขวา = บ่าย):

| สี | ความหมาย | เงื่อนไข |
|---|---|---|
| 🟢 Green | ว่าง | ยังเหลือคิวมาก |
| 🟡 Amber | กำลังจอง | คิวเริ่มใกล้เต็ม |
| 🔴 Red | เต็ม | booking ≥ capacity ของ slot |
| ⚪ Gray | OFF | ไม่มีช่างว่างใน slot นั้น |

- **วันที่ผ่านมา** — Disabled อัตโนมัติ (ไม่สามารถเลือกได้)
- **วันที่เต็มหรือไม่มีช่างว่างทั้งวัน** — Disabled
- **Slot Selector Buttons** — หลังเลือกวัน จะเห็น:
  - `ว่างอีก X จาก Y slot` โดย `Y = จำนวนช่างที่ว่าง x 3`
  - `กำลังจอง` (เหลือง)
  - `เต็มแล้ว` + Disabled (แดง)
  - `No technician available` + Disabled (เทา)

### 3.2 แหล่งข้อมูล

```
tickets (จาก /api/maintenance)
    ↓
นับจำนวน ticket ที่มี scheduledDate และ scheduledSlot ตรงกัน
    ↓
โหลด availability ของช่างจาก /api/technician/availability
    ↓
คำนวณจำนวนช่างที่ว่างจริงในแต่ละวัน/slot
    ↓
คำนวณ capacity รวมของ slot = availableTechnicians x 3
    ↓
แสดงสถานะแต่ละวัน/slot
```

**สิ่งที่ระบบตรวจตอนจองจริง:**
- ต้องมีช่างว่างอย่างน้อย 1 คนใน slot ที่เลือก
- จำนวน booking ใน slot ต้องน้อยกว่า capacity รวมของ slot
- ถ้าไม่มีช่างว่างหรือ slot เต็ม ระบบ backend จะ reject การจองแม้ UI ยังไม่ทัน refresh

---

## 4. Multi-Technician Behavior

### 4.1 หลักการ

- การตั้ง availability และ block slot เป็นข้อมูล **รายช่าง**
- การ block ของช่าง A จะไม่ทำให้ช่าง B ถูก block ไปด้วย
- ระบบจะดูว่าใน slot นั้นมีช่างคนไหนว่างบ้าง แล้วค่อยรวม capacity ตามจำนวนคนที่ว่างจริง

### 4.2 ตัวอย่าง

```text
ช่าง A ว่าง, ช่าง B ว่าง
→ Capacity ของ Morning = 6 งาน

ช่าง A block Morning, ช่าง B ว่าง
→ Capacity ของ Morning = 3 งาน

ช่าง A block Morning, ช่าง B block Morning
→ Capacity ของ Morning = 0 งาน
→ ลูกบ้านจะเห็น slot เป็น OFF / No technician available
```

### 4.3 ข้อจำกัดที่ยังมีอยู่

- ตอนนี้งานยังถูกสร้างเป็น pool ของ slot นั้น ยังไม่ได้ lock ว่า booking นี้เป็นของช่างคนไหน
- เพราะฉะนั้นถ้ามีช่าง 2 คน และเหลือช่างว่างจริง 1 คน ระบบจะยังยอมรับงานได้ตาม capacity ของช่างที่เหลือ แต่ตอนปฏิบัติงานจริงยังต้องให้ช่าง claim/จัดการคิวกันต่อ
- ถ้าต้องการความละเอียดมากขึ้นในอนาคต สามารถเพิ่ม auto-assignment หรือ load balancing ต่อช่างได้

---

## 5. สรุปสถานะ

| ฟีเจอร์ | สถานะ | ไฟล์ |
|---|---|---|
| Technician Calendar (UI) | ✅ เสร็จแล้ว | TechnicianDashboard.tsx |
| Light/Dark Theme Toggle | ✅ เสร็จแล้ว | TechnicianDashboard.tsx |
| AM/PM Slot Bars | ✅ เสร็จแล้ว | TechnicianDashboard.tsx |
| User Mini Booking Calendar | ✅ เสร็จแล้ว (Level 2) | Tickets.tsx |
| Slot Capacity Indicator | ✅ เสร็จแล้ว | Tickets.tsx |
| Save Availability to DB | ✅ เสร็จแล้ว | TechnicianDashboard.tsx / server.js |
| User เห็น Off Day ของช่าง | ✅ เสร็จแล้ว | Tickets.tsx / server.js |
| Dynamic Capacity ตามจำนวนช่างที่ว่าง | ✅ เสร็จแล้ว | Tickets.tsx / server.js |
