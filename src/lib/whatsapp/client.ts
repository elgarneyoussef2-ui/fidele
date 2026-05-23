import { formatTemplate, type TemplateName, type TemplateVariables } from './templates'

export interface SendMessageParams {
  phone: string
  templateName: TemplateName
  variables: TemplateVariables
}

export interface SendMessageResult {
  success: boolean
  messageId?: string
  error?: string
}

// Vérifie si on est en mode production avec l'API configurée
function isProductionMode(): boolean {
  return !!(
    process.env.WHATSAPP_API_KEY &&
    process.env.WHATSAPP_API_URL
  )
}

// Simule un délai réseau en dev
async function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 100))
}

// Envoie via l'API 360dialog en production
async function sendViaAPI(
  phone: string,
  message: string
): Promise<SendMessageResult> {
  const response = await fetch(
    `${process.env.WHATSAPP_API_URL}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'D360-API-KEY': process.env.WHATSAPP_API_KEY!,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    return { success: false, error }
  }

  const data = await response.json()
  return { success: true, messageId: data.messages?.[0]?.id }
}

// Point d'entrée principal — mock en dev, API réelle en prod
export async function sendMessage(
  params: SendMessageParams
): Promise<SendMessageResult> {
  const { phone, templateName, variables } = params
  const message = formatTemplate(templateName, variables)

  if (!isProductionMode()) {
    // Mode développement : afficher dans les logs
    await mockDelay()
    console.log('\n📱 [WhatsApp MOCK]')
    console.log(`  → Destinataire : ${phone}`)
    console.log(`  → Template     : ${templateName}`)
    console.log(`  → Message      : ${message}`)
    console.log('─'.repeat(60))
    return { success: true, messageId: `mock_${Date.now()}` }
  }

  return sendViaAPI(phone, message)
}
