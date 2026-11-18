import { Activity, ArrowRight, BatteryCharging, ClipboardList } from "lucide-react";
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
  license: "BY-SA 3.0" | "BY-SA 4.0" | "BY 2.5" | "BY 3.0" | "BY 4.0" | "Public domain";
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

const nasalCannula: Visual = {
  file: "nasal-cannula",
  width: 888,
  height: 875,
  alt: ["Nasal cannula showing two short prongs and a length of clear tubing.", "قنّية أنفية يظهر فيها طرفان قصيران وأنبوب شفاف."],
  label: ["Identify the nasal cannula", "تعرّف على القنّية الأنفية"],
  detail: ["Locate the two nasal prongs and trace the tubing to its connector.", "حدّد الطرفين الأنفيين وتتبّع الأنبوب حتى الوصلة."],
  source: "Nasal_cannula.jpg",
  credit: "Ctac",
  license: "BY-SA 4.0",
};

const endotrachealTube: Visual = {
  file: "endotracheal-tube",
  width: 950,
  height: 713,
  alt: ["Curved endotracheal tube with depth markings, a cuff and a separate pilot balloon line.", "أنبوب رغامي منحنٍ مع علامات العمق وكُفّة وخط منفصل لبالون المؤشر."],
  label: ["Identify the endotracheal tube components", "تعرّف على مكوّنات الأنبوب الرغامي"],
  detail: ["Find the depth markings, the cuff near the tip and the blue pilot balloon on the narrow side line.", "حدّد علامات العمق والكُفّة قرب الطرف وبالون المؤشر الأزرق على الخط الجانبي الرفيع."],
  source: "Endotracheal_Tube.JPG",
  credit: "ICUnurses",
  license: "BY-SA 4.0",
};

const ivCatheter: Visual = {
  file: "iv-catheter",
  width: 950,
  height: 534,
  alt: ["A peripheral intravenous catheter and its packaging, with the protective cover in place.", "قسطرة وريدية طرفية بجانب عبوتها مع بقاء الغطاء الواقي في مكانه."],
  label: ["Recognise a peripheral IV catheter", "تعرّف على القسطرة الوريدية الطرفية"],
  detail: ["Compare the catheter with the packaging label. This example is shown with its protective cover in place.", "قارن القسطرة بالملصق على العبوة. يظهر هذا المثال والغطاء الواقي في مكانه."],
  source: "IV_Catheter.jpg",
  credit: "Intropin (Mark Oniffrey)",
  license: "BY-SA 4.0",
};

const crrtModules = new Set(["EQ-06", "SK-17", "D04-T09"]);
const crrtSteps = [
  ["Access line", "خط السحب"],
  ["Blood pump", "مضخة الدم"],
  ["Filter", "المرشّح"],
  ["Return line", "خط الإرجاع"],
] as const;

function CrrtCircuitVisual({ locale }: { locale: string }) {
  const ar = locale === "ar";
  return (
    <figure className="mb-8 space-y-4 rounded-xl border border-border bg-muted p-4 sm:p-5">
      <figcaption>
        <p className="font-semibold">{ar ? "مسار الدم في دائرة العلاج الكلوي المستمر" : "Blood path in the CRRT circuit"}</p>
        <p className="mt-1 text-sm text-muted-foreground">{ar ? "رسم مبسّط لمسار الدم من المريض إلى المرشّح ثم عودته إلى المريض." : "Simplified view of blood flowing from the patient through the filter and back to the patient."}</p>
      </figcaption>
      <ol className="grid gap-3 sm:grid-cols-4">
        {crrtSteps.map((step, index) => (
          <li key={step[0]} className="flex flex-col items-center gap-2 sm:flex-row">
            <span className="flex min-h-12 w-full flex-1 items-center rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold">{step[ar ? 1 : 0]}</span>
            {index < crrtSteps.length - 1 && <ArrowRight aria-hidden="true" className="size-4 shrink-0 rotate-90 sm:rotate-0 sm:rtl:rotate-180" />}
          </li>
        ))}
      </ol>
      <a className="text-xs text-muted-foreground underline" href="https://www.albertahealthservices.ca/assets/about/scn/ahs-scn-cc-dialyzingwisely-crrt-alarm-management-care-pathway-resource.pdf">
        {ar ? "مرجع دائرة العلاج الكلوي المستمر" : "CRRT circuit reference"}
      </a>
    </figure>
  );
}

const bloodBag: Visual = {
  file: "blood-bag",
  width: 360,
  height: 510,
  alt: ["A whole-blood bag with a printed product label, ports and tubing.", "كيس دم كامل عليه ملصق المنتج وتظهر منافذه والأنبوب."],
  label: ["Locate the label and ports on a blood bag", "حدّد ملصق كيس الدم ومنافذه"],
  detail: ["Find the printed label, ports and tubing on this example whole-blood bag. Other blood components have their own labels.", "حدّد الملصق والمنافذ والأنبوب في هذا المثال لكيس دم كامل. لمكوّنات الدم الأخرى ملصقاتها الخاصة."],
  source: "Blood_bag.jpg",
  credit: "DtheZombie",
  license: "BY-SA 3.0",
};

const foleyCatheter: Visual = {
  file: "foley-catheter",
  width: 875,
  height: 875,
  alt: ["Anatomical illustration of a Foley catheter with its retention balloon inside the bladder.", "رسم تشريحي لقسطرة فولي يظهر بالون التثبيت داخل المثانة."],
  label: ["See where a Foley catheter sits", "تعرّف على موضع قسطرة فولي"],
  detail: ["Follow the catheter into the bladder and locate the retention balloon. The drawing shows the final position.", "تتبّع القسطرة حتى المثانة وحدّد بالون التثبيت. يوضّح الرسم موضع القسطرة بعد تركيبها."],
  source: "Foley_Catheter.png",
  credit: "BruceBlaus",
  license: "BY-SA 4.0",
};

const centralLine: Visual = {
  file: "central-line",
  width: 296,
  height: 875,
  alt: ["A central venous catheter with a chest dressing and three external lumens.", "قسطرة وريدية مركزية مع ضماد على الصدر وثلاثة فروع خارجية."],
  label: ["Identify the external parts of a central line", "تعرّف على الأجزاء الخارجية للقسطرة المركزية"],
  detail: ["Find the dressing over the insertion area and follow the three external branches to their connectors.", "حدّد الضماد فوق منطقة الإدخال وتتبّع الفروع الخارجية الثلاثة حتى وصلاتها."],
  source: "Central-venous-catheter.png",
  credit: "Fireman biff",
  license: "BY-SA 3.0",
};

const nasogastricTube: Visual = {
  file: "nasogastric-tube",
  width: 437,
  height: 875,
  alt: ["A side-view diagram of a nasogastric tube travelling from the nose to the stomach.", "رسم جانبي لأنبوب أنفي معدي يمتد من الأنف إلى المعدة."],
  label: ["Follow the nasogastric tube route", "تتبّع مسار الأنبوب الأنفي المعدي"],
  detail: ["Trace the intended route from the nose to the stomach. Confirm the tube’s position using the approved method before feeding or giving medicines.", "تتبّع المسار المقصود من الأنف إلى المعدة. تحقّق من موضع الأنبوب بالطريقة المعتمدة قبل التغذية أو إعطاء الأدوية."],
  source: "Nasogastric_Intubation.png",
  credit: "BruceBlaus",
  license: "BY-SA 4.0",
};

const suctionCatheter: Visual = {
  file: "suction-catheter",
  width: 419,
  height: 875,
  alt: ["A flexible suction catheter with a connector at one end.", "قسطرة شفط مرنة لها وصلة عند أحد الطرفين."],
  label: ["Identify an airway suction catheter", "تعرّف على قسطرة شفط مجرى الهواء"],
  detail: ["Find the connector at the wider end and the catheter tip at the other end. This example shows an open-suction catheter.", "حدّد الوصلة عند الطرف الأعرض وطرف القسطرة في الجهة الأخرى. يوضّح هذا المثال قسطرة شفط مفتوحة."],
  source: "Absaugkatheter.jpg",
  credit: "Uwe Gille",
  license: "BY-SA 3.0",
};

const venturiMask: Visual = {
  file: "venturi-mask",
  width: 950,
  height: 734,
  alt: ["Illustration of an adult wearing a Venturi mask, with example adapters shown below.", "رسم لشخص بالغ يرتدي قناع فنتوري وتظهر أسفله أمثلة للمحوّلات."],
  label: ["Identify a Venturi mask and its adapter", "تعرّف على قناع فنتوري ومحوّله"],
  detail: ["Find the adapter below the mask. The adapter colours and settings shown are examples. Verify the markings and instructions for the device in use.", "حدّد المحوّل تحت القناع. الألوان والإعدادات المعروضة أمثلة. تحقّق من العلامات وتعليمات الجهاز المستخدم."],
  source: "Adult_with_air_entrainment_(Venturi)_mask.png",
  credit: "Open Critical Care & World Health Organization",
  license: "BY 4.0",
};

const transportChecks = [
  { icon: Activity, label: ["Monitoring", "المراقبة"], text: ["Confirm monitoring can continue during the transfer.", "تأكّد من استمرار المراقبة أثناء النقل."] },
  { icon: BatteryCharging, label: ["Oxygen and power", "الأكسجين والطاقة"], text: ["Check oxygen supply, batteries and backup equipment.", "تحقّق من إمداد الأكسجين والبطاريات والمعدات الاحتياطية."] },
  { icon: ClipboardList, label: ["Equipment and handover", "المعدات وتسليم الحالة"], text: ["Secure portable equipment and prepare the handover.", "ثبّت المعدات المحمولة وجهّز تسليم الحالة."] },
] as const;

function TransportVisual({ locale }: { locale: string }) {
  const language = locale === "ar" ? 1 : 0;
  return (
    <figure className="mb-8 space-y-4 rounded-xl border border-border bg-muted p-4 sm:p-5">
      <figcaption className="font-semibold">{language ? "فحوصات أساسية قبل نقل المريض داخل المستشفى" : "Key checks before an intrahospital transfer"}</figcaption>
      <ul className="grid gap-3 sm:grid-cols-3">
        {transportChecks.map(({ icon: Icon, label, text }) => (
          <li key={label[0]} className="space-y-2 rounded-lg border border-border bg-card p-3 text-sm">
            <Icon aria-hidden="true" className="size-5 text-primary" />
            <p className="font-semibold">{label[language]}</p>
            <p className="text-muted-foreground">{text[language]}</p>
          </li>
        ))}
      </ul>
      <a className="text-xs text-muted-foreground underline" href="https://www.ficm.ac.uk/sites/ficm/files/documents/2026-04/The%20Transfer%20Of%20The%20Critically%20Ill%20Adult_edition5_2026_FINALs.pdf">
        {language ? "إرشادات نقل المريض البالغ ذي الحالة الحرجة" : "Critical care transfer guidance"}
      </a>
    </figure>
  );
}

const pupillometer: Visual = {
  file: "pupillometer",
  width: 584,
  height: 875,
  alt: ["A handheld automated pupillometer with an eyecup and display.", "مقياس حدقة آلي محمول مزوّد بكأس للعين وشاشة."],
  label: ["Recognise a pupillometer", "تعرّف على جهاز قياس الحدقة"],
  detail: ["Locate the eyecup beside the display. This is one example of a device used to assess the pupils.", "حدّد كأس العين بجوار الشاشة. هذا مثال على جهاز يُستخدم لتقييم حدقتي العين."],
  source: "Pupillometer_neurolight.jpg",
  credit: "IDMED",
  license: "BY-SA 4.0",
};

const semiFowler: Visual = {
  file: "semi-fowler",
  width: 301,
  height: 201,
  alt: ["A person lying in a hospital bed with the upper section of the bed raised.", "شخص مستلقٍ على سرير مستشفى مع رفع الجزء العلوي من السرير."],
  label: ["Recognise the semi-Fowler position", "تعرّف على وضعية نصف فاولر"],
  detail: ["Look at how the bed supports the upper body at an incline. Use the position and head-of-bed angle specified in the patient’s care plan.", "لاحظ كيف يدعم السرير الجزء العلوي من الجسم بزاوية مائلة. اتبع الوضعية وزاوية رفع رأس السرير المحددتين في خطة رعاية المريض."],
  source: "Semi-Fowler's_position.jpg",
  credit: "Glynda Rees Doyle and Jodie Anita McCutcheon",
  license: "BY 4.0",
};

const handwashing: Visual = {
  file: "handwashing",
  width: 950,
  height: 710,
  alt: ["A person washing their hands under running water at a sink.", "شخص يغسل يديه تحت الماء الجاري عند المغسلة."],
  label: ["Handwashing at the sink", "غسل اليدين عند المغسلة"],
  detail: ["This photo illustrates handwashing with running water. See the lesson for when to use soap and water or alcohol-based hand rub.", "توضّح الصورة غسل اليدين بالماء الجاري. راجع الدرس لمعرفة متى يُستخدم الماء والصابون أو مطهّر اليدين الكحولي."],
  source: "Person_washing_hands.jpg",
  credit: "CDC, Kimberly Smith and Christine Ford",
  license: "Public domain",
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
  "SK-08": nasalCannula,
  "D01-T03": nasalCannula,
  "SK-04": endotrachealTube,
  "D01-T12": endotrachealTube,
  "SK-03": ivCatheter,
  "SK-09": bloodBag,
  "D08-T03": bloodBag,
  "SK-12": foleyCatheter,
  "D04-T03": foleyCatheter,
  "SK-02": centralLine,
  "D06-T05": centralLine,
  "SK-11": nasogastricTube,
  "SK-06": suctionCatheter,
  "D01-T11": suctionCatheter,
  "SK-24": pupillometer,
  "D03-T03": pupillometer,
  "SK-15": semiFowler,
  "D06-T07": semiFowler,
  "SK-21": handwashing,
  "D06-T04": handwashing,
};

function EquipmentPhoto({ visual, locale }: { visual: Visual; locale: string }) {

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
          {visual.license === "Public domain" ? "Public domain (US)" : <a className="underline" href={`https://creativecommons.org/licenses/${license}/`}>CC {visual.license}</a>} · {visual.cropped ? "Cropped and converted to WebP" : "WebP version, resized where applicable"}
        </p>
      </figcaption>
    </figure>
  );
}


export function EquipmentVisual({ moduleKey, locale }: { moduleKey: string; locale: string }) {
  if (crrtModules.has(moduleKey)) return <CrrtCircuitVisual locale={locale} />;
  if (moduleKey === "SK-20") return <TransportVisual locale={locale} />;

  const visual = visuals[moduleKey];
  if (!visual) return null;
  const showVenturiMask = moduleKey === "SK-08" || moduleKey === "D01-T03";
  return (
    <>
      <EquipmentPhoto visual={visual} locale={locale} />
      {showVenturiMask && <EquipmentPhoto visual={venturiMask} locale={locale} />}
    </>
  );
}
