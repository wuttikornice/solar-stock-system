#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
สคริปต์วิเคราะห์ยอดสต๊อกคงเหลือและตรวจสอบความถูกต้อง
"""

import pandas as pd
from collections import defaultdict

# อ่านไฟล์ CSV
print("=" * 80)
print("📊 กำลังวิเคราะห์ข้อมูลสต๊อก CMI Solar")
print("=" * 80)
print()

# อ่านข้อมูลสินค้า
products_df = pd.read_csv("public/CMI Solar Stock - Products.csv")
print(f"✅ อ่านข้อมูลสินค้าทั้งหมด: {len(products_df)} รายการ")

# อ่านข้อมูลสต๊อกเข้า
stock_in_df = pd.read_csv("CMI Solar Stock - Stock_In.csv")
print(f"✅ อ่านข้อมูลสต๊อกเข้า: {len(stock_in_df)} รายการ")

# อ่านข้อมูลสต๊อกออก (ใช้ไฟล์ FIXED)
stock_out_df = pd.read_csv("Stock_Out_FIXED.csv")
print(f"✅ อ่านข้อมูลสต๊อกออก: {len(stock_out_df)} รายการ")
print()

# นับจำนวนสต๊อกเข้าแต่ละ Product ID
stock_in_count = stock_in_df['Product ID'].value_counts().to_dict()
print(f"📦 สินค้าที่มีการรับเข้า: {len(stock_in_count)} รายการ")

# นับจำนวนสต๊อกออกแต่ละ Product ID
stock_out_count = stock_out_df['Product ID'].value_counts().to_dict()
print(f"📤 สินค้าที่มีการจ่ายออก: {len(stock_out_count)} รายการ")
print()

# สร้างตารางสรุป
print("=" * 120)
print("📋 สรุปยอดสต๊อกคงเหลือ")
print("=" * 120)
print()

summary_data = []

for _, product in products_df.iterrows():
    product_id = product['Product ID']
    category = product['Category']
    brand = product['Brand']
    model = product['Model']
    unit = product['Unit']
    min_stock = product['Min Stock']

    # คำนวณสต๊อก
    qty_in = stock_in_count.get(product_id, 0)
    qty_out = stock_out_count.get(product_id, 0)
    balance = qty_in - qty_out

    # ตรวจสอบสถานะ
    status = ""
    warning = ""

    if pd.notna(min_stock) and balance < min_stock:
        status = "⚠️  ต่ำกว่าขั้นต่ำ"
        warning = "ต้องสั่งเพิ่ม"
    elif balance == 0:
        status = "❌ สต๊อกหมด"
        warning = "ไม่มีสินค้า"
    elif balance < 0:
        status = "🔴 ผิดปกติ!"
        warning = "ออกมากกว่าเข้า"
    elif balance > 0:
        status = "✅ ปกติ"
    else:
        status = "➖ ไม่มีรายการ"

    summary_data.append({
        'Product ID': product_id,
        'Category': category,
        'Brand': brand,
        'Model': model,
        'Unit': unit,
        'รับเข้า': qty_in,
        'จ่ายออก': qty_out,
        'คงเหลือ': balance,
        'Min Stock': min_stock if pd.notna(min_stock) else '-',
        'สถานะ': status,
        'หมายเหตุ': warning
    })

# สร้าง DataFrame สรุป
summary_df = pd.DataFrame(summary_data)

# แสดงผลตามหมวดหมู่
categories = summary_df['Category'].unique()

total_products = 0
total_in = 0
total_out = 0
total_balance = 0
warning_count = 0
critical_count = 0
normal_count = 0

for category in sorted(categories):
    category_data = summary_df[summary_df['Category'] == category]
    print(f"\n{'='*120}")
    print(f"📂 หมวดหมู่: {category}")
    print(f"{'='*120}")

    for _, row in category_data.iterrows():
        print(f"\n{row['Product ID']} - {row['Brand']} {row['Model']}")
        print(f"   📥 รับเข้า: {row['รับเข้า']} {row['Unit']}")
        print(f"   📤 จ่ายออก: {row['จ่ายออก']} {row['Unit']}")
        print(f"   📊 คงเหลือ: {row['คงเหลือ']} {row['Unit']}")
        if row['Min Stock'] != '-':
            print(f"   ⚡ สต๊อกขั้นต่ำ: {row['Min Stock']} {row['Unit']}")
        print(f"   {row['สถานะ']}", end='')
        if row['หมายเหตุ']:
            print(f" - {row['หมายเหตุ']}")
        else:
            print()

        # นับสถิติ
        total_products += 1
        total_in += row['รับเข้า']
        total_out += row['จ่ายออก']
        total_balance += row['คงเหลือ']

        if '🔴' in row['สถานะ']:
            critical_count += 1
        elif '⚠️' in row['สถานะ'] or '❌' in row['สถานะ']:
            warning_count += 1
        elif '✅' in row['สถานะ']:
            normal_count += 1

# สรุปภาพรวม
print(f"\n{'='*120}")
print("📊 สรุปภาพรวม")
print(f"{'='*120}")
print(f"\n📦 จำนวนสินค้าทั้งหมด: {total_products} รายการ")
print(f"📥 รับเข้าทั้งหมด: {total_in} ชิ้น")
print(f"📤 จ่ายออกทั้งหมด: {total_out} ชิ้น")
print(f"📊 คงเหลือรวม: {total_balance} ชิ้น")
print()
print(f"✅ สต๊อกปกติ: {normal_count} รายการ")
print(f"⚠️  สต๊อกต่ำ/หมด: {warning_count} รายการ")
print(f"🔴 พบความผิดปกติ: {critical_count} รายการ")

# ตรวจสอบความถูกต้องของข้อมูล
print(f"\n{'='*120}")
print("🔍 การตรวจสอบความถูกต้อง")
print(f"{'='*120}")
print()

# 1. ตรวจสอบสต๊อกติดลบ
negative_stock = summary_df[summary_df['คงเหลือ'] < 0]
if len(negative_stock) > 0:
    print("❌ พบปัญหา: มีสินค้าที่จ่ายออกมากกว่ารับเข้า!")
    for _, row in negative_stock.iterrows():
        print(f"   - {row['Product ID']}: รับเข้า {row['รับเข้า']} แต่จ่ายออก {row['จ่ายออก']} (ติดลบ {row['คงเหลือ']})")
else:
    print("✅ ไม่พบสต๊อกติดลบ - ข้อมูลถูกต้อง")

print()

# 2. ตรวจสอบสินค้าที่ต่ำกว่าสต๊อกขั้นต่ำ
low_stock = summary_df[
    (summary_df['Min Stock'] != '-') &
    (summary_df['คงเหลือ'] < summary_df['Min Stock'].astype(float))
]
if len(low_stock) > 0:
    print(f"⚠️  พบสินค้าที่ต่ำกว่าสต๊อกขั้นต่ำ: {len(low_stock)} รายการ")
    for _, row in low_stock.iterrows():
        shortage = float(row['Min Stock']) - row['คงเหลือ']
        print(f"   - {row['Product ID']}: คงเหลือ {row['คงเหลือ']} {row['Unit']} (ต้องเพิ่มอีก {shortage:.0f} {row['Unit']})")
else:
    print("✅ สต๊อกทุกรายการอยู่ในเกณฑ์ปกติ")

print()

# 3. ตรวจสอบ Serial Number ซ้ำ
print("🔍 ตรวจสอบ Serial Number...")
stock_in_serials = stock_in_df['Serial Number'].dropna().value_counts()
duplicates_in = stock_in_serials[stock_in_serials > 1]

if len(duplicates_in) > 0:
    print(f"⚠️  พบ Serial Number ซ้ำในสต๊อกเข้า: {len(duplicates_in)} รายการ")
    for serial, count in duplicates_in.head(5).items():
        print(f"   - {serial}: ปรากฏ {count} ครั้ง")
else:
    print("✅ ไม่พบ Serial Number ซ้ำในสต๊อกเข้า")

stock_out_serials = stock_out_df['Serial Number'].dropna().value_counts()
duplicates_out = stock_out_serials[stock_out_serials > 1]

if len(duplicates_out) > 0:
    print(f"⚠️  พบ Serial Number ซ้ำในสต๊อกออก: {len(duplicates_out)} รายการ")
    for serial, count in duplicates_out.head(5).items():
        print(f"   - {serial}: ปรากฏ {count} ครั้ง")
else:
    print("✅ ไม่พบ Serial Number ซ้ำในสต๊อกออก")

print()

# 4. ตรวจสอบ Serial Number ที่จ่ายออกแต่ไม่มีในรับเข้า
out_serials = set(stock_out_df['Serial Number'].dropna())
in_serials = set(stock_in_df['Serial Number'].dropna())
invalid_outs = out_serials - in_serials

if len(invalid_outs) > 0:
    print(f"⚠️  พบ Serial Number ที่จ่ายออกแต่ไม่มีในระบบรับเข้า: {len(invalid_outs)} รายการ")
    for serial in list(invalid_outs)[:5]:
        product_id = stock_out_df[stock_out_df['Serial Number'] == serial]['Product ID'].iloc[0]
        print(f"   - {serial} ({product_id})")
    if len(invalid_outs) > 5:
        print(f"   ... และอีก {len(invalid_outs) - 5} รายการ")
else:
    print("✅ Serial Number ทุกรายการที่จ่ายออกมีในระบบรับเข้า")

print()
print("=" * 120)
print("✅ การวิเคราะห์เสร็จสมบูรณ์")
print("=" * 120)

# บันทึกผลลัพธ์เป็น CSV
output_file = "stock_analysis_summary.csv"
summary_df.to_csv(output_file, index=False, encoding='utf-8-sig')
print(f"\n💾 บันทึกผลการวิเคราะห์ไปที่: {output_file}")
