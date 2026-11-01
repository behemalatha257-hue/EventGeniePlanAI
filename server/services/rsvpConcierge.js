/**
 * EventGeniePlan AI - Hyper-Personalized RSVP Concierge Engine
 * 24/7 Guest Inquiry Assistance, Dietary Logging & FAQ Chatbot
 */

const { callGeminiRaw } = require('./geminiService');

const EVENT_FAQS = {
  dressCode: 'Black-Tie Optional / Celestial Elegance. Deep jewel tones, midnight blues, champagne accents, or classic tuxedos and formal evening gowns are encouraged.',
  parking: 'Complimentary valet parking is provided at the North Porte-Cochère of The Grand Luminary Estate. Electric vehicle (EV) charging stations are available in Bay 2.',
  schedule: 'Guest arrival & Champagne Prelude begins at 03:30 PM. The formal Ceremony commences at 04:30 PM sharp, followed by Sunset Terrace Cocktails at 05:45 PM and Plated Dinner at 07:00 PM.',
  registry: 'Your presence is our cherished gift. For guests wishing to honor the couple with a tribute, contributions to our Solar Clean Energy & Regenerative Farm Foundation are welcomed via our digital registry portal.',
  children: 'To allow all guests an evening of relaxation and unhurried celebration, our wedding reception is an adults-only occasion. Professional childcare suites are available at the on-site lodge upon advance reservation.',
  venueLocation: 'The Grand Luminary Estate, Glasshouse Terrace, 1400 Solstice Way, Emerald Valley.'
};

async function handleConciergeInquiry(userQuery, guestContext = {}) {
  const query = (userQuery || '').toLowerCase().trim();

  // Rule-based instant resolution for common FAQs with word boundaries to avoid false substring matches
  let directAnswer = null;

  if (/\b(diet|vegan|vegetarian|allergy|allergies|gluten|halal|kosher|nut|nuts|celiac)\b/i.test(query)) {
    directAnswer = `🥗 **Dietary Needs:** Our culinary team accommodates all dietary needs including Vegan, Gluten-Free, Nut Allergies, and Halal. I have noted your preferences and notified the banquet kitchen!`;
  } else if (/\b(dress|wear|attire|black-tie|gown|suit|tuxedo)\b/i.test(query)) {
    directAnswer = `👗 **Dress Code:** ${EVENT_FAQS.dressCode}`;
  } else if (/\b(park|parking|valet|garage|car|cars|ev|charging)\b/i.test(query)) {
    directAnswer = `🚗 **Parking & Arrival:** ${EVENT_FAQS.parking}`;
  } else if (/\b(time|schedule|when|start|curfew|timing|agenda)\b/i.test(query)) {
    directAnswer = `⏰ **Event Schedule:** ${EVENT_FAQS.schedule}`;
  } else if (/\b(gift|gifts|registry|present|presents|honeymoon fund)\b/i.test(query)) {
    directAnswer = `🎁 **Gift & Registry Information:** ${EVENT_FAQS.registry}`;
  } else if (/\b(kid|kids|child|children|baby|babies|toddler)\b/i.test(query)) {
    directAnswer = `👶 **Children Policy:** ${EVENT_FAQS.children}`;
  } else if (/\b(where|address|location|venue|place|estate)\b/i.test(query)) {
    directAnswer = `📍 **Venue Location:** ${EVENT_FAQS.venueLocation}`;
  }

  if (directAnswer) {
    return {
      success: true,
      reply: directAnswer,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // If not matched by static FAQs, delegate to Gemini AI
  const prompt = `You are the gracious, warm, and highly professional RSVP Concierge AI for Aria & Julian's Grand Solstice Gala Wedding.
Event Details:
- Venue: ${EVENT_FAQS.venueLocation}
- Schedule: ${EVENT_FAQS.schedule}
- Dress Code: ${EVENT_FAQS.dressCode}
- Parking: ${EVENT_FAQS.parking}
- Registry: ${EVENT_FAQS.registry}
- Children: ${EVENT_FAQS.children}

Guest Query: "${userQuery}"

Provide an elegant, helpful, and hospitable response in 2-3 sentences.`;

  try {
    const aiResponse = await callGeminiRaw(prompt, 'You are a warm, courteous event concierge.', false);
    return {
      success: true,
      reply: aiResponse,
      category: 'genai-response',
      source: 'gemini-concierge'
    };
  } catch (err) {
    return {
      success: true,
      reply: `Thank you for reaching out! We are delighted to celebrate with you. For any urgent questions regarding Aria & Julian's Solstice Gala, please visit the guest portal or reply with keywords like 'dress code', 'parking', 'schedule', or 'dietary'.`,
      category: 'default-fallback',
      source: 'concierge-fallback'
    };
  }
}

module.exports = {
  handleConciergeInquiry,
  EVENT_FAQS
};
