/// <reference types="vite/client" />

type AssistantHistoryMessage = {
  role: string;
  content: string;
};

type HotelInsight = {
  summary: string;
  recommendation: string;
};

let googleGenAIModulePromise: Promise<typeof import('@google/genai')> | null = null;

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
};

const loadGoogleGenAI = async () => {
  googleGenAIModulePromise ??= import('@google/genai');
  return googleGenAIModulePromise;
};

const createGenAIClient = async (apiKey: string) => {
  const { GoogleGenAI } = await loadGoogleGenAI();

  return new GoogleGenAI({
    apiKey,
    httpOptions: { apiVersion: 'v1' }
  });
};

export const chatWithAssistant = async (history: AssistantHistoryMessage[], message: string) => {
  const apiKey = getApiKey();

  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    return "L'assistant n'est pas encore configuré. Vérifiez que VITE_GEMINI_API_KEY est bien défini dans .env.local, puis redémarrez le serveur.";
  }

  const genAI = await createGenAIClient(apiKey);

  try {
    const systemPrompt = "Tu es l'assistant intelligent de l'Hôtel Mirador. Tu es expert en hôtellerie, courtois et efficace. Tu aides le personnel à gérer les réservations, le stock du bar et du restaurant, la sécurité, les paramètres et la réception. Réponds toujours en français.";

    const processedMessage = `${systemPrompt}\n\nMessage de l'utilisateur: ${message}`;

    const contents = [
      ...history
        .filter((msg, index) => !(index === 0 && msg.role !== 'user'))
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
      { role: 'user', parts: [{ text: processedMessage }] }
    ];

    const response = await (genAI as any).models.generateContent({
      model: 'gemini-1.5-flash',
      contents
    });

    if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text;
    }

    return (response as any).text || "Désolé, je n'ai pas pu formuler une réponse.";
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    if (error.message?.includes('API_KEY_INVALID')) {
      return 'Clé API invalide. Vérifiez VITE_GEMINI_API_KEY dans .env.local.';
    }
    return `Erreur technique : ${error.message || 'vérifiez votre quota ou votre connexion internet.'}`;
  }
};

export const getHotelInsights = async (stats: unknown, rooms: unknown[]): Promise<HotelInsight> => {
  const apiKey = getApiKey();

  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    return {
      summary: 'IA non configurée.',
      recommendation: 'Définissez VITE_GEMINI_API_KEY dans .env.local.'
    };
  }

  const genAI = await createGenAIClient(apiKey);

  const prompt = `
    En tant qu'expert en gestion hôtelière pour l'Hôtel Mirador, analyse ces données :
    Stats : ${JSON.stringify(stats)}
    Chambres : ${JSON.stringify(rooms.map((room: any) => ({ n: room.number, s: room.status })))}

    Fournis un résumé opérationnel concis (3 phrases) et une recommandation pour augmenter le chiffre d'affaires.
    Réponds TOUJOURS en JSON sous ce format : { "summary": "...", "recommendation": "..." }
  `;

  try {
    const response = await (genAI as any).models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    let text = '';
    if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      text = response.candidates[0].content.parts[0].text;
    } else {
      text = (response as any).text;
    }

    if (!text) {
      throw new Error('No text in response');
    }

    const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error('Gemini Insight Error:', error);
    return {
      summary: 'Analyse en attente de configuration.',
      recommendation: 'Assurez-vous que votre clé API est valide et redémarrez le serveur.'
    };
  }
};
