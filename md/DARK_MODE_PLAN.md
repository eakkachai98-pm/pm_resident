# Dark Mode Implementation Plan (Tailwind CSS)

## 🎯 วัตถุประสงค์ (Objective)
เพิ่มฟีเจอร์ Dark Mode ให้กับระบบ IT Fixit เพื่อลดอาการปวดตาสำหรับช่างเทคนิคและผู้ดูแลระบบที่ต้องใช้งานหน้าจอเป็นเวลานาน และเพิ่มความสวยงามทันสมัยให้กับแอปพลิเคชัน

## 🛠 แนวทางและเทคโนโลยีที่ใช้ (Approach & Technology)
ระบบมีการใช้งาน **Tailwind CSS v4** อยู่แล้ว การรองรับ Dark Mode จึงสามารถทำได้โดยการใช้ Utility Classes (เช่น `dark:bg-gray-800`, `dark:text-white`) และการสร้าง Context สำหรับจัดการสถานะ (State) ของ ธีม

---

## 📝 ขั้นตอนการทำงาน (Implementation Steps)

### Step 1: สร้าง ThemeContext (State Management)
*   สร้างไฟล์ `src/context/ThemeContext.tsx`
*   สร้าง Context ที่สามารถกำหนดค่า `theme` เป็น `'light'`, `'dark'`, หรือ `'system'`
*   ใช้ `localStorage` ในการจดจำการตั้งค่าของผู้ใช้
*   ครอบ (Wrap) ตัวแอปพลิเคชันใน `main.tsx` ด้วย `<ThemeProvider>`

### Step 2: อัปเดต Tailwind Configuration
*   (หากจำเป็น) ให้ตั้งค่า Tailwind CSS ให้เปลี่ยนโหมดด้วย class (เช่นใส่คลาส `dark` ไว้ที่แท็ก `<html>` หรือ `<body>`) ซึ่งมักจะทำอัตโนมัติใน ThemeContext

### Step 3: เพิ่มปุ่มสลับธีม (Theme Toggle)
*   แก้ไขคอมโพเนนต์ `Header` (`src/App.tsx`)
*   เพิ่มปุ่มสำหรับสลับโหมด ใกล้ๆ กับปุ่มเปลี่ยนภาษา (EN/TH)
*   ใช้ไอคอนพระอาทิตย์ (Sun) ☀️ สำหรับเปิด Light Mode และพระจันทร์ (Moon) 🌙 สำหรับ Dark Mode

### Step 4: อัปเดต Colors ใน Components หลัก
ทยอยเพิ่มคลาส `dark:` ในคอมโพเนนต์ต่างๆ ดังนี้:

**1. พื้นหลังแอปและตัวอักษรหลัก (Global)**
*   `bg-[#F4F6F8]` -> `dark:bg-gray-900`
*   `text-gray-900` -> `dark:text-gray-100`

**2. Sidebar & Header**
*   Header: เปลี่ยนพื้นหลังและการเบลอให้เข้ากับธีมมืด (`dark:bg-gray-800/80`)
*   Sidebar: อัปเดตสีพื้นหลังและสีเมื่อ Hover ให้โดดเด่นบนธีมมืด

**3. Cards, Tables, & Modals**
*   กล่องและ Card (Dashboard): `bg-white` -> `dark:bg-gray-800`, ขอบ (`border`) ให้สีเข้มขึ้น
*   ตาราง (Inventory, Tickets): สลับสีแถว (`odd/even`) และหัวตารางให้เหมาะกับโหมดมืด
*   Modal (หน้าต่างเด้งขึ้นมา): สีพื้นและเงา (Shadow) ต้องปรับให้ดูมีมิติแม้พื้นหลังจะมืด

**4. Forms & Inputs**
*   ช่องกรอกข้อมูล (Input/Textarea): `bg-gray-50` -> `dark:bg-gray-700`, พร้อมอัปเดตสี placeholder

---

## 🧪 การทดสอบ (Testing)
1.  **Manual Test:** ลองกดสลับธีมและสำรวจทุกหน้าจอ (Dashboard, Inventory, Tickets, CommandCenter)
2.  **Persistence:** รีเฟรชเบราว์เซอร์ ธีมยังคงจำค่าเดิมที่เลือกไว้
3.  **UI Consistency:** สังเกตปุ่มและตัวอักษรบางจุดที่อาจจะกลืนไปกับพื้นหลังสีดำ และปรับ Contrast ให้เหมาะสม

---
*หมายเหตุ: สามารถทยอยอัปเดตไปทีละหน้าเพื่อลดผลกระทบที่อาจเกิดกับ UI ในภาพรวมได้*
