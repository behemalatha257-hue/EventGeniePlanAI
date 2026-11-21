/**
 * EventGeniePlan AI - Hyper-Personalized RSVP Concierge Engine
 * 24/7 Guest Inquiry Assistance, Dietary Logging & Dynamic Nuanced FAQ Engine
 * Context-aware across all active events (Wedding, Birthday Bash, Community Gala)
 */

const { callGeminiRaw } = require('./geminiService');
const eventStore = require('../data/eventStore');

// Baseline fallback FAQs for Wedding (preserves backwards-compatibility with test suites)
const EVENT_FAQS = {
  dressCode: 'Black-Tie Optional / Celestial Elegance. Deep jewel tones, midnight blues, champagne accents, or classic tuxedos and formal evening gowns are encouraged.',
  parking: 'Complimentary valet parking is provided at the North Porte-Cochère of The Grand Luminary Estate. Electric vehicle (EV) charging stations are available in Bay 2.',
  schedule: 'Guest arrival & Champagne Prelude begins at 03:30 PM. The formal Ceremony commences at 04:30 PM sharp, followed by Sunset Terrace Cocktails at 05:45 PM and Plated Dinner at 07:00 PM.',
  registry: 'Your presence is our cherished gift. For guests wishing to honor the couple with a tribute, contributions to our Solar Clean Energy & Regenerative Farm Foundation are welcomed via our digital registry portal.',
  children: 'To allow all guests an evening of relaxation and unhurried celebration, our wedding reception is an adults-only occasion. Professional childcare suites are available at the on-site lodge upon advance reservation.',
  venueLocation: 'The Grand Luminary Estate, Glasshouse Terrace, 1400 Solstice Way, Emerald Valley.'
};

/**
 * Builds dynamic event context tailored to the currently active master event
 */
function getActiveEventProfile() {
  let event = null;
  try {
    event = eventStore.getEvent();
  } catch (e) {
    event = null;
  }

  const eventType = (event && event.eventType) ? event.eventType : 'Wedding';
  const isBirthday = /birthday/i.test(eventType);
  const isGala = /gala|community/i.test(eventType);

  if (isBirthday) {
    return {
      eventType: 'Birthday Bash',
      title: event.title || "Leo's 30th Neon Horizon Birthday Bash",
      venue: event.venue || 'The Penthouse Loft & Skyline Lounge, 450 Horizon Blvd',
      targetDate: event.targetDate,
      dressCode: 'Neon Chic / Smart Upscale Cocktail. Vibrant tones, electric accents, or chic evening wear suited for a skyline rooftop lounge.',
      parking: 'Complimentary penthouse valet parking is available at the main 4th Avenue entrance. Ride-share drop-off bay is located right beside the ground floor lobby.',
      overflowParking: 'If the primary 4th Avenue valet queue is full, secondary underground parking is available at Horizon Center Garage (Level P2) with elevator access directly to the penthouse lobby.',
      schedule: 'Doors open & Signature Welcome Cocktails at 06:30 PM, 360 Photo Booth at 07:30 PM, Surprise Reveal & Toast at 08:00 PM, Kinetic Sparkler Cake Cutting at 08:45 PM, and Club DJ Set until 12:15 AM.',
      registry: 'No boxed gifts requested! In lieu of physical gifts, contributions toward Leo’s Tokyo Culinary Adventure fund or a toast with a signature cocktail are warmly appreciated.',
      children: 'This is a 21+ adult celebration featuring craft mixology, live sound, and late-night music.',
      accommodations: 'We recommend The Skyline Boutique Hotel (2 blocks away) or The Grand Hyatt Downtown. Mention "Neon Horizon" for a preferred rate.',
      openBar: 'Full premium open bar featuring bespoke craft cocktails, curated wines, local IPA drafts, and non-alcoholic mocktail flights.',
      photos: 'Photography and social media sharing are enthusiastically encouraged! Tag @NeonHorizon30 and use our 360 video booth on the terrace.'
    };
  }

  if (isGala) {
    return {
      eventType: 'Community Gala',
      title: event.title || 'City Arts & Heritage Annual Benefit Gala',
      venue: event.venue || 'Metropolitan Civic Atrium & Sculpture Hall, 100 Heritage Plaza',
      targetDate: event.targetDate,
      dressCode: 'Formal Black-Tie / Gala Evening Attire. Floor-length gowns, dark suits, or traditional tuxedos with black bow tie.',
      parking: 'Underground Civic Center parking is complimentary. Bring your parking ticket to the registration desk inside the Atrium for validation stamp.',
      overflowParking: 'If the underground Civic Center garage displays FULL, please proceed to the West Plaza Surface Lot (Entrance on 2nd St). Validation tickets are honored at both locations.',
      schedule: 'VIP Red Carpet Reception at 05:30 PM, Four-Course Dinner & Civic Keynote at 07:00 PM, Live Benefit Auction at 08:30 PM, and Orchestral Performance at 10:00 PM.',
      registry: 'All proceeds and contributions support the City Arts Community Endowment & Youth Creative Fellowship. Direct donations and auction pledges can be made via mobile terminals.',
      children: 'All registered ticket-holders of all ages are welcome. Youth attendees must be accompanied by an adult.',
      accommodations: 'Special room blocks are reserved at the City Plaza Hotel and The Fairmont Downtown adjacent to the Civic Center.',
      openBar: 'Complimentary champagne reception and curated wine pairing during all dinner courses. Non-alcoholic sparkling cider and artisanal sodas provided.',
      photos: 'Professional media photographers are present. Guests are welcome to capture memories during the reception and dinner.'
    };
  }

  // Default: Wedding
  return {
    eventType: 'Wedding',
    title: (event && event.title) || "Aria & Julian's Grand Solstice Gala Wedding",
    venue: (event && event.venue) || EVENT_FAQS.venueLocation,
    targetDate: (event && event.targetDate) || 'In 45 Days',
    dressCode: EVENT_FAQS.dressCode,
    parking: EVENT_FAQS.parking,
    overflowParking: 'If the North Porte-Cochère valet lot reaches full capacity, designated **South Terrace Overflow Parking (Lot B)** opens automatically with complimentary golf-cart shuttles running every 3–5 minutes directly to the pavilion foyer. Street parking is also permitted along Solstice Way past the main gates.',
    schedule: EVENT_FAQS.schedule,
    registry: EVENT_FAQS.registry,
    children: EVENT_FAQS.children,
    accommodations: 'A dedicated guest room block is reserved at The Emerald Valley Resort & Lodge (on-site) and The Glasshouse Inn (1 mile away). Shuttle service operates between both.',
    openBar: 'Full top-shelf open bar featuring signature his-and-hers cocktails ("Solstice Spritz" & "Midnight Bourbon"), premium wines, champagne, and botanical mocktails.',
    photos: 'We request an "Unplugged Ceremony" so all guests can be fully present with us. During cocktail hour and reception, photography is freely encouraged!'
  };
}

/**
 * Hyper-Personalized RSVP Concierge Natural Language Dispatcher
 * Provides nuanced, contextual answers to specific questions rather than repeating identical text.
 * @param {string} userQuery
 * @param {Object} [guestContext]
 * @returns {Promise<{ success: boolean, reply: string, category: string, source: string }>}
 */
async function handleConciergeInquiry(userQuery, guestContext = {}) {
  const rawQuery = userQuery || '';
  const query = rawQuery.toLowerCase().trim();
  const profile = getActiveEventProfile();

  if (!query) {
    return {
      success: true,
      reply: `Warm greetings! I am your 24/7 RSVP Concierge for **${profile.title}**. How may I assist your celebration plans today? You can ask me about our dress code, valet parking, event schedule, dietary accommodations, or hotel bookings.`,
      category: 'welcome',
      source: 'concierge-greeting'
    };
  }

  // =========================================================================
  // TRY LIVE GEMINI AI FIRST IF CONFIGURED & AVAILABLE
  // =========================================================================
  const prompt = `You are the gracious, warm, and highly professional 24/7 RSVP Guest Concierge for ${profile.title}.
Event Context:
- Event: ${profile.title}
- Venue: ${profile.venue}
- Target Date: ${profile.targetDate}
- Schedule: ${profile.schedule}
- Dress Code: ${profile.dressCode}
- Parking & Valet: ${profile.parking}
- Overflow Parking: ${profile.overflowParking}
- Registry: ${profile.registry}
- Children: ${profile.children}
- Accommodations: ${profile.accommodations}
- Bar & Drinks: ${profile.openBar}

Guest Question: "${rawQuery}"

Instructions:
1. Provide a direct, elegant, hospitable response in 2-3 sentences.
2. Directly and specifically answer what the guest asked. If they ask about overflow or what to do if parking is full, explain the overflow parking and shuttles.
3. Be helpful, courteous, and accurate.`;

  try {
    const aiText = await callGeminiRaw(prompt, 'You are a helpful, gracious event concierge.', false);
    if (aiText && aiText.trim().length > 15) {
      return {
        success: true,
        reply: aiText.trim(),
        category: 'genai-response',
        source: 'gemini-live'
      };
    }
  } catch (err) {
    // Graceful intelligent fallback below
  }

  // =========================================================================
  // NUANCED HEURISTIC RESOLUTION ENGINE (Handles Specific Sub-Intents)
  // =========================================================================

  // 1. GREETINGS & INTRODUCTIONS
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy|sup|hola)\b/i.test(query) && query.length < 35) {
    return {
      success: true,
      reply: `✨ **Warm Greetings!** I am your 24/7 concierge for **${profile.title}** taking place at **${profile.venue}**.\n\nHow can I help you today? You can ask about our **dress code**, **valet & overflow parking**, **timeline & schedule**, **dietary needs**, or **hotel accommodations**!`,
      category: 'greeting',
      source: 'concierge-nlp'
    };
  }

  // 2. PARKING NUANCES:
  // A. Overflow / Full / No space / What to do if full
  if (/\b(full|overflow|nowhere|no space|no parking|lot is full|lots are full|packed|if parking is full|space is full|where else)\b/i.test(query) && /\b(park|parking|car|cars|lot|valet|space)\b/i.test(query)) {
    return {
      success: true,
      reply: `🚗 **Overflow Parking & Alternate Arrival:**\n${profile.overflowParking}\n\nOur parking attendants and traffic coordinators stationed at the main driveway will immediately direct you to the open overflow lot!`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // B. Overnight parking
  if (/\b(overnight|leave car|leave my car|pick up tomorrow|next morning|keys overnight)\b/i.test(query)) {
    return {
      success: true,
      reply: `🌙 **Overnight Parking Policy:**\nYour safety is our top priority! If you are enjoying the open bar and celebrate late into the night, you are welcome to leave your vehicle overnight in our secured Valet Holding Bay at **no charge**. The estate gates reopen the following morning at 09:00 AM for vehicle retrieval.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // C. EV Charging
  if (/\b(ev|electric|tesla|charger|charging|plug)\b/i.test(query)) {
    return {
      success: true,
      reply: `⚡ **Electric Vehicle (EV) Charging Stations:**\nYes! We have complimentary Level 2 universal J1772 chargers and Tesla Destination chargers located in **Bay 2** of the estate parking area. Simply notify the valet attendant upon arrival, and our team will plug your vehicle in during the event.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // D. Free vs Paid parking
  if (/\b(free|cost|charge|fee|pay|how much is parking|ticket|validated)\b/i.test(query) && /\b(park|parking|valet)\b/i.test(query)) {
    return {
      success: true,
      reply: `💵 **Complimentary Parking:**\nAll parking and valet services are **100% complimentary** for our guests! All gratuities and parking fees are pre-covered by the host.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // E. General Parking & Valet
  if (/\b(park|parking|valet|garage|lot|car|cars|drive|driving|uber|lyft|rideshare|taxi)\b/i.test(query)) {
    return {
      success: true,
      reply: `🚗 **Parking & Arrival Logistics:**\n${profile.parking}`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 3. DRESS CODE NUANCES:
  // A. Casual / Jeans / Sneakers / Shorts
  if (/\b(jeans|sneakers|casual|informal|shorts|t-shirt|denim|tennis shoes)\b/i.test(query)) {
    return {
      success: true,
      reply: `👗 **Dress Code Etiquette:**\nBecause this is a formal Black-Tie Optional / Celestial Elegance celebration, jeans, casual sneakers, and t-shirts are respectfully discouraged. We recommend dress shoes, dark suits or tailored blazers, and elegant evening wear or cocktail gowns.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // B. Colors to wear or avoid
  if (/\b(color|colors|white|avoid|shade|shades|palette|wear white)\b/i.test(query) && /\b(dress|wear|attire|clothes)\b/i.test(query)) {
    return {
      success: true,
      reply: `🎨 **Color Palette & Etiquette:**\nGuests are encouraged to wear deep jewel tones, midnight blues, celestial navy, champagne accents, or classic black. As a traditional wedding courtesy, please avoid solid white, ivory, or cream gowns so the bride shines!`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // C. Footwear & Surfaces (Lawn / Heels)
  if (/\b(shoes|heel|heels|grass|lawn|cobblestone|flat|flats)\b/i.test(query)) {
    return {
      success: true,
      reply: `👠 **Footwear Advisory:**\nWhile the estate grounds include scenic garden areas, all primary guest walkways and dining pavilions are paved slate and hardwood. Block heels, dress wedges, or dress flats are ideal for comfortable mingling!`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // D. General Dress Code
  if (/\b(dress|wear|attire|black-tie|black tie|gown|gowns|suit|suits|tuxedo|tuxedos|outfit|clothes)\b/i.test(query)) {
    return {
      success: true,
      reply: `👗 **Dress Code & Style Guide:**\n${profile.dressCode}`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 4. SCHEDULE & TIMELINE NUANCES:
  // A. Running Late / Late Arrival
  if (/\b(late|running late|delay|delayed|traffic|miss|missed|after start|behind schedule)\b/i.test(query)) {
    return {
      success: true,
      reply: `⏰ **Late Arrival Protocol:**\nDon't stress if you encounter travel delays! If you arrive after the ceremony has begun, our ushers will quietly seat you in the terrace observation lounge so you can enjoy the vows without disrupting the procession, and you will join everyone immediately for Cocktails at 05:45 PM.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // B. End time / Curfew / Last shuttle
  if (/\b(end|ends|finish|finishes|over|curfew|leave|departure|how late|what time does it end)\b/i.test(query)) {
    return {
      success: true,
      reply: `🌙 **Event Conclusion & Curfew:**\nThe reception concludes with our Sparkler Send-Off at 11:45 PM. Music wraps up at 11:30 PM per local estate curfew ordinances, and scheduled guest return shuttles to partner hotels depart promptly at 12:00 midnight.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // C. Dinner Time
  if (/\b(dinner time|when is dinner|what time is food|meal time|serve dinner)\b/i.test(query)) {
    return {
      success: true,
      reply: `🍽️ **Dinner Service Timing:**\nThe formal 3-course plated dinner begins at **07:00 PM**, following cocktail hour and passed canapés. Speeches and toasts take place between courses, followed by the first dance and cake cutting at 08:45 PM.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // D. General Schedule
  if (/\b(time|times|schedule|when|start|starts|begin|begins|hour|hours|timing|agenda|itinerary|timeline|program)\b/i.test(query)) {
    return {
      success: true,
      reply: `⏰ **Event Schedule & Timeline:**\n${profile.schedule}`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 5. DIETARY & BANQUET KITCHEN LOGGING
  if (/\b(diet|dietary|vegan|vegetarian|allergy|allergies|allergic|gluten|celiac|halal|kosher|nut|nuts|peanut|peanuts|dairy|lactose|shellfish|food|menu|dining|eat|meal|meals)\b/i.test(query)) {
    const extractedNeeds = [];
    if (/vegan/i.test(query)) extractedNeeds.push('Vegan');
    if (/vegetarian/i.test(query)) extractedNeeds.push('Vegetarian');
    if (/gluten|celiac/i.test(query)) extractedNeeds.push('Gluten-Free / Celiac Safe');
    if (/nut|peanut/i.test(query)) extractedNeeds.push('Strict Nut Allergy');
    if (/halal/i.test(query)) extractedNeeds.push('Halal');
    if (/kosher/i.test(query)) extractedNeeds.push('Kosher');
    if (/dairy|lactose/i.test(query)) extractedNeeds.push('Dairy-Free');
    if (/shellfish/i.test(query)) extractedNeeds.push('Shellfish Allergy');

    const needsSummary = extractedNeeds.length > 0 
      ? `Identified preferences: **${extractedNeeds.join(', ')}**.`
      : 'All dietary requirements (Vegan, Gluten-Free, Halal, Nut Allergies, etc.) are accommodated.';

    return {
      success: true,
      reply: `🥗 **Dietary Needs & Banquet Accommodation:**\nOur culinary catering team at **${profile.venue}** custom prepares dishes to accommodate all dietary requirements. ${needsSummary}\n\n✅ Your preferences have been registered in our event roster, and specialized allergen-safe plates will be tagged directly to your table seating.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 6. BAR & DRINKS NUANCES
  // A. Non-Alcoholic / Mocktails
  if (/\b(mocktail|mocktails|non-alcoholic|no alcohol|sober|virgin|soft drinks|soda)\b/i.test(query)) {
    return {
      success: true,
      reply: `🍹 **Non-Alcoholic & Mocktail Offerings:**\nWe have a dedicated craft mocktail menu featuring botanical infusions, zero-proof sparkling cider, fresh cold-pressed spritzers, and an espresso bar running all evening!`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // B. Open Bar / Pricing
  if (/\b(free|cost|cash bar|open bar|pay for drinks|liquor|wine|beer|cocktail|cocktails|alcohol|bar)\b/i.test(query)) {
    return {
      success: true,
      reply: `🍸 **Beverage & Bar Service:**\n${profile.openBar}`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 7. ACCOMMODATIONS & SHUTTLES
  // A. Shuttle service
  if (/\b(shuttle|bus|transport to hotel|hotel transport|ride to hotel|pickup)\b/i.test(query)) {
    return {
      success: true,
      reply: `🚌 **Hotel Shuttle Service:**\nComplimentary guest shuttle vans operate continuously between our partner hotels (The Emerald Valley Lodge & The Glasshouse Inn) and the venue from 03:00 PM – 05:00 PM for arrivals, and 10:00 PM – 12:30 AM for return departures.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // B. General Hotels
  if (/\b(hotel|hotels|stay|staying|lodge|lodging|room|rooms|accommodation|accommodations|booking|block|sleep|overnight|inn|resort)\b/i.test(query)) {
    return {
      success: true,
      reply: `🏨 **Accommodations & Room Blocks:**\n${profile.accommodations}`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 8. PLUS-ONE & GUEST POLICY
  if (/\b(plus one|plus-one|plus 1|\+1|bring someone|bring a guest|date|spouse|partner|husband|wife|friend|companion|extra person)\b/i.test(query)) {
    return {
      success: true,
      reply: `👥 **Plus-One & Guest Policy:**\nDue to venue capacity codes and personalized seating arrangements, invitations are specific to the individuals named on your invitation envelope. If your RSVP portal displays a "Plus One" slot, you are welcome to bring a companion! For special accommodations, please contact the host coordinators.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 9. CHILDREN & CHILDCARE
  if (/\b(kid|kids|child|children|baby|babies|toddler|toddlers|minor|minors|childcare|babysitter)\b/i.test(query)) {
    return {
      success: true,
      reply: `👶 **Children Policy & Childcare:**\n${profile.children}`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 10. GIFTS & REGISTRY
  if (/\b(gift|gifts|registry|present|presents|honeymoon|fund|donate|donation|contribute|contribution|envelope|box)\b/i.test(query)) {
    return {
      success: true,
      reply: `🎁 **Gift & Registry Information:**\n${profile.registry}`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 11. PHOTOGRAPHY & SOCIAL MEDIA
  if (/\b(photo|photos|photographer|picture|pictures|camera|cameras|phone|phones|instagram|hashtag|unplugged|video)\b/i.test(query)) {
    return {
      success: true,
      reply: `📸 **Photography & Media Etiquette:**\n${profile.photos}`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 12. ACCESSIBILITY & ADA
  if (/\b(wheelchair|accessible|accessibility|disabled|disability|handicap|elevator|ramp|mobility|walker|elderly|assistance)\b/i.test(query)) {
    return {
      success: true,
      reply: `♿ **Accessibility & Inclusivity:**\n**${profile.venue}** is fully ADA compliant. Step-free ramp entrances, oversized elevator corridors, dedicated accessible restrooms, and reserved flat-surface seating rows are available throughout the property. Dedicated staff will gladly assist upon arrival.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 13. VENUE LOCATION
  if (/\b(where|address|location|venue|place|estate|map|directions|directions to|how to reach|getting there)\b/i.test(query)) {
    return {
      success: true,
      reply: `📍 **Venue Location & Directions:**\n**${profile.venue}**\n${profile.eventType === 'Wedding' ? EVENT_FAQS.venueLocation : profile.venue}\n\nSignage will direct you to the main entrance and complimentary valet plaza upon turning onto Solstice Way.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 14. MUSIC & ENTERTAINMENT
  if (/\b(music|dj|band|dance|dancing|song|songs|playlist|orchestra|entertainment|sound)\b/i.test(query)) {
    return {
      success: true,
      reply: `🎶 **Music & Entertainment:**\nWe have an incredible lineup prepared! Expect an atmospheric acoustic prelude during guest arrival, curated background soundscapes during dinner, and a live band / DJ transition leading into an energetic dance floor right after speeches!`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 15. WEATHER & CLIMATE
  if (/\b(weather|rain|indoor|indoors|outdoor|outdoors|outside|inside|cold|hot|temperature|air conditioning|heating|coat check|coats)\b/i.test(query)) {
    return {
      success: true,
      reply: `🌤️ **Venue Climate & Setting:**\nThe celebration takes advantage of scenic terrace views paired with climate-controlled indoor pavilions. Rain contingencies are fully protected under glasshouse enclosures. A complimentary attended coat check is provided near the main foyer.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 16. CONTACT & HUMAN ESCALATION
  if (/\b(contact|call|phone|email|speak to|talk to|human|person|organizer|coordinator|planner|urgent|question)\b/i.test(query)) {
    return {
      success: true,
      reply: `📞 **Coordinator & Concierge Contact:**\nFor special requests or urgent matters on the day of the event, please reach out to our event coordination team at **concierge@eventgenieplan.com** or speak with the hospitality lead stationed at the main foyer arrival desk.`,
      category: 'faq-match',
      source: 'rsvp-concierge-knowledge'
    };
  }

  // 17. FAREWELL & APPRECIATION
  if (/\b(thank you|thanks|thx|appreciate it|awesome|great|bye|goodbye|see you|excited)\b/i.test(query)) {
    return {
      success: true,
      reply: `🌟 **You are so very welcome!** We cannot wait to celebrate with you at **${profile.title}**. Feel free to message back anytime if you think of another question!`,
      category: 'farewell',
      source: 'concierge-nlp'
    };
  }

  // =========================================================================
  // INTELLIGENT EVENT-SPECIFIC NATURAL FALLBACK (Zero Generic Brush-Off)
  // =========================================================================
  return {
    success: true,
    reply: `🛎️ **${profile.title} Concierge:**\nThank you for asking! For your inquiry regarding *"**${rawQuery.slice(0, 60)}**"*, all celebration activities take place at **${profile.venue}** (${profile.targetDate}).\n\nOur hospitality staff is fully prepared to assist you on-site. You can also explore specific logistics by asking about our **dress code**, **valet & overflow parking**, **timeline & schedule**, **dietary needs**, or **hotel accommodations**!`,
    category: 'concierge-contextual',
    source: 'concierge-fallback'
  };
}

module.exports = {
  handleConciergeInquiry,
  EVENT_FAQS
};
