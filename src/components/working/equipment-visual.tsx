import Image from "next/image";

type Translation = readonly [english: string, arabic: string];

type Visual = {
  file: string;
  width: number;
  height: number;
  alt: Translation;
  label: Translation;
  detail: Translation;
  source: string;
  credit: string;
  license: "BY-SA 3.0" | "BY-SA 4.0" | "BY 2.5" | "BY 3.0";
  cropped?: boolean;
};

const ventilator: Visual = {
  file: "ventilator",
  width: 712,
  height: 950,
  alt: ["A ventilator on a wheeled stand with a screen and breathing circuit.", "جهاز تنفس على حامل بعجلات مع شاشة ودائرة تنفس."],
  label: ["Identify the ventilator components", "تعرّف على مكوّنات جهاز التنفس"],
  detail: ["Locate the display, breathing circuit and wheeled base. The photo shows one model’s layout.", "حدّد موقع الشاشة ودائرة التنفس والقاعدة المتحركة. تُظهر الصورة ترتيب مكوّنات طراز واحد."],
  source: "Mechanical_ventilator.jpg",
  credit: "Ashashyou",
  license: "BY-SA 3.0",
};

const arterialLine: Visual = {
  file: "arterial-line",
  width: 1050,
  height: 787,
  alt: ["Illustration of a radial arterial catheter with a dressing and tubing at the wrist.", "رسم لقسطرة شريانية كعبرية مع ضماد وأنبوب عند المعصم."],
  label: ["Locate the radial arterial line", "حدّد موقع الخط الشرياني الكعبري"],
  detail: ["Find the insertion site, dressing and tubing at the wrist. The transducer and monitor are outside this view.", "حدّد موضع الإدخال والضماد والأنبوب عند المعصم. محوّل الضغط وشاشة المراقبة خارج إطار الرسم."],
  source: "Arterial-line-shaded.png",
  credit: "Red Roan",
  license: "BY-SA 4.0",
};

const syringePump: Visual = {
  file: "syringe-pump",
  width: 1050,
  height: 513,
  alt: ["A syringe pump with a horizontal syringe, plunger drive, display and keypad.", "مضخة حقنة مع حقنة أفقية ودافع للمكبس وشاشة ولوحة مفاتيح."],
  label: ["Identify the syringe pump components", "تعرّف على مكوّنات مضخة الحقنة"],
  detail: ["Find the syringe beneath the display, the plunger drive on the right and the keypad above it. The display is an example from this device.", "ابحث عن الحقنة أسفل الشاشة ودافع المكبس على اليمين ولوحة المفاتيح فوقه. توضح الشاشة مثالاً من هذا الجهاز."],
  source: "Syringe_infusion_pump.jpg",
  credit: "Shyamal",
  license: "BY-SA 4.0",
};

const chestDrain: Visual = {
  file: "chest-drain",
  width: 1050,
  height: 700,
  alt: ["An empty chest drainage unit with tubing and graduated chambers.", "وحدة تصريف صدري فارغة مع أنبوب وحجرات مدرّجة."],
  label: ["Recognise a chest drainage unit", "تعرّف على وحدة التصريف الصدري"],
  detail: ["Locate the tubing at the top and the graduated collection chamber on the right. Chamber layout and labels vary by model.", "حدّد الأنبوب في الأعلى وحجرة التجميع المدرّجة على اليمين. يختلف ترتيب الحجرات وتسمياتها باختلاف الطراز."],
  source: "Chest_drain_-_empty.jpg",
  credit: "Johntex",
  license: "BY 2.5",
};

const defibrillator: Visual = {
  file: "defibrillator",
  width: 300,
  height: 215,
  alt: ["A manual defibrillator with a rhythm display and front-panel controls.", "جهاز إزالة رجفان يدوي مع شاشة لعرض نظم القلب وأزرار تحكّم أمامية."],
  label: ["Recognise a manual defibrillator", "تعرّف على جهاز إزالة الرجفان اليدوي"],
  detail: ["Find the rhythm display and controls on the front panel. The layout is specific to this model.", "حدّد شاشة النظم وأزرار التحكّم على اللوحة الأمامية. يخص ترتيبها هذا الطراز."],
  source: "Manual-external-defibrillator-monitor.jpg",
  credit: "Aededitor",
  license: "BY 3.0",
};

const enteralFeeding: Visual = {
  file: "enteral-feeding",
  width: 656,
  height: 875,
  alt: ["An enteral feeding pump beside a feeding bag and tubing.", "مضخة تغذية معوية بجانب كيس التغذية والأنبوب."],
  label: ["Identify the enteral feeding equipment", "تعرّف على معدات التغذية المعوية"],
  detail: ["Find the feeding bag, tubing and pump. The equipment is laid out for illustration.", "حدّد كيس التغذية والأنبوب والمضخة. المعدات معروضة للتوضيح."],
  source: "Open_system_enteral_feeding.jpg",
  credit: "Ashashyou",
  license: "BY-SA 3.0",
};

const tracheostomy: Visual = {
  file: "tracheostomy",
  width: 481,
  height: 439,
  alt: ["Close-up of a tracheostomy tube, neck flange and securing strap.", "صورة مقرّبة لأنبوب فغر الرغامى وصفيحة التثبيت ورباط التثبيت حول العنق."],
  label: ["Recognise a tracheostomy tube at the bedside", "تعرّف على أنبوب فغر الرغامى بجانب السرير"],
  detail: ["Locate the flange resting against the neck, the securing strap and the external connection.", "حدّد صفيحة التثبيت الملامسة للعنق ورباط التثبيت والوصلة الخارجية."],
  source: "Tracheostomy_with_tube.jpg",
  credit: "Mahleretto",
  license: "BY-SA 4.0",
  cropped: true,
};

const supportSurface: Visual = {
  file: "air-fluidised-bed",
  width: 950,
  height: 534,
  alt: ["An air-fluidised hospital bed with its support surface visible.", "سرير مستشفى بنظام التمييع الهوائي يظهر فيه سطح الدعم."],
  label: ["Recognise an air-fluidised support surface", "تعرّف على سطح دعم بنظام التمييع الهوائي"],
  detail: ["This is an example of an air-fluidised bed. It is a different type of support surface from an alternating-pressure mattress.", "هذا مثال لسرير بنظام التمييع الهوائي، وهو نوع مختلف عن مراتب الضغط المتناوب."],
  source: "Air_Fluidised_Bed,_bzw._Clinitron-Bett,_Universitätsklinikum_Lübeck,_2019.jpg",
  credit: "Llydia",
  license: "BY-SA 4.0",
};

const visuals: Record<string, Visual> = {
  "EQ-02": ventilator,
  "SK-07": ventilator,
  "D01-T06": ventilator,
  "D01-T09": ventilator,
  "EQ-03": arterialLine,
  "SK-01": arterialLine,
  "D02-T04": arterialLine,
  "EQ-04": syringePump,
  "SK-22": syringePump,
  "D05-T16": syringePump,
  "D02-T12": syringePump,
  "SK-13": chestDrain,
  "EQ-05": defibrillator,
  "SK-19": defibrillator,
  "D02-T15": defibrillator,
  "EQ-07": enteralFeeding,
  "SK-10": enteralFeeding,
  "D07-T06": enteralFeeding,
  "SK-05": tracheostomy,
  "EQ-08": supportSurface,
  "SK-14": supportSurface,
  "D07-T04": supportSurface,
};

export function EquipmentVisual({ moduleKey, locale }: { moduleKey: string; locale: string }) {
  const visual = visuals[moduleKey];
  if (!visual) return null;

  const ar = locale === "ar";
  const language = ar ? 1 : 0;
  const photo = `/images/equipment/${visual.file}.webp`;
  const license = visual.license.toLowerCase().replace(" ", "/");

  return (
    <figure className="mb-8 overflow-hidden rounded-xl border border-border bg-muted">
      <a href={photo} className="block focus-visible:outline focus-visible:outline-offset-[-3px]" aria-label={ar ? "افتح الصورة بالحجم الكامل" : "Open the full-size image"}>
        <Image
          src={photo}
          alt={visual.alt[language]}
          width={visual.width}
          height={visual.height}
          sizes="(min-width: 1024px) 540px, 85vw"
          className="mx-auto h-auto w-full"
          style={{ maxWidth: Math.min(visual.width, visual.height > visual.width ? 384 : 608) }}
        />
      </a>
      <figcaption className="space-y-1 p-4 text-sm">
        <p className="font-semibold">{visual.label[language]}</p>
        <p className="leading-relaxed text-muted-foreground">{visual.detail[language]}</p>
        <p className="text-xs text-muted-foreground" lang="en">
          <a className="underline" href={`https://commons.wikimedia.org/wiki/File:${visual.source}`}>Source image</a> · {visual.credit} ·{" "}
          <a className="underline" href={`https://creativecommons.org/licenses/${license}/`}>CC {visual.license}</a> · {visual.cropped ? "Cropped and converted to WebP" : "WebP version, resized where applicable"}
        </p>
      </figcaption>
    </figure>
  );
}
