import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './Profile.css'

interface ProfileProps {
  onLogout: () => void
  onBack: () => void
  userName?: string
  onNavigate?: (page: string) => void
}

function Profile({ onLogout, onBack, userName: _userName, onNavigate }: ProfileProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  // Dummy user profile data
  const userProfile = {
    fullName: 'Robert Johnson',
    employeeId: 'MR-2024-001',
    email: 'robert.johnson@zenrac.com',
    phone: '+91 98765 43210',
    designation: 'Medical Representative',
    department: 'Sales & Marketing',
    region: 'Mumbai',
    territory: 'Mumbai Central & South',
    joiningDate: '2022-03-15',
    experience: '2 years 9 months',
    manager: 'Sarah Williams',
    managerEmail: 'sarah.williams@zenrac.com',
    address: 'Flat 302, Green Valley Apartments, Andheri West, Mumbai - 400053',
    emergencyContact: {
      name: 'Emily Johnson',
      relation: 'Spouse',
      phone: '+91 98765 43211',
    },
    qualifications: [
      'B.Pharm (Bachelor of Pharmacy)',
      'MBA in Pharmaceutical Management',
    ],
    languages: ['English', 'Hindi', 'Marathi'],
    achievements: [
      'Top Performer Q2 2024',
      'Best Client Relationship Award 2023',
      'Exceeded Sales Target by 25% in 2024',
    ],
  }

  return (
    <div className="profile-container">
      <Header onLogout={onLogout} onMenuClick={handleMenuClick} onNavigateHome={() => onNavigate?.('home')} onNavigateOfflineRequests={() => onNavigate?.('offline-requests')} />
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} userName={userProfile.fullName} userEmail={userProfile.email} userMobile={userProfile.phone} onNavigate={onNavigate} onLogout={onLogout} />
      <main className="profile-content">
        <div className="profile-header">
          <button className="back-button" onClick={onBack} aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="profile-title">Profile</h1>
        </div>

        <div className="profile-wrapper">
          <div className="profile-card main-profile-card">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="profile-name-section">
                <h2 className="profile-full-name">{userProfile.fullName}</h2>
                <p className="profile-designation">{userProfile.designation}</p>
                <p className="profile-employee-id">Employee ID: {userProfile.employeeId}</p>
              </div>
            </div>
          </div>

          <div className="profile-sections">
            <div className="profile-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Personal Information
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{userProfile.fullName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{userProfile.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{userProfile.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Address</span>
                  <span className="info-value">{userProfile.address}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Emergency Contact</span>
                  <span className="info-value">{userProfile.emergencyContact.name} ({userProfile.emergencyContact.relation}) - {userProfile.emergencyContact.phone}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Professional Information
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Department</span>
                  <span className="info-value">{userProfile.department}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Region</span>
                  <span className="info-value">{userProfile.region}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Territory</span>
                  <span className="info-value">{userProfile.territory}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Joining Date</span>
                  <span className="info-value">{new Date(userProfile.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Experience</span>
                  <span className="info-value">{userProfile.experience}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Reporting Manager</span>
                  <span className="info-value">{userProfile.manager} ({userProfile.managerEmail})</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 14L9 11H15L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 6H20M4 6L4 18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V6M4 6L6 4H18L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Qualifications & Skills
              </h3>
              <div className="qualifications-list">
                {userProfile.qualifications.map((qual, index) => (
                  <div key={index} className="qualification-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{qual}</span>
                  </div>
                ))}
              </div>
              <div className="languages-section">
                <span className="languages-label">Languages:</span>
                <div className="languages-tags">
                  {userProfile.languages.map((lang, index) => (
                    <span key={index} className="language-tag">{lang}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Achievements & Awards
              </h3>
              <div className="achievements-list">
                {userProfile.achievements.map((achievement, index) => (
                  <div key={index} className="achievement-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile


