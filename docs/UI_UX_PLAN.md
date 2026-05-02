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

## 3.5. หน้า Resident Profile (ข้อมูลส่วนตัวและเอกสาร) ✅ *[NEW 2026-05-02]*
- **แยกหน้าจอ (Dedicated Screen):** เปลี่ยนจากการใช้ Modal Pop-up มาเป็นหน้าจอหลักผ่าน Navigation Menu เพื่องานที่เป็นทางการและมีความน่าเชื่อถือ
- **ข้อมูลส่วนตัว (Read-Only):** ดึงข้อมูลส่วนตัว (ชื่อ, เบอร์, อีเมล, สัญชาติ) และข้อมูล **สัญญาเช่าปัจจุบัน (Active Lease)** พร้อมสถานะแสดงผลแบบอ่านอย่างเดียว 
- **ระบบเอกสาร (My Documents):** แสดงรายการเอกสารอ้างอิงของลูกบ้าน (เช่น สำเนาบัตร, สัญญาเช่า) ដែល Admin อัปโหลดให้ทางระบบหลังบ้าน พร้อมปุ่มกดดาวน์โหลดไฟล์ 
- **ไฟล์:** `src/screens/Profile.tsx`

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
- **Tenant Detail Slide-over Panel:** 
  - กดปุ่ม `View →` จะสไลด์หน้าต่างข้อมูลผู้เช่าจากด้านขวา โดยไม่ต้องเปลี่ยนหน้า
  - **Edit Profile (เฉพาะ Admin เท่านั้น):** มุมขวาบนจะมีไอคอน ✏️ ปรากฏขึ้นเฉพาะบัญชีระดับ `admin` เท่านั้น เมื่อกดแล้วจะสามารถแก้ไขข้อมูลผู้เช่าได้แบบ Inline โดยปุ่ม Save/Cancel จะถูกย้ายไปอยู่ด้านล่างสุด (Footer) เพื่อให้พื้นที่พิมพ์กว้างขึ้นและไม่ทับซ้อนกัน
  - **การย้ายห้อง (Room Transfer Logic):** 
    - *อัปเดตระบบ (2026-05-02):* เมื่อเปลี่ยนห้อง ระบบจะทำการ **Terminate สัญญาเดิมอัตโนมัติ** (พร้อมรับค่ามิเตอร์น้ำ-ไฟวันย้ายออก) เพื่อให้เก็บบิลของห้องเก่าไว้ในประวัติ และ **สร้างสัญญาใหม่ (New Lease)** ให้กับห้องใหม่โดยอัตโนมัติ เพื่อรักษาความถูกต้องของข้อมูลบัญชี (Data Integrity)
  - **ข้อมูลส่วนตัว:** ข้อมูลติดต่อพื้นฐาน และข้อมูลผู้ติดต่อฉุกเฉิน (Emergency Contact)
  - **สัญญาปัจจุบัน:** แสดงห้องพักที่อยู่ปัจจุบัน, วันที่เข้าอยู่, และค่าเช่ารายเดือน
  - **ระบบเอกสาร (Documents & Contracts):** อัปโหลดไฟล์เอกสารสัญญาเช่าหรือบัตรประชาชนเข้าสู่ฐานข้อมูล (`TenantDocument`)
    - **Image Compression:** หากไฟล์เป็นรูปภาพ (`.jpg`, `.png`) ระบบจะใช้ Canvas บีบอัดขนาดให้ไม่เกิน 1200px และลด Quality เหลือ 70% ก่อนอัปโหลดโดยอัตโนมัติ เพื่อประหยัดพื้นที่เซิร์ฟเวอร์
    - **UI Stability:** เพิ่มระบบดักจับ Error (Robust Fetching) หาก API มีปัญหาหรือหาโมเดล Database ไม่เจอ หน้าจอ UI จะแสดงข้อความแจ้งเตือนแทนการ Error หน้าจอขาว (White Screen Crash) ช่วยให้ระบบไม่ล่ม
  - **การย้ายออก (Terminate Lease):** ปุ่มสีแดงสำหรับยุติสัญญาเช่า โดยให้ระบุวัน Move-out Date และสามารถระบุ **เลขมิเตอร์น้ำ/ไฟ ล่าสุด** เพื่อนำไปออกบิลเดือนสุดท้ายอัตโนมัติได้ ระบบจะตั้งค่าสัญญาเป็น Inactive และคืนสถานะห้องเป็น Available
- **ไฟล์หลัก:** `src/screens/Personnel.tsx`, `server/server.js`, `prisma/schema.prisma`


## 5. หน้า Billing (บิลค่าเช่า) ✅
- **การจัดการ Invoice:** 
  - แสดงรายการบิลสถานะต่างๆ (Pending, Paid) พร้อมจำนวนเงินที่ต้องชำระ
  - เตรียมโครงสร้างรองรับ Payment Gateway / Upload Slip ในอนาคต

## 6. หน้า Maintenance (แจ้งซ่อม) ✅ *[Updated 2026-05-02]*
- ปรับปรุงฟอร์มแจ้งซ่อม เปลี่ยนหมวดหมู่ปัญหาเป็น: 💧 ระบบน้ำ, ⚡ ระบบไฟ, ❄️ แอร์, 🚪 โครงสร้าง/เฟอร์นิเจอร์, อื่นๆ
- **ระบบ Auto-fill ห้องพักอัจฉริยะ (Room Selection Lockdown):** 
  - หากเป็น **ลูกบ้าน (Resident)** แจ้งซ่อม: ระบบจะดึงห้องเช่าปัจจุบันจาก Active Lease ไปค้นหา และดึงเลขห้องมาเติมให้โดยอัตโนมัติ พร้อม **ล็อกไม่ให้เปลี่ยนห้องได้** ป้องกันการแจ้งซ่อมห้องผู้อื่น
  - หากเป็น **แอดมิน/ช่าง (Admin/Staff)** แจ้งซ่อม: สามารถเลือกห้องแบบ Dropdown ได้อิสระตามเดิม เพื่อความสะดวกในการสร้างใบสั่งซ่อมแทนลูกบ้าน หรือแจ้งซ่อมพื้นที่ส่วนกลาง

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
