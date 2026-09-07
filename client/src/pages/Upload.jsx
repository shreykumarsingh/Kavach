import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { searchAPI, analysisAPI } from '../services/api'
import { geocodeLocation, getCurrentLocation } from '../services/location'
import toast from 'react-hot-toast'
import { 
  Upload, FileImage, FileVideo, X, Loader2, 
  AlertTriangle, Shield, Link as LinkIcon, Search,
  Globe, CheckCircle, MapPin, Navigation
} from 'lucide-react'

const LOCATION_SUGGESTIONS = [
  'Mumbai, Maharashtra',
  'Delhi, NCT',
  'Bangalore, Karnataka',
  'Chennai, Tamil Nadu',
  'Hyderabad, Telangana',
  'Kolkata, West Bengal',
  'Pune, Maharashtra',
  'Ahmedabad, Gujarat',
  'Jaipur, Rajasthan',
  'Lucknow, Uttar Pradesh',
  'Chandigarh, UT',
  'Bhopal, Madhya Pradesh',
  'Patna, Bihar',
  'Ranchi, Jharkhand',
  'Guwahati, Assam',
  'Thiruvananthapuram, Kerala',
  'Dehradun, Uttarakhand',
  'Shimla, Himachal Pradesh',
  'Srinagar, Jammu & Kashmir',
  'Ludhiana, Punjab',
  'Surat, Gujarat',
  'Vadodara, Gujarat',
  'Nagpur, Maharashtra',
  'Nashik, Maharashtra',
  'Faridabad, Haryana',
  'Gurgaon, Haryana',
  'Noida, Uttar Pradesh',
  'Ghaziabad, Uttar Pradesh',
  'Kanpur, Uttar Pradesh',
  'Allahabad, Uttar Pradesh',
  'Varanasi, Uttar Pradesh',
  'Agra, Uttar Pradesh',
  'Coimbatore, Tamil Nadu',
  'Madurai, Tamil Nadu',
  'Tiruchirappalli, Tamil Nadu',
  'Visakhapatnam, Andhra Pradesh',
  'Vijayawada, Andhra Pradesh',
  'Mysore, Karnataka',
  'Mangalore, Karnataka',
  'Hubli, Karnataka',
  'Dharwad, Karnataka',
  'Indore, Madhya Pradesh',
  'Jabalpur, Madhya Pradesh',
  'Gwalior, Madhya Pradesh',
  'Ujjain, Madhya Pradesh',
  'Cuttack, Odisha',
  'Bhubaneswar, Odisha',
  'Rourkela, Odisha',
  'Jamshedpur, Jharkhand',
  'Dhanbad, Jharkhand',
  'Bhilai, Chhattisgarh',
  'Raipur, Chhattisgarh',
  'Amritsar, Punjab',
  'Jalandhar, Punjab',
  'Bathinda, Punjab',
  'Hoshiarpur, Punjab',
  'Solan, Himachal Pradesh',
  'Mandi, Himachal Pradesh',
  'Jammu, Jammu & Kashmir',
  'Pauri, Uttarakhand',
  'Haridwar, Uttarakhand',
  'Roorkee, Uttarakhand',
  'Kashipur, Uttarakhand',
  'Haldwani, Uttarakhand',
  'Silchar, Assam',
  'Dibrugarh, Assam',
  'Tezpur, Assam',
  'Muzaffarpur, Bihar',
  'Gaya, Bihar',
  'Darbhanga, Bihar',
  'Bhagalpur, Bihar',
  'Purnia, Bihar',
  'Kochi, Kerala',
  'Kozhikode, Kerala',
  'Thrissur, Kerala',
  'Kollam, Kerala',
  'Palakkad, Kerala',
  'Malappuram, Kerala',
  'Port Blair, Andaman & Nicobar',
  'Puducherry, Puducherry',
  'Panaji, Goa',
  'Margao, Goa',
  'Vasco, Goa',
  'Itanagar, Arunachal Pradesh',
  'Imphal, Manipur',
  'Dimapur, Nagaland',
  'Kohima, Nagaland',
  'Aizawl, Mizoram',
  'Agartala, Tripura',
  'Gangtok, Sikkim',
  'Leh, Ladakh',
  'Kargil, Ladakh',
  'Ahmednagar, Maharashtra',
  'Akola, Maharashtra',
  'Amravati, Maharashtra',
  'Aurangabad, Maharashtra',
  'Badlapur, Maharashtra',
  'Baramati, Maharashtra',
  'Bhiwandi, Maharashtra',
  'Dhule, Maharashtra',
  'Hinjewadi, Maharashtra',
  'Jalgaon, Maharashtra',
  'Jalna, Maharashtra',
  'Kolhapur, Maharashtra',
  'Latur, Maharashtra',
  'Malegaon, Maharashtra',
  'Navi Mumbai, Maharashtra',
  'Panvel, Maharashtra',
  'Parbhani, Maharashtra',
  'Pimpri-Chinchwad, Maharashtra',
  'Satara, Maharashtra',
  'Solapur, Maharashtra',
  'Thane, Maharashtra',
  'Ulhasnagar, Maharashtra',
  'Wagholi, Maharashtra',
  'Wardha, Maharashtra',
  'Yavatmal, Maharashtra',
  'Anand, Gujarat',
  'Ankleshwar, Gujarat',
  'Bharuch, Gujarat',
  'Bhavnagar, Gujarat',
  'Bhuj, Gujarat',
  'Gandhidham, Gujarat',
  'Gandhinagar, Gujarat',
  'Godhra, Gujarat',
  'Himmatnagar, Gujarat',
  'Jamnagar, Gujarat',
  'Junagadh, Gujarat',
  'Mehsana, Gujarat',
  'Morbi, Gujarat',
  'Nadiad, Gujarat',
  'Navsari, Gujarat',
  'Palanpur, Gujarat',
  'Patan, Gujarat',
  'Porbandar, Gujarat',
  'Rajkot, Gujarat',
  'Sabarkantha, Gujarat',
  'Surendranagar, Gujarat',
  'Valsad, Gujarat',
  'Vapi, Gujarat',
  'Ambala, Haryana',
  'Bhiwani, Haryana',
  'Fatehabad, Haryana',
  'Hisar, Haryana',
  'Jhajjar, Haryana',
  'Jind, Haryana',
  'Karnal, Haryana',
  'Kaithal, Haryana',
  'Kurukshetra, Haryana',
  'Mahendragarh, Haryana',
  'Narnaul, Haryana',
  'Panipat, Haryana',
  'Rewari, Haryana',
  'Rohtak, Haryana',
  'Sirsa, Haryana',
  'Sonipat, Haryana',
  'Yamunanagar, Haryana',
  'Bangalore Rural, Karnataka',
  'Bangalore Urban, Karnataka',
  'Belgaum, Karnataka',
  'Bellary, Karnataka',
  'Bidar, Karnataka',
  'Chitradurga, Karnataka',
  'Dakshina Kannada, Karnataka',
  'Davanagere, Karnataka',
  'Gadag, Karnataka',
  'Gulbarga, Karnataka',
  'Hassan, Karnataka',
  'Haveri, Karnataka',
  'Karwar, Karnataka',
  'Kolar, Karnataka',
  'Koppal, Karnataka',
  'Mandya, Karnataka',
  'Raichur, Karnataka',
  'Shimoga, Karnataka',
  'Tumkur, Karnataka',
  'Udupi, Karnataka',
  'Chennai, Tamil Nadu',
  'Ariyalur, Tamil Nadu',
  'Coimbatore, Tamil Nadu',
  'Cuddalore, Tamil Nadu',
  'Dharmapuri, Tamil Nadu',
  'Dindigul, Tamil Nadu',
  'Erode, Tamil Nadu',
  'Kanchipuram, Tamil Nadu',
  'Kanyakumari, Tamil Nadu',
  'Karur, Tamil Nadu',
  'Krishnagiri, Tamil Nadu',
  'Madurai, Tamil Nadu',
  'Nagapattinam, Tamil Nadu',
  'Namakkal, Tamil Nadu',
  'Nilgiris, Tamil Nadu',
  'Perambalur, Tamil Nadu',
  'Pudukkottai, Tamil Nadu',
  'Ramanathapuram, Tamil Nadu',
  'Salem, Tamil Nadu',
  'Sivaganga, Tamil Nadu',
  'Thanjavur, Tamil Nadu',
  'Theni, Tamil Nadu',
  'Thoothukudi, Tiruchirappalli, Tamil Nadu',
  'Tirunelveli, Tamil Nadu',
  'Tiruppur, Tamil Nadu',
  'Tiruvallur, Tamil Nadu',
  'Tiruvannamalai, Tamil Nadu',
  'Tiruvarur, Tamil Nadu',
  'Vellore, Tamil Nadu',
  'Villupuram, Tamil Nadu',
  'Virudhunagar, Tamil Nadu',
  'Hyderabad, Telangana',
  'Adilabad, Telangana',
  'Karimnagar, Telangana',
  'Khammam, Telangana',
  'Mahbubnagar, Telangana',
  'Medak, Telangana',
  'Nalgonda, Telangana',
  'Nizamabad, Telangana',
  'Warangal, Telangana',
  'Kolkata, West Bengal',
  'Asansol, West Bengal',
  'Bardhaman, West Bengal',
  'Birbhum, West Bengal',
  'Dakshin Dinajpur, West Bengal',
  'Darjeeling, West Bengal',
  'Hooghly, West Bengal',
  'Howrah, West Bengal',
  'Jalpaiguri, West Bengal',
  'Malda, West Bengal',
  'Murshidabad, West Bengal',
  'Nadia, West Bengal',
  'North 24 Parganas, West Bengal',
  'Paschim Medinipur, West Bengal',
  'Purba Medinipur, West Bengal',
  'Purulia, West Bengal',
  'South 24 Parganas, West Bengal',
  'Uttar Dinajpur, West Bengal',
  'Visakhapatnam, Andhra Pradesh',
  'Vijayawada, Andhra Pradesh',
  'Anantapur, Andhra Pradesh',
  'Chittoor, Andhra Pradesh',
  'East Godavari, Andhra Pradesh',
  'Guntur, Andhra Pradesh',
  'Kadapa, Andhra Pradesh',
  'Krishna, Andhra Pradesh',
  'Kurnool, Andhra Pradesh',
  'Prakasam, Andhra Pradesh',
  'Srikakulam, Andhra Pradesh',
  'Visakhapatnam, Andhra Pradesh',
  'Vizianagaram, Andhra Pradesh',
  'West Godavari, Andhra Pradesh',
  'Bhopal, Madhya Pradesh',
  'Indore, Madhya Pradesh',
  'Jabalpur, Madhya Pradesh',
  'Gwalior, Madhya Pradesh',
  'Ujjain, Madhya Pradesh',
  'Alirajpur, Madhya Pradesh',
  'Anuppur, Madhya Pradesh',
  'Ashoknagar, Madhya Pradesh',
  'Balaghat, Madhya Pradesh',
  'Barwani, Madhya Pradesh',
  'Betul, Madhya Pradesh',
  'Bhind, Madhya Pradesh',
  'Burhanpur, Madhya Pradesh',
  'Chhatarpur, Madhya Pradesh',
  'Chhindwara, Madhya Pradesh',
  'Damoh, Madhya Pradesh',
  'Datia, Madhya Pradesh',
  'Dewas, Madhya Pradesh',
  'Dhar, Madhya Pradesh',
  'Dindori, Madhya Pradesh',
  'Guna, Madhya Pradesh',
  'Harda, Madhya Pradesh',
  'Hoshangabad, Madhya Pradesh',
  'Jhabua, Madhya Pradesh',
  'Katni, Madhya Pradesh',
  'Khandwa, Madhya Pradesh',
  'Khargone, Madhya Pradesh',
  'Mandla, Madhya Pradesh',
  'Mandsaur, Madhya Pradesh',
  'Morena, Madhya Pradesh',
  'Narsinghpur, Madhya Pradesh',
  'Neemuch, Madhya Pradesh',
  'Panna, Madhya Pradesh',
  'Raisen, Madhya Pradesh',
  'Rajgarh, Madhya Pradesh',
  'Ratlam, Madhya Pradesh',
  'Rewa, Madhya Pradesh',
  'Sagar, Madhya Pradesh',
  'Satna, Madhya Pradesh',
  'Sehore, Madhya Pradesh',
  'Seoni, Madhya Pradesh',
  'Shahdol, Madhya Pradesh',
  'Shajapur, Madhya Pradesh',
  'Sheopur, Madhya Pradesh',
  'Shivpuri, Madhya Pradesh',
  'Sidhi, Madhya Pradesh',
  'Singrauli, Madhya Pradesh',
  'Tikamgarh, Madhya Pradesh',
  'Ujjain, Madhya Pradesh',
  'Vidisha, Madhya Pradesh',
  'Jaipur, Rajasthan',
  'Jodhpur, Rajasthan',
  'Udaipur, Rajasthan',
  'Kota, Rajasthan',
  'Bikaner, Rajasthan',
  'Ajmer, Rajasthan',
  'Alwar, Rajasthan',
  'Banswara, Rajasthan',
  'Baran, Rajasthan',
  'Barmer, Rajasthan',
  'Bharatpur, Rajasthan',
  'Bhilwara, Rajasthan',
  'Bundi, Rajasthan',
  'Chittorgarh, Rajasthan',
  'Churu, Rajasthan',
  'Dausa, Rajasthan',
  'Dholpur, Rajasthan',
  'Dungarpur, Rajasthan',
  'Ganganagar, Rajasthan',
  'Hanumangarh, Rajasthan',
  'Haryana, Rajasthan',
  'Jaipur, Rajasthan',
  'Jaisalmer, Rajasthan',
  'Jalore, Rajasthan',
  'Jhalawar, Rajasthan',
  'Jhunjhunu, Rajasthan',
  'Kota, Rajasthan',
  'Nagaur, Rajasthan',
  'Pali, Rajasthan',
  'Pratapgarh, Rajasthan',
  'Rajsamand, Rajasthan',
  'Sawai Madhopur, Rajasthan',
  'Sikar, Rajasthan',
  'Sirohi, Rajasthan',
  'Sri Ganganagar, Rajasthan',
  'Tonk, Rajasthan',
  'Udaipur, Rajasthan',
  'Lucknow, Uttar Pradesh',
  'Kanpur, Uttar Pradesh',
  'Varanasi, Uttar Pradesh',
  'Allahabad, Uttar Pradesh',
  'Agra, Uttar Pradesh',
  'Meerut, Uttar Pradesh',
  'Aligarh, Uttar Pradesh',
  'Bareilly, Uttar Pradesh',
  'Moradabad, Uttar Pradesh',
  'Saharanpur, Uttar Pradesh',
  'Gorakhpur, Uttar Pradesh',
  'Noida, Uttar Pradesh',
  'Ghaziabad, Uttar Pradesh',
  'Firozabad, Uttar Pradesh',
  'Jhansi, Uttar Pradesh',
  'Mathura, Uttar Pradesh',
  'Rampur, Uttar Pradesh',
  'Shahjahanpur, Uttar Pradesh',
  'Sultanpur, Uttar Pradesh',
  'Ayodhya, Uttar Pradesh',
  'Azamgarh, Uttar Pradesh',
  'Bahraich, Uttar Pradesh',
  'Ballia, Uttar Pradesh',
  'Banda, Uttar Pradesh',
  'Barabanki, Uttar Pradesh',
  'Basti, Uttar Pradesh',
  'Budaun, Uttar Pradesh',
  'Bulandshahr, Uttar Pradesh',
  'Deoria, Uttar Pradesh',
  'Etawah, Uttar Pradesh',
  'Faizabad, Uttar Pradesh',
  'Farrukhabad, Uttar Pradesh',
  'Fatehpur, Uttar Pradesh',
  'Ghazipur, Uttar Pradesh',
  'Gonda, Uttar Pradesh',
  'Hamirpur, Uttar Pradesh',
  'Hardoi, Uttar Pradesh',
  'Hathras, Uttar Pradesh',
  'Jalaun, Uttar Pradesh',
  'Jaunpur, Uttar Pradesh',
  'Jhansi, Uttar Pradesh',
  'Kannauj, Uttar Pradesh',
  'Kanpur Dehat, Uttar Pradesh',
  'Kaushambi, Uttar Pradesh',
  'Kheri, Uttar Pradesh',
  'Kushinagar, Uttar Pradesh',
  'Lakhimpur, Uttar Pradesh',
  'Lalitpur, Uttar Pradesh',
  'Maharajganj, Uttar Pradesh',
  'Mahoba, Uttar Pradesh',
  'Mainpuri, Uttar Pradesh',
  'Mau, Uttar Pradesh',
  'Mirzapur, Uttar Pradesh',
  'Mirzapur, Uttar Pradesh',
  'Muzaffarnagar, Uttar Pradesh',
  'Pilibhit, Uttar Pradesh',
  'Pratapgarh, Uttar Pradesh',
  'Raebareli, Uttar Pradesh',
  'Rampur, Uttar Pradesh',
  'Sambhal, Uttar Pradesh',
  'Sant Kabir Nagar, Uttar Pradesh',
  'Shamli, Uttar Pradesh',
  'Siddharthnagar, Uttar Pradesh',
  'Sitapur, Uttar Pradesh',
  'Sonbhadra, Uttar Pradesh',
  'Sultanpur, Uttar Pradesh',
  'Unnao, Uttar Pradesh',
  'Varanasi, Uttar Pradesh',
  'Patna, Bihar',
  'Gaya, Bihar',
  'Bhagalpur, Bihar',
  'Darbhanga, Bihar',
  'Muzaffarpur, Bihar',
  'Purnia, Bihar',
  'Arrah, Bihar',
  'Bihar Sharif, Bihar',
  'Durgapur, Bihar',
  'Gopalganj, Bihar',
  'Hajipur, Bihar',
  'Katihar, Bihar',
  'Munger, Bihar',
  'Nawada, Bihar',
  'Patna, Bihar',
  'Ramgarh, Bihar',
  'Samastipur, Bihar',
  'Saran, Bihar',
  'Sitamarhi, Bihar',
  'Siwan, Bihar',
  'Arwal, Bihar',
  'Aurangabad, Bihar',
  'Banka, Bihar',
  'Begusarai, Bihar',
  'Bhabua, Bihar',
  'Bhagalpur, Bihar',
  'Bhojpur, Bihar',
  'Buxar, Bihar',
  'Darbhanga, Bihar',
  'East Champaran, Bihar',
  'Gaya, Bihar',
  'Gopalganj, Bihar',
  'Jamui, Bihar',
  'Jehanabad, Bihar',
  'Kaimur, Bihar',
  'Katihar, Bihar',
  'Khagaria, Bihar',
  'Kishanganj, Bihar',
  'Lakhisarai, Bihar',
  'Madhepura, Bihar',
  'Madhubani, Bihar',
  'Munger, Bihar',
  'Nalanda, Bihar',
  'Nawada, Bihar',
  'West Champaran, Bihar',
  'Ranchi, Jharkhand',
  'Jamshedpur, Jharkhand',
  'Dhanbad, Jharkhand',
  'Bokaro, Jharkhand',
  'Hazaribagh, Jharkhand',
  'Deoghar, Jharkhand',
  'Giridih, Jharkhand',
  'Ramgarh, Jharkhand',
  'Ranchi, Jharkhand',
  'Saraikela Kharsawan, Jharkhand',
  'Simdega, Jharkhand',
  'Gwalior, Madhya Pradesh',
  'Bhubaneswar, Odisha',
  'Cuttack, Odisha',
  'Rourkela, Odisha',
  'Berhampur, Odisha',
  'Sambalpur, Odisha',
  'Balasore, Odisha',
  'Bhadrak, Odisha',
  'Jajpur, Odisha',
  'Jharsuguda, Odisha',
  'Kendujhar, Odisha',
  'Sundargarh, Odisha',
  'Angul, Odisha',
  'Balangir, Odisha',
  'Baleswar, Odisha',
  'Bargarh, Odisha',
  'Boudh, Odisha',
  'Cuttack, Odisha',
  'Deogarh, Odisha',
  'Dhenkanal, Odisha',
  'Gajapati, Odisha',
  'Ganjam, Odisha',
  'Jagatsinghpur, Odisha',
  'Jajpur, Odisha',
  'Jharsuguda, Odisha',
  'Kalahandi, Odisha',
  'Kandhamal, Odisha',
  'Kendrapara, Odisha',
  'Kendujhar, Odisha',
  'Khordha, Odisha',
  'Koraput, Odisha',
  'Malkangiri, Odisha',
  'Mayurbhanj, Odisha',
  'Nabarangpur, Odisha',
  'Nayagarh, Odisha',
  'Nuapada, Odisha',
  'Puri, Odisha',
  'Rayagada, Odisha',
  'Sambalpur, Odisha',
  'Subarnapur, Odisha',
  'Sundergarh, Odisha',
  'Raipur, Chhattisgarh',
  'Bhilai, Chhattisgarh',
  'Bilaspur, Chhattisgarh',
  'Durg, Chhattisgarh',
  'Korba, Chhattisgarh',
  'Rajnandgaon, Chhattisgarh',
  'Ambikapur, Chhattisgarh',
  'Jagdalpur, Chhattisgarh',
  'Raigarh, Chhattisgarh',
  'Chandigarh, UT',
  'Puducherry, Puducherry',
  'Port Blair, Andaman & Nicobar',
  'Panaji, Goa',
  'Margao, Goa',
  'Vasco, Goa',
  'Marmagao, Goa',
  'Panaji, Goa',
  'Ponda, Goa',
  'Quepem, Goa',
  'Sanguem, Goa',
  'Sonaulim, Goa',
  'Thivim, Goa',
  'Verna, Goa',
  'Mumbai, Maharashtra',
  'Pune, Maharashtra',
  'Nagpur, Maharashtra',
  'Thane, Maharashtra',
  'Nashik, Maharashtra',
  'Aurangabad, Maharashtra',
  'Solapur, Maharashtra',
  'Kolhapur, Maharashtra',
  'Navi Mumbai, Maharashtra',
  'Pimpri-Chinchwad, Maharashtra',
  'Kalyan-Dombivali, Maharashtra',
  'Vasai-Virar, Maharashtra',
  'Malegaon, Maharashtra',
  'Jalgaon, Maharashtra',
  'Ahmednagar, Maharashtra',
  'Akola, Maharashtra',
  'Amravati, Maharashtra',
  'Chandrapur, Maharashtra',
  'Dhule, Maharashtra',
  'Gadchiroli, Maharashtra',
  'Gondia, Maharashtra',
  'Hingoli, Maharashtra',
  'Jalna, Maharashtra',
  'Latur, Maharashtra',
  'Nanded, Maharashtra',
  'Osmanabad, Maharashtra',
  'Parbhani, Maharashtra',
  'Pune, Maharashtra',
  'Raigad, Maharashtra',
  'Ratnagiri, Maharashtra',
  'Sangli, Maharashtra',
  'Satara, Maharashtra',
  'Sindhudurg, Maharashtra',
  'Wardha, Maharashtra',
  'Washim, Maharashtra',
  'Yavatmal, Maharashtra',
  'Gandhinagar, Gujarat',
  'Ahmedabad, Gujarat',
  'Surat, Gujarat',
  'Vadodara, Gujarat',
  'Rajkot, Gujarat',
  'Gandhinagar, Gujarat',
  'Bhavnagar, Gujarat',
  'Jamnagar, Gujarat',
  'Junagadh, Gujarat',
  'Anand, Gujarat',
  'Ankleshwar, Gujarat',
  'Bharuch, Gujarat',
  'Botad, Gujarat',
  'Dahod, Gujarat',
  'Gandhidham, Gujarat',
  'Godhra, Gujarat',
  'Himmatnagar, Gujarat',
  'Jetpur, Gujarat',
  'Morbi, Gujarat',
  'Nadiad, Gujarat',
  'Navsari, Gujarat',
  'Palanpur, Gujarat',
  'Patan, Gujarat',
  'Porbandar, Gujarat',
  'Surendranagar, Gujarat',
  'Surat, Gujarat',
  'Tharad, Gujarat',
  'Valsad, Gujarat',
  'Vapi, Gujarat',
  'Veraval, Gujarat',
  'Visnagar, Gujarat',
  'Wankaner, Gujarat',
  'Ambala, Haryana',
  'Bhiwani, Haryana',
  'Charkhi Dadri, Haryana',
  'Faridabad, Haryana',
  'Fatehabad, Haryana',
  'Gurgaon, Haryana',
  'Hisar, Haryana',
  'Jhajjar, Haryana',
  'Jind, Haryana',
  'Kaithal, Haryana',
  'Karnal, Haryana',
  'Kurukshetra, Haryana',
  'Mahendragarh, Haryana',
  'Nuh, Haryana',
  'Palwal, Haryana',
  'Panchkula, Haryana',
  'Panipat, Haryana',
  'Rewari, Haryana',
  'Rohtak, Haryana',
  'Sirsa, Haryana',
  'Sonipat, Haryana',
  'Yamunanagar, Haryana',
  'Bangalore, Karnataka',
  'Mysore, Karnataka',
  'Hubli, Karnataka',
  'Mangalore, Karnataka',
  'Belgaum, Karnataka',
  'Bellary, Karnataka',
  'Dharwad, Karnataka',
  'Gulbarga, Karnataka',
  'Tumkur, Karnataka',
  'Udupi, Karnataka',
  'Bagalkot, Karnataka',
  'Bidar, Karnataka',
  'Chitradurga, Karnataka',
  'Davanagere, Karnataka',
  'Gadag, Karnataka',
  'Hassan, Karnataka',
  'Haveri, Karnataka',
  'Karwar, Karnataka',
  'Kolar, Karnataka',
  'Koppal, Karnataka',
  'Mandya, Karnataka',
  'Raichur, Karnataka',
  'Shimoga, Karnataka',
  'Chennai, Tamil Nadu',
  'Coimbatore, Tamil Nadu',
  'Madurai, Tamil Nadu',
  'Tiruchirappalli, Tamil Nadu',
  'Salem, Tamil Nadu',
  'Tiruppur, Tamil Nadu',
  'Vellore, Tamil Nadu',
  'Erode, Tamil Nadu',
  'Tirunelveli, Tamil Nadu',
  'Thanjavur, Tamil Nadu',
  'Dindigul, Tamil Nadu',
  'Cuddalore, Tamil Nadu',
  'Kanchipuram, Tamil Nadu',
  'Tiruvannamalai, Tamil Nadu',
  'Kanyakumari, Tamil Nadu',
  'Nagapattinam, Tamil Nadu',
  'Perambalur, Tamil Nadu',
  'Ariyalur, Tamil Nadu',
  'Chennai, Tamil Nadu',
  'Hyderabad, Telangana',
  'Warangal, Telangana',
  'Karimnagar, Telangana',
  'Khammam, Telangana',
  'Nizamabad, Telangana',
  'Adilabad, Telangana',
  'Kolkata, West Bengal',
  'Asansol, West Bengal',
  'Siliguri, West Bengal',
  'Durgapur, West Bengal',
  'Bardhaman, West Bengal',
  'Malda, West Bengal',
  'Kharagpur, West Bengal',
  'Baharampur, West Bengal',
  'Haldia, West Bengal',
  'Shibpur, West Bengal',
  'Darjeeling, West Bengal',
  'Krishnanagar, West Bengal',
  'Kalyani, West Bengal',
  'Murshidabad, West Bengal',
  'Naihati, West Bengal',
  'Pune, Maharashtra',
  'Mumbai, Maharashtra',
  'Nagpur, Maharashtra',
  'Thane, Maharashtra',
  'Nashik, Maharashtra',
  'Aurangabad, Maharashtra',
  'Solapur, Maharashtra',
  'Kolhapur, Maharashtra',
  'Navi Mumbai, Maharashtra',
  'Pimpri-Chinchwad, Maharashtra',
  'Kalyan, Maharashtra',
  'Vasai, Maharashtra',
  'Virar, Maharashtra',
  'Ahmednagar, Maharashtra',
  'Akola, Maharashtra',
  'Amravati, Maharashtra',
  'Baramati, Maharashtra',
  'Bhiwandi, Maharashtra',
  'Chandrapur, Maharashtra',
  'Dhule, Maharashtra',
  'Gadchiroli, Maharashtra',
  'Gondia, Maharashtra',
  'Hingoli, Maharashtra',
  'Jalgaon, Maharashtra',
  'Jalna, Maharashtra',
  'Latur, Maharashtra',
  'Malegaon, Maharashtra',
  'Nanded, Maharashtra',
  'Osmanabad, Maharashtra',
  'Parbhani, Maharashtra',
  'Pune, Maharashtra',
  'Raigad, Maharashtra',
  'Ratnagiri, Maharashtra',
  'Sangli, Maharashtra',
  'Satara, Maharashtra',
  'Sindhudurg, Maharashtra',
  'Wardha, Maharashtra',
  'Washim, Maharashtra',
  'Yavatmal, Maharashtra',
  'Jammu, Jammu & Kashmir',
  'Srinagar, Jammu & Kashmir',
  'Anantnag, Jammu & Kashmir',
  'Baramulla, Jammu & Kashmir',
  'Budgam, Jammu & Kashmir',
  'Ganderbal, Jammu & Kashmir',
  'Kathua, Jammu & Kashmir',
  'Kishtwar, Jammu & Kashmir',
  'Poonch, Jammu & Kashmir',
  'Rajouri, Jammu & Kashmir',
  'Ramban, Jammu & Kashmir',
  'Reasi, Jammu & Kashmir',
  'Samba, Jammu & Kashmir',
  'Shopian, Jammu & Kashmir',
  'Udhampur, Jammu & Kashmir',
  'Leh, Ladakh',
  'Kargil, Ladakh',
  'Shimla, Himachal Pradesh',
  'Mandi, Himachal Pradesh',
  'Solan, Himachal Pradesh',
  'Kullu, Himachal Pradesh',
  'Manali, Himachal Pradesh',
  'Dharamshala, Himachal Pradesh',
  'Kangra, Himachal Pradesh',
  'Chamba, Himachal Pradesh',
  'Bilaspur, Himachal Pradesh',
  'Hamirpur, Himachal Pradesh',
  'Una, Himachal Pradesh',
  'Sirmour, Himachal Pradesh',
  'Kinnaur, Himachal Pradesh',
  'Lahaul, Himachal Pradesh',
  'Spiti, Himachal Pradesh',
  'Dehradun, Uttarakhand',
  'Haridwar, Uttarakhand',
  'Roorkee, Uttarakhand',
  'Rishikesh, Uttarakhand',
  'Kashipur, Uttarakhand',
  'Haldwani, Uttarakhand',
  'Rudrapur, Uttarakhand',
  'Kotdwar, Uttarakhand',
  'Ramnagar, Uttarakhand',
  'Nainital, Uttarakhand',
  'Almora, Uttarakhand',
  'Mussoorie, Uttarakhand',
  'Pauri, Uttarakhand',
  'Tehri, Uttarakhand',
  'Uttarkashi, Uttarakhand',
  'Chamoli, Uttarakhand',
  'Champawat, Uttarakhand',
  'Pithoragarh, Uttarakhand',
  'Bageshwar, Uttarakhand',
  'Udham Singh Nagar, Uttarakhand',
  'Chandigarh, UT',
  'Guwahati, Assam',
  'Silchar, Assam',
  'Dibrugarh, Assam',
  'Jorhat, Assam',
  'Tezpur, Assam',
  'Tinsukia, Assam',
  'Bongaigaon, Assam',
  'Dhubri, Assam',
  'Diphu, Assam',
  'Goalpara, Assam',
  'Golaghat, Assam',
  'Hailakandi, Assam',
  'Karbi Anglong, Assam',
  'Karimganj, Assam',
  'Kokrajhar, Assam',
  'Lakhimpur, Assam',
  'Morigaon, Assam',
  'Nagaon, Assam',
  'Nalbari, Assam',
  'North Cachar Hills, Assam',
  'Sivasagar, Assam',
  'Sonitpur, Assam',
  'Imphal, Manipur',
  'Thoubal, Manipur',
  'Bishnupur, Manipur',
  'Churachandpur, Manipur',
  'Senapati, Manipur',
  'Ukhrul, Manipur',
  'Kohima, Nagaland',
  'Dimapur, Nagaland',
  'Mokokchung, Nagaland',
  'Tuensang, Nagaland',
  'Wokha, Nagaland',
  'Zunheboto, Nagaland',
  'Peren, Nagaland',
  'Longleng, Nagaland',
  'Kiphire, Nagaland',
  'Aizawl, Mizoram',
  'Lunglei, Mizoram',
  'Saiha, Mizoram',
  'Champhai, Mizoram',
  'Kolasib, Mizoram',
  'Lawngtlai, Mizoram',
  'Mamit, Mizoram',
  'Saitual, Mizoram',
  'Serchhip, Mizoram',
  'Agartala, Tripura',
  'Udaipur, Tripura',
  'Dharmanagar, Tripura',
  'Kailasahar, Tripura',
  'Belonia, Tripura',
  'Ambassa, Tripura',
  'Itanagar, Arunachal Pradesh',
  'Naharlagun, Arunachal Pradesh',
  'Pasighat, Arunachal Pradesh',
  'Tawang, Arunachal Pradesh',
  'Ziro, Arunachal Pradesh',
  'Along, Arunachal Pradesh',
  'Tezu, Arunachal Pradesh',
  'Bomdila, Arunachal Pradesh',
  'Rupa, Arunachal Pradesh',
  'Roing, Arunachal Pradesh',
  'Gangtok, Sikkim',
  'Namchi, Sikkim',
  'Gyalshing, Sikkim',
  'Soreng, Sikkim',
  'Pakyong, Sikkim',
  'Gezing, Sikkim',
  'Jorethang, Sikkim',
  'Mangan, Sikkim',
  'Rangpo, Sikkim',
  'Singtam, Sikkim',
  'Kochi, Kerala',
  'Thiruvananthapuram, Kerala',
  'Kozhikode, Kerala',
  'Thrissur, Kerala',
  'Kollam, Kerala',
  'Malappuram, Kerala',
  'Palakkad, Kerala',
  'Kannur, Kerala',
  'Alappuzha, Kerala',
  'Kottayam, Kerala',
  'Ernakulam, Kerala',
  'Idukki, Kerala',
  'Wayanad, Kerala',
  'Kasargod, Kerala',
  'Pathanamthitta, Kerala',
]

const UploadPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState(searchParams.get('mode') || 'upload')
  const [description, setDescription] = useState('')
  const [reportingMode, setReportingMode] = useState('anonymous')
  const [location, setLocation] = useState('')
  const [locationData, setLocationData] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const filteredSuggestionsMemo = useMemo(() => {
    if (!location.trim()) return LOCATION_SUGGESTIONS.slice(0, 15)
    const searchTerm = location.toLowerCase()
    return LOCATION_SUGGESTIONS.filter(s => 
      s.toLowerCase().includes(searchTerm)
    ).slice(0, 5)
  }, [location])

  const handleLocationChange = (e) => {
    const value = e.target.value
    setLocation(value)
    setLocationData(null)
    setShowSuggestions(true)
  }

  const selectSuggestion = async (suggestion) => {
    setLocation(suggestion)
    setShowSuggestions(false)
    setLocationLoading(true)
    
    const result = await geocodeLocation(suggestion)
    if (result.success) {
      setLocationData(result.data)
    }
    setLocationLoading(false)
  }

  const handleUseCurrentLocation = async () => {
    setLocationLoading(true)
    try {
      const result = await getCurrentLocation()
      if (result.success) {
        const displayLocation = result.data.city 
          ? `${result.data.city}, ${result.data.state}`
          : result.data.displayName
        setLocation(displayLocation)
        setLocationData(result.data)
        toast.success('Location detected!')
      }
    } catch (error) {
      toast.error('Could not detect location. Please enter manually.')
    }
    setLocationLoading(false)
  }

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setUrl('')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxFiles: 1,
    disabled: mode === 'url',
  })

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleUpload = async () => {
    if (!location.trim()) {
      toast.error('Please enter your location')
      return
    }

    if (mode === 'upload') {
      if (!file) {
        toast.error('Please select a file to upload')
        return
      }

      setLoading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('description', description)
        formData.append('reportingMode', reportingMode)
        formData.append('location', location)
        if (locationData) {
          formData.append('locationData', JSON.stringify(locationData))
        }

        const response = await searchAPI.search(formData, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        })

        const result = response.data.searchResult || response.data.analysis?.result
        if (result) {
          if (result.similarFound > 0) {
            toast.success(`Found ${result.similarFound} similar image(s)!`)
          } else {
            toast.success('No similar images found')
          }
        } else {
          toast.success('Search completed')
        }

        const locationParam = locationData && (locationData.city || locationData.state)
          ? `lat=${locationData.lat}&lon=${locationData.lon}&city=${encodeURIComponent(locationData.city || '')}&state=${encodeURIComponent(locationData.state || '')}&location=${encodeURIComponent(location)}`
          : `location=${encodeURIComponent(location)}`
        navigate(`/analysis/${response.data.analysis._id}?${locationParam}`)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Search failed. Please try again.')
      } finally {
        setLoading(false)
      }
    } else if (mode === 'url') {
      if (!url) {
        toast.error('Please enter a URL')
        return
      }

      if (!isValidUrl(url)) {
        toast.error('Please enter a valid URL')
        return
      }

      setLoading(true)

      try {
        const response = await analysisAPI.uploadUrl({
          url,
          description,
          reportingMode,
          location,
          locationData: locationData || undefined,
        })

        if (response.data.analysis) {
          toast.success('URL scan completed')
          const locationParam = locationData && (locationData.city || locationData.state)
            ? `lat=${locationData.lat}&lon=${locationData.lon}&city=${encodeURIComponent(locationData.city || '')}&state=${encodeURIComponent(locationData.state || '')}&location=${encodeURIComponent(location)}`
            : `location=${encodeURIComponent(location)}`
          navigate(`/analysis/${response.data.analysis._id}?${locationParam}`)
        } else {
          toast.error('Failed to scan URL')
        }
      } catch (error) {
        console.error('URL scan error:', error)
        toast.error(error.response?.data?.message || 'URL scan failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  const getFileIcon = () => {
    if (!file) return null
    if (file.type.startsWith('video/')) return FileVideo
    return FileImage
  }

  const FileIcon = getFileIcon()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-900 flex items-center space-x-2 transition-colors"
          >
            <X className="w-5 h-5" />
            <span>Cancel</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Reverse Image Search</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Mode Toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center p-1 rounded-full bg-white border border-gray-200 shadow-sm">
            <button
              onClick={() => setMode('upload')}
              className={`px-6 py-3 rounded-full transition-all flex items-center space-x-2 ${
                mode === 'upload'
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
            <button
              onClick={() => { setMode('url'); setFile(null); }}
              className={`px-6 py-3 rounded-full transition-all flex items-center space-x-2 ${
                mode === 'url'
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Scan URL</span>
            </button>
          </div>
        </div>

        {/* Upload Area (File Mode) */}
        {mode === 'upload' && (
          <div
            {...getRootProps()}
            className={`rounded-2xl p-12 text-center cursor-pointer transition-all border-2 border-dashed mb-8 ${
              isDragActive 
                ? 'border-sky-400 bg-sky-50' 
                : 'border-gray-300 hover:border-sky-400 bg-white'
            }`}
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <input {...getInputProps()} />
            
            {file ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-r from-sky-100 to-cyan-100 rounded-xl">
                    {FileIcon && <FileIcon className="w-8 h-8 text-sky-600" />}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile() }}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-red-500" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-sky-100 to-cyan-100 rounded-full flex items-center justify-center">
                  <Upload className="w-10 h-10 text-sky-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your file'}
                </h3>
                <p className="text-gray-500 mb-4">
                  or click to browse from your device
                </p>
                <p className="text-sm text-gray-400">
                  Supported: Images (PNG, JPG, JPEG, WEBP)
                </p>
              </>
            )}
          </div>
        )}

        {/* URL Input (URL Mode) */}
        {mode === 'url' && (
          <div className="rounded-2xl p-8 mb-8 bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-sky-100 to-cyan-100 rounded-xl">
                <LinkIcon className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold">Enter Image URL</h3>
                <p className="text-gray-500 text-sm">Paste a direct link to an image</p>
              </div>
            </div>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-colors bg-gray-50"
              />
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {url && isValidUrl(url) && (
              <div className="mt-4 flex items-center space-x-2 text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Valid URL format</span>
              </div>
            )}
          </div>
        )}

        {/* Options */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context about this image..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-colors resize-none bg-white"
              rows={3}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={location}
                  onChange={handleLocationChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Enter your city/state"
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 focus:outline-none transition-colors bg-white"
                />
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                {locationLoading && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-500 animate-spin" />
                )}
              </div>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locationLoading}
                className="px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50"
                title="Use current location"
              >
                <Navigation className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {showSuggestions && filteredSuggestionsMemo.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {filteredSuggestionsMemo.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-sky-50 transition-colors flex items-center space-x-2"
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
            {locationData && (
              <div className="mt-2 flex items-center space-x-2 text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Location verified: {locationData.city && locationData.state ? `${locationData.city}, ${locationData.state}` : location || locationData.displayName || 'Location'}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reporting Mode
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setReportingMode('anonymous')}
                className={`p-5 rounded-xl border-2 transition-all ${
                  reportingMode === 'anonymous'
                    ? 'border-sky-500 bg-sky-50 shadow-md'
                    : 'border-gray-200 hover:border-sky-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Shield className={`w-6 h-6 ${reportingMode === 'anonymous' ? 'text-sky-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className={`font-medium ${reportingMode === 'anonymous' ? 'text-sky-700' : 'text-gray-900'}`}>Anonymous</p>
                    <p className="text-sm text-gray-500">Your identity will be hidden</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setReportingMode('confidential')}
                className={`p-5 rounded-xl border-2 transition-all ${
                  reportingMode === 'confidential'
                    ? 'border-sky-500 bg-sky-50 shadow-md'
                    : 'border-gray-200 hover:border-sky-300 bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={`w-6 h-6 ${reportingMode === 'confidential' ? 'text-sky-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <p className={`font-medium ${reportingMode === 'confidential' ? 'text-sky-700' : 'text-gray-900'}`}>Confidential</p>
                    <p className="text-sm text-gray-500">Only admin can see</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                {mode === 'url' ? 'Scanning URL...' : 'Uploading and analyzing...'}
              </span>
              <span className="text-sm text-sky-600 font-medium">{uploadProgress > 0 ? `${uploadProgress}%` : 'Processing...'}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${uploadProgress > 0 ? uploadProgress : 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={loading || !location.trim() || (mode === 'upload' && !file) || (mode === 'url' && !url)}
          className={`w-full mt-8 flex items-center justify-center space-x-2 py-4 text-lg font-semibold rounded-xl transition-all ${
            location.trim() && ((mode === 'upload' && file) || (mode === 'url' && url && isValidUrl(url)))
              ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:opacity-90 shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{mode === 'url' ? 'Scanning...' : 'Searching...'}</span>
            </>
          ) : (
            <>
              <Search className="w-6 h-6" />
              <span>{mode === 'url' ? 'Scan URL' : 'Find Similar Images'}</span>
            </>
          )}
        </button>

        {/* Disclaimer */}
        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-gray-700">
            <strong className="text-amber-600">Note:</strong> This search finds similar images in our database. 
            For web search, additional API integration is required.
          </p>
        </div>
      </main>
    </div>
  )
}

export default UploadPage