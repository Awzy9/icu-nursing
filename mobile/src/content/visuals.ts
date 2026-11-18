// A small, hardcoded set of the attributed lesson photos added in PR #32
// (src/components/working/equipment-visual.tsx / bedside-monitor-visual.tsx), ported to native
// for the three examples this batch verifies end to end: the Bedside Monitor Parameters
// section (EQ-01), the central-line image with the patient's breast covered (SK-02, D06-T05),
// and the glucose meter photo used in the hypoglycemia case (SC-10, via MD-15). Captions,
// alt text and attribution are not secrets - they are the same text the website already shows
// every visitor - so they are safe to ship as plain app data, same as the UI strings in
// core/i18n.ts. The photo files themselves are not duplicated into the app: they are fetched
// from the website's own public/images path (src/core/remoteContent.ts's siteBaseUrl).

export interface Visual {
  path: string; // relative to the website's public/ directory
  width: number; height: number;
  alt: [string, string]; label: [string, string]; detail: [string, string];
  source: string; credit: string; license: string;
  coveredForPrivacy?: boolean;
}

export const centralLineVisual: Visual = {
  path: "/images/equipment/central-line.webp",
  width: 296, height: 875,
  alt: ["A central venous catheter with a chest dressing and three external lumens.", "قسطرة وريدية مركزية مع ضماد على الصدر وثلاثة فروع خارجية."],
  label: ["Identify the external parts of a central line", "تعرّف على الأجزاء الخارجية للقسطرة المركزية"],
  detail: ["Find the dressing over the insertion area and follow the three external branches to their connectors.", "حدّد الضماد فوق منطقة الإدخال وتتبّع الفروع الخارجية الثلاثة حتى وصلاتها."],
  source: "Central-venous-catheter.png",
  credit: "Fireman biff",
  license: "BY-SA 3.0",
  coveredForPrivacy: true,
};

export const glucoseMeterVisual: Visual = {
  path: "/images/equipment/glucose-meter.webp",
  width: 656, height: 875,
  alt: ["A handheld blood glucose meter with a digital display.", "جهاز محمول لقياس سكر الدم مزوّد بشاشة رقمية."],
  label: ["Blood glucose meter", "جهاز قياس سكر الدم"],
  detail: ["The test strip is visible at the top of the meter.", "يظهر شريط الفحص في الجزء العلوي من الجهاز."],
  source: "(20250417)_Blood_glucose_meter_07.jpg",
  credit: "Roy Zuo",
  license: "BY-SA 4.0",
};

export const bedsideMonitorVisual = {
  path: "/images/equipment/bedside-monitor-demo.jpg",
  width: 880, height: 900,
  alt: ["Bedside monitor in demo mode displaying green ECG traces, a cyan pulse waveform and vital-sign readings.", "جهاز مراقبة بجانب السرير يعرض موجات تخطيط القلب والنبض وقيم العلامات الحيوية في وضع العرض."] as [string, string],
  source: "PatientMonitor-2.jpg",
  credit: "副局長",
  license: "BY-SA 4.0",
  features: [
    {
      title: ["ECG and heart rate", "تخطيط القلب ومعدل ضرباته"] as [string, string],
      description: [
        "Find the green ECG traces and the green heart-rate number on the right. The traces show electrical activity. The heart-rate number is calculated from detected beats.",
        "ابحث عن موجات تخطيط القلب الخضراء ورقم معدل ضربات القلب الأخضر على اليمين. تُظهر الموجات النشاط الكهربائي، ويُحسب المعدل من الضربات التي يرصدها الجهاز.",
      ] as [string, string],
    },
    {
      title: ["Oxygen saturation and pulse waveform", "تشبع الأكسجين وموجة النبض"] as [string, string],
      description: [
        "Find the cyan pulse waveform and the SpO2 value. Both come from the pulse oximeter. The waveform helps you assess the quality of the pulse signal.",
        "ابحث عن موجة النبض السماوية وقيمة SpO2. كلاهما يأتي من مقياس التأكسج النبضي. تساعد الموجة في تقييم جودة إشارة النبض.",
      ] as [string, string],
    },
    {
      title: ["Alarm priority", "أولوية الإنذار"] as [string, string],
      description: [
        "When an alarm appears, read its message and priority. Check the patient first, then verify the signal and follow the local response protocol. Alarm colours and sounds vary by model.",
        "عند ظهور إنذار، اقرأ رسالته وأولويته. افحص المريض أولاً ثم تحقّق من الإشارة واتبع بروتوكول الاستجابة المحلي. تختلف ألوان الإنذارات وأصواتها باختلاف الجهاز.",
      ] as [string, string],
    },
  ],
};

export const licenseUrl = (license: string): string => license === "CC0 1.0" ? "https://creativecommons.org/publicdomain/zero/1.0/" : `https://creativecommons.org/licenses/${license.toLowerCase().replace(" ", "/")}/`;
