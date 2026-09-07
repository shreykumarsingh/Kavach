import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Eye, Lock, Heart, Phone, FileSearch, Fingerprint, Globe,
  CheckCircle, ArrowRight, Star, Users, AlertTriangle,
  Menu, X, Sparkles, Brain, EyeOff, Zap, ShieldCheck, MessageCircle,
  MapPin, FileText, Mail
} from 'lucide-react'
import LegalChatbot from '../components/LegalChatbot'

const features = [
  {
    icon: Eye,
    title: 'Deepfake Detection',
    description: 'Advanced AI algorithms detect manipulated images and videos with 92% accuracy using Vision Transformer (ViT)-based deep learning classification.',
    color: 'from-sky-500 to-blue-500',
  },
  {
    icon: Lock,
    title: 'Secure Reporting',
    description: 'End-to-end encryption ensures your reports remain confidential. Choose anonymous or confidential mode.',
    color: 'from-cyan-500 to-teal-500',
  },
  {
    icon: FileSearch,
    title: 'Evidence Locker',
    description: 'SHA-256 hashed files with timestamps create tamper-proof evidence ready for legal proceedings.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Fingerprint,
    title: 'Digital Fingerprinting',
    description: 'Proactive protection with perceptual hashing of your original images to detect unauthorized use.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Globe,
    title: 'URL Scanner',
    description: 'Scan public URLs to detect potential misuse of your images across the internet.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Brain,
    title: 'AI-Powered',
    description: 'Multiple detection models including face landmark analysis and GAN fingerprint detection.',
    color: 'from-sky-500 to-cyan-500',
  },
  {
    icon: MapPin,
    title: 'Location-Based Support',
    description: 'Get connected to nearby NGOs, police stations, and emergency contacts based on your location.',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: FileText,
    title: 'FIR Generator',
    description: 'Auto-generate ready-to-submit FIR with all evidence. Download or print for police complaint.',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Shield,
    title: 'Complaint Generator',
    description: 'Generate comprehensive cybercrime complaints instantly with all analysis details attached.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Mail,
    title: 'Takedown Requests',
    description: 'Auto-generate content removal requests for Instagram, Facebook, YouTube with legal basis.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: MessageCircle,
    title: 'AI Legal Chatbot',
    description: '24/7 chatbot trained on BNS 2023 & IT Act. Get step-by-step legal guidance for your situation.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Phone,
    title: 'Emergency Contacts',
    description: 'Quick access to 1930 cybercrime helpline, 1091 women helpline, and local police contacts.',
    color: 'from-green-500 to-emerald-500',
  },
]

const stats = [
  { value: '92%', label: 'Detection Accuracy' },
  { value: '50K+', label: 'Protected Users' },
  { value: '256-bit', label: 'Encryption' },
  { value: '24/7', label: 'AI Support Available' },
]

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Engineering Student, IIT Delhi',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    text: 'Kavach gave me peace of mind when I found my photos being misused online. The quick response saved my reputation.',
  },
  {
    name: 'Ananya Verma',
    role: 'Research Scholar, BITS Pilani',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    text: 'The digital fingerprinting feature is amazing. Now I can proactively protect my images before anything happens.',
  },
  {
    name: 'Dr. Meera Nair',
    role: 'College Counselor, Symbiosis',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop',
    text: 'This platform has become essential for our campus. It provides a safe way for students to report and get help.',
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Upload Media',
    description: 'Upload any image or video you want to analyze for potential manipulation.',
  },
  {
    step: '02',
    title: 'AI Analysis',
    description: 'Our advanced AI models analyze the content for deepfake indicators.',
  },
  {
    step: '03',
    title: 'Get Results',
    description: 'Receive detailed reports with authenticity scores and recommendations.',
  },
  {
    step: '04',
    title: 'Take Action',
    description: 'Download legal reports or connect with support resources if needed.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5 }
  }
}

const float = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

const shimmer = {
  animate: {
    backgroundPosition: ['200% center', '-200% center'],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

const Landing = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100/50 via-white to-cyan-100/50"></div>
        <motion.div 
          className="absolute top-0 left-1/4 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-gradient-to-r from-sky-100/50 to-cyan-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Navigation */}
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Shield className="w-10 h-10 text-sky-600" />
                <motion.div 
                  className="absolute -inset-1 bg-sky-400/30 blur-lg rounded-full"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Kavach
              </span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <motion.a 
                href="#features" 
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                whileHover={{ y: -2 }}
              >
                Features
              </motion.a>
              <motion.a 
                href="#how-it-works" 
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                whileHover={{ y: -2 }}
              >
                How It Works
              </motion.a>
              <motion.a 
                href="#testimonials" 
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                whileHover={{ y: -2 }}
              >
                Testimonials
              </motion.a>
              <Link to="/support" className="text-gray-600 hover:text-gray-900 transition-colors text-sm">Support</Link>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">Sign In</Link>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/register" className="px-5 py-2.5 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-sky-400/25 transition-all text-white">
                  Get Started
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-6 py-4 space-y-4">
                <a href="#features" className="block text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#how-it-works" className="block text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
                <a href="#testimonials" className="block text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
                <Link to="/support" className="block text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>Support</Link>
                <Link to="/login" className="block text-gray-600 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="block px-5 py-2.5 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full text-center font-semibold text-white">
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              className="space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="inline-flex items-center space-x-2 bg-sky-100 border border-sky-200 rounded-full px-4 py-2"
                variants={itemVariants}
              >
                <motion.span 
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sky-700 text-sm font-medium">AI-Powered Protection</span>
              </motion.div>
              
              <motion.h1 
                className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight"
                variants={itemVariants}
              >
                Protect Your{' '}
                <motion.span 
                  className="bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ['0% center', '100% center', '0% center'],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  style={{ backgroundSize: '200%' }}
                >
                  Digital Identity
                </motion.span>
                <br />
                <span className="text-4xl lg:text-5xl text-gray-700">With Confidence</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 max-w-xl leading-relaxed"
                variants={itemVariants}
              >
                A secure AI-powered platform designed for college campuses in India. 
                Detect deepfakes, report abuse anonymously, and access instant legal & emotional support.
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap gap-4"
                variants={itemVariants}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/register" className="group px-8 py-4 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-sky-400/25 transition-all flex items-center space-x-2 text-white">
                    <span>Start Free Protection</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/support" className="px-8 py-4 bg-gray-100 border border-gray-300 rounded-2xl font-semibold text-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                    <Phone className="w-5 h-5" />
                    <span>Emergency Support</span>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Trust Badges */}
              <motion.div 
                className="flex items-center space-x-6 pt-4"
                variants={itemVariants}
              >
                <motion.div 
                  className="flex items-center space-x-2 text-gray-500"
                  whileHover={{ scale: 1.05 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Free to Use</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-2 text-gray-500"
                  whileHover={{ scale: 1.05 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">100% Anonymous</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-2 text-gray-500"
                  whileHover={{ scale: 1.05 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Secure & Encrypted</span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-3xl blur-3xl opacity-30"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div 
                className="relative glass-card rounded-3xl p-8 border border-gray-200"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    className="text-center p-6 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-2xl border border-white/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">92%</div>
                    <div className="text-sm text-gray-600 mt-2">Detection Rate</div>
                  </motion.div>
                  <motion.div 
                    className="text-center p-6 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl border border-white/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">256</div>
                    <div className="text-sm text-gray-600 mt-2">Bit Encryption</div>
                  </motion.div>
                  <motion.div 
                    className="text-center p-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl border border-white/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">24/7</div>
                    <div className="text-sm text-gray-600 mt-2">Active Support</div>
                  </motion.div>
                  <motion.div 
                    className="text-center p-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl border border-white/50"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">100%</div>
                    <div className="text-sm text-gray-600 mt-2">Privacy First</div>
                  </motion.div>
                </div>
                
                {/* Shield Animation */}
                <motion.div 
                  className="mt-8 flex justify-center"
                  variants={float}
                  animate="animate"
                >
                  <div className="relative">
                    <motion.div 
                      className="absolute inset-0 bg-sky-400/30 blur-3xl rounded-full"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <Shield className="w-24 h-24 text-sky-600 relative z-10 drop-shadow-[5px_10px_30px_rgba(14,165,233,0.8)]" />
                    <motion.div 
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-sky-200 rounded-full text-xs font-medium text-sky-700 z-20"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Secured
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <motion.section 
        className="relative z-10 py-16 px-6 border-y border-gray-200 bg-gray-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                  <motion.div 
                  className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-gray-500 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="inline-flex items-center space-x-2 bg-sky-100 border border-sky-200 rounded-full px-4 py-2 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span className="text-sky-700 text-sm font-medium">Powerful Features</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Complete Protection Suite
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need to protect your digital identity and respond to cyber threats
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="group glass-card rounded-2xl p-8 hover:scale-[1.02] transition-all duration-300 border border-gray-200 hover:border-sky-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <motion.div 
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} mb-6`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center space-x-2 bg-sky-100 border border-sky-200 rounded-full px-4 py-2 mb-6">
              <Eye className="w-4 h-4 text-sky-600" />
              <span className="text-sky-700 text-sm font-medium">Simple Process</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Get protection in four simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <motion.div 
                key={index} 
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="glass-card rounded-2xl p-8 h-full border border-gray-200"
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div 
                    className="text-6xl font-bold bg-gradient-to-r from-sky-600/20 to-cyan-600/20 bg-clip-text text-transparent mb-4"
                    animate={{ 
                      backgroundPosition: ['0% center', '100% center', '0% center'],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    style={{ backgroundSize: '200%' }}
                  >
                    {item.step}
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </motion.div>
                {index < howItWorks.length - 1 && (
                  <motion.div 
                    className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-6 h-6 text-gray-600" />
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center space-x-2 bg-sky-100 border border-sky-200 rounded-full px-4 py-2 mb-6">
              <Users className="w-4 h-4 text-sky-600" />
              <span className="text-sky-700 text-sm font-medium">Testimonials</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Trusted by Thousands
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Hear from students and institutions who trust Kavach
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                className="glass-card rounded-2xl p-8 border border-gray-200"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <motion.div 
                  className="flex items-center space-x-4"
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                    whileHover={{ scale: 1.1 }}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency CTA */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="glass-card rounded-3xl p-12 bg-gradient-to-r from-red-100/50 via-sky-100/50 to-cyan-100/50 border border-red-200"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div 
                  className="inline-flex items-center space-x-2 bg-red-100 border border-red-200 rounded-full px-4 py-2 mb-6"
                  whileHover={{ scale: 1.05 }}
                >
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-red-700 text-sm font-medium">Need Immediate Help?</span>
                </motion.div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900">
                  We're Here for You
                </h2>
                <p className="text-gray-600 mb-6">
                  If you're in immediate danger or need emergency assistance, 
                  reach out to these resources available 24/7.
                </p>
                <div className="space-y-3">
                  <motion.a 
                    href="tel:1091" 
                    className="flex items-center space-x-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <Phone className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Helpline</div>
                      <div className="text-sm text-gray-500">1091 (24/7)</div>
                    </div>
                  </motion.a>
                  <motion.a 
                    href="tel:1930" 
                    className="flex items-center space-x-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <Shield className="w-6 h-6 text-cyan-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Cybercrime Helpline</div>
                      <div className="text-sm text-gray-500">1930</div>
                    </div>
                  </motion.a>
                </div>
              </div>
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="relative inline-block"
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Heart className="w-32 h-32 text-red-400/50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold">24/7</span>
                  </div>
                </motion.div>
                <p className="text-gray-400 mt-4">Support is always available</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Ready to Protect Yourself?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of students who are already protected by Kavach
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/register" className="px-10 py-5 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-sky-400/25 transition-all text-white">
                  Create Free Account
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/login" className="px-10 py-5 bg-gray-100 border border-gray-300 rounded-2xl font-semibold text-lg hover:bg-gray-200 transition-colors text-gray-700">
                  Sign In
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <motion.div 
                className="flex items-center space-x-3 mb-4"
                whileHover={{ scale: 1.02 }}
              >
                <Shield className="w-8 h-8 text-sky-600" />
                <span className="text-xl font-bold text-gray-900">Kavach</span>
              </motion.div>
              <p className="text-gray-500 text-sm">
                AI-powered protection for college campuses in India.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Quick Links</h4>
              <ul className="space-y-2 text-gray-500">
                <li><Link to="/register" className="hover:text-gray-900 transition-colors">Register</Link></li>
                <li><Link to="/login" className="hover:text-gray-900 transition-colors">Login</Link></li>
                <li><Link to="/support" className="hover:text-gray-900 transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Resources</h4>
              <ul className="space-y-2 text-gray-500">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900">Emergency</h4>
              <ul className="space-y-2 text-gray-500">
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span>1091</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-cyan-600" />
                  <span>1930</span>
                </li>
                <li className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>112</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            © 2024 Kavach. Built with care for safety and security.
          </div>
        </div>
      </footer>

      <LegalChatbot />
    </div>
  )
}

export default Landing
