// Portal entries for the /data-entry page. Each `url` is the live Google
// Form link once it exists (see the "Ledger Entry Forms" setup guide) — set
// to null it renders as "not set up yet" instead of a dead link. Filling in
// a url here and redeploying is the only step needed to activate a card.
export type DataEntryUnit = "HajjUmrah" | "Hotel" | "Bakery" | "Group";

export interface DataEntryLink {
  unit: DataEntryUnit;
  titleEn: string;
  titleAr: string;
  filledByEn: string;
  filledByAr: string;
  table: string;
  url: string | null;
}

export const DATA_ENTRY_LINKS: DataEntryLink[] = [
  {
    unit: "HajjUmrah",
    titleEn: "New Booking",
    titleAr: "حجز جديد",
    filledByEn: "Booking agents, at the point of sale",
    filledByAr: "وكلاء الحجز، عند نقطة البيع",
    table: "Raw_Bookings",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSflubXoRMPIGmmh4HJQ_z8OPcy1crjyj5S982R8z91YLHE8Yw/viewform",
  },
  {
    unit: "HajjUmrah",
    titleEn: "New Inquiry",
    titleAr: "استفسار جديد",
    filledByEn: "Sales / inquiry desk, on first contact",
    filledByAr: "مكتب المبيعات والاستفسارات، عند أول تواصل",
    table: "Raw_Inquiries",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSfRhA8foGVZFvj3wVs9rQUuaUC4YKgPmw6PIDn8lAFJ3dQOIg/viewform",
  },
  {
    unit: "HajjUmrah",
    titleEn: "Post-Trip Feedback",
    titleAr: "تقييم بعد الرحلة",
    filledByEn: "Pilgrims, or staff following up by phone",
    filledByAr: "الحجاج، أو الموظفون عبر المتابعة الهاتفية",
    table: "Raw_CustomerFeedback",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSf3zjNl-ggajQuo8IrpDbiWO0PcyQkqTikW-v3dYl_7c-FHMg/viewform",
  },
  {
    unit: "HajjUmrah",
    titleEn: "Visa & Permit Processed",
    titleAr: "معالجة التأشيرة والتصريح",
    filledByEn: "Visa desk, once per booking as it's processed",
    filledByAr: "مكتب التأشيرات، لكل حجز عند معالجته",
    table: "Raw_VisaPermits",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSfV72E0tU4iNrDJMfLyA1koBnN4fmbrdfab_roB9XU-M7dtng/viewform",
  },
  {
    unit: "Hotel",
    titleEn: "New Reservation",
    titleAr: "حجز جديد",
    filledByEn: "Front desk, at check-in or booking",
    filledByAr: "مكتب الاستقبال، عند تسجيل الوصول أو الحجز",
    table: "Raw_Reservations",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSdFB5boIk7kAH01iNCYUWLZ_lPvMBB0RTq1LezfiulNeCqCgw/viewform",
  },
  {
    unit: "Hotel",
    titleEn: "F&B Sale",
    titleAr: "بيع مأكولات ومشروبات",
    filledByEn: "Restaurant / room-service staff, per sale",
    filledByAr: "موظفو المطعم وخدمة الغرف، لكل عملية بيع",
    table: "Raw_FnB_Sales",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSdGHZlnlO3Og__fFvIgPdpB9GvfaQaD5CtYnrl1BGon-DLcsQ/viewform",
  },
  {
    unit: "Hotel",
    titleEn: "Guest Feedback",
    titleAr: "تقييم النزيل",
    filledByEn: "Guests at checkout, or front desk on their behalf",
    filledByAr: "النزلاء عند المغادرة، أو مكتب الاستقبال نيابة عنهم",
    table: "Raw_GuestFeedback",
    url: "https://docs.google.com/forms/d/e/1FAIpQLScUzTpCnhornyrs6WNnvHlLwPBGBqDYAX3LXEpvEkSrdANBoQ/viewform",
  },
  {
    unit: "Bakery",
    titleEn: "Daily Sales",
    titleAr: "المبيعات اليومية",
    filledByEn: "Outlet cashier, per transaction or end-of-day",
    filledByAr: "أمين الصندوق، لكل عملية أو في نهاية اليوم",
    table: "Raw_Sales",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSfRo6FsfHbLBFK4bivAXPeDNpUqQ8veqEzoyxIxxFZAgW5dpA/viewform",
  },
  {
    unit: "Bakery",
    titleEn: "Production Run",
    titleAr: "دفعة إنتاج",
    filledByEn: "Production / kitchen lead, per batch",
    filledByAr: "مسؤول الإنتاج، لكل دفعة",
    table: "Raw_Production",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSf-dhX1woIrNo6LoAGsKjC98sGEFdL3Lmueyo8Gzdf1o5bQsw/viewform",
  },
  {
    unit: "Bakery",
    titleEn: "Waste Log",
    titleAr: "سجل الهدر",
    filledByEn: "Outlet staff, end of day",
    filledByAr: "موظفو الفرع، نهاية اليوم",
    table: "Raw_Waste",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSfWHXgc5bCW8R7s7j8lf77tV2FO4RMmS6vC1wWn3lywDAePMQ/viewform",
  },
  {
    unit: "Group",
    titleEn: "Expense Claim",
    titleAr: "طلب مصاريف",
    filledByEn: "Department heads / whoever incurs the cost",
    filledByAr: "رؤساء الأقسام / من يتحمل التكلفة",
    table: "Raw_Expenses",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSfIV0l6G9K7SF2WQxCbPq-fivh0t-n3PONTYdo92tTo6hNOsA/viewform",
  },
];

export const LEDGER_ENTRY_FORMS_GUIDE_URL = "https://claude.ai/code/artifact/b59dcc4c-8cbc-4a2a-988c-563294a70d90";
