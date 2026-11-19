import { Activity, ArrowRight, BatteryCharging, ClipboardList, Droplets, Filter, Gauge, RotateCw } from "lucide-react";
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
  license: "BY-SA 2.5" | "BY-SA 3.0" | "BY-SA 4.0" | "BY 2.5" | "BY 3.0" | "BY 4.0" | "Public domain" | "CC0 1.0";
  cropped?: boolean;
  rotated?: boolean;
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

const arterialTransducer: Visual = {
  file: "arterial-transducer-level",
  width: 1050,
  height: 618,
  alt: ["Illustration showing the pressure transducer at the reference level and the effect of a height difference.", "رسم يوضّح مستوى محوّل الضغط المرجعي وتأثير اختلاف الارتفاع."],
  label: ["Locate the pressure transducer and reference level", "حدّد موضع محوّل الضغط ومستواه المرجعي"],
  detail: ["Follow the line from the patient to the transducer and compare the transducer height with the reference point.", "تتبّع الأنبوب من المريض إلى محوّل الضغط وقارن ارتفاع المحوّل بالنقطة المرجعية."],
  source: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7183114/figure/Fig1/",
  credit: "Saugel et al., Critical Care (2020), figure 1",
  license: "BY 4.0",
};

const arterialDamping: Visual = {
  file: "arterial-waveform-damping",
  width: 818,
  height: 1150,
  alt: ["Arterial waveform examples showing exaggerated peaks with underdamping and a flattened trace with overdamping.", "أمثلة لموجات الضغط الشرياني تظهر قمماً مبالغاً فيها عند نقص التخميد وموجة مسطّحة عند فرط التخميد."],
  label: ["Compare underdamped and overdamped arterial traces", "قارن موجات الضغط الشرياني ناقصة التخميد ومفرطة التخميد"],
  detail: ["Compare the sharp peak in the upper example with the blunted upstroke in the lower example.", "قارن القمة الحادة في المثال العلوي بالصعود البطيء في المثال السفلي."],
  source: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7183114/figure/Fig3/",
  credit: "Saugel et al., Critical Care (2020), figure 3",
  license: "BY 4.0",
};

export function ArterialWaveformPhoto({ locale }: { locale: string }) {
  return <EquipmentPhoto visual={arterialDamping} locale={locale} />;
}

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

const cvvhdImage = "/images/equipment/cvvhd-circuit.webp";
const cvvhdLabels = [
  ["Patient catheter", "قسطرة المريض"],
  ["Access pressure sensor (before the pump)", "حساس ضغط السحب (قبل المضخة)"],
  ["Blood pump", "مضخة الدم"],
  ["Filter inlet pressure sensor (after the pump)", "حساس ضغط مدخل المرشّح (بعد المضخة)"],
  ["Hemofilter", "المرشّح الدموي"],
  ["Return pressure sensor (toward the patient)", "حساس ضغط الإرجاع (باتجاه المريض)"],
  ["Fresh dialysate bag", "كيس سائل الديال الطازج"],
  ["Effluent collection bag", "كيس تجميع السائل المطروح"],
  ["Effluent pressure sensor", "حساس ضغط السائل المطروح"],
] as const;

function CvvhdCircuitFigure({ locale }: { locale: string }) {
  const ar = locale === "ar";
  return (
    <figure className="mb-8 overflow-hidden rounded-xl border border-border bg-muted">
      <a href={cvvhdImage} className="block focus-visible:outline focus-visible:outline-offset-[-3px]" aria-label={ar ? "افتح مخطط الدائرة بالحجم الكامل" : "Open the full-size circuit illustration"}>
        <Image
          src={cvvhdImage}
          alt={ar ? "مخطط مرقّم يبيّن اتجاه تدفق الدم وسائل الديال والسائل المطروح في دائرة CVVHD." : "Numbered CVVHD circuit showing the direction of blood, fresh dialysate and effluent flow."}
          width={1080}
          height={640}
          sizes="(min-width: 1024px) 750px, 90vw"
          className="h-auto w-full"
        />
      </a>
      <figcaption className="space-y-3 p-4 sm:p-5">
        <p className="font-semibold">{ar ? "تتبّع مسارات السوائل وحدّد حساسات الضغط" : "Trace the CVVHD fluid paths and locate the pressure sensors"}</p>
        <p className="text-sm text-muted-foreground">
          {ar ? "الوردي: الدم. الأزرق: سائل الديال الطازج. الأصفر: السائل المطروح. هذا رسم تعليمي مبسّط لدائرة الديال الدموي الوريدي المستمر." : "Pink shows blood, blue shows fresh dialysate, and amber shows effluent. This is a simplified continuous venovenous hemodialysis circuit."}
        </p>
        <ol className="list-decimal space-y-1 ps-6 text-sm sm:columns-2">
          {cvvhdLabels.map(([en, translated]) => <li key={en} className="break-inside-avoid">{ar ? translated : en}</li>)}
        </ol>
        <p className="text-xs text-muted-foreground">
          {ar ? "رسم تعليمي أصلي. مرجع الدائرة: " : "Original teaching illustration. Circuit reference: "}
          <a className="underline" href="https://www.ncbi.nlm.nih.gov/books/NBK556028/figure/article-90896.image.f2/">
            {ar ? "StatPearls، الشكل ٢" : "StatPearls, figure 2"}
          </a>
        </p>
      </figcaption>
    </figure>
  );
}

const crrtModules = new Set(["SK-17", "D04-T09"]);
const crrtSteps = [
  { icon: Gauge, label: ["Access line", "خط السحب"], detail: ["Access pressure before the pump", "ضغط السحب قبل المضخة"] },
  { icon: RotateCw, label: ["Blood pump", "مضخة الدم"], detail: ["Moves blood through the circuit", "تحرّك الدم عبر الدائرة"] },
  { icon: Filter, label: ["Filter", "المرشّح"], detail: ["Filter inlet pressure and effluent-side pressure", "ضغط مدخل المرشّح وضغط جهة السائل المطروح"] },
  { icon: Gauge, label: ["Return line", "خط الإرجاع"], detail: ["Return pressure toward the patient", "ضغط الإرجاع باتجاه المريض"] },
] as const;

function CrrtCircuitVisual({ locale }: { locale: string }) {
  const ar = locale === "ar";
  return (
    <figure className="mb-8 space-y-4 rounded-xl border border-border bg-muted p-4 sm:p-5">
      <figcaption>
        <p className="font-semibold">{ar ? "مسار الدم في دائرة العلاج الكلوي المستمر" : "Blood path in the CRRT circuit"}</p>
        <p className="mt-1 text-sm text-muted-foreground">{ar ? "رسم مبسّط لمسار الدم من المريض إلى المرشّح ثم عودته إلى المريض." : "Simplified view of blood flowing from the patient through the filter and back to the patient."}</p>
      </figcaption>
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {crrtSteps.map(({ icon: Icon, label, detail }, index) => (
          <li key={label[0]} className="flex flex-col items-center gap-2 sm:flex-row">
            <span className="min-h-32 w-full flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"><Icon aria-hidden="true" className="mb-2 size-5 text-primary" /><strong className="block">{label[ar ? 1 : 0]}</strong><span className="text-muted-foreground">{detail[ar ? 1 : 0]}</span></span>
            {index < crrtSteps.length - 1 && <ArrowRight aria-hidden="true" className="size-4 shrink-0 rotate-90 sm:rotate-0 sm:rtl:rotate-180" />}
          </li>
        ))}
      </ol>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Droplets aria-hidden="true" className="size-5 shrink-0 text-primary" />
        {ar ? "مسار منفصل: يخرج السائل المطروح من المرشّح إلى كيس التجميع." : "Separate fluid path: effluent leaves the filter and flows to the collection bag."}
      </p>
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

const glucoseMeter: Visual = {
  file: "glucose-meter",
  width: 656,
  height: 875,
  alt: ["A handheld blood glucose meter with a digital display.", "جهاز محمول لقياس سكر الدم مزوّد بشاشة رقمية."],
  label: ["Blood glucose meter", "جهاز قياس سكر الدم"],
  detail: ["The test strip is visible at the top of the meter.", "يظهر شريط الفحص في الجزء العلوي من الجهاز."],
  source: "(20250417)_Blood_glucose_meter_07.jpg",
  credit: "Roy Zuo",
  license: "BY-SA 4.0",
};

const bloodCulture: Visual = {
  file: "blood-culture",
  width: 950,
  height: 713,
  alt: ["A gloved hand holds a clear blood culture bottle.", "يد ترتدي قفازًا تمسك بزجاجة شفافة لمزرعة الدم."],
  label: ["Blood culture bottle", "زجاجة مزرعة الدم"],
  detail: ["This is an example of a bottle used to collect a blood sample for culture.", "هذا مثال على زجاجة تُستخدم لجمع عينة دم للزرع."],
  source: "Blood_culture_bottle_without_growth_of_organisms.jpg",
  credit: "Ajay Kumar Chaurasiya",
  license: "BY-SA 4.0",
};

const citrateTube: Visual = {
  file: "citrate-tube",
  width: 950,
  height: 713,
  alt: ["A blue-capped citrate tube containing a blood sample.", "أنبوب سترات بغطاء أزرق يحتوي على عينة دم."],
  label: ["Citrate tube for coagulation testing", "أنبوب سترات لاختبارات التخثر"],
  detail: ["This photo shows a blood sample in a citrate collection tube.", "تُظهر الصورة عينة دم في أنبوب جمع يحتوي على السترات."],
  source: "Blood_in_Citrate_Tube_for_Coagulation_Test.jpg",
  credit: "Ajay Kumar Chaurasiya",
  license: "BY-SA 4.0",
};

const fingerOximeter: Visual = {
  file: "finger-oximeter",
  width: 950,
  height: 633,
  alt: ["A clip-style pulse oximeter attached to a finger.", "مقياس التأكسج النبضي على شكل مشبك مثبت على إصبع."],
  label: ["Fingertip pulse oximeter", "مقياس التأكسج النبضي للإصبع"],
  detail: ["A fingertip pulse oximeter displays oxygen saturation (SpO₂) and pulse rate.", "يعرض مقياس التأكسج النبضي للإصبع تشبع الأكسجين (SpO₂) ومعدل النبض."],
  source: "Pulse_oximeter_on_a_finger.jpg",
  credit: "Jakub T. Jankiewicz",
  license: "BY-SA 4.0",
};

const bagMask: Visual = {
  file: "bag-mask",
  width: 656,
  height: 875,
  alt: ["A manual resuscitator with a clear face mask, squeeze bag and oxygen reservoir.", "جهاز إنعاش يدوي مزوّد بقناع وجه شفاف وكيس قابل للضغط وخزان أكسجين."],
  label: ["Bag-valve-mask resuscitator", "جهاز الإنعاش اليدوي بالكيس والصمام والقناع"],
  detail: ["The face mask is at the top, the squeeze bag is in the middle and the oxygen reservoir is at the bottom.", "يظهر قناع الوجه في الأعلى، والكيس القابل للضغط في الوسط، وخزان الأكسجين في الأسفل."],
  source: "Bag_mask_ventilation_device.jpg",
  credit: "ICUnurses",
  license: "BY-SA 4.0",
};

const stethoscope: Visual = {
  file: "stethoscope",
  width: 656,
  height: 875,
  alt: ["A stethoscope with earpieces, blue tubing and a round chest piece.", "سماعة طبية تظهر فيها قطع الأذن والأنبوب الأزرق والقطعة الصدرية الدائرية."],
  label: ["Stethoscope", "سماعة طبية"],
  detail: ["A stethoscope is used to listen to sounds such as heartbeats and breath sounds during the assessment.", "تُستخدم السماعة الطبية للاستماع إلى أصوات مثل نبضات القلب وأصوات التنفس أثناء التقييم."],
  source: "Stethoscope.jpg",
  credit: "ICUnurses",
  license: "BY-SA 4.0",
};

const rollator: Visual = {
  file: "rollator",
  width: 656,
  height: 875,
  alt: ["A wheeled walker with hand brakes and a built-in seat.", "مشّاية بعجلات مزوّدة بمكابح يدوية ومقعد مدمج."],
  label: ["Wheeled walker (rollator)", "مشّاية بعجلات"],
  detail: ["This example shows a mobility aid with brake levers beneath both handgrips.", "يوضح هذا المثال وسيلة مساعدة على المشي بمقبضي مكابح أسفل مسكتي اليد."],
  source: "Rollator.jpg",
  credit: "DirkvdM",
  license: "BY 3.0",
};

const oronasalMask: Visual = {
  file: "oronasal-mask",
  width: 808,
  height: 875,
  alt: ["A patient wearing a ventilation mask over the nose and mouth, with head straps and breathing tubing visible.", "مريض يرتدي قناع تهوية يغطي الأنف والفم، وتظهر أحزمة تثبيت الرأس وأنبوب التنفس."],
  label: ["Oronasal mask for non-invasive ventilation", "قناع الأنف والفم للتهوية غير الغازية"],
  detail: ["The mask covers the nose and mouth and connects to the breathing circuit.", "يغطي القناع الأنف والفم ويتصل بدارة التنفس."],
  source: "Oronasal_NVS.jpg",
  credit: "Mahleretto",
  license: "BY-SA 4.0",
};

const ecgMachine: Visual = {
  file: "ecg-machine",
  rotated: true,
  width: 875,
  height: 525,
  alt: ["An ECG machine with controls and a strip of grid paper.", "جهاز تخطيط كهربائية القلب تظهر عليه أزرار التحكم وشريط ورق التخطيط."],
  label: ["Electrocardiograph", "جهاز تخطيط كهربائية القلب"],
  detail: ["This machine records an ECG and can print it on grid paper. A bedside monitor displays the rhythm continuously.", "يسجّل هذا الجهاز تخطيط كهربائية القلب ويمكنه طباعته على ورق مدرّج. تعرض شاشة المراقبة بجانب السرير النظم القلبي باستمرار."],
  source: "ECG_machine.jpg",
  credit: "Zeeshan2907",
  license: "BY-SA 4.0",
};

const penlight: Visual = {
  file: "penlight",
  width: 950,
  height: 353,
  alt: ["A handheld medical penlight with its tip illuminated.", "مصباح طبي قلمي محمول يظهر طرفه مضاءً."],
  label: ["Medical penlight", "مصباح طبي قلمي"],
  detail: ["A penlight can be used to check how the pupils respond to light during a neurological assessment.", "يمكن استخدام المصباح القلمي لفحص استجابة الحدقتين للضوء أثناء التقييم العصبي."],
  source: "Halogenlight.JPG",
  credit: "Hanabishi",
  license: "BY-SA 3.0",
};

const highFlowCannula: Visual = {
  file: "high-flow-cannula",
  width: 492,
  height: 875,
  alt: ["A high-flow nasal oxygen system on a wheeled stand with blue breathing tubing.", "نظام أكسجين أنفي عالي التدفق على حامل بعجلات مع أنابيب تنفس زرقاء."],
  label: ["High-flow nasal oxygen setup", "نظام الأكسجين الأنفي عالي التدفق"],
  detail: ["The setup includes a humidifier, a breathing circuit and a nasal interface.", "يتضمن النظام جهاز ترطيب ودارة تنفس ووصلة أنفية."],
  source: "High_Flow_Nasal_Cannula_Classic.png",
  credit: "BreathDriver",
  license: "BY-SA 4.0",
};

const bloodPressureCuff: Visual = {
  file: "bp-cuff",
  width: 688,
  height: 700,
  alt: ["A manual blood pressure cuff with an inflation bulb and a round pressure gauge.", "كُفّة يدوية لقياس ضغط الدم مع مضخة نفخ ومقياس ضغط دائري."],
  label: ["Manual blood pressure cuff", "كُفّة يدوية لقياس ضغط الدم"],
  detail: ["The hand bulb inflates the cuff and the gauge displays cuff pressure.", "تنفخ المضخة اليدوية الكُفّة ويعرض المقياس الضغط داخلها."],
  source: "Aneroid_Sphygmomanometer.jpg",
  credit: "Confidence24",
  license: "BY-SA 4.0",
};

const bloodGasAnalyzer: Visual = {
  file: "blood-gas-analyzer",
  width: 950,
  height: 794,
  alt: ["A benchtop blood gas analyzer with its screen and sample inlet visible.", "جهاز مخبري لتحليل غازات الدم تظهر فيه الشاشة وفتحة إدخال العينة."],
  label: ["Blood gas analyzer", "جهاز تحليل غازات الدم"],
  detail: ["This example shows a laboratory analyzer that measures blood pH, carbon dioxide partial pressure and oxygen partial pressure.", "يوضح هذا المثال جهازًا مخبريًا يقيس درجة حموضة الدم والضغط الجزئي لثاني أكسيد الكربون والضغط الجزئي للأكسجين."],
  source: "Cobas221A.png",
  credit: "J3D3",
  license: "BY-SA 3.0",
};

const healthcarePpe: Visual = {
  file: "healthcare-ppe",
  width: 950,
  height: 534,
  alt: ["Healthcare workers wearing protective clothing and masks in a hospital.", "عاملون في الرعاية الصحية يرتدون ملابس واقية وكمامات في مستشفى."],
  label: ["Personal protective equipment in clinical care", "معدات الوقاية الشخصية في الرعاية السريرية"],
  detail: ["This photo shows protective clothing and face protection used in a hospital during the COVID-19 pandemic.", "تُظهر الصورة الملابس الواقية ووسائل حماية الوجه المستخدمة في مستشفى خلال جائحة كوفيد-19."],
  source: "Healthcare_workers_wearing_PPE_03.jpg",
  credit: "Javed Anees, District Hospital, Tirur",
  license: "CC0 1.0",
};

const urineOutputBag: Visual = {
  file: "urine-output-bag",
  width: 656,
  height: 875,
  alt: ["A urine drainage bag with a graduated measuring chamber hanging from a hospital bed frame.", "كيس تصريف بول مزوّد بحجرة قياس مدرّجة ومعلّق بإطار سرير المستشفى."],
  label: ["Urine drainage bag with measuring chamber", "كيس تصريف البول بحجرة قياس"],
  detail: ["The narrow central chamber has markings for reading collected urine volume.", "تحتوي الحجرة الضيقة في الوسط على تدريجات لقراءة حجم البول المتجمّع."],
  source: "Urine_output_bag.jpg",
  credit: "Ashashyou",
  license: "BY-SA 4.0",
};

const bladderUltrasound: Visual = {
  file: "bladder-ultrasound",
  width: 590,
  height: 364,
  alt: ["A grayscale ultrasound image of the bladder with measurement markers.", "صورة للمثانة بالموجات فوق الصوتية بتدرّج رمادي تظهر عليها علامات القياس."],
  label: ["Bladder ultrasound", "تصوير المثانة بالموجات فوق الصوتية"],
  detail: ["In this example, the fluid-filled bladder appears dark. The measurement markers help estimate the volume of urine in the bladder.", "تظهر المثانة الممتلئة بالسوائل داكنة في هذا المثال. تساعد علامات القياس على تقدير حجم البول في المثانة."],
  source: "Ultrasound_Scan_ND_024.jpg",
  credit: "Nevit Dilmen",
  license: "BY-SA 2.5",
  cropped: true,
};

const capnographySetup: Visual = {
  file: "capnography-setup",
  width: 950,
  height: 534,
  alt: ["Capnography equipment with an airway adapter and coiled connections laid out on a green cloth.", "معدات قياس ثاني أكسيد الكربون في الزفير، مع وصلة لمجرى الهواء وتوصيلات ملفوفة، موضوعة على قطعة قماش خضراء."],
  label: ["Capnography equipment", "معدات تخطيط ثاني أكسيد الكربون في الزفير"],
  detail: ["Capnography displays how carbon dioxide changes during breathing. EtCO₂ is the value measured at the end of exhalation.", "يُظهر تخطيط ثاني أكسيد الكربون كيف يتغيّر مستواه أثناء التنفس. ويعبّر EtCO₂ عن القيمة المقاسة في نهاية الزفير."],
  source: "Capno.jpg",
  credit: "Behzad39",
  license: "BY-SA 4.0",
};

const nonrebreatherMask: Visual = {
  file: "nonrebreather-mask",
  width: 600,
  height: 800,
  alt: ["A clear oxygen mask with a reservoir bag attached below it.", "قناع أكسجين شفاف يتصل به كيس خزان من الأسفل."],
  label: ["Non-rebreather oxygen mask", "قناع أكسجين يمنع إعادة الاستنشاق"],
  detail: ["The reservoir bag hangs below the mask. The oxygen supply tubing runs off to the side.", "يتدلى كيس الخزان أسفل القناع، ويمتد أنبوب إمداد الأكسجين إلى الجانب."],
  source: "Non_Rebreather_Mask.JPG",
  credit: "ICUnurses",
  license: "BY-SA 4.0",
};

const cuffedTracheostomy: Visual = {
  file: "tracheostomy-cuffed",
  width: 900,
  height: 675,
  alt: ["A tracheostomy tube with an inflated cuff and a blue pilot balloon.", "أنبوب فغر الرغامى بكُفّة منفوخة وبالون مؤشر أزرق."],
  label: ["Cuffed tracheostomy tube", "أنبوب فغر الرغامى المزود بكُفّة"],
  detail: ["The inflated cuff surrounds the tube near its tip. A thin inflation line connects it to the blue pilot balloon.", "تحيط الكُفّة المنفوخة بالأنبوب قرب طرفه، ويصلها خط نفخ رفيع ببالون المؤشر الأزرق."],
  source: "Tracheostomy_tube_cuffed.jpg",
  credit: "Tenbergen",
  license: "BY-SA 4.0",
};

const visuals: Record<string, Visual> = {
  "EQ-02": ventilator,
  "SK-07": ventilator,
  "D01-T06": ventilator,
  "D01-T07": capnographySetup,
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
  "D02-T14": bagMask,
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
  "D04-T03": urineOutputBag,
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
  "D06-T01": bloodCulture,
  "D02-T09": bloodCulture,
  "D08-T02": citrateTube,
  "MD-15": glucoseMeter,
  "D07-T01": stethoscope,
  "D02-T02": ecgMachine,
  "D03-T01": penlight,
  "D02-T08": bloodPressureCuff,
  "D04-T08": bloodGasAnalyzer,
  "SK-16": rollator,
  "D01-T17": oronasalMask,
};

function EquipmentPhoto({ visual, locale }: { visual: Visual; locale: string }) {

  const ar = locale === "ar";
  const language = ar ? 1 : 0;
  const photo = `/images/equipment/${visual.file}.webp`;
  const licenseUrl = visual.license === "CC0 1.0"
    ? "https://creativecommons.org/publicdomain/zero/1.0/"
    : `https://creativecommons.org/licenses/${visual.license.toLowerCase().replace(" ", "/")}/`;

  const covered = visual.file === "central-line";
  const largeWidth = Math.min(visual.width, visual.height > visual.width ? 384 : 608);
  const picture = (
    <Image
      src={photo}
      alt={visual.alt[language]}
      width={visual.width}
      height={visual.height}
      sizes="(min-width: 1024px) 540px, 85vw"
      className="mx-auto h-auto w-full"
      style={{ maxWidth: largeWidth }}
    />
  );

  return (
    <figure className="mb-8 overflow-hidden rounded-xl border border-border bg-muted">
      {covered ? (
        <div className="relative mx-auto w-full" style={{ maxWidth: largeWidth }}>
          {picture}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-slate-800"
            style={{ clipPath: "polygon(76% 25%, 100% 25%, 100% 73%, 76% 71%, 69% 66%, 62% 63%, 57% 59%, 51% 55%, 46% 50%, 45% 43%, 45% 38%, 43% 35%, 38% 35%, 73% 33%)" }}
          />
        </div>
      ) : (
        <a href={photo} className="block focus-visible:outline focus-visible:outline-offset-[-3px]" aria-label={ar ? "افتح الصورة بالحجم الكامل" : "Open the full-size image"}>
          {picture}
        </a>
      )}
      <figcaption className="space-y-1 p-4 text-sm">
        <p className="font-semibold">{visual.label[language]}</p>
        <p className="leading-relaxed text-muted-foreground">{visual.detail[language]}</p>
        <p className="text-xs text-muted-foreground" lang="en">
          <a className="underline" href={visual.source.startsWith("https://") ? visual.source : `https://commons.wikimedia.org/wiki/File:${visual.source}`}>Source image</a> · {visual.credit} ·{" "}
          {visual.license === "Public domain" ? "Public domain (US)" : <a className="underline" href={licenseUrl}>{visual.license === "CC0 1.0" ? visual.license : `CC ${visual.license}`}</a>} · {covered ? "Shown with a privacy cover" : visual.cropped ? "Cropped and converted to WebP" : visual.rotated ? "Rotated and converted to WebP" : "WebP version, resized where applicable"}
        </p>
      </figcaption>
    </figure>
  );
}


export function PulseOximeterPhoto({ locale }: { locale: string }) {
  return <EquipmentPhoto visual={fingerOximeter} locale={locale} />;
}

export function EquipmentVisual({ moduleKey, locale }: { moduleKey: string; locale: string }) {
  if (moduleKey === "EQ-06") return <CvvhdCircuitFigure locale={locale} />;
  if (crrtModules.has(moduleKey)) return <CrrtCircuitVisual locale={locale} />;
  if (moduleKey === "EQ-01") return <PulseOximeterPhoto locale={locale} />;
  if (moduleKey === "SK-20") return <TransportVisual locale={locale} />;

  const visual = visuals[moduleKey];
  if (!visual) return null;
  const showVenturiMask = moduleKey === "SK-08" || moduleKey === "D01-T03";
  return (
    <>
      <EquipmentPhoto visual={visual} locale={locale} />
      {moduleKey === "EQ-03" && <EquipmentPhoto visual={arterialTransducer} locale={locale} />}
      {showVenturiMask && <EquipmentPhoto visual={venturiMask} locale={locale} />}
      {moduleKey === "SK-08" && <EquipmentPhoto visual={nonrebreatherMask} locale={locale} />}
      {moduleKey === "SK-05" && <EquipmentPhoto visual={cuffedTracheostomy} locale={locale} />}
      {moduleKey === "D01-T03" && <EquipmentPhoto visual={highFlowCannula} locale={locale} />}
      {moduleKey === "SK-21" && <EquipmentPhoto visual={healthcarePpe} locale={locale} />}
      {moduleKey === "D04-T03" && <EquipmentPhoto visual={bladderUltrasound} locale={locale} />}
    </>
  );
}
