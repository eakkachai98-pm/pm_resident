# Database Schema

โครงสร้างฐานข้อมูลสำหรับระบบหอพัก (Resident soft) ประกอบด้วยตารางหลักดังนี้:

## 1. `User` (ผู้ใช้งาน)
เก็บข้อมูลผู้ใช้งานทุกคน ทั้ง Admin, Staff และ Resident
- `id`: String (CUID)
- `role`: String ('ADMIN', 'STAFF', 'RESIDENT')
- `name`: String
- `email`: String (สำหรับ Login)
- `phone`: String? (Nullable)
- `password`: String
- `nationality`: String? (เช่น 'Thai', 'Foreigner')
- `identityNumber`: String? (เลขบัตรประชาชน / Passport No.)
- `preferredLanguage`: String? (เช่น 'th', 'en', 'zh-CN', 'zh-TW')
- `emergencyContact`: String?
- `visaExpiryDate`: DateTime? (สำหรับผู้เช่าต่างชาติ)
- `tm30Reported`: Boolean? (สถานะการแจ้ง ตม.30)
- `createdAt`: DateTime

## 2. `Room` (ห้องพัก)
- `id`: String (CUID)
- `roomNumber`: String (เช่น '101', '102')
- `floor`: Int
- `roomType`: String (เช่น 'Standard', 'Commercial')
- `price`: Float
- `status`: String ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE')

## 3. `Lease` (สัญญาเช่า)
เชื่อมความสัมพันธ์ระหว่าง User(Resident) และ Room
- `id`: String (CUID)
- `roomId`: String (FK -> Room)
- `tenantId`: String (FK -> User)
- `startDate`: DateTime
- `endDate`: DateTime? (Nullable)
- `isActive`: Boolean

## 4. `MeterReading` (การอ่านมิเตอร์น้ำ/ไฟ)
- `id`: String (CUID)
- `roomId`: String (FK -> Room)
- `billingMonth`: String (เช่น '2024-10')
- `waterMeter`: Float
- `electricMeter`: Float
- `createdAt`: DateTime

## 5. `Invoice` (ใบแจ้งหนี้)
- `id`: String (CUID)
- `leaseId`: String (FK -> Lease)
- `billingMonth`: String
- `roomRent`: Float
- `waterCharge`: Float
- `electricCharge`: Float
- `totalAmount`: Float
- `status`: String ('UNPAID', 'PENDING_VERIFICATION', 'PAID')
- `slipImageUrl`: String? (Nullable)
- `createdAt`: DateTime

## 6. `MaintenanceTicket` (รายการแจ้งซ่อม)
- `id`: String (CUID)
- `roomId`: String (FK -> Room)
- `reporterId`: String (FK -> User)
- `assigneeId`: String? (FK -> User/Staff) (Nullable)
- `title`: String
- `description`: String? (Nullable)
- `category`: String ('Water', 'Electric', 'AirCon', 'General')
- `status`: String ('OPEN', 'IN_PROGRESS', 'RESOLVED')
- `createdAt`: DateTime
- `resolvedAt`: DateTime? (Nullable)
- `scheduledDate`: String? (Nullable)
- `scheduledSlot`: String? (Nullable)

## 7. `TechnicianAvailability` (วันทำงานของช่าง)
เก็บวันทำงานหลักของช่างแต่ละคน เพื่อให้ระบบปฏิทินและระบบจองรู้ว่าช่างคนนั้นทำงานวันไหน
- `id`: String (CUID)
- `staffId`: String (FK -> User, unique)
- `workingDays`: String (JSON array เช่น `["Mon","Tue","Wed","Thu","Fri"]`)
- `updatedAt`: DateTime

## 8. `TechnicianBlockedSlot` (ช่วงเวลาที่ช่าง block ไว้)
เก็บวันลา, วันหยุด, หรือช่วงเวลาที่ช่างไม่พร้อมรับงานเป็นรายคน
- `id`: String (CUID)
- `staffId`: String (FK -> User)
- `date`: String (`YYYY-MM-DD`)
- `type`: String (`Full Day`, `Morning`, `Afternoon`)
- `reason`: String? (Nullable)

## หมายเหตุเรื่องการจองหลายช่าง
- ความจุของ slot ไม่ได้ fix ที่ 3 งานทั้งระบบอีกต่อไป
- ระบบจะคำนวณ `capacity รวมของ slot = จำนวนช่างที่ว่างใน slot x 3`
- ถ้าช่างบางคน block slot ไว้ จะลด capacity เฉพาะใน slot นั้นตามจำนวนช่างที่เหลือ
