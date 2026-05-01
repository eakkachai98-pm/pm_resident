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

## 4. หน้า Rooms (แผนผังห้องพัก) ✅
- **รูปแบบการแสดงผล (View):** แสดงเป็นรูปแบบตาราง (Grid View Analytics)
- **สีสถานะห้อง (Color Indicators):**
  - 🟢 สีเขียว: ว่าง (AVAILABLE)
  - 🔴 สีแดง: มีผู้เช่า (OCCUPIED)
  - 🟡 สีส้ม: ซ่อมบำรุง (MAINTENANCE)

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
