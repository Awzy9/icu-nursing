import type { Progress } from "./progress";

export const ONBOARDING_STORAGE_KEY = "icu.onboarding.v1";

/**
 * A concise, opt-out six-screen introduction. All destinations exist in the native
 * app; feature copy is descriptive rather than medical advice or competence claims.
 */
export const onboardingSteps = [
  {
    id: "welcome", icon: "heart", accent: "study",
    eyebrow: ["Welcome", "مرحباً"],
    title: ["Welcome to ICU Nursing", "مرحباً بك في ICU Nursing"],
    description: ["You don't need to learn every feature today. Here's where to find what matters, in six short steps.", "لا تحتاج إلى معرفة كل المزايا اليوم. تعرّف على أهم الأقسام في ست خطوات قصيرة."],
    points: [
      ["Learn at your own pace", "تعلّم بالوتيرة المناسبة لك"],
      ["Practise with feedback", "تدرّب مع شرح الإجابات"],
      ["Find tools and visuals quickly", "اعثر على الأدوات والرسوم بسهولة"],
    ],
  },
  {
    id: "learn", icon: "book", accent: "topics",
    eyebrow: ["1 · Learn", "١ · تعلّم"],
    title: ["Start with one topic", "ابدأ بموضوع واحد"],
    description: ["Open Learn to browse nursing topics, clinical skills, medications and equipment. Choose a Learning Path for a guided sequence.", "افتح قسم تعلّم لاستعراض المواضيع والمهارات السريرية والأدوية والأجهزة. اختر مساراً تعليمياً للتعلّم بالترتيب."],
    points: [
      ["Browse the lesson library", "تصفّح مكتبة الدروس"],
      ["Follow a Learning Path", "اتبع مساراً تعليمياً"],
      ["Bookmark useful lessons", "احفظ الدروس المهمة"],
    ],
  },
  {
    id: "practice", icon: "checklist", accent: "practice",
    eyebrow: ["2 · Practice", "٢ · تدرّب"],
    title: ["Learn by answering", "تعلّم من خلال الإجابة"],
    description: ["Use questions, case scenarios and the Nursing Lab. Choose your answer before revealing the explanation, then revisit missed decisions.", "استخدم الأسئلة والحالات السريرية ومختبر التمريض. اختر الإجابة قبل إظهار الشرح، ثم راجع القرارات التي أخطأت فيها."],
    points: [
      ["Take a short quiz or exam", "جرّب اختباراً قصيراً أو امتحاناً"],
      ["Try a fictional ICU case", "تدرّب على حالة عناية مركزة افتراضية"],
      ["Review incorrect answers", "راجع إجاباتك غير الصحيحة"],
    ],
  },
  {
    id: "tools", icon: "flask", accent: "equipment",
    eyebrow: ["3 · Clinical Tools", "٣ · الأدوات السريرية"],
    title: ["Tools in one place", "كل الأدوات في مكان واحد"],
    description: ["Find the infusion-pump calculator, ABG interpretation, GCS, NEWS2 and interactive ventilator and CRRT learning tools.", "اعثر على حاسبة مضخة التسريب، وتفسير غازات الدم، ومقياسي GCS وNEWS2، وتمارين أجهزة التنفس والعلاج الكلوي المستمر."],
    points: [
      ["Try calculations with fictional values", "جرّب الحسابات باستخدام قيم افتراضية"],
      ["Interpret measurements step by step", "تعلّم تفسير القياسات خطوة بخطوة"],
      ["Educational practice, not bedside orders", "للتعلّم وليس لإصدار أوامر علاجية"],
    ],
  },
  {
    id: "visuals", icon: "pulse", accent: "study",
    eyebrow: ["4 · Visuals", "٤ · التعلم البصري"],
    title: ["See what you're learning", "تعلّم من خلال الصور"],
    description: ["Explore equipment pictures, ECG and ventilator waveforms, illustrated nursing skills, and labelled anatomy diagrams.", "استكشف صور الأجهزة، وموجات تخطيط القلب وجهاز التنفس، والمهارات التمريضية المصورة، والرسوم التشريحية المشروحة."],
    points: [
      ["Compare real equipment photos", "تعرّف على صور الأجهزة"],
      ["Interpret practice waveforms", "فسّر الموجات التعليمية"],
      ["Read the explanation after answering", "اقرأ الشرح بعد الإجابة"],
    ],
  },
  {
    id: "get-started", icon: "bookmark", accent: "skills",
    eyebrow: ["5 · Make it yours", "٥ · خصّص تجربتك"],
    title: ["Ready to begin?", "هل أنت مستعد للبدء؟"],
    description: ["Your progress and bookmarks are saved on this device. Signing in enables supported progress syncing across devices. You can replay this tour from Account any time.", "يُحفظ تقدمك والدروس المفضلة على هذا الجهاز. يتيح تسجيل الدخول مزامنة بيانات التعلّم المدعومة بين الأجهزة. يمكنك إعادة هذا الدليل من الحساب في أي وقت."],
    points: [
      ["Start with one guided Learning Path", "ابدأ بمسار تعليمي واحد"],
      ["Or explore the Visual Library", "أو استكشف المكتبة البصرية"],
      ["Find this tutorial again in Account", "أعِد عرض الدليل من قسم الحساب"],
    ],
  },
] as const;

export function hasExistingLearningActivity(p: Progress): boolean {
  return p.viewed.length > 0 || p.bookmarks.length > 0 ||
    p.completed.length > 0 || p.practice.length > 0 ||
    Object.keys(p.attempts).length > 0 || Object.keys(p.cases).length > 0 ||
    Object.keys(p.sessions).length > 0 || Object.keys(p.ticks).length > 0;
}

/** Show automatically only on a fresh, unused local profile; everyone can replay manually. */
export function shouldAutoStartOnboarding(ready: boolean, seen: boolean, progress: Progress): boolean {
  return ready && !seen && !hasExistingLearningActivity(progress);
}
