# Database Schema (Proposed)

โครงสร้างฐานข้อมูลเบื้องต้นสำหรับระบบหอพัก (Resident soft) ควรประกอบด้วยตารางหลักดังนี้:

## 1. `User` (ผู้ใช้งาน)
เก็บข้อมูลผู้ใช้งานทุกคน ทั้ง Admin, Staff และ Resident
- `id`: UUID
- `role`: Enum ('ADMIN', 'STAFF', 'RESIDENT')
- `name`: String
- `email`: String (สำหรับ Login)
- `phone`: String
- `passwordHash`: String

## 2. `Room` (ห้องพัก)
- `id`: UUID
- `roomNumber`: String (เช่น '101', '102')
- `floor`: Int
- `roomType`: String (เช่น 'Standard', 'VIP')
- `pricePerMonth`: Float
- `status`: Enum ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE')

## 3. `Lease` (สัญญาเช่า)
เชื่อมความสัมพันธ์ระหว่าง User(Resident) และ Room
- `id`: UUID
- `roomId`: UUID (FK)
- `tenantId`: UUID (FK)
- `startDate`: DateTime
- `endDate`: DateTime
- `depositAmount`: Float
- `isActive`: Boolean

## 4. `MeterReading` (การอ่านมิเตอร์น้ำ/ไฟ)
- `id`: UUID
- `roomId`: UUID (FK)
- `billingMonth`: String (เช่น '2024-10')
- `waterMeter`: Float
- `electricMeter`: Float
- `createdAt`: DateTime

## 5. `Invoice` (ใบแจ้งหนี้)
- `id`: UUID
- `leaseId`: UUID (FK)
- `billingMonth`: String
- `roomRent`: Float
- `waterCharge`: Float
- `electricCharge`: Float
- `otherCharges`: Float
- `totalAmount`: Float
- `status`: Enum ('UNPAID', 'PENDING_VERIFICATION', 'PAID')
- `slipImageUrl`: String (รูปสลิปที่แนบมา)

## 6. `MaintenanceTicket` (รายการแจ้งซ่อม)
- `id`: UUID
- `roomId`: UUID (FK)
- `reportedById`: UUID (FK -> User)
- `assignedToId`: UUID (FK -> User/Staff) (Nullable)
- `title`: String
- `description`: Text
- `status`: Enum ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
- `createdAt`: DateTime
