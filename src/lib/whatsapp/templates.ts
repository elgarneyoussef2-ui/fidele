// Templates de messages WhatsApp pré-définis

export type TemplateName =
  | 'welcome'
  | 'points_update'
  | 'birthday'
  | 'inactive'
  | 'review_request'

export type TemplateVariables = Record<string, string | number>

const templates: Record<TemplateName, (vars: TemplateVariables) => string> = {
  welcome: (v) =>
    `🎉 Bienvenue ${v.name} chez ${v.restaurant} ! Vous avez reçu ${v.points} points de bienvenue. Scannez le QR à chaque visite pour gagner plus de points.`,

  points_update: (v) =>
    `✅ Merci ${v.name} ! Vous avez gagné +${v.earned} points. Solde total : ${v.balance} points. Continuez à visiter ${v.restaurant} pour débloquer des récompenses !`,

  birthday: (v) =>
    `🎂 Joyeux anniversaire ${v.name} ! Toute l'équipe de ${v.restaurant} vous souhaite une belle journée. Profitez d'un coupon -15% offert aujourd'hui uniquement. Code : ${v.code}`,

  inactive: (v) =>
    `👋 ${v.name}, vous nous manquez ! Cela fait un moment que vous n'êtes pas venu(e) chez ${v.restaurant}. Revenez ce weekend avec -20% de réduction. Code : ${v.code}`,

  review_request: (v) =>
    `⭐ Merci ${v.name} de votre visite chez ${v.restaurant} ! Si vous avez apprécié, laissez-nous un avis Google, ça nous aide beaucoup : ${v.link}`,
}

export function formatTemplate(
  name: TemplateName,
  variables: TemplateVariables
): string {
  const template = templates[name]
  if (!template) {
    throw new Error(`Template inconnu : ${name}`)
  }
  return template(variables)
}
