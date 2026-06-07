/**
 * Liste des 15 wilayas de Mauritanie (synchronisée avec
 * `citizens.models.MauritaniaWilayaChoices` côté backend).
 *
 * On expose value + label arabe pour les UI (selects et badges).
 */
export const WILAYAS = [
  { value: "Hodh Ech Chargui", label: "الحوض الشرقي" },
  { value: "Hodh El Gharbi", label: "الحوض الغربي" },
  { value: "Assaba", label: "العصابة" },
  { value: "Gorgol", label: "كوركول" },
  { value: "Brakna", label: "البراكنة" },
  { value: "Trarza", label: "الترارزة" },
  { value: "Adrar", label: "أدرار" },
  { value: "Dakhlet Nouadhibou", label: "داخلت نواذيبو" },
  { value: "Tagant", label: "تكانت" },
  { value: "Guidimagha", label: "كيديماغا" },
  { value: "Tiris Zemmour", label: "تيرس زمور" },
  { value: "Inchiri", label: "إنشيري" },
  { value: "Nouakchott Ouest", label: "نواكشوط الغربية" },
  { value: "Nouakchott Nord", label: "نواكشوط الشمالية" },
  { value: "Nouakchott Sud", label: "نواكشوط الجنوبية" },
];

const LABEL_INDEX = Object.fromEntries(WILAYAS.map((w) => [w.value, w.label]));

/** Label arabe pour une valeur backend. Retourne la valeur brute si inconnue. */
export const labelWilaya = (value) => LABEL_INDEX[value] ?? value ?? "";
