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
