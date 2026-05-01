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
- **Capacity ต่อ Slot** — 3 งาน (hardcoded ปัจจุบัน)

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

### 2.2 ข้อจำกัดที่มีอยู่ (⚠️ Known Limitations)

> **workingDays และ blockedSlots เก็บแค่ใน React State เท่านั้น!**
> - เมื่อ refresh หน้าเว็บ → ข้อมูลหาย
> - ฝั่งลูกบ้าน **ไม่รู้** ว่าช่างมีวันหยุดวันไหน
> - ปุ่ม "Save Schedule" ยังไม่ได้ call API จริง

---

## 3. User Booking Calendar (ฝั่งลูกบ้าน)

**ไฟล์:** `src/screens/Tickets.tsx`

### 3.1 ฟีเจอร์ที่มีอยู่ (Level 1 — ทำแล้ว)

เมื่อลูกบ้านกด "Report Issue" จะเห็น Mini Calendar ใน Modal:

- **Mini Calendar Grid** — นำทางเดือนด้วย ←/→
- **Dot indicator 2 จุดต่อวัน** (จุดซ้าย = เช้า, จุดขวา = บ่าย):

| สี | ความหมาย | เงื่อนไข |
|---|---|---|
| 🟢 Green | ว่าง | booking < 2 |
| 🟡 Amber | กำลังจอง | booking = 2 |
| 🔴 Red | เต็ม | booking ≥ 3 |

- **วันที่ผ่านมา** — Disabled อัตโนมัติ (ไม่สามารถเลือกได้)
- **วันที่เต็ม (mc≥3 และ ac≥3)** — Disabled
- **Slot Selector Buttons** — หลังเลือกวัน จะเห็น:
  - `ว่างอีก X จาก 3 slot` (เขียว)
  - `กำลังจอง` (เหลือง)
  - `เต็มแล้ว` + Disabled (แดง)

### 3.2 แหล่งข้อมูล

```
tickets (จาก /api/maintenance)
    ↓
นับจำนวน ticket ที่มี scheduledDate และ scheduledSlot ตรงกัน
    ↓
แสดงสถานะแต่ละวัน/slot
```

**⚠️ ข้อจำกัด:** ปฏิทินนี้ **ไม่รับรู้** Off Day ของช่าง เพราะ `workingDays` และ `blockedSlots` ยังไม่ได้บันทึกลง Database

---

## 4. แผน Level 2: Real Technician Availability (Future)

### 4.1 เป้าหมาย

ให้ปฏิทินฝั่งลูกบ้าน **เห็นวันที่ช่างว่างจริงๆ** รวมถึงวันหยุดและวันที่ block ไว้

### 4.2 สิ่งที่ต้องทำ

#### ① เพิ่ม Prisma Schema

```prisma
model TechnicianAvailability {
  id           String   @id @default(cuid())
  staffId      String
  staff        User     @relation(fields: [staffId], references: [id])
  workingDays  String   // JSON array: ["Mon","Tue","Wed","Thu","Fri"]
  updatedAt    DateTime @updatedAt
}

model TechnicianBlockedSlot {
  id       String @id @default(cuid())
  staffId  String
  staff    User   @relation(fields: [staffId], references: [id])
  date     String // "YYYY-MM-DD"
  type     String // "Full Day" | "Morning" | "Afternoon"
  reason   String?
}
```

#### ② เพิ่ม API Endpoints (server/server.js)

```
GET  /api/technician/availability      → return workingDays + blockedSlots ของช่างทุกคน
POST /api/technician/availability      → save workingDays
POST /api/technician/blocked-slots     → add blocked slot
DELETE /api/technician/blocked-slots/:id → remove blocked slot
```

#### ③ แก้ TechnicianDashboard.tsx

- ปุ่ม "Save Schedule" ต้อง call `POST /api/technician/availability`
- โหลด workingDays + blockedSlots จาก DB แทน useState default

#### ④ แก้ Tickets.tsx (User Calendar)

- เพิ่ม `GET /api/technician/availability` เพื่อดึงข้อมูลว่างของช่าง
- Disable วันที่ไม่ใช่ Working Days
- Disable Slot ที่ถูก Block

### 4.3 UX ที่คาดหวังหลัง Level 2

```
User เห็นปฏิทิน:
  วันจันทร์–ศุกร์   → 🟢 ว่าง / 🟡 กำลังจอง
  วันเสาร์–อาทิตย์  → ⬜ OFF (ช่างไม่ทำงาน, disabled)
  วันที่ช่าง block  → 🔴 ไม่ว่าง (ลาพัก, disabled)
```

---

## 5. สรุปสถานะ

| ฟีเจอร์ | สถานะ | ไฟล์ |
|---|---|---|
| Technician Calendar (UI) | ✅ เสร็จแล้ว | TechnicianDashboard.tsx |
| Light/Dark Theme Toggle | ✅ เสร็จแล้ว | TechnicianDashboard.tsx |
| AM/PM Slot Bars | ✅ เสร็จแล้ว | TechnicianDashboard.tsx |
| User Mini Booking Calendar | ✅ เสร็จแล้ว (Level 1) | Tickets.tsx |
| Slot Capacity Indicator | ✅ เสร็จแล้ว | Tickets.tsx |
| Save Availability to DB | ❌ ยังไม่ทำ (Level 2) | ต้องสร้างใหม่ |
| User เห็น Off Day ของช่าง | ❌ ยังไม่ทำ (Level 2) | ต้องสร้างใหม่ |
