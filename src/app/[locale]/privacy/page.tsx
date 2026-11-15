import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };
const CONTACT = "iculearningplatform@gmail.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "سياسة الخصوصية | ICU Nurse Knowledge Map" : "Privacy Policy | ICU Nurse Knowledge Map",
    description: locale === "ar" ? "سياسة خصوصية منصة ICU Nurse Knowledge Map وتطبيقها." : "Privacy policy for the ICU Nurse Knowledge Map website and mobile application.",
  };
}

const content = {
  en: {
    heading: "Privacy Policy",
    updated: "Last updated: 15 November 2026",
    intro: "This Privacy Policy describes how ICU Nurse Knowledge Map (also referred to as ICU Nursing Knowledge Map), an educational website and companion mobile application, handles information when you browse the service, create an account, or use its learning features. Contact the developer at iculearningplatform@gmail.com.",
    sections: [
      { title: "Information we collect", items: [
        "Account information: email address, authentication identifiers, and, when provided, profile preferences such as name, language, country or experience level.",
        "Learning activity: topic completion, progress, bookmarks, practice answers and results, saved study schedules, simulated case attempts and skills or equipment learning activity.",
        "Security and technical information: authentication timestamps, session identifiers, network and device information such as IP address, browser or app version, and technical logs needed to operate, protect and troubleshoot the service. The precise information received depends on the service provider and enabled features.",
        "Messages you send us: your email address and the contents of a privacy or support request."
      ]},
      { title: "How we use information", items: [
        "To create and authenticate your account, maintain your session, and provide your requested educational features.",
        "To save and synchronize learning progress, bookmarks, assessments, and preferences across your signed-in devices when the backend is enabled.",
        "To prevent abuse, enforce account security, diagnose service errors, respond to support requests, and comply with applicable obligations.",
        "To develop and improve the educational platform using operational testing and feedback. We do not use your personal learning history to make patient-care decisions."
      ]},
      { title: "Providers and sharing", items: [
        "Supabase provides the planned account authentication and database infrastructure. When account features are enabled, relevant account and learning records are processed through Supabase.",
        "Vercel hosts the website and may process request metadata and technical logs required for delivery and security.",
        "Cloudflare Turnstile is used for anti-bot checks on applicable sign-in and sign-up screens and may process device, browser and network signals as described in Cloudflare's privacy documentation.",
        "We may disclose information when legally required or to protect the service from fraud or misuse. We do not sell personal information or publish identifiable learning records."
      ]},
      { title: "Mobile app and local storage", items: [
        "The Android/iOS app may store sign-in tokens in protected device storage and cache sample or learning state locally. When the account backend is enabled, applicable progress and bookmarks may be synchronized.",
        "Authentication tokens are not intended to be stored as plain text in ordinary app storage. Signing out or deleting the account clears the app's associated local session state.",
        "The educational app is not designed to collect actual patient records or patient-identifying information. Please do not enter patient details in exercises, messages, or support requests."
      ]},
      { title: "Demo mode and unpublished content", items: [
        "The current staging website can operate without an account backend and then displays demonstration or openly viewable draft educational material, not user-specific learner records.",
        "Public draft-preview content is not clinically approved and should not be used as medical or bedside-care guidance."
      ]},
      { title: "Data retention and deletion", items: [
        "Account and learning records are generally maintained while your account is active and needed for the service. Operational logs are retained as required for security and operations; exact periods can depend on provider settings and legal obligations.",
        "Learners can request permanent account deletion using the in-app deletion screen when supported or the website's account deletion page. A recent sign-in and confirmation of the account email are required; multifactor verification is required where applicable.",
        "Deleting an eligible learner account removes the profile and associated progress, saved attempts, bookmarks, schedules and sessions from the active account system. Limited non-identifying deletion audit information and existing security logs may remain. Provider backups may retain copies temporarily until their normal expiry.",
        "Staff accounts or accounts linked to retained professional clinical-review records require an administrator-assisted process for accountability reasons. Contact us for help."
      ]},
      { title: "Security and international processing", items: [
        "We use authentication controls, access restrictions and HTTPS transport to reduce unauthorized access. No online system can guarantee absolute security.",
        "Service providers may process data in jurisdictions outside your country. Their infrastructure and applicable data-protection arrangements govern those transfers."
      ]},
      { title: "Your choices and rights", items: [
        "You can request access, correction or deletion of your personal information, subject to applicable law and necessary retention requirements, by emailing us.",
        "You can stop using the app and sign out at any time. Removing the app alone does not delete a server-side account."
      ]},
      { title: "Children, changes and contact", items: [
        "The service is intended for nursing students and healthcare professionals, not children. We do not knowingly design it to solicit personal information from children.",
        "We may update this policy as the service changes. The date above identifies this version; material changes will be reflected on this page.",
        "Privacy questions and requests: iculearningplatform@gmail.com."
      ]}
    ],
    deletionLabel: "Account deletion instructions",
    note: "The actual privacy disclosures for a store release must be checked again against the final installed app build, enabled SDKs, and Google Play Data safety answers."
  },
  ar: {
    heading: "سياسة الخصوصية",
    updated: "آخر تحديث: 15 نوفمبر 2026",
    intro: "توضح هذه السياسة كيفية تعامل ICU Nurse Knowledge Map (منصة المعرفة لتمريض العناية المركزة) وموقعها وتطبيقها المصاحب مع المعلومات عند تصفح الخدمة أو إنشاء حساب أو استخدام الأنشطة التعليمية. البريد الإلكتروني للمطور: iculearningplatform@gmail.com.",
    sections: [
      { title: "المعلومات التي نجمعها", items: [
        "معلومات الحساب مثل البريد الإلكتروني ومعرّفات تسجيل الدخول وتفضيلات الملف الشخصي المقدمة اختياريًا، بما في ذلك الاسم واللغة والبلد ومستوى الخبرة.",
        "النشاط التعليمي مثل التقدم وإكمال الموضوعات والمفضلة وإجابات الأسئلة ونتائجها وجداول المراجعة ومحاولات الحالات الافتراضية وتقدم المهارات والمعدات.",
        "بيانات الأمان والتشغيل مثل أوقات تسجيل الدخول ومعرّفات الجلسات وعنوان IP ومعلومات المتصفح أو إصدار التطبيق والسجلات التقنية اللازمة للتشغيل والحماية. تختلف البيانات بحسب الخدمات المفعلة ومزوديها.",
        "المعلومات التي ترسلها عند التواصل للدعم أو طلب متعلق بالخصوصية."
      ]},
      { title: "أوجه استخدام المعلومات", items: [
        "إنشاء الحسابات والتحقق منها وتوفير الميزات التعليمية المطلوبة.",
        "حفظ التقدم والمفضلة ونتائج التدريب والتفضيلات ومزامنتها عند تفعيل خدمة الحسابات.",
        "حماية الخدمة ومنع إساءة الاستخدام ومعالجة الأعطال والرد على الاستفسارات والالتزام بالمتطلبات المعمول بها.",
        "تحسين المنصة من خلال الاختبارات التشغيلية والملاحظات، وليس اتخاذ قرارات علاجية عن المرضى."
      ]},
      { title: "الجهات المقدمة للخدمات ومشاركة البيانات", items: [
        "تقدم Supabase البنية التحتية المخطط لها للمصادقة وقاعدة البيانات؛ وعند تفعيل الحسابات تعالج بيانات الحساب والتعلم ذات الصلة.",
        "تستضيف Vercel الموقع وقد تعالج معلومات الطلبات والسجلات التقنية اللازمة لتقديم الخدمة وحمايتها.",
        "تستخدم خدمة Cloudflare Turnstile للتحقق من الطلبات الآلية في شاشات التسجيل والدخول المناسبة، وقد تعالج إشارات الجهاز والمتصفح والشبكة حسب سياسة خصوصيتها.",
        "قد نفصح عن معلومات عندما يتطلب القانون ذلك أو لحماية الخدمة من الاحتيال وإساءة الاستخدام. لا نبيع المعلومات الشخصية ولا ننشر سجلات تعلم مرتبطة بهوية المستخدم."
      ]},
      { title: "التطبيق والتخزين المحلي", items: [
        "قد يخزن تطبيق الهاتف رموز الجلسة في تخزين آمن على الجهاز وبيانات تعليمية مؤقتة أو تجريبية، وقد يزامن التقدم والمفضلة عند تفعيل الخادم.",
        "لا يُقصد تخزين رموز المصادقة كنص واضح في تخزين التطبيق العادي. يؤدي تسجيل الخروج أو حذف الحساب إلى مسح حالة الجلسة المحلية المرتبطة.",
        "الخدمة التعليمية ليست مخصصة لجمع سجلات مرضى حقيقية أو معلومات تكشف هويتهم. يرجى عدم إدخال معلومات المرضى في الأنشطة أو مراسلات الدعم."
      ]},
      { title: "الوضع التجريبي والمحتوى غير المنشور", items: [
        "قد يعمل موقع المعاينة دون حسابات ويعرض محتوى تجريبيًا أو مسودات تعليمية متاحة للعامة دون سجلات تعلم مرتبطة بمستخدم.",
        "المسودات المعروضة ليست معتمدة سريريًا ولا تصلح لتوجيه القرارات الطبية أو الرعاية بجانب السرير."
      ]},
      { title: "الاحتفاظ بالبيانات والحذف", items: [
        "تُحفظ بيانات الحساب والتعلم طوال الحاجة إليها لتقديم الخدمة عندما يكون الحساب نشطًا. وقد تُحتفظ بالسجلات التشغيلية بحسب متطلبات الأمان والالتزامات ومزودي الخدمات.",
        "يمكن للمتعلم طلب الحذف الدائم من التطبيق عند توفر الوظيفة أو من صفحة حذف الحساب بالموقع. يلزم تسجيل دخول حديث وتأكيد البريد الإلكتروني، مع تحقق متعدد العوامل عند انطباقه.",
        "يحذف الحساب المؤهل الملف الشخصي والتقدم والمحاولات والمفضلة وجداول المراجعة والجلسات من النظام النشط. قد تُحتفظ بسجل تدقيق محدود غير معرّف للهوية وبعض السجلات الأمنية، وقد تبقى نسخ احتياطية مؤقتة حتى انقضاء مدة حفظها.",
        "تحتاج حسابات الموظفين أو الحسابات المرتبطة بسجلات مراجعات مهنية محفوظة إلى مساعدة المسؤول بسبب متطلبات المساءلة."
      ]},
      { title: "الأمان والمعالجة الدولية", items: [
        "نستخدم ضوابط المصادقة وتقييد الوصول واتصالات HTTPS للحد من الوصول غير المصرح به، دون ضمان أمان مطلق.",
        "قد تُعالج البيانات خارج بلد المستخدم وفق البنية التحتية لمزودي الخدمات وترتيبات حماية البيانات المعمول بها."
      ]},
      { title: "حقوق المستخدم وخياراته", items: [
        "يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها، ضمن الحدود القانونية ومتطلبات الاحتفاظ الضرورية، عبر البريد الإلكتروني.",
        "يمكنك تسجيل الخروج والتوقف عن استخدام التطبيق في أي وقت. حذف التطبيق من الجهاز وحده لا يحذف الحساب الموجود على الخادم."
      ]},
      { title: "الأطفال والتحديثات والتواصل", items: [
        "الخدمة موجهة لطلاب التمريض وممارسي الرعاية الصحية وليست مصممة للأطفال أو لجمع بياناتهم الشخصية عن قصد.",
        "قد تتغير هذه السياسة مع تطور الخدمة وسيُحدّث تاريخها عند إجراء تغييرات جوهرية.",
        "للاستفسارات وطلبات الخصوصية: iculearningplatform@gmail.com."
      ]}
    ],
    deletionLabel: "تعليمات حذف الحساب",
    note: "يجب مطابقة إفصاحات الخصوصية مع نسخة التطبيق النهائية وحزم البرمجيات المستخدمة وإجابات قسم أمان البيانات في Google Play قبل إطلاق التطبيق."
  }
} as const;

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const p = locale === "ar" ? content.ar : content.en;
  return (
    <article className="mx-auto max-w-3xl space-y-7" dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">{p.heading}</h1>
        <p className="text-sm text-muted-foreground">{p.updated}</p>
        <p className="leading-7">{p.intro}</p>
      </header>
      {p.sections.map((s, i) => (
        <section className="space-y-3" key={i}>
          <h2 className="text-xl font-semibold">{s.title}</h2>
          <ul className="list-disc space-y-2 ps-6 leading-7">{s.items.map((item, n) => <li key={n}>{item}</li>)}</ul>
        </section>
      ))}
      <section className="rounded-lg border p-4">
        <Link href={"/" + locale + "/account-deletion"} className="font-semibold underline">{p.deletionLabel}</Link>
        <p className="mt-3"><a className="underline" href={"mailto:" + CONTACT}>{CONTACT}</a></p>
      </section>
      <p className="text-sm text-muted-foreground">{p.note}</p>
    </article>
  );
}
