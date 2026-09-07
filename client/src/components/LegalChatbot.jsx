import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Scale, AlertTriangle, Loader2, ChevronDown, Phone, Shield } from 'lucide-react'
import { legalChatbotAPI } from '../services/api'

const LEGAL_SECTIONS = {
  bns_66e: {
    section: "BNS Section 66E",
    title: "Violation of Privacy",
    punishment: "Imprisonment up to 3 years and fine",
    description: "Whoever intentionally captures, publishes or transmits the image of a private area of any person without his or her consent, or threatens to do so, shall be punished."
  },
  bns_66d: {
    section: "BNS Section 66D",
    title: "Cheating by Personation",
    punishment: "Imprisonment up to 3 years and fine",
    description: "Whoever, by means of any communication device or computer resource, cheats by personation shall be punished."
  },
  bns_66c: {
    section: "BNS Section 66C",
    title: "Identity Fraud",
    punishment: "Imprisonment up to 3 years and fine",
    description: "Whoever, secretly or stealthily, obtains or sells or transfers any identity document of another person shall be punished."
  },
  bns_66a: {
    section: "BNS Section 66A (Repealed)",
    title: "Information Technology Act Section 66A",
    punishment: "Imprisonment up to 3 years and fine",
    description: "Sending offensive messages through communication service etc. (Note: Section 66A was struck down by Supreme Court in 2015, but similar provisions exist under BNS)"
  },
  it_act_66e: {
    section: "IT Act Section 66E",
    title: "Violation of Privacy",
    punishment: "Imprisonment up to 3 years and fine",
    description: "Whoever intentionally captures, publishes or transmits the image of a private area of any person without his or her consent under circumstances violating privacy."
  },
  it_act_66c: {
    section: "IT Act Section 66C",
    title: "Identity Theft",
    punishment: "Imprisonment up to 3 years and fine",
    description: "Whoever fraudulently or dishonestly makes use of the electronic signature, password or any other unique identification feature of any other person."
  },
  it_act_66d: {
    section: "IT Act Section 66D",
    title: "Cheating by Personation",
    punishment: "Imprisonment up to 3 years and fine",
    description: "Whoever cheats by personation using computer resource shall be punished."
  },
  it_act_67: {
    section: "IT Act Section 67",
    title: "Publishing Obscene Material",
    punishment: "Imprisonment up to 5 years and fine up to 10 lakh",
    description: "Whoever publishes or transmits or causes to be published or transmitted in the electronic form any obscene material."
  },
  it_act_67a: {
    section: "IT Act Section 67A",
    title: "Publishing Sexually Explicit Material",
    punishment: "Imprisonment up to 7 years and fine up to 10 lakh",
    description: "Whoever publishes or transmits or causes to be published or transmitted in the electronic form any material which contains sexually explicit act."
  },
  it_act_72: {
    section: "IT Act Section 72",
    title: "Breach of Confidentiality",
    punishment: "Imprisonment up to 2 years and fine",
    description: "Whoever secures access to any electronic record, book, register, correspondence, information, document or other material without consent."
  },
  it_act_72a: {
    section: "IT Act Section 72A",
    title: "Disclosure of Information",
    punishment: "Imprisonment up to 3 years and fine",
    description: "Whoever discloses to any other person any material or information obtained by him while providing services under any lawful contract."
  },
  bns_64: {
    section: "BNS Section 64",
    title: "Public Nuisance",
    punishment: "Fine up to 200 rupees",
    description: "Whoever commits a public nuisance shall be punished with fine."
  },
  bns_351: {
    section: "BNS Section 351",
    title: "Assault",
    punishment: "Imprisonment up to 1 year or fine up to 1000 rupees",
    description: "Whoever makes any gesture, or any preparation intending or knowing it to be likely that such gesture or preparation will cause a woman to apprehend that the person making it intends to have sexual intercourse with her."
  }
}

const QUESTION_PATTERNS = {
  deepfake: {
    keywords: ['deepfake', 'fake image', 'morphed photo', 'ai generated', 'face swap', 'ai photo', 'डीपफेक', 'फर्जी फोटो', 'एआई फोटो', 'चेहरा बदला', 'editable photo', 'morphed', 'ai video', 'फर्जी वीडियो', 'फोटो बदला', 'edited photo'],
    response: "For deepfake or AI-manipulated images without consent:",
    sections: ['bns_66e', 'it_act_66e', 'bns_66d', 'it_act_66d', 'it_act_67a'],
    steps: [
      "1. Screenshot the deepfake image and collect evidence (take photos with your phone)",
      "2. Note the URL/website where the image is posted",
      "3. Note the account name/phone number of the person who posted it",
      "4. Report to the platform (Instagram/Facebook/etc.) using their reporting tool",
      "5. File complaint on cybercrime.gov.in",
      "6. Call 1930 for assistance",
      "7. Visit nearest police station with all evidence",
      "8. Consult a lawyer for further legal action"
    ]
  },
  privacy: {
    keywords: ['privacy', 'private photo', 'private image', 'leaked photo', 'leaked image', 'breach', 'my photo', 'प्राइवेसी', 'प्राइवेट फोटो', 'प्राइवेट वीडियो', 'प्राइवेट फोटो लीक', 'मेरी फोटो', 'prIVATE', 'PRIVATE', 'निजी फोटो', 'निजी वीडियो', 'फोटो लीक', 'लीक'],
    response: "For privacy violation (unauthorized sharing of private photos):",
    sections: ['bns_66e', 'it_act_66e', 'it_act_72', 'it_act_72a'],
    steps: [
      "1. Don't delete any messages - they are evidence",
      "2. Take screenshots of the shared content",
      "3. Note the date/time when the photo was shared",
      "4. Report to the platform where it was posted",
      "5. File complaint at cybercrime.gov.in",
      "6. Call 1930 for immediate assistance",
      "7. File FIR at nearest police station",
      "8. Consult a lawyer for legal notice"
    ]
  },
  harassment: {
    keywords: ['harassment', 'harassing', 'bullying', 'torment', 'trouble', 'bother', 'threatening', 'परेशान', 'धमकी', 'धमकाना', 'झूठी शिकायत', 'फब्रूरी', 'बदतमीद', 'गाली', 'गाली गलौज', 'अभद्र', 'मानसिक प्रताड़ना', 'taunting', 'disturb'],
    response: "For cyber harassment:",
    sections: ['bns_66e', 'it_act_66e', 'bns_66d', 'it_act_66d'],
    steps: [
      "1. Screenshot all abusive messages/threats",
      "2. Note the harasser's account details",
      "3. Block the harasser on all platforms",
      "4. Report to the social media platform",
      "5. File complaint on cybercrime.gov.in",
      "6. Visit police station and file written complaint",
      "7. Apply for protection order from court",
      "8. Keep all evidence safely"
    ]
  },
  identity_theft: {
    keywords: ['identity theft', 'fake account', 'impersonation', 'stolen identity', 'cloned', 'fake profile', 'फर्जी अकाउंट', 'नकली प्रोफाइल', 'पहचान चोरी', 'impersonate', 'मेरा नाम', 'बनाकर', 'नाम से', 'account banaya', 'id clone', 'नकली आईडी'],
    response: "For identity theft or impersonation:",
    sections: ['bns_66c', 'it_act_66c', 'bns_66d', 'it_act_66d'],
    steps: [
      "1. Screenshot the fake account/profile",
      "2. Note all posts made using your identity",
      "3. Report fake account to the platform (Report as 'Impersonation')",
      "4. File complaint on cybercrime.gov.in",
      "5. Visit police station with ID proof showing you are the real person",
      "6. Get FIR copy for documentation",
      "7. Notify your bank/credit card companies if financial info was used",
      "8. Consult lawyer for legal action against the imposter"
    ]
  },
  social_media: {
    keywords: ['facebook', 'instagram', 'whatsapp', 'twitter', 'youtube', 'social media', 'online', 'post', 'ट्विटर', 'फेसबुक', 'इंस्टाग्राम', 'व्हाट्सएप', 'सोशल मीडिया', 'पोस्ट', 'story', 'status', 'ट्रोलिंग', 'ऑनलाइन', 'ग्रुप'],
    response: "For issues related to social media platforms:",
    sections: ['it_act_66d', 'it_act_67', 'it_act_67a', 'bns_66e'],
    steps: [
      "1. Go to the post and click 'Report' button",
      "2. Select appropriate reason ( harassment/ impersonation/ inappropriate content)",
      "3. Take screenshot of the report confirmation",
      "4. If no action in 24 hours, file on cybercrime.gov.in",
      "5. Call 1930 for urgent assistance",
      "6. If the person is known, send legal notice",
      "7. File police complaint as backup",
      "8. Keep all evidence documented"
    ]
  },
  obscene: {
    keywords: ['obscene', 'explicit', 'adult', 'pornography', 'nude', 'sexual', 'vulgar', 'अश्लील', 'वर्सट', 'पॉर्न', 'आपत्तिजनक', 'videos', 'hot video', 'अर्धनग्न', 'gore', 'गंदी', 'फोटो'],
    response: "For publishing obscene or explicit content:",
    sections: ['it_act_67', 'it_act_67a', 'bns_66e'],
    steps: [
      "1. Don't share or forward the content - it adds to the crime",
      "2. Screenshot the content immediately",
      "3. Note the URL and account details",
      "4. Report to the platform on emergency basis",
      "5. File complaint on cybercrime.gov.in immediately",
      "6. Call 1930 - this is urgent",
      "7. Visit police station for FIR",
      "8. This is a serious offense - get legal help immediately"
    ]
  },
  blackmail: {
    keywords: ['blackmail', 'extortion', 'threat', 'demand money', 'pay', 'threaten', 'blackmailing', 'चैनल', 'black mail', 'मांग रहा', 'पैसे मांग', 'धमकी दे', 'मेरी फोटो', 'video दिखाओगे', 'शेयर कर दूंगा', 'पैसे दो', 'रुपये दो', 'डरा', 'डराकर'],
    response: "For blackmail or extortion using images:",
    sections: ['bns_66e', 'bns_66d', 'it_act_66e', 'it_act_66d', 'it_act_72a'],
    steps: [
      "1. DO NOT PAY ANY MONEY - this will never stop",
      "2. Save all blackmail messages (screenshot everything)",
      "3. Note the blackmailer's contact details",
      "4. Don't delete any communication",
      "5. File complaint on cybercrime.gov.in immediately",
      "6. Call 1930 for emergency help",
      "7. Go to police station and file FIR",
      "8. Get lawyer to send legal notice to blackmailer",
      "9. The blackmailer can be charged under multiple sections"
    ]
  },
  stalking: {
    keywords: ['stalking', 'follow', 'track', 'monitor', 'watch', 'following', 'फॉलो', 'ट्रैक', 'पीछे पड़', 'follow कर', 'नजर रख', 'बार बार मैसेज', 'call आना', 'पीछा', 'घूर', 'ताकना'],
    response: "For cyber stalking:",
    sections: ['bns_66e', 'it_act_66e', 'it_act_72a'],
    steps: [
      "1. Screenshot all messages/monitoring attempts",
      "2. Block the stalker on all platforms",
      "3. Don't respond to any messages",
      "4. Report to cybercrime.gov.in",
      "5. File complaint at police station",
      "6. Apply for protection order from court",
      "7. If you know the person, file for restraining order",
      "8. Inform family members for safety"
    ]
  },
  revenge_porn: {
    keywords: ['revenge porn', 'ex partner', 'former boyfriend', 'former girlfriend', 'breakup', 'ex', 'ब्रेकअप', 'भाई', 'गर्लफ्रेंड', 'बॉयफ्रेंड', 'प्रेम', 'affair', 'relationship', 'रिलेशनशिप', 'तोड़ दिया', 'ब्रेक', 'exposed', 'वीडियो शेयर', 'गर्लफ्रेंड ने', 'बॉयफ्रेंड ने'],
    response: "For revenge porn or unauthorized sharing after breakup:",
    sections: ['bns_66e', 'it_act_66e', 'it_act_67a', 'bns_66d'],
    steps: [
      "1. Don't contact the ex - let lawyer handle communication",
      "2. Screenshot all shared content immediately",
      "3. Note when the content was posted",
      "4. Report to all platforms where it's posted",
      "5. File complaint on cybercrime.gov.in",
      "6. Call 1930 for urgent help",
      "7. File FIR at police station",
      "8. Even if you shared the photo willingly before, sharing without consent is illegal",
      "9. Get a lawyer to send legal notice"
    ]
  },
  child: {
    keywords: ['child', 'minor', 'kids', 'children', 'young', 'student', 'बच्चा', 'बच्चों', 'नाबालिग', 'छोटा', 'बच्ची', 'लड़की', 'लड़का', 'school', 'कॉलेज', 'स्टूडेंट', 'मासूम', 'bacche', 'bacchi'],
    response: "For child-related cyber crimes:",
    sections: ['it_act_67', 'it_act_67a', 'bns_66e'],
    steps: [
      "1. This is extremely serious - act immediately",
      "2. Don't forward or share the content (it's also a crime)",
      "3. Screenshot the content as evidence",
      "4. Report to cybercrime.gov.in with 'Child Abuse' option",
      "5. Call 1930 immediately",
      "6. Contact National Commission for Protection of Child Rights (NCPCR)",
      "7. This is cognizable and non-bailable offense",
      "8. Get legal help immediately - the offender can get up to 7 years imprisonment"
    ]
  },
  defamation: {
    keywords: ['defamation', 'defame', 'fake news', 'rumor', 'character assassination', 'bad name', 'बदनामी', 'बदनाम', 'झूठी खबर', 'अफवाह', 'rumours', 'गलत जानकारी', 'इज्जत खराब', 'नाम खराब', 'मानहानि', 'अपमान', 'shame', 'बुरा'],
    response: "For defamation through digital means:",
    sections: ['bns_356', 'it_act_66e'],
    steps: [
      "1. Screenshot all defamatory posts/messages",
      "2. Note the reach (shares, views) of the content",
      "3. Send legal notice to the person via email/post",
      "4. Ask for written apology and removal",
      "5. If no response in 15 days, file civil suit for defamation",
      "6. Also file complaint under IT Act for harassment",
      "7. Consult a lawyer for damages claim",
      "8. Document your reputation damage with evidence"
    ]
  },
  hacking: {
    keywords: ['hack', 'hacking', 'unauthorized access', 'breach', 'compromised', 'hacked', 'हैक', 'हैकिंग', 'अकाउंट खुला', 'password बदल', 'लॉगिन', 'access', 'data breach', 'चोरी', 'डेटा'],
    response: "For unauthorized access or hacking:",
    sections: ['it_act_66', 'it_act_66b', 'it_act_72', 'it_act_72a'],
    steps: [
      "1. Change all passwords immediately",
      "2. Enable two-factor authentication everywhere",
      "3. Note what was accessed/changed",
      "4. Screenshot any suspicious activity",
      "5. File complaint on cybercrime.gov.in",
      "6. Report to police with all evidence",
      "7. If money stolen, notify your bank",
      "8. Get forensic investigation done if needed",
      "9. Consult cyber law expert"
    ]
  },
  fraud: {
    keywords: ['fraud', 'scam', 'cheating', 'fake', 'fraudulent', 'money', 'transaction', 'फ्रॉड', 'ठगी', 'घोटाला', 'scammer', 'ठग', 'चोरी', 'लूट', 'रुपये गए', 'UPI', 'bank', 'account debit', 'गबर', 'खाता', 'धोखाधड़ी'],
    response: "For online fraud or scam:",
    sections: ['bns_318', 'bns_66d', 'it_act_66d', 'it_act_66c'],
    steps: [
      "1. Note transaction ID and bank details used",
      "2. Screenshot all messages from scammer",
      "3. Contact your bank immediately to freeze transaction",
      "4. File complaint on cybercrime.gov.in",
      "5. Call 1930 for urgent action",
      "6. File FIR at police station",
      "7. Provide all evidence to police",
      "8. Follow up with police weekly",
      "9. If amount is large, hire a lawyer"
    ]
  },
  default: {
    keywords: [],
    response: "I'm not sure I understand your exact situation. Could you provide more details?\n\nHere are some examples of what I can help with:\n\n• Someone shared your private photo/video online\n• You're being blackmailed with personal content\n• A fake account was created in your name\n• You're receiving threatening messages online\n• Your social media account was hacked\n• You were scammed online\n\nPlease describe your situation in more detail:",
    sections: [],
    steps: []
  }
}

const findMatchingPattern = (query) => {
  const lowerQuery = query.toLowerCase()
  const cleanQuery = lowerQuery.replace(/[^\w\s]/g, ' ')
  
  for (const [key, value] of Object.entries(QUESTION_PATTERNS)) {
    if (key !== 'default') {
      for (const keyword of value.keywords) {
        const cleanKeyword = keyword.toLowerCase()
        if (cleanQuery.includes(cleanKeyword) || cleanQuery.split(/\s+/).some(word => word.includes(cleanKeyword) || cleanKeyword.includes(word))) {
          return value
        }
      }
    }
  }
  
  return QUESTION_PATTERNS.default
}

const generateResponse = (userQuery) => {
  const pattern = findMatchingPattern(userQuery)
  
  const sections = pattern.sections.map(sectionKey => LEGAL_SECTIONS[sectionKey]).filter(Boolean)
  const lowerQuery = userQuery.toLowerCase()
  
  const emergencyKeywords = ['deepfake', 'revenge porn', 'child', 'blackmail', 'obscene', 'डीपफेक', 'ब्लैकमेल', 'चाइल्ड', 'अश्लील', 'blackmailing']
  const emergencyWarning = pattern !== QUESTION_PATTERNS.default || emergencyKeywords.some(k => lowerQuery.includes(k))
  
  return {
    response: pattern.response,
    sections: sections,
    steps: pattern.steps || [],
    emergencyWarning: emergencyWarning && ['deepfake', 'revenge porn', 'blackmail', 'obscene', 'child', 'डीपफेक', 'ब्लैकमेल', 'चाइल्ड', 'अश्लील'].some(k => lowerQuery.includes(k))
  }
}

const LegalChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Namaste! I'm your AI Legal Assistant.\n\nI can help you with India's BNS 2023 and IT Act 2000. You can write in Hindi or English - I can understand both.\n\nTell me about your issue:\n\n• Private photo/video leaked online\n• Fake account created in your name\n• Being blackmailed with photos/videos\n• Online threats or harassment\n• Hacking/account compromised\n• Online fraud/scam\n\nEmergency: Call 1930 (Cybercrime Helpline)\n\nNote: This is general information only. For specific legal advice, please consult a lawyer.",
      sections: [],
      emergencyWarning: false
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    const localFallback = generateResponse(userMessage)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const response = await legalChatbotAPI.chat(userMessage, history)
      
      const hasResponse = response && response.response && !response.error
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: hasResponse ? response.response : localFallback.response,
        bnsSections: response?.bns_sections || [],
        itActSections: response?.it_act_sections || [],
        sections: (response?.relevant_sections && response.relevant_sections.length > 0) ? response.relevant_sections : localFallback.sections,
        categories: response?.detected_categories || [],
        severity: response?.severity || (localFallback.emergencyWarning ? 'High' : 'Medium'),
        platforms: response?.platforms || [],
        threatIndicators: response?.threatIndicators || [],
        immediateActions: response?.immediateActions || [],
        steps: localFallback.steps || [],
        emergencyWarning: (response?.emergency_warning !== undefined) ? response.emergency_warning : localFallback.emergencyWarning
      }])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: localFallback.response,
        bnsSections: [],
        itActSections: [],
        sections: localFallback.sections || [],
        categories: [],
        severity: localFallback.emergencyWarning ? 'High' : 'Medium',
        steps: localFallback.steps || [],
        emergencyWarning: localFallback.emergencyWarning
      }])
    }
    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickQuestions = [
    "Someone shared my private photo online without my consent",
    "A fake account was created on social media using my name",
    "I'm being blackmailed with my personal photos",
    "Someone is harassing me with threatening messages online"
  ]

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
      >
        <MessageCircle className="w-7 h-7 text-white" />
        <motion.span
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Scale className="w-3 h-3 text-white" />
        </motion.span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Legal Chatbot</h3>
                  <p className="text-white/80 text-xs">BNS 2023 • IT Act 2000</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-700 font-medium">Emergency:</span>
              </div>
              <div className="flex space-x-3 text-xs">
                <a href="tel:1091" className="text-red-600 font-medium hover:underline">1091</a>
                <a href="tel:1930" className="text-red-600 font-medium hover:underline">1930</a>
                <a href="tel:112" className="text-red-600 font-medium hover:underline">112</a>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-800">For general information only. Consult a lawyer for legal advice.</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    
                    {message.severity && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          message.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                          message.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                          message.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          Severity: {message.severity}
                        </span>
                        {message.categories?.length > 0 && message.categories.map((cat, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                            {cat.type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {message.immediateActions?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        <p className="text-xs font-semibold mb-2 opacity-80">⚡ Immediate Actions:</p>
                        <div className="space-y-1">
                          {message.immediateActions.slice(0, 5).map((action, idx) => (
                            <p key={idx} className="text-xs text-gray-700 bg-gray-50 rounded p-1.5 flex items-start gap-1">
                              <span className="font-bold">{action.priority}.</span>
                              {action.action}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {message.steps && message.steps.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        <p className="text-xs font-semibold mb-2 opacity-80">📝 Step-by-Step Procedure:</p>
                        <div className="space-y-1">
                          {message.steps.map((step, idx) => (
                            <p key={idx} className="text-xs text-gray-700 bg-gray-50 rounded p-1.5">{step}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {(message.bnsSections?.length > 0 || message.itActSections?.length > 0) && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        <p className="text-xs font-semibold mb-2 opacity-80">📜 Relevant Legal Sections:</p>
                        
                        {message.bnsSections?.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-bold text-blue-700 mb-1">Bhartiya Nyaya Sanhita (BNS) 2023:</p>
                            <div className="space-y-2">
                              {message.bnsSections.map((section, idx) => (
                                <div key={`bns-${idx}`} className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                                  <p className="text-xs font-bold text-blue-800">{section.section}</p>
                                  {section.title && <p className="text-xs text-blue-700 font-medium">{section.title}</p>}
                                  {section.applicability && <p className="text-xs text-blue-600 mt-1">→ {section.applicability}</p>}
                                  {section.punishment && <p className="text-xs font-semibold text-blue-600 mt-1">📋 {section.punishment}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {message.itActSections?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-green-700 mb-1">Information Technology (IT) Act 2000:</p>
                            <div className="space-y-2">
                              {message.itActSections.map((section, idx) => (
                                <div key={`it-${idx}`} className="bg-green-50 rounded-lg p-2 border border-green-100">
                                  <p className="text-xs font-bold text-green-800">{section.section}</p>
                                  {section.title && <p className="text-xs text-green-700 font-medium">{section.title}</p>}
                                  {section.applicability && <p className="text-xs text-green-600 mt-1">→ {section.applicability}</p>}
                                  {section.punishment && <p className="text-xs font-semibold text-green-600 mt-1">📋 {section.punishment}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {message.sections?.length > 0 && !message.bnsSections && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        <p className="text-xs font-semibold mb-2 opacity-80">📜 Relevant Legal Sections:</p>
                        <div className="space-y-2">
                          {message.sections.map((section, idx) => (
                            <div key={idx} className="bg-purple-50 rounded-lg p-2 border border-purple-100">
                              <p className="text-xs font-bold text-purple-800">{section.section}</p>
                              {section.title && <p className="text-xs text-purple-700 font-medium">{section.title}</p>}
                              {section.description && <p className="text-xs text-purple-700 mt-1">{section.description}</p>}
                              {section.applicability && <p className="text-xs text-purple-600 mt-1">→ {section.applicability}</p>}
                              {section.punishment && <p className="text-xs font-semibold text-purple-600 mt-1">📋 {section.punishment}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.emergencyWarning && (
                      <div className="mt-3 pt-3 border-t border-red-300/50">
                        <p className="text-xs font-semibold text-red-600">⚠️ URGENT - Follow These Steps:</p>
                        <div className="text-xs text-red-500 mt-1 space-y-1">
                          <p>1. DON'T delete any evidence</p>
                          <p>2. Screenshot everything immediately</p>
                          <p>3. Call 1930 NOW</p>
                          <p>4. File complaint at cybercrime.gov.in</p>
                          <p>5. Visit nearest police station</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                      <span className="text-sm text-gray-500">Analyzing your situation...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(q)
                      }}
                      className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your situation..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default LegalChatbot
