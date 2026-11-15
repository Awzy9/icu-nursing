// Language support (English and Arabic, with right-to-left layout). Pure TypeScript: no React Native imports, so it is unit tested from the repository root.
export type Locale = "en" | "ar";
export const LOCALES: Locale[] = ["en", "ar"];
export const isRtl = (l: Locale): boolean => l === "ar";
export type LocalizedText = Record<string, string>;

export const messages = {
  en: {
    "app.name": "ICU Knowledge Map",
    "app.sampleBanner": "SAMPLE CONTENT. Everything in this app is a fictional, nonclinical sample written to test the software. It contains no ICU, patient or medication content and must never be used for care decisions.",
    "tab.learn": "Learn", "tab.practice": "Practice", "tab.library": "Library", "tab.account": "Account",
    "hub.title": "Learning hub", "hub.intro": "Practise with fictional samples while the real content is being prepared and reviewed.",
    "hub.continue": "Open", "hub.questions": "Question practice", "hub.questionsBody": "Answer one question at a time and read why each option is right or wrong.",
    "hub.cases": "Case-based learning", "hub.casesBody": "Make decisions step by step and see the consequences.",
    "hub.skills": "Skills", "hub.skillsBody": "Self-study checklists with safety and escalation points.",
    "hub.medications": "Medication reference", "hub.medicationsBody": "A reference layout with no dosing.",
    "hub.equipment": "Equipment and monitoring", "hub.equipmentBody": "Explore labelled diagrams, what is measured, safety and escalation.",
    "hub.bookmarks": "Bookmarks and progress", "hub.progress": "{viewed} of {total} equipment parts viewed · {marked} items bookmarked",
    "practice.title": "Practice", "library.title": "Library", "account.title": "Account and settings",
    "bookmarks.title": "Bookmarks", "bookmarks.empty": "Nothing bookmarked yet. Use the bookmark button on any item.", "bookmark.add": "Bookmark", "bookmark.remove": "Bookmarked",
    "common.back": "Back", "common.next": "Next", "common.close": "Close", "common.sample": "Sample", "common.notFound": "That item was not found.", "common.loading": "Loading…",
    "common.viewed": "viewed", "common.partsViewed": "{done} of {total} parts viewed", "common.selectPart": "Choose a part to see what it does.",
    "equipment.title": "Equipment and monitoring", "equipment.parts": "Parts of the diagram", "equipment.parameters": "What is measured or shown", "equipment.safety": "Safety concepts", "equipment.escalation": "When and how to escalate",
    "equipment.diagramAlt": "Diagram", "equipment.notice": "Original generic diagrams about fictional devices. Not a copy of any manufacturer's screen or manual.",
    "skills.title": "Skills", "skills.checklist": "Self-study checklist", "skills.ticked": "{done} of {total} steps ticked", "skills.notice": "A checklist here is a learning aid. It is not a competency assessment, a certificate or a clinical standard.", "skills.critical": "critical", "skills.sections": "Sections",
    "medications.title": "Medication reference", "medications.highAlert": "High-alert (fictional)", "medications.monitoring": "Monitoring", "medications.notice": "This reference never contains doses. Preparation and dosing always follow the order and your institution's policy.",
    "cases.title": "Case-based learning", "cases.step": "Step {n} of {total}", "cases.choose": "What do you do?", "cases.consequence": "What happens", "cases.feedback": "Why", "cases.continue": "Continue", "cases.summary": "Case summary", "cases.score": "Educational score: {score} out of 100", "cases.scoreNote": "This score only guides your learning. It is not a pass, a competency assessment or a certificate.", "cases.debrief": "Debrief", "cases.revisit": "Decisions to revisit: {steps}", "cases.again": "Try again", "cases.scopes": "Who decides",
    "scope.assessment": "Assessment", "scope.monitoring": "Monitoring", "scope.escalation": "Escalation", "scope.independent_nursing": "Independent nursing action", "scope.order_or_protocol_required": "Needs an order or protocol", "scope.prescriber_or_other_discipline": "Prescriber or another discipline",
    "quiz.title": "Question practice", "quiz.question": "Question {n} of {total}", "quiz.check": "Check answer", "quiz.correct": "Correct", "quiz.incorrect": "Not quite", "quiz.explain": "Explanation", "quiz.finish": "Finish", "quiz.result": "You answered {right} of {total} correctly.", "quiz.restart": "Practise again", "quiz.start": "Start practice",
    "account.language": "Language", "account.theme": "Appearance", "account.themeSystem": "Match the device", "account.themeLight": "Light", "account.themeDark": "Dark", "account.privacy": "Privacy", "account.privacyBody": "This build stores only your language, appearance, bookmarks and progress on this device. It has no account, no analytics and no advertising identifiers.",
    "account.deletionInfo": "Account deletion", "account.deletionBody": "When sign-in is available you will be able to delete your account here at any time. Deletion is immediate and permanent. It needs a recent sign-in and your email address, ends every session and cannot be undone.",
    "account.deletionLink": "How deletion works", "account.signInSoon": "Sign-in is being prepared and is not available in this build.",
    "prototype.title": "Original prototype screen", "prototype.note": "The first prototype screen, kept unchanged.",
    "a11y.bookmarkOn": "Remove bookmark", "a11y.bookmarkOff": "Add bookmark", "a11y.openItem": "Open {title}",
  },
  ar: {
    "app.name": "خريطة معرفة العناية المركزة",
    "app.sampleBanner": "محتوى تجريبي. كل ما في هذا التطبيق عيّنات خيالية غير سريرية كُتبت لاختبار البرنامج. لا يحتوي على محتوى للعناية المركزة أو المرضى أو الأدوية ولا يجوز استخدامه لاتخاذ قرارات الرعاية.",
    "tab.learn": "تعلّم", "tab.practice": "تدرّب", "tab.library": "المكتبة", "tab.account": "الحساب",
    "hub.title": "مركز التعلّم", "hub.intro": "تدرّب على عيّنات خيالية أثناء إعداد المحتوى الحقيقي ومراجعته.",
    "hub.continue": "فتح", "hub.questions": "التدرّب على الأسئلة", "hub.questionsBody": "أجب عن سؤال واحد في كل مرة واقرأ لماذا كل خيار صحيح أو خاطئ.",
    "hub.cases": "التعلّم بالحالات", "hub.casesBody": "اتخذ القرارات خطوة بخطوة وشاهد العواقب.",
    "hub.skills": "المهارات", "hub.skillsBody": "قوائم تحقق للدراسة الذاتية مع نقاط السلامة والتصعيد.",
    "hub.medications": "مرجع الأدوية", "hub.medicationsBody": "تخطيط مرجعي بلا جرعات.",
    "hub.equipment": "المعدات والمراقبة", "hub.equipmentBody": "استكشف مخططات موسومة وما يُقاس والسلامة والتصعيد.",
    "hub.bookmarks": "الإشارات المرجعية والتقدّم", "hub.progress": "تم عرض {viewed} من {total} أجزاء من المعدات · {marked} عناصر محفوظة",
    "practice.title": "التدرّب", "library.title": "المكتبة", "account.title": "الحساب والإعدادات",
    "bookmarks.title": "الإشارات المرجعية", "bookmarks.empty": "لا توجد عناصر محفوظة بعد. استخدم زر الإشارة المرجعية في أي عنصر.", "bookmark.add": "حفظ", "bookmark.remove": "محفوظ",
    "common.back": "رجوع", "common.next": "التالي", "common.close": "إغلاق", "common.sample": "عيّنة", "common.notFound": "لم يُعثر على هذا العنصر.", "common.loading": "جارٍ التحميل…",
    "common.viewed": "تم العرض", "common.partsViewed": "تم عرض {done} من {total} أجزاء", "common.selectPart": "اختر جزءاً لترى ما يفعله.",
    "equipment.title": "المعدات والمراقبة", "equipment.parts": "أجزاء المخطط", "equipment.parameters": "ما يُقاس أو يُعرض", "equipment.safety": "مفاهيم السلامة", "equipment.escalation": "متى وكيف تُصعِّد",
    "equipment.diagramAlt": "مخطط", "equipment.notice": "مخططات عامة أصلية عن أجهزة خيالية. ليست نسخة من شاشة أو دليل أي شركة مصنّعة.",
    "skills.title": "المهارات", "skills.checklist": "قائمة تحقق للدراسة الذاتية", "skills.ticked": "تم وضع علامة على {done} من {total} خطوات", "skills.notice": "القائمة هنا أداة تعلّم. وليست تقييماً للكفاءة أو شهادة أو معياراً سريرياً.", "skills.critical": "حرجة", "skills.sections": "الأقسام",
    "medications.title": "مرجع الأدوية", "medications.highAlert": "عالي الخطورة (خيالي)", "medications.monitoring": "المراقبة", "medications.notice": "لا يحتوي هذا المرجع على جرعات أبداً. يتبع التحضير والجرعات دائماً الأمر الطبي وسياسة مؤسستك.",
    "cases.title": "التعلّم بالحالات", "cases.step": "الخطوة {n} من {total}", "cases.choose": "ماذا تفعل؟", "cases.consequence": "ما الذي يحدث", "cases.feedback": "السبب", "cases.continue": "متابعة", "cases.summary": "ملخص الحالة", "cases.score": "الدرجة التعليمية: {score} من 100", "cases.scoreNote": "هذه الدرجة للإرشاد في التعلّم فقط. وليست نجاحاً أو تقييماً للكفاءة أو شهادة.", "cases.debrief": "المراجعة", "cases.revisit": "قرارات تستحق المراجعة: {steps}", "cases.again": "حاول مجدداً", "cases.scopes": "من يقرر",
    "scope.assessment": "تقييم", "scope.monitoring": "مراقبة", "scope.escalation": "تصعيد", "scope.independent_nursing": "إجراء تمريضي مستقل", "scope.order_or_protocol_required": "يتطلب أمراً أو بروتوكولاً", "scope.prescriber_or_other_discipline": "واصف الدواء أو تخصص آخر",
    "quiz.title": "التدرّب على الأسئلة", "quiz.question": "السؤال {n} من {total}", "quiz.check": "تحقق من الإجابة", "quiz.correct": "صحيح", "quiz.incorrect": "ليس تماماً", "quiz.explain": "الشرح", "quiz.finish": "إنهاء", "quiz.result": "أجبت إجابة صحيحة عن {right} من {total}.", "quiz.restart": "تدرّب مجدداً", "quiz.start": "ابدأ التدرّب",
    "account.language": "اللغة", "account.theme": "المظهر", "account.themeSystem": "مطابقة الجهاز", "account.themeLight": "فاتح", "account.themeDark": "داكن", "account.privacy": "الخصوصية", "account.privacyBody": "يخزّن هذا الإصدار لغتك ومظهرك وإشاراتك المرجعية وتقدّمك على هذا الجهاز فقط. لا يوجد فيه حساب ولا تحليلات ولا معرّفات إعلانية.",
    "account.deletionInfo": "حذف الحساب", "account.deletionBody": "عندما يتوفر تسجيل الدخول ستتمكن من حذف حسابك من هنا في أي وقت. الحذف فوري ونهائي. يتطلب تسجيل دخول حديثاً وبريدك الإلكتروني، وينهي كل الجلسات ولا يمكن التراجع عنه.",
    "account.deletionLink": "كيف يعمل الحذف", "account.signInSoon": "تسجيل الدخول قيد الإعداد وغير متاح في هذا الإصدار.",
    "prototype.title": "شاشة النموذج الأولي الأصلية", "prototype.note": "شاشة النموذج الأولي الأولى كما هي دون تغيير.",
    "a11y.bookmarkOn": "إزالة الإشارة المرجعية", "a11y.bookmarkOff": "إضافة إشارة مرجعية", "a11y.openItem": "فتح {title}",
  },
} as const satisfies Record<Locale, Record<string, string>>;
export type MessageKey = keyof (typeof messages)["en"];

/** Interpolates {name} placeholders. A missing Arabic string falls back to English, never to a raw key. */
export function translate(locale: Locale, key: string, vars: Record<string, string | number> = {}): string {
  const table = messages[locale] as Record<string, string>;
  const en = messages.en as Record<string, string>;
  const raw = table[key] ?? en[key] ?? key;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

/** Localized content field: the requested language, then the base language, then English, then any value. */
export function localized(value: LocalizedText | string | null | undefined, locale: Locale): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[locale] ?? value.en ?? Object.values(value)[0] ?? "";
}
export const usedFallback = (value: LocalizedText | null | undefined, locale: Locale): boolean => !!value && !(locale in value);
export function localizedList(value: Record<string, string[]> | null | undefined, locale: Locale): string[] {
  if (!value) return [];
  return value[locale] ?? value.en ?? Object.values(value)[0] ?? [];
}
