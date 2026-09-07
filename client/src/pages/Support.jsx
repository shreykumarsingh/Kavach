import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Phone, Shield, Heart, BookOpen, ExternalLink, 
  MessageCircle, Mail, MapPin, Clock, AlertTriangle,
  ArrowLeft, FileText, Users, Sparkles
} from 'lucide-react'

const Support = () => {
  const emergencyContacts = [
    {
      icon: Phone,
      title: 'Helpline',
      number: '1091',
      description: '24/7 National Helpline',
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
    },
    {
      icon: Shield,
      title: 'Cybercrime Reporting',
      number: '1930',
      description: 'Cybercrime Helpline',
      gradient: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-100',
      textColor: 'text-cyan-600',
      borderColor: 'border-cyan-200',
    },
    {
      icon: AlertTriangle,
      title: 'Emergency',
      number: '112',
      description: 'Police Emergency Services',
      gradient: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
    },
  ]

  const resources = [
    {
      title: 'National Commission',
      description: 'Official body for rights in India',
      link: 'https://ncw.nic.in',
    },
    {
      title: 'Cybercrime Portal',
      description: 'Report cyber crimes online',
      link: 'https://cybercrime.gov.in',
    },
    {
      title: 'IT Act 2000',
      description: 'India\'s IT law and regulations',
      link: 'https://www.meity.gov.in/content/information-technology-act-2000',
    },
    {
      title: 'Legal Aid India',
      description: 'Free legal services',
      link: 'https://legalaidindia.gov.in',
    },
  ]

  const mentalHealth = [
    {
      title: 'iCall - Tata Institute of Social Sciences',
      phone: '9152987821',
      timing: 'Mon-Sat, 8am-10pm',
      description: 'Free mental health helpline',
    },
    {
      title: 'Vandrevala Foundation Helpline',
      phone: '1860 266 2345',
      timing: '24/7',
      description: 'Mental health support',
    },
    {
      title: 'NIMHANS Helpline',
      phone: '080 4611 0007',
      timing: '24/7',
      description: 'National Institute of Mental Health',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Heart className="w-5 h-5 text-sky-500" />
            <span>Support Resources</span>
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8">
        {/* Emergency Banner */}
        <div className="rounded-2xl p-8 mb-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-100 to-orange-100">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">Need Immediate Help?</h2>
              <p className="text-gray-600 mb-6">
                If you're in immediate danger, please contact emergency services right away.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="tel:1091" className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 flex items-center space-x-2 transition-all shadow-md">
                  <Phone className="w-5 h-5" />
                  <span>Call 1091</span>
                </a>
                <a href="tel:112" className="px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 flex items-center space-x-2 transition-all">
                  <Shield className="w-5 h-5" />
                  <span>Emergency 112</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3 text-gray-900">
            <Phone className="w-7 h-7 text-sky-600" />
            <span>Emergency Contacts</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {emergencyContacts.map((contact, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${contact.gradient} mb-4 shadow-md`}>
                  <contact.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-1 text-gray-900">{contact.title}</h3>
                <p className="text-3xl font-bold mb-2 text-gray-900">{contact.number}</p>
                <p className="text-gray-500 text-sm mb-3">{contact.description}</p>
                {contact.available && (
                  <span className="inline-flex items-center space-x-2 text-emerald-600 text-sm font-medium">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>Available 24/7</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Mental Health Support */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3 text-gray-900">
            <Heart className="w-7 h-7 text-sky-600" />
            <span>Mental Health Support</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {mentalHealth.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-sky-200 transition-all"
              >
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-sm mb-3">{item.description}</p>
                <a
                  href={`tel:${item.phone}`}
                  className="block text-sky-600 font-semibold mb-1 hover:text-sky-700 transition-colors"
                >
                  {item.phone}
                </a>
                <p className="text-sm text-gray-500 flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{item.timing}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Legal Resources */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3 text-gray-900">
            <BookOpen className="w-7 h-7 text-cyan-600" />
            <span>Legal Resources</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {resources.map((resource, index) => (
              <a
                key={index}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl p-5 flex items-center justify-between bg-white border border-gray-200 hover:bg-cyan-50 hover:border-cyan-300 transition-all shadow-sm group"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-gray-500">{resource.description}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-cyan-600 transition-colors" />
              </a>
            ))}
          </div>
        </section>

        {/* College Support */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-3 text-gray-900">
            <Users className="w-7 h-7 text-emerald-600" />
            <span>College Support</span>
          </h2>
          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm">
            <p className="text-gray-600 mb-6">
              Your college has an Internal Complaints Committee (ICC) as mandated by the 
              Sexual Harassment of Individuals at Workplace (Prevention, Prohibition and Redressal) Act, 2013.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <h4 className="font-semibold mb-2 text-gray-900">Contact Your ICC</h4>
                <p className="text-gray-600 text-sm">
                  Reach out to your college's ICC for any harassment-related complaints. 
                  They are required to respond within 7 days.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-100">
                <h4 className="font-semibold mb-2 text-gray-900">College Counselor</h4>
                <p className="text-gray-600 text-sm">
                  Your college provides free counseling services. Contact your student 
                  affairs office for more information.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Note */}
        <div className="rounded-2xl p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
              <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-900">Your Privacy is Protected</h4>
              <p className="text-gray-600 text-sm">
                All information shared through this platform is treated with strict confidentiality. 
                We do not share your personal information with anyone without your explicit consent. 
                You can choose to report anonymously, and your identity will never be revealed to 
                the accused party.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Support