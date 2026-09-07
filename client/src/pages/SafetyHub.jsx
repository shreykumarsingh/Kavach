import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { safetyAPI } from '../services/api'
import toast from 'react-hot-toast'
import { 
  Shield, Phone, AlertTriangle, Users, FileText, 
  Heart, ExternalLink, ChevronRight, Loader2,
  CheckCircle, X, Plus, Trash2, Edit2, Save,
  BookOpen, Scale, Stethoscope, MapPin, Zap
} from 'lucide-react'

const SafetyHub = () => {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('overview')
  const [contacts, setContacts] = useState([])
  const [resources, setResources] = useState(null)
  const [safetyScore, setSafetyScore] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', relation: 'friend' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [contactsRes, resourcesRes, scoreRes] = await Promise.all([
        safetyAPI.getTrustedContacts(),
        safetyAPI.getSafetyResources(),
        safetyAPI.getSafetyScore(),
      ])
      setContacts(contactsRes.data.contacts || [])
      setResources(resourcesRes.data.resources)
      setSafetyScore(scoreRes.data)
    } catch (error) {
      console.error('Failed to fetch safety data')
    }
  }

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('Name and phone are required')
      return
    }

    setLoading(true)
    try {
      await safetyAPI.addTrustedContact(newContact)
      toast.success('Contact added successfully')
      setShowAddContact(false)
      setNewContact({ name: '', phone: '', email: '', relation: 'friend' })
      fetchData()
    } catch (error) {
      toast.error('Failed to add contact')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async (index) => {
    try {
      await safetyAPI.deleteTrustedContact(index)
      toast.success('Contact removed')
      fetchData()
    } catch (error) {
      toast.error('Failed to remove contact')
    }
  }

  const handleEmergencyAlert = async () => {
    setLoading(true)
    try {
      const result = await safetyAPI.sendEmergencyAlert({
        message: 'Emergency alert from Kavach - I need immediate help!',
      })
      if (result.data.alertsSent?.length > 0) {
        toast.success(`Emergency alert sent to ${result.data.contactsNotified} contacts!`)
      } else {
        toast.error('No alerts sent - check your trusted contacts')
      }
    } catch (error) {
      toast.error('Failed to send emergency alert')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 p-6 shadow-sm">
        <Link to="/" className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-600">Kavach</span>
          </div>
        </Link>
        
        <nav className="space-y-2">
          <Link to="/dashboard" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all">
            <Shield className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/safety" className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl shadow-md">
            <Heart className="w-5 h-5" />
            <span className="font-medium">Safety Hub</span>
          </Link>
          <Link to="/profile" className="flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-xl transition-all">
            <Users className="w-5 h-5" />
            <span>Profile</span>
          </Link>
        </nav>

        {/* Emergency Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleEmergencyAlert}
            disabled={loading || contacts.length === 0}
            className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <span>SOS</span>
              </>
            )}
          </button>
          {contacts.length === 0 && (
            <p className="text-xs text-gray-500 text-center mt-2">Add contacts to enable SOS</p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 p-8 pb-24">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-3 text-gray-900 flex items-center space-x-4">
            <Heart className="w-10 h-10 text-sky-600" />
            <span>Safety Hub</span>
          </h1>
          <p className="text-gray-500 text-lg">Your comprehensive safety toolkit</p>
        </header>

        {/* Safety Score */}
        {safetyScore && (
          <div className="bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Your Safety Score</p>
                <p className="text-5xl font-bold">{safetyScore.score}/100</p>
                <p className="text-white/80 text-sm mt-2">Based on your protection settings</p>
              </div>
              <div className="text-right">
                {safetyScore.recommendations?.map((rec, i) => (
                  <p key={i} className="text-sm bg-white/20 px-3 py-1 rounded-full mb-2">{rec}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => setActiveSection('contacts')}
            className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-sky-300 transition-all text-left"
          >
            <div className="p-3 rounded-xl bg-gradient-to-r from-sky-100 to-cyan-100 w-fit mb-4">
              <Users className="w-8 h-8 text-sky-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Trusted Contacts</h3>
            <p className="text-sm text-gray-500">{contacts.length} contacts</p>
          </button>

          <button
            onClick={() => setActiveSection('helplines')}
            className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all text-left"
          >
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 w-fit mb-4">
              <Phone className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Helplines</h3>
            <p className="text-sm text-gray-500">Emergency numbers</p>
          </button>

          <button
            onClick={() => setActiveSection('legal')}
            className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-cyan-300 transition-all text-left"
          >
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-100 to-blue-100 w-fit mb-4">
              <Scale className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Legal Rights</h3>
            <p className="text-sm text-gray-500">Know your rights</p>
          </button>

          <button
            onClick={() => setActiveSection('steps')}
            className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all text-left"
          >
            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-100 to-yellow-100 w-fit mb-4">
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">What To Do</h3>
            <p className="text-sm text-gray-500">Step-by-step guide</p>
          </button>
        </div>

        {/* Section Content */}
        <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
          {activeSection === 'contacts' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                  <Users className="w-6 h-6 text-sky-600" />
                  <span>Trusted Emergency Contacts</span>
                </h2>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Contact</span>
                </button>
              </div>

              {showAddContact && (
                <div className="rounded-xl p-6 mb-6 bg-sky-50 border border-sky-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Add New Contact</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Name"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className="px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none bg-white"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      className="px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none bg-white"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      className="px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none bg-white"
                    />
                    <select
                      value={newContact.relation}
                      onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                      className="px-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none bg-white"
                    >
                      <option value="family">Family</option>
                      <option value="friend">Friend</option>
                      <option value="guardian">Guardian</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={handleAddContact}
                      disabled={loading}
                      className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {loading ? 'Adding...' : 'Add Contact'}
                    </button>
                    <button
                      onClick={() => setShowAddContact(false)}
                      className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {contacts.length > 0 ? (
                <div className="space-y-3">
                  {contacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-5 rounded-xl bg-sky-50 border border-sky-100 hover:border-sky-300 transition-all">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-500">{contact.phone}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-600 border border-sky-200 capitalize">
                            {contact.relation}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-3 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-all"
                        >
                          <Phone className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleDeleteContact(index)}
                          className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-sky-100 to-cyan-100 rounded-full flex items-center justify-center">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-xl text-gray-600 mb-2">No trusted contacts added yet</p>
                  <p className="text-gray-500">Add contacts who will be notified in emergencies</p>
                </div>
              )}
            </>
          )}

          {activeSection === 'helplines' && resources && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <Phone className="w-6 h-6 text-emerald-600" />
                <span>Emergency Helplines</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {resources.helplines.map((helpline, index) => (
                  <a
                    key={index}
                    href={helpline.url || `tel:${helpline.number}`}
                    className="flex items-center justify-between p-5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{helpline.name}</p>
                        <p className="text-2xl font-bold text-emerald-600">{helpline.number || 'Online'}</p>
                        <p className="text-sm text-gray-500">{helpline.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </a>
                ))}
              </div>
            </>
          )}

          {activeSection === 'legal' && resources && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <Scale className="w-6 h-6 text-cyan-600" />
                <span>Know Your Legal Rights</span>
              </h2>
              <div className="space-y-4">
                {resources.legalRights.map((right, index) => (
                  <div key={index} className="p-4 rounded-xl bg-cyan-50 border-l-4 border-cyan-500">
                    <h3 className="font-semibold text-gray-900">{right.title}</h3>
                    <p className="text-gray-600 mt-1">{right.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 'steps' && resources && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <Zap className="w-6 h-6 text-orange-600" />
                <span>What To Do If You Are a Victim</span>
              </h2>
              <div className="space-y-4">
                {resources.steps.map((step) => (
                  <div key={step.step} className="flex items-start space-x-4 p-4 rounded-xl bg-orange-50 border border-orange-100 hover:border-orange-300 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-white font-bold">{step.step}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <p className="text-gray-600 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mental Health Support */}
        {resources && resources.mentalHealth && (
          <div className="mt-8 rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Stethoscope className="w-6 h-6 text-sky-600 mr-3" />
              Mental Health Support
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {resources.mentalHealth.map((resource, index) => (
                <a
                  key={index}
                  href={`tel:${resource.phone}`}
                  className="p-4 rounded-xl bg-sky-50 border border-sky-100 hover:bg-sky-100 hover:border-sky-300 transition-all"
                >
                  <p className="font-semibold text-gray-900 mb-1">{resource.name}</p>
                  <p className="text-lg font-bold text-sky-600">{resource.phone}</p>
                  <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default SafetyHub