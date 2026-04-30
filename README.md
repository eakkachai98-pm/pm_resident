# Resident soft: Dormitory & Resident Management System

ระบบบริหารจัดการหอพักและอพาร์ทเมนต์แบบครบวงจร (Dormitory Management System) ออกแบบมาเพื่อช่วยให้เจ้าของหอพักและผู้ดูแลสามารถบริหารจัดการผู้เช่า, ค่าใช้จ่าย, และการซ่อมบำรุงได้อย่างมีประสิทธิภาพ

## 🌟 ฟีเจอร์หลัก (Core Features)
- **Room Management:** ระบบจัดการห้องพัก สถานะห้องว่าง/มีผู้เช่า ข้อมูลเฟอร์นิเจอร์
- **Tenant Management:** ระบบจัดการข้อมูลผู้เช่าและสัญญาเช่า (Lease Agreement)
- **Billing & Metering:** ระบบจดค่าน้ำ-ค่าไฟ และคำนวณบิลรายเดือนอัตโนมัติ
- **Payment Verification:** ระบบแจ้งชำระเงินและตรวจสอบสลิปโอนเงิน
- **Maintenance (Ticketing):** ระบบแจ้งซ่อมสำหรับลูกบ้าน พร้อมระบบจัดการคิวงานของช่าง
- **Notice Board:** ระบบประกาศข่าวสารจากส่วนกลางถึงลูกบ้าน

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - ตรวจสอบว่า PostgreSQL เปิดทำงานอยู่
   - สร้างฐานข้อมูลชื่อ `db_resident` และตั้งค่า `DATABASE_URL` ใน `.env` (ตัวอย่าง: `postgresql://user:pass@localhost:5433/db_resident?schema=public`)
   - รันคำสั่งซิงค์โครงสร้างฐานข้อมูลและจำลองข้อมูลเริ่มต้น:
     ```bash
     npx prisma db push
     npx prisma generate
     npx tsx prisma/seed.js
     ```

3. **Run App**
   ```bash
   npm run dev
   ```

## 🔐 ข้อมูลเข้าใช้งานระบบ (Demo Credentials)

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) | สิทธิ์การเข้าถึง |
| :--- | :--- | :--- | :--- |
| **Admin (เจ้าของ/ผู้จัดการ)** | `admin@residentsoft.com` | `password123` | จัดการทุกอย่าง (ตั้งค่า, บิล, อนุมัติสลิป) |
| **Staff (ช่าง/แม่บ้าน)** | `staff@residentsoft.com` | `password123` | ดูงานแจ้งซ่อม และอัปเดตสถานะงาน |
| **Resident (ลูกบ้าน)** | `resident@residentsoft.com` | `password123` | ดูบิลค่าเช่า, แจ้งซ่อม, ดูประกาศ |

## 📁 โครงสร้างโปรเจกต์
- **Frontend:** React 19, TypeScript, Tailwind v4
- **Backend:** Node.js Express พร้อม Prisma ORM
- **Database:** PostgreSQL

## 📝 Recent Updates (อัปเดตล่าสุด)
- **UI/UX Improvements:**
  - แก้ไขปัญหา Header ซ้อนทับ Navbar (Z-index issue)
  - ปรับโครงสร้าง Pop-up Modal ทั้งหมดให้เป็นมาตรฐาน (รองรับ Scrollable Body แบบไม่ทะลุกรอบ)
  - เพิ่มระบบแสดงข้อมูลแจ้งซ่อมแบบ Modal บนหน้า Dashboard แทนการ Link ไปหน้าอื่น
- **Maintenance & Feedback:**
  - เพิ่มระบบปิดงานซ่อม (Resolve Ticket) พร้อมแนบรูปภาพซ่อมเสร็จและโน้ตจากช่าง
  - ช่างไม่สามารถกดปิดงานซ้ำได้หากสถานะเป็น RESOLVED หรือ CLOSED ไปแล้ว
  - เพิ่มระบบ Rating 5 ดาว ให้ลูกบ้านสามารถให้คะแนนความพึงพอใจและ Feedback แก่ช่างได้เมื่อซ่อมเสร็จ
  - ปรับปรุง Pop-up ดูรายละเอียดแจ้งซ่อมในฝั่งช่าง (Technician) ให้แสดงข้อมูลครบถ้วนเหมือนฝั่งลูกบ้าน (โชว์รูปภาพซ่อมเสร็จ, โน้ตช่าง, และคะแนน Rating)