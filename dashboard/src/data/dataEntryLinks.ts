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
    url: null,
  },
  {
    unit: "HajjUmrah",
    titleEn: "New Inquiry",
    titleAr: "استفسار جديد",
    filledByEn: "Sales / inquiry desk, on first contact",
    filledByAr: "مكتب المبيعات والاستفسارات، عند أول تواصل",
    table: "Raw_Inquiries",
    url: null,
  },
  {
    unit: "HajjUmrah",
    titleEn: "Post-Trip Feedback",
    titleAr: "تقييم بعد الرحلة",
    filledByEn: "Pilgrims, or staff following up by phone",
    filledByAr: "الحجاج، أو الموظفون عبر المتابعة الهاتفية",
    table: "Raw_CustomerFeedback",
    url: null,
  },
  {
    unit: "HajjUmrah",
    titleEn: "Visa & Permit Processed",
    titleAr: "معالجة التأشيرة والتصريح",
    filledByEn: "Visa desk, once per booking as it's processed",
    filledByAr: "مكتب التأشيرات، لكل حجز عند معالجته",
    table: "Raw_VisaPermits",
    url: null,
  },
  {
    unit: "Hotel",
    titleEn: "New Reservation",
    titleAr: "حجز جديد",
    filledByEn: "Front desk, at check-in or booking",
    filledByAr: "مكتب الاستقبال، عند تسجيل الوصول أو الحجز",
    table: "Raw_Reservations",
    url: null,
  },
  {
    unit: "Hotel",
    titleEn: "F&B Sale",
    titleAr: "بيع مأكولات ومشروبات",
    filledByEn: "Restaurant / room-service staff, per sale",
    filledByAr: "موظفو المطعم وخدمة الغرف، لكل عملية بيع",
    table: "Raw_FnB_Sales",
    url: null,
  },
  {
    unit: "Hotel",
    titleEn: "Guest Feedback",
    titleAr: "تقييم النزيل",
    filledByEn: "Guests at checkout, or front desk on their behalf",
    filledByAr: "النزلاء عند المغادرة، أو مكتب الاستقبال نيابة عنهم",
    table: "Raw_GuestFeedback",
    url: null,
  },
  {
    unit: "Bakery",
    titleEn: "Daily Sales",
    titleAr: "المبيعات اليومية",
    filledByEn: "Outlet cashier, per transaction or end-of-day",
    filledByAr: "أمين الصندوق، لكل عملية أو في نهاية اليوم",
    table: "Raw_Sales",
    url: null,
  },
  {
    unit: "Bakery",
    titleEn: "Production Run",
    titleAr: "دفعة إنتاج",
    filledByEn: "Production / kitchen lead, per batch",
    filledByAr: "مسؤول الإنتاج، لكل دفعة",
    table: "Raw_Production",
    url: null,
  },
  {
    unit: "Bakery",
    titleEn: "Waste Log",
    titleAr: "سجل الهدر",
    filledByEn: "Outlet staff, end of day",
    filledByAr: "موظفو الفرع، نهاية اليوم",
    table: "Raw_Waste",
    url: null,
  },
  {
    unit: "Group",
    titleEn: "Expense Claim",
    titleAr: "طلب مصاريف",
    filledByEn: "Department heads / whoever incurs the cost",
    filledByAr: "رؤساء الأقسام / من يتحمل التكلفة",
    table: "Raw_Expenses",
    url: null,
  },
];

export const LEDGER_ENTRY_FORMS_GUIDE_URL = "https://claude.ai/code/artifact/b59dcc4c-8cbc-4a2a-988c-563294a70d90";
