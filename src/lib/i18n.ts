export type Lang = 'fr' | 'ar'

export interface Tr {
  // Common
  pts: string
  mad: string
  lang_toggle: string

  // Nav
  home_tab: string
  scan_tab: string
  wallet_subtitle: string

  // Welcome
  wallet_access: string
  enter_password: string
  already_have_account: string
  no_account_found: string
  network_error: string
  wrong_password_err: string
  or: string
  scan_qr_btn: string
  first_visit_hint: string
  change_number_btn: string
  password_ph: string

  // Home hero
  greeting: string
  total_loyalty: string
  scan_to_start: string
  no_restaurant_title: string
  no_restaurant_hint: string
  scan_now: string
  my_restaurants: string

  // Tiers
  bronze: string
  silver: string
  gold: string
  max_tier: string

  // Dynamic helpers
  n_more_pts_to: (n: number, tier: string) => string
  n_visits: (n: number) => string
  in_n_restaurants: (n: number) => string
  expiry_pill: (pts: number, days: number) => string

  // Detail
  your_balance: string
  n_more_to_reach: (n: number, tier: string) => string
  you_are_max_tier: string
  available_rewards: string
  no_rewards: string
  use_btn: string
  sent_label: string
  visit_history: string
  no_visits: string
  expiry_warning_title: (pts: number, days: number) => string
  expiry_use_before: (date: string) => string
  confirm_use_pts: (pts: number) => string
  confirm_restaurant_validate: string
  cancel: string
  confirm: string

  // Relative time
  just_now: string
  n_min_ago: (m: number) => string
  n_h_ago: (h: number) => string
  n_d_ago: (d: number) => string
  n_mo_ago: (mo: number) => string
}

export const T: Record<Lang, Tr> = {
  fr: {
    pts: 'pts',
    mad: 'MAD',
    lang_toggle: 'عربي',

    home_tab: 'Accueil',
    scan_tab: 'Scanner',
    wallet_subtitle: 'Portefeuille fidélité',

    wallet_access: 'Accédez à votre portefeuille fidélité.',
    enter_password: 'Entrez votre mot de passe pour continuer.',
    already_have_account: 'J\'ai déjà un compte',
    no_account_found: 'Aucun compte trouvé. Scannez un QR code pour créer votre compte.',
    network_error: 'Erreur réseau, réessayez.',
    wrong_password_err: 'Mot de passe incorrect.',
    or: 'OU',
    scan_qr_btn: 'Scanner un QR code',
    first_visit_hint: 'Première visite ? Scannez le QR code du restaurant.',
    change_number_btn: '← Modifier le numéro',
    password_ph: 'Mot de passe',

    greeting: 'Bonjour,',
    total_loyalty: 'Total fidélité',
    scan_to_start: 'Scannez pour commencer',
    no_restaurant_title: 'Aucun restaurant encore',
    no_restaurant_hint: 'Scannez le QR code d\'un restaurant pour l\'ajouter à votre portefeuille.',
    scan_now: 'Scanner maintenant',
    my_restaurants: 'Mes restaurants',

    bronze: 'Bronze',
    silver: 'Argent',
    gold: 'Or',
    max_tier: 'Palier maximum ✨',

    n_more_pts_to: (n, tier) => `encore ${n} pts → ${tier}`,
    n_visits: (n) => `${n} visite${n > 1 ? 's' : ''}`,
    in_n_restaurants: (n) => `Dans ${n} restaurant${n > 1 ? 's' : ''}`,
    expiry_pill: (pts, days) => `${pts} pt${pts > 1 ? 's' : ''} expirent dans ${days} jour${days > 1 ? 's' : ''}`,

    your_balance: 'Votre solde',
    n_more_to_reach: (n, tier) => `Encore ${n} pts pour atteindre ${tier}`,
    you_are_max_tier: 'Vous êtes au palier maximum ✨',
    available_rewards: 'Récompenses disponibles',
    no_rewards: 'Aucune récompense disponible pour ce restaurant.',
    use_btn: 'Utiliser',
    sent_label: 'Envoyé ✓',
    visit_history: 'Historique des visites',
    no_visits: 'Aucune visite enregistrée.',
    expiry_warning_title: (pts, days) => `${pts} pt${pts > 1 ? 's' : ''} expirent dans ${days} jour${days > 1 ? 's' : ''}`,
    expiry_use_before: (date) => `Utilisez vos points avant le ${date}`,
    confirm_use_pts: (pts) => `Vous allez utiliser ${pts} pts.`,
    confirm_restaurant_validate: 'Le restaurant doit valider votre demande.',
    cancel: 'Annuler',
    confirm: 'Confirmer',

    just_now: 'À l\'instant',
    n_min_ago: (m) => `Il y a ${m} min`,
    n_h_ago: (h) => `Il y a ${h}h`,
    n_d_ago: (d) => `Il y a ${d}j`,
    n_mo_ago: (mo) => `Il y a ${mo} mois`,
  },

  ar: {
    pts: 'نقطة',
    mad: 'درهم',
    lang_toggle: 'Français',

    home_tab: 'الرئيسية',
    scan_tab: 'مسح',
    wallet_subtitle: 'محفظة النقاط',

    wallet_access: 'ادخل إلى محفظة نقاط ولائك.',
    enter_password: 'أدخل كلمة مرورك للمتابعة.',
    already_have_account: 'لدي حساب بالفعل',
    no_account_found: 'لم يُعثر على حساب. امسح رمز QR لإنشاء حسابك.',
    network_error: 'خطأ في الشبكة، حاول مجدداً.',
    wrong_password_err: 'كلمة مرور خاطئة.',
    or: 'أو',
    scan_qr_btn: 'مسح رمز QR',
    first_visit_hint: 'زيارتك الأولى؟ امسح رمز QR الخاص بالمطعم.',
    change_number_btn: 'تعديل الرقم ←',
    password_ph: 'كلمة المرور',

    greeting: 'أهلاً،',
    total_loyalty: 'إجمالي النقاط',
    scan_to_start: 'امسح للبدء',
    no_restaurant_title: 'لا يوجد مطعم بعد',
    no_restaurant_hint: 'امسح رمز QR لمطعم لإضافته إلى محفظتك.',
    scan_now: 'امسح الآن',
    my_restaurants: 'مطاعمي',

    bronze: 'برونز',
    silver: 'فضة',
    gold: 'ذهب',
    max_tier: 'أعلى مستوى ✨',

    n_more_pts_to: (n, tier) => `${n} نقطة أخرى ← ${tier}`,
    n_visits: (n) => `${n} ${n === 1 ? 'زيارة' : 'زيارات'}`,
    in_n_restaurants: (n) => `في ${n} ${n === 1 ? 'مطعم' : 'مطاعم'}`,
    expiry_pill: (pts, days) => `${pts} نقطة تنتهي خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}`,

    your_balance: 'رصيدك',
    n_more_to_reach: (n, tier) => `${n} نقطة أخرى للوصول إلى ${tier}`,
    you_are_max_tier: 'أنت في أعلى مستوى ✨',
    available_rewards: 'المكافآت المتاحة',
    no_rewards: 'لا توجد مكافآت لهذا المطعم.',
    use_btn: 'استخدام',
    sent_label: 'تم الإرسال ✓',
    visit_history: 'سجل الزيارات',
    no_visits: 'لا توجد زيارات مسجلة.',
    expiry_warning_title: (pts, days) => `${pts} نقطة تنتهي خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}`,
    expiry_use_before: (date) => `استخدم نقاطك قبل ${date}`,
    confirm_use_pts: (pts) => `ستستخدم ${pts} نقطة.`,
    confirm_restaurant_validate: 'يجب على المطعم تأكيد طلبك.',
    cancel: 'إلغاء',
    confirm: 'تأكيد',

    just_now: 'الآن',
    n_min_ago: (m) => `منذ ${m} دقيقة`,
    n_h_ago: (h) => `منذ ${h} ساعة`,
    n_d_ago: (d) => `منذ ${d} يوم`,
    n_mo_ago: (mo) => `منذ ${mo} شهر`,
  },
}
