import Image from "next/image";

const photo = "/images/equipment/bedside-monitor-demo.jpg";
const source = "https://commons.wikimedia.org/wiki/File:PatientMonitor-2.jpg";
const license = "https://creativecommons.org/licenses/by-sa/4.0/";

const features = [
  {
    title: ["ECG and heart rate", "تخطيط القلب ومعدل ضرباته"],
    description: [
      "Find the green ECG traces and the green heart-rate number on the right. The traces show electrical activity. The heart-rate number is calculated from detected beats.",
      "ابحث عن موجات تخطيط القلب الخضراء ورقم معدل ضربات القلب الأخضر على اليمين. تُظهر الموجات النشاط الكهربائي، ويُحسب المعدل من الضربات التي يرصدها الجهاز.",
    ],
  },
  {
    title: ["Oxygen saturation and pulse waveform", "تشبع الأكسجين وموجة النبض"],
    description: [
      "Find the cyan pulse waveform and the SpO₂ value. Both come from the pulse oximeter. The waveform helps you assess the quality of the pulse signal.",
      "ابحث عن موجة النبض السماوية وقيمة SpO₂. كلاهما يأتي من مقياس التأكسج النبضي. تساعد الموجة في تقييم جودة إشارة النبض.",
    ],
  },
  {
    title: ["Alarm priority", "أولوية الإنذار"],
    description: [
      "When an alarm appears, read its message and priority. Check the patient first, then verify the signal and follow the local response protocol. Alarm colours and sounds vary by model.",
      "عند ظهور إنذار، اقرأ رسالته وأولويته. افحص المريض أولاً ثم تحقّق من الإشارة واتبع بروتوكول الاستجابة المحلي. تختلف ألوان الإنذارات وأصواتها باختلاف الجهاز.",
    ],
  },
];

export function BedsideMonitorVisual({ locale }: { locale: string }) {
  const ar = locale === "ar";
  const language = ar ? 1 : 0;

  return (
    <div className="mb-8 space-y-4">
      <figure className="overflow-hidden rounded-xl border border-border bg-muted">
        <a href={photo} className="block focus-visible:outline focus-visible:outline-offset-[-3px]" aria-label={ar ? "افتح صورة جهاز المراقبة بالحجم الكامل" : "Open the full-size bedside monitor photo"}>
          <Image
            src={photo}
            alt={ar ? "جهاز مراقبة بجانب السرير يعرض موجات تخطيط القلب والنبض وقيم العلامات الحيوية في وضع العرض." : "Bedside monitor in demo mode displaying green ECG traces, a cyan pulse waveform and vital-sign readings."}
            width={880}
            height={900}
            sizes="(min-width: 1024px) 540px, 85vw"
            className="mx-auto h-auto w-full max-w-[34rem]"
          />
        </a>
        <figcaption className="space-y-1 p-4 text-sm text-muted-foreground">
          <p>{ar ? "شاشة في وضع العرض. اضغط على الصورة لتكبيرها." : "Demo-mode display. Open the photo to see the readings at full size."}</p>
          <p><a className="underline" href={source}>PatientMonitor-2.jpg</a> · <span lang="ja">副局長</span> · <a className="underline" href={license}>CC BY-SA 4.0</a></p>
        </figcaption>
      </figure>
      <div className="space-y-2">
        {features.map((feature) => (
          <details key={feature.title[0]} className="rounded-xl border border-border px-4 py-3">
            <summary className="cursor-pointer font-semibold">{feature.title[language]}</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description[language]}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
