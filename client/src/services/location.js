const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

export const geocodeLocation = async (locationQuery) => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=1&countrycodes=in`,
      {
        headers: {
          'User-Agent': 'NaariKavach/1.0'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Geocoding failed')
    }
    
    const data = await response.json()
    
    if (data && data.length > 0) {
      const result = data[0]
      return {
        success: true,
        data: {
          displayName: result.display_name,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          city: result.address?.city || result.address?.town || result.address?.village || result.address?.county || '',
          state: result.address?.state || '',
          country: result.address?.country || 'India',
          postcode: result.address?.postcode || ''
        }
      }
    }
    
    return { success: false, error: 'Location not found' }
  } catch (error) {
    console.error('Geocoding error:', error)
    return { success: false, error: error.message }
  }
}

export const reverseGeocode = async (lat, lon) => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'NaariKavach/1.0'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed')
    }
    
    const data = await response.json()
    
    return {
      success: true,
      data: {
        displayName: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        country: data.address?.country || 'India'
      }
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return { success: false, error: error.message }
  }
}

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const reverseResult = await reverseGeocode(latitude, longitude)
        if (reverseResult.success) {
          resolve({
            success: true,
            data: {
              ...reverseResult.data,
              lat: latitude,
              lon: longitude
            }
          })
        } else {
          resolve({
            success: true,
            data: {
              displayName: `${latitude}, ${longitude}`,
              lat: latitude,
              lon: longitude,
              city: '',
              state: '',
              country: 'India'
            }
          })
        }
      },
      (error) => {
        reject(error)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

const NGO_DATABASE = {
  all: [
    {
      name: "Women Helpline - Ministry of Women & Child",
      description: "National helpline for women facing violence",
      phone: "1800-114-114",
      type: "women_safety",
      isGovernment: true,
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Ministry+of+Women+and+Child+Development+Delhi"
    },
    {
      name: "Cyber Crime Investigation Cell",
      description: "Government cybercrime reporting and support",
      phone: "1930",
      type: "cyber_safety",
      isGovernment: true,
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cyber+Crime+Police+Station+India"
    },
    {
      name: "National Legal Services Authority",
      description: "Free legal aid for women and cybercrime victims",
      phone: "1800-11-4000",
      type: "legal_aid",
      isGovernment: true,
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Legal+Services+Authority+New+Delhi"
    },
    {
      name: "National Commission for Women",
      description: "Statutory body for women rights",
      phone: "011-2323-4188",
      type: "legal_aid",
      isGovernment: true,
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Commission+for+Women+New+Delhi"
    },
    {
      name: "Mahila Police Station",
      description: "Women-specific police assistance",
      phone: "1091",
      type: "women_safety",
      isGovernment: true,
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mahila+Police+Station"
    }
  ],
  mumbai: [
    {
      name: "Majlis Manch",
      description: "Legal and social support for women in Mumbai",
      phone: "022-2282-7355",
      type: "women_safety",
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Majlis+Manch+Mumbai"
    },
    {
      name: "Mumbai Police Women Helpline",
      description: "24/7 women safety assistance in Mumbai",
      phone: "022-2642-2000",
      type: "women_safety",
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mumbai+Police+Women+Cell",
      isGovernment: true
    },
    {
      name: "Maharashtra State Legal Services Authority",
      description: "Free legal aid in Maharashtra",
      phone: "022-2369-6000",
      type: "legal_aid",
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Maharashtra+State+Legal+Services+Authority+Mumbai",
      isGovernment: true
    },
    {
      name: "Cyber Crime Police Station Mumbai",
      description: "Cybercrime reporting in Mumbai",
      phone: "022-2640-2200",
      type: "cyber_safety",
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cyber+Crime+Police+Mumbai",
      isGovernment: true
    },
    {
      name: "Sahayog Foundation",
      description: "Women empowerment and support in Mumbai",
      phone: "022-2611-2222",
      type: "women_safety"
    }
  ],
  pune: [
    {
      name: "Sakhi - Women Support Pune",
      description: "Women safety and counseling in Pune",
      phone: "020-2644-5555",
      type: "women_safety"
    },
    {
      name: "Pune Police Women Cell",
      description: "Women assistance and safety in Pune",
      phone: "020-2636-3030",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Maharashtra Legal Services Pune",
      description: "Free legal aid in Pune",
      phone: "020-2605-1100",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Pune",
      description: "Cybercrime reporting in Pune",
      phone: "020-2642-3333",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Mahila Suraksha Pune",
      description: "Women protection services in Pune",
      phone: "020-2421-1111",
      type: "women_safety"
    }
  ],
  delhi: [
    {
      name: "Delhi Commission for Women",
      description: "DCW - Women safety and support services in Delhi",
      phone: "011-23317979",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Delhi Police Women Helpline",
      description: "24/7 women safety assistance in Delhi",
      phone: "011-2349-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Delhi State Legal Services Authority",
      description: "Free legal aid in Delhi",
      phone: "011-2332-3000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Delhi",
      description: "Cybercrime reporting in Delhi",
      phone: "011-2306-1490",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Sakshi - Violence Prevention",
      description: "Counseling and support for women in Delhi",
      phone: "011-4060-2222",
      type: "women_safety"
    }
  ],
  bangalore: [
    {
      name: "Karnataka Women Development Corporation",
      description: "Women safety and support in Karnataka",
      phone: "080-2211-5555",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Bangalore Women Police",
      description: "Women assistance and safety in Bangalore",
      phone: "080-2294-3333",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Karnataka State Legal Services Authority",
      description: "Free legal aid services in Karnataka",
      phone: "080-2211-0305",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Centre for Internet and Society",
      description: "Digital safety resources and cyber support",
      phone: "080-4113-2007",
      type: "cyber_safety",
      website: "https://cis-india.org"
    },
    {
      name: "Enfold Proactive Health Trust",
      description: "Women health and safety support",
      phone: "080-2548-6666",
      type: "women_safety"
    }
  ],
  chennai: [
    {
      name: "Tamil Nadu Women Helpline",
      description: "Women safety and support in Tamil Nadu",
      phone: "044-2859-2859",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Chennai Women Police",
      description: "Women assistance and safety in Chennai",
      phone: "044-2341-3456",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Tamil Nadu Legal Services Authority",
      description: "Free legal aid in Tamil Nadu",
      phone: "044-2789-2000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Chennai",
      description: "Cybercrime reporting in Chennai",
      phone: "044-2234-1234",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Mahatma Gandhi Help Centre",
      description: "Women support services in Chennai",
      phone: "044-2524-4444",
      type: "women_safety"
    }
  ],
  hyderabad: [
    {
      name: "Telangana Women Protection Helpline",
      description: "Women safety support in Telangana",
      phone: "040-2785-2139",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Hyderabad Women Police",
      description: "Women assistance and safety in Hyderabad",
      phone: "040-2785-0000",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Telangana State Legal Services Authority",
      description: "Free legal aid in Telangana",
      phone: "040-2345-6789",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Hyderabad",
      description: "Cybercrime reporting in Hyderabad",
      phone: "040-2324-4444",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Swecha - Women Welfare",
      description: "Women empowerment in Hyderabad",
      phone: "040-6666-8888",
      type: "women_safety"
    }
  ],
  kolkata: [
    {
      name: "West Bengal Women Helpline",
      description: "Women assistance in West Bengal",
      phone: "033-2344-6000",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Kolkata Police Women Cell",
      description: "Women safety assistance in Kolkata",
      phone: "033-2214-5555",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "West Bengal Legal Services Authority",
      description: "Free legal aid in West Bengal",
      phone: "033-2212-1000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Kolkata",
      description: "Cybercrime reporting in Kolkata",
      phone: "033-2214-3333",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Jatio Nari Saniti",
      description: "Women rights organization in Kolkata",
      phone: "033-2489-1111",
      type: "women_safety"
    }
  ],
  chandigarh: [
    {
      name: "Chandigarh Women Police",
      description: "Women assistance and safety in Chandigarh",
      phone: "0172-274-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "UT Legal Services Chandigarh",
      description: "Free legal aid in Chandigarh",
      phone: "0172-272-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Chandigarh",
      description: "Cybercrime reporting in Chandigarh",
      phone: "0172-260-2000",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Saheli Women Resource Centre",
      description: "Counselling for women in Chandigarh",
      phone: "0172-272-2222",
      type: "women_safety"
    }
  ],
  ahmedabad: [
    {
      name: "Gujarat Women Helpline",
      description: "Women safety support in Gujarat",
      phone: "1800-2333-4444",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Ahmedabad Women Police",
      description: "Women assistance in Ahmedabad",
      phone: "079-2321-5555",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Gujarat State Legal Services Authority",
      description: "Free legal aid in Gujarat",
      phone: "079-2325-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Ahmedabad",
      description: "Cybercrime reporting in Ahmedabad",
      phone: "079-2320-4000",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Mahila Suraksha Gujarat",
      description: "Women protection services",
      phone: "079-2656-6666",
      type: "women_safety"
    }
  ],
  jaipur: [
    {
      name: "Rajasthan Women Helpline",
      description: "Women safety in Rajasthan",
      phone: "1800-120-2020",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Jaipur Women Police",
      description: "Women assistance in Jaipur",
      phone: "0141-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Rajasthan State Legal Services Authority",
      description: "Free legal aid in Rajasthan",
      phone: "0141-274-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Jaipur",
      description: "Cybercrime reporting in Jaipur",
      phone: "0141-250-1111",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Mahila Kalyan Sansthan",
      description: "Women welfare in Jaipur",
      phone: "0141-222-3333",
      type: "women_safety"
    }
  ],
  lucknow: [
    {
      name: "UP Women Helpline",
      description: "Women safety in Uttar Pradesh",
      phone: "1800-1800-111",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Lucknow Women Police",
      description: "Women assistance in Lucknow",
      phone: "0522-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "UP State Legal Services Authority",
      description: "Free legal aid in Uttar Pradesh",
      phone: "0522-230-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Lucknow",
      description: "Cybercrime reporting in Lucknow",
      phone: "0522-221-5555",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Mahila Suraksha Lucknow",
      description: "Women protection in Lucknow",
      phone: "0522-262-2222",
      type: "women_safety"
    }
  ],
  bhopal: [
    {
      name: "MP Women Helpline",
      description: "Women safety in Madhya Pradesh",
      phone: "1800-1200-000",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Bhopal Women Police",
      description: "Women assistance in Bhopal",
      phone: "0755-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "MP State Legal Services Authority",
      description: "Free legal aid in Madhya Pradesh",
      phone: "0755-255-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Bhopal",
      description: "Cybercrime reporting in Bhopal",
      phone: "0755-250-1111",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Madhya Pradesh Mahila Congress",
      description: "Women welfare in Bhopal",
      phone: "0755-276-6666",
      type: "women_safety"
    }
  ],
  patna: [
    {
      name: "Bihar Women Helpline",
      description: "Women safety in Bihar",
      phone: "1800-3456-222",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Patna Women Police",
      description: "Women assistance in Patna",
      phone: "0612-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Bihar State Legal Services Authority",
      description: "Free legal aid in Bihar",
      phone: "0612-250-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Patna",
      description: "Cybercrime reporting in Patna",
      phone: "0612-250-2222",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Bihar Mahila Suraksha",
      description: "Women protection in Bihar",
      phone: "0612-222-3333",
      type: "women_safety"
    }
  ],
  ranchi: [
    {
      name: "Jharkhand Women Helpline",
      description: "Women safety in Jharkhand",
      phone: "1800-3456-000",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Ranchi Women Police",
      description: "Women assistance in Ranchi",
      phone: "0651-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Jharkhand State Legal Services Authority",
      description: "Free legal aid in Jharkhand",
      phone: "0651-250-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Ranchi",
      description: "Cybercrime reporting in Ranchi",
      phone: "0651-250-2222",
      type: "cyber_safety",
      isGovernment: true
    }
  ],
  guwahati: [
    {
      name: "Assam Women Helpline",
      description: "Women safety in Assam",
      phone: "1800-3456-789",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Guwahati Women Police",
      description: "Women assistance in Guwahati",
      phone: "0361-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Assam State Legal Services Authority",
      description: "Free legal aid in Assam",
      phone: "0361-250-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Guwahati",
      description: "Cybercrime reporting in Guwahati",
      phone: "0361-250-2222",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Assam Mahila Suraksha",
      description: "Women protection in Assam",
      phone: "0361-222-3333",
      type: "women_safety"
    }
  ],
  trivandrum: [
    {
      name: "Kerala Women Helpline",
      description: "Women safety in Kerala",
      phone: "1800-425-1999",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Thiruvananthapuram Women Police",
      description: "Women assistance in Thiruvananthapuram",
      phone: "0471-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Kerala State Legal Services Authority",
      description: "Free legal aid in Kerala",
      phone: "0471-250-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Thiruvananthapuram",
      description: "Cybercrime reporting in Thiruvananthapuram",
      phone: "0471-250-2222",
      type: "cyber_safety",
      isGovernment: true
    },
    {
      name: "Kerala Mahila Samajam",
      description: "Women welfare in Kerala",
      phone: "0471-222-3333",
      type: "women_safety"
    }
  ],
  dehradun: [
    {
      name: "Uttarakhand Women Helpline",
      description: "Women safety in Uttarakhand",
      phone: "1800-3456-111",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Dehradun Women Police",
      description: "Women assistance in Dehradun",
      phone: "0135-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Uttarakhand State Legal Services Authority",
      description: "Free legal aid in Uttarakhand",
      phone: "0135-250-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Dehradun",
      description: "Cybercrime reporting in Dehradun",
      phone: "0135-250-2222",
      type: "cyber_safety",
      isGovernment: true
    }
  ],
  shimla: [
    {
      name: "Himachal Pradesh Women Helpline",
      description: "Women safety in Himachal Pradesh",
      phone: "1800-180-1111",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Shimla Women Police",
      description: "Women assistance in Shimla",
      phone: "0177-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "HP State Legal Services Authority",
      description: "Free legal aid in Himachal Pradesh",
      phone: "0177-250-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Shimla",
      description: "Cybercrime reporting in Shimla",
      phone: "0177-250-2222",
      type: "cyber_safety",
      isGovernment: true
    }
  ],
  srinagar: [
    {
      name: "Jammu Kashmir Women Helpline",
      description: "Women safety in Jammu Kashmir",
      phone: "1800-180-7114",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Srinagar Women Police",
      description: "Women assistance in Srinagar",
      phone: "0194-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Jammu Kashmir Legal Services Authority",
      description: "Free legal aid in J&K",
      phone: "0194-250-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Srinagar",
      description: "Cybercrime reporting in Srinagar",
      phone: "0194-250-2222",
      type: "cyber_safety",
      isGovernment: true
    }
  ],
  ludhiana: [
    {
      name: "Punjab Women Helpline",
      description: "Women safety in Punjab",
      phone: "1800-1800-111",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Ludhiana Women Police",
      description: "Women assistance in Ludhiana",
      phone: "0161-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Punjab State Legal Services Authority",
      description: "Free legal aid in Punjab",
      phone: "0161-250-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Ludhiana",
      description: "Cybercrime reporting in Ludhiana",
      phone: "0161-250-2222",
      type: "cyber_safety",
      isGovernment: true
    }
  ],
  indore: [
    {
      name: "Indore Women Police",
      description: "Women assistance in Indore",
      phone: "0731-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "MP Women Helpline Indore",
      description: "Women safety in Indore",
      phone: "0731-250-2222",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Cyber Crime Indore",
      description: "Cybercrime reporting in Indore",
      phone: "0731-250-3333",
      type: "cyber_safety",
      isGovernment: true
    }
  ],
  coimbatore: [
    {
      name: "Coimbatore Women Police",
      description: "Women assistance in Coimbatore",
      phone: "0422-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "TN Women Helpline Coimbatore",
      description: "Women safety in Coimbatore",
      phone: "0422-250-2222",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Cyber Crime Coimbatore",
      description: "Cybercrime reporting in Coimbatore",
      phone: "0422-250-3333",
      type: "cyber_safety",
      isGovernment: true
    }
  ],
  kochi: [
    {
      name: "Kochi Women Police",
      description: "Women assistance in Kochi",
      phone: "0484-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Kerala Women Helpline Kochi",
      description: "Women safety in Kochi",
      phone: "0484-250-2222",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Cyber Crime Kochi",
      description: "Cybercrime reporting in Kochi",
      phone: "0484-250-3333",
      type: "cyber_safety",
      isGovernment: true
    }
  ],
  visakhapatnam: [
    {
      name: "Visakhapatnam Women Police",
      description: "Women assistance in Visakhapatnam",
      phone: "0891-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "AP Women Helpline Vizag",
      description: "Women safety in Visakhapatnam",
      phone: "0891-250-2222",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Cyber Crime Visakhapatnam",
      description: "Cybercrime reporting in Visakhapatnam",
      phone: "0891-250-3333",
      type: "cyber_safety",
      isGovernment: true
    }
  ],
  bhubaneswar: [
    {
      name: "Odisha Women Helpline",
      description: "Women safety in Odisha",
      phone: "1800-3456-100",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Bhubaneswar Women Police",
      description: "Women assistance in Bhubaneswar",
      phone: "0674-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Odisha State Legal Services Authority",
      description: "Free legal aid in Odisha",
      phone: "0674-250-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Bhubaneswar",
      description: "Cybercrime reporting in Bhubaneswar",
      phone: "0674-250-2222",
      type: "cyber_safety",
      isGovernment: true
    }
  ],
  goa: [
    {
      name: "Goa Women Helpline",
      description: "Women safety in Goa",
      phone: "1800-200-2020",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Goa Women Police",
      description: "Women assistance in Goa",
      phone: "0832-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Goa Legal Services Authority",
      description: "Free legal aid in Goa",
      phone: "0832-250-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Goa",
      description: "Cybercrime reporting in Goa",
      phone: "0832-250-2222",
      type: "cyber_safety",
      isGovernment: true
    }
  ],
  puducherry: [
    {
      name: "Puducherry Women Helpline",
      description: "Women safety in Puducherry",
      phone: "1800-425-1000",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Puducherry Women Police",
      description: "Women assistance in Puducherry",
      phone: "0413-250-1091",
      type: "women_safety",
      isGovernment: true
    },
    {
      name: "Puducherry Legal Services",
      description: "Free legal aid in Puducherry",
      phone: "0413-250-0000",
      type: "legal_aid",
      isGovernment: true
    },
    {
      name: "Cyber Crime Puducherry",
      description: "Cybercrime reporting in Puducherry",
      phone: "0413-250-2222",
      type: "cyber_safety",
      isGovernment: true
    }
  ]
}

const getRegionKey = (city, state) => {
  const location = `${city} ${state}`.toLowerCase()
  
  if (location.includes('mumbai') || location.includes('maharashtra')) return 'mumbai'
  if (location.includes('pune') || location.includes('nagpur') || location.includes('nashik')) return 'pune'
  if (location.includes('delhi') || location.includes('new delhi') || location.includes('ncr')) return 'delhi'
  if (location.includes('bangalore') || location.includes('bengaluru') || location.includes('karnataka')) return 'bangalore'
  if (location.includes('chennai') || location.includes('madras') || location.includes('tamil nadu')) return 'chennai'
  if (location.includes('hyderabad') || location.includes('telangana')) return 'hyderabad'
  if (location.includes('kolkata') || location.includes('west bengal')) return 'kolkata'
  if (location.includes('chandigarh') || location.includes('ut')) return 'chandigarh'
  if (location.includes('ahmedabad') || location.includes('gujarat') || location.includes('surat') || location.includes('vadodara')) return 'ahmedabad'
  if (location.includes('jaipur') || location.includes('rajasthan')) return 'jaipur'
  if (location.includes('lucknow') || location.includes('uttar pradesh') || location.includes('kanpur') || location.includes('varanasi')) return 'lucknow'
  if (location.includes('kochi') || location.includes('kerala') || location.includes('thiruvananthapuram') || location.includes('kozhikode') || location.includes('thrissur')) return 'trivandrum'
  if (location.includes('guwahati') || location.includes('assam') || location.includes('silchar') || location.includes('dibrugarh')) return 'guwahati'
  if (location.includes('bhopal') || location.includes('indore') || location.includes('madhya pradesh') || location.includes('jabalpur')) return 'bhopal'
  if (location.includes('patna') || location.includes('bihar') || location.includes('muzaffarpur') || location.includes('gaya')) return 'patna'
  if (location.includes('ranchi') || location.includes('jharkhand') || location.includes('jamshedpur') || location.includes('dhanbad')) return 'ranchi'
  if (location.includes('dehradun') || location.includes('uttarakhand') || location.includes('haridwar') || location.includes('rishikesh')) return 'dehradun'
  if (location.includes('shimla') || location.includes('himachal') || location.includes('kullu') || location.includes('manali')) return 'shimla'
  if (location.includes('srinagar') || location.includes('jammu') || location.includes('ladakh') || location.includes('kashmir')) return 'srinagar'
  if (location.includes('ludhiana') || location.includes('punjab') || location.includes('amritsar') || location.includes('jalandhar')) return 'ludhiana'
  if (location.includes('coimbatore') || location.includes('madurai') || location.includes('tiruchirappalli')) return 'coimbatore'
  if (location.includes('visakhapatnam') || location.includes('vijayawada') || location.includes('andhra')) return 'visakhapatnam'
  if (location.includes('bhubaneswar') || location.includes('odisha') || location.includes('cuttack') || location.includes('rourkela')) return 'bhubaneswar'
  if (location.includes('goa') || location.includes('panaji') || location.includes('margao')) return 'goa'
  if (location.includes('puducherry') || location.includes('pondicherry')) return 'puducherry'
  
  return 'default'
}

export const getNearbyNGOs = (locationData) => {
  if (!locationData) {
    return NGO_DATABASE.all.slice(0, 6)
  }
  
  const { city, state } = locationData
  const regionKey = getRegionKey(city, state)
  
  if (NGO_DATABASE[regionKey]) {
    return NGO_DATABASE[regionKey].slice(0, 6)
  }
  
  return NGO_DATABASE.all.slice(0, 6)
}

export const getEmergencyContacts = (locationData) => {
  const baseContacts = [
    { name: 'Cybercrime Helpline', number: '1930', type: 'cyber', description: 'For online fraud and cyber complaints' },
    { name: 'Women Helpline', number: '1091', type: 'women', description: '24/7 women assistance' },
    { name: 'Emergency Services', number: '112', type: 'emergency', description: 'All emergencies' },
    { name: 'Police', number: '100', type: 'police', description: 'Police emergency' }
  ]
  
  if (!locationData) return baseContacts
  
  const { city, state } = locationData
  const regionKey = getRegionKey(city, state)
  
  const statePolice = {
    'mumbai': { name: 'Mumbai Police', number: '022-2642-2000' },
    'pune': { name: 'Pune Police', number: '020-2636-3030' },
    'delhi': { name: 'Delhi Police', number: '011-2349-1000' },
    'bangalore': { name: 'Karnataka Police', number: '080-2294-3333' },
    'chennai': { name: 'Chennai Police', number: '044-2341-3456' },
    'hyderabad': { name: 'Hyderabad Police', number: '040-2785-0000' },
    'kolkata': { name: 'Kolkata Police', number: '033-2214-5555' },
    'chandigarh': { name: 'Chandigarh Police', number: '0172-274-1000' },
    'ahmedabad': { name: 'Ahmedabad Police', number: '079-2321-5555' },
    'jaipur': { name: 'Jaipur Police', number: '0141-250-1000' },
    'lucknow': { name: 'Lucknow Police', number: '0522-250-1000' },
    'bhopal': { name: 'Bhopal Police', number: '0755-250-1000' },
    'patna': { name: 'Patna Police', number: '0612-250-1000' },
    'ranchi': { name: 'Ranchi Police', number: '0651-250-1000' },
    'guwahati': { name: 'Guwahati Police', number: '0361-250-1000' },
    'trivandrum': { name: 'Thiruvananthapuram Police', number: '0471-250-1000' },
    'dehradun': { name: 'Dehradun Police', number: '0135-250-1000' },
    'shimla': { name: 'Shimla Police', number: '0177-250-1000' },
    'srinagar': { name: 'Srinagar Police', number: '0194-250-1000' },
    'ludhiana': { name: 'Ludhiana Police', number: '0161-250-1000' },
    'indore': { name: 'Indore Police', number: '0731-250-1000' },
    'coimbatore': { name: 'Coimbatore Police', number: '0422-250-1000' },
    'kochi': { name: 'Kochi Police', number: '0484-250-1000' },
    'visakhapatnam': { name: 'Visakhapatnam Police', number: '0891-250-1000' },
    'bhubaneswar': { name: 'Bhubaneswar Police', number: '0674-250-1000' },
    'goa': { name: 'Goa Police', number: '0832-250-1000' },
    'puducherry': { name: 'Puducherry Police', number: '0413-250-1000' }
  }
  
  if (regionKey !== 'default' && statePolice[regionKey]) {
    return [
      ...baseContacts,
      { ...statePolice[regionKey], type: 'police', description: 'Local Police' }
    ]
  }
  
  return baseContacts
}
