# UI/UX Modification Plan: Resident soft

**Status:** ✅ **Completed** (Phase 1 & Phase 2 Migrations Done)

เอกสารนี้ระบุแผนการปรับปรุงหน้าจอผู้ใช้งาน (User Interface) และประสบการณ์ผู้ใช้ (User Experience) เพื่อเปลี่ยนจากระบบ IT Asset เดิม มาเป็นระบบจัดการหอพักอย่างเต็มรูปแบบ ซึ่งได้ดำเนินการ **เสร็จสิ้นเรียบร้อยแล้วทั้งหมด**

## 1. เมนูนำทาง (Sidebar Navigation) ✅
รื้อเมนูเดิมออกและแทนที่ด้วยเมนูสำหรับหอพัก:
- ❌ **ของเดิม:** Command Center, Inventory, Personnel, Tickets, Settings
- ✅ **เปลี่ยนเป็น:**
  - **📊 Dashboard:** หน้าจอภาพรวมของหอพัก (แยกระบบระหว่าง Admin และลูกบ้าน)
  - **🚪 Rooms (Inventory):** ผังห้องพัก และสถานะของแต่ละห้อง
  - **👥 Tenants (Personnel):** ข้อมูลลูกบ้านและประวัติการเช่า
  - **💸 Billing:** จัดการบิล แจ้งหนี้ 
  - **🛠️ Maintenance (Tickets):** แจ้งซ่อมบำรุง
  - **⚙️ Settings:** ตั้งค่าหอพัก (เช่น ราคาค่าน้ำ-ค่าไฟต่อหน่วย)

## 2. หน้า Admin Dashboard (ภาพรวมฝั่งแอดมิน) ✅
- **ข้อมูลสรุป (Cards):** 
  - อัตราการเข้าพัก (Occupancy Rate)
  - ยอดค้างชำระ (Unpaid Invoices)
  - งานแจ้งซ่อมค้าง (Pending Maintenance)
- **กราฟ (Charts):** แสดงรายรับย้อนหลัง (Revenue Chart)

## 3. หน้า Resident Dashboard (ภาพรวมฝั่งลูกบ้าน) ✅ *[NEW]*
- **Real-time IoT Flow:** อนิเมชันแสดงการไหลของพลังงานไฟฟ้าและน้ำเข้าสู่ห้องพัก (SVG SVG Flow Animation) พร้อมข้อมูลอัปเดตทุก 20 นาที
- **Mobile-Optimized Cards:** สรุปยอดการใช้งานน้ำและไฟรายเดือน แบ่งเป็น Card แยกกัน พร้อมกราฟแท่งแบบมินิมอล (Sparklines) และแนวโน้มการใช้พลังงาน (Trend Indicators)
- **Outstanding Bills:** สรุปบิลที่ค้างชำระและปุ่มเตรียมชำระเงิน
- **My Requests:** ติดตามสถานะงานแจ้งซ่อมของตัวเอง ความสูงกล่องสัดส่วนพอดีกับ IoT Flow

## 4. หน้า Rooms (แผนผังห้องพัก) ✅ *[UI Revamped 2026-05-02]*
- **รูปแบบการแสดงผล (View):** Grid ห้องพัก แบ่งตามชั้น (Floor Sections) พร้อม Stat Cards สรุปภาพรวมด้านบน
- **Stat Cards:** แสดงจำนวนห้องทั้งหมด, ว่าง, มีผู้เช่า, ซ่อมบำรุง พร้อม icon บนพื้นหลัง pastel ตามสี
- **Toolbar:** มีช่องค้นหา + ตัวกรองชั้น + Legend สถานะ ในแถวเดียวกัน
- **Floor Header:** แสดงชื่อชั้น + จำนวนห้องรวมและห้องว่างในชั้นนั้น (เช่น `6 rooms · 2 available`)
- **Room Cards (Minimalist Redesign):**
  - รูปทรงโค้งมน `border-radius: 14px` ขอบบาง `1.5px` พื้นหลัง Pastel ตามสถานะ
  - 🟢 เขียวอ่อน: ว่าง (AVAILABLE) — แสดงราคา ฿/เดือน
  - 🔴 แดงอ่อน: มีผู้เช่า (OCCUPIED) — แสดงชื่อผู้เช่า
  - 🟡 เหลืองอ่อน: ซ่อมบำรุง (MAINTENANCE) — แสดง "Under Repair" + dot กระพริบ
- **Hover Effect:** ยกขึ้นเล็กน้อย `y: -3px` พร้อม transition นุ่มลื่น
- **ไฟล์:** `src/screens/Inventory.tsx`

## 4.5. หน้า Tenants (จัดการผู้เช่า) ✅ *[UI Revamped 2026-05-02]*
- **เปลี่ยนจาก:** Card Grid ใหญ่ๆ เรียง 3 ช่อง ดูยาก scroll เยอะ
- **เปลี่ยนเป็น:** Table Layout เรียบง่าย อ่านง่าย เห็นข้อมูลได้มากต่อหน้า
- **Stat Cards (3 ใบ):** ผู้เช่าทั้งหมด, Active Leases, Foreigners
- **Toolbar:** ช่องค้นหา (ชื่อ/ห้อง/เบอร์) + Dropdown กรองชั้น + ปุ่ม Add Tenant
- **Table Columns:** Tenant (Avatar + ชื่อ + email), Room Chip, Phone, Move-in Date, Type Badge, View →
  - **Avatar:** ใช้ตัวอักษรแรกของชื่อ พร้อม background สี Pastel ต่างกันตามแต่ละคน (hash-based palette)
  - **Room Chip:** `🚪 R701` แบบ badge เล็กๆ เห็นชัด
  - **Type Badge:** 🇹🇭 Thai / 🌍 Foreigner / 🇨🇳 CN / 🇹🇼 TW ตามสัญชาติและภาษา
  - **View →:** ปุ่มซ่อน ปรากฏตอน hover เพื่อไม่รก
- **Floor Filter Logic:** ใช้ field `room.location` (เช่น `"Floor 7"`) เป็นหลัก — เหมือนกับ Inventory.tsx ทุกประการ โดยหากไม่พบ location จะดึงเลขจากห้อง และท้ายสุดหากระบุไม่ได้เลย (เช่น ห้องชื่อ "ร้านอาหาร_1") จะทำการ fallback ให้เป็น **Floor 1** ทันที เพื่อให้ตรงกับโครงสร้างข้อมูลของหน้า Rooms (**Bug fixed & synced 2026-05-02**)
- **ไฟล์:** `src/screens/Personnel.tsx`


## 5. หน้า Billing (บิลค่าเช่า) ✅
- **การจัดการ Invoice:** 
  - แสดงรายการบิลสถานะต่างๆ (Pending, Paid) พร้อมจำนวนเงินที่ต้องชำระ
  - เตรียมโครงสร้างรองรับ Payment Gateway / Upload Slip ในอนาคต

## 6. หน้า Maintenance (แจ้งซ่อม) ✅
- ปรับปรุงฟอร์มแจ้งซ่อม เปลี่ยนหมวดหมู่ปัญหาเป็น: 💧 ระบบน้ำ, ⚡ ระบบไฟ, ❄️ แอร์, 🚪 โครงสร้าง/เฟอร์นิเจอร์, อื่นๆ

## 7. หน้า Settings (ตั้งค่าระบบ) ✅
- รื้อถอนหน้าจัดการ Hardware Categories และ Departments เดิมทิ้ง
- เปลี่ยนเป็น **Utility Pricing** รองรับการตั้งราคา Electric Rate (฿/Unit) และ Water Rate (฿/Unit)

---
**🚀 Next Phase (Future Enhancements):**
- [x] **Smart Calendar Booking System (Staff & Resident):**
  - ฝั่งลูกบ้านเลือกระบุวัน/เวลา (Slot) ในการแจ้งซ่อมได้ (เสร็จสมบูรณ์ในหน้า Tickets)
  - ฝั่งช่าง (Technician Dashboard) มีหน้าจอ Monthly Calendar เพื่อดูคิวงาน พร้อมระบบ Claim งานจาก Pool และแสดงงานของตัวเอง (แก้ไขปัญหาการดึงข้อมูลและระบบผูก ID ช่างเรียบร้อยแล้ว)
- [ ] Payment Gateway Integration (QR PromptPay & Slip Upload)
- [x] **Email Notification Integration** (แทนที่ Line Notify เนื่องจาก LINE ยกเลิกบริการ): แจ้งเตือนสถานะการซ่อมบำรุงให้ลูกบ้าน และแจ้งงานซ่อมใหม่ให้ช่างผ่านอีเมล (Nodemailer) ดำเนินการเสร็จสิ้นแล้วใน Backend
- [x] **Minimalist Room Layout Redesign (UI Revamp Phase):** ✅ *ดำเนินการเสร็จสิ้นแล้ว (2026-05-02)*
  - เปลี่ยนจาก Card สี่เหลี่ยมแข็งๆ เป็น Soft Rounded Cards พร้อม Pastel Background ตามสถานะ
  - เพิ่ม Stat Cards สรุปภาพรวม, Toolbar พร้อม Legend และ Floor Header แสดงจำนวนห้องว่าง
  - ไฟล์ที่แก้ไข: `src/screens/Inventory.tsx`
