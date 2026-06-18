import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Calendar,
  Clock,
  Pin,
  Mail,
  MessageSquare,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="landing-page">
      {/* Background Dot Grid */}
      <div className="dot-grid-bg"></div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => navigate('/')}>
            <div className="logo-dots">
              <span className="logo-dot blue"></span>
              <span className="logo-dot"></span>
              <span className="logo-dot"></span>
              <span className="logo-dot"></span>
            </div>
            <span className="brand-name">TodoApps</span>
          </div>

          <button 
            className="nav-menu-toggle" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`nav-content-wrapper ${isMenuOpen ? 'active' : ''}`}>
            <div className="nav-links">
              <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#benefits" onClick={() => setIsMenuOpen(false)}>Solutions</a>
              <a href="#benefits" onClick={() => setIsMenuOpen(false)}>Resources</a>
              <a href="#features" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            </div>

            <div className="nav-buttons">
              <button
                className="nav-btn-text"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/login');
                }}
              >
                Sign in
              </button>
              <button
                className="nav-btn-primary"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/signup');
                }}
              >
                Get demo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">

          {/* Top Logo Badge Indicator */}
          <div className="hero-badge-container">
            <div className="hero-badge">
              <div className="logo-dots small">
                <span className="logo-dot blue"></span>
                <span className="logo-dot"></span>
                <span className="logo-dot"></span>
                <span className="logo-dot"></span>
              </div>
            </div>
          </div>

          {/* Central Hero Content */}
          <div className="hero-content">
            <h1 className="hero-title">
              Think, plan, and track <br />
              <span className="title-muted">all in one place</span>
            </h1>
            <p className="hero-subtitle">
              Efficiently manage your tasks and boost productivity.
            </p>
            <div className="hero-actions">
              <button
                className="hero-btn-primary"
                onClick={() => navigate('/signup')}
              >
                Get free demo
              </button>
            </div>
          </div>

          {/* Interactive Floating Widgets Layout */}
          <div className="hero-canvas">

            {/* Widget 1: Top Left - Sticky Note + Floating Checkbox */}
            <div className="widget widget-sticky-note">
              <div className="sticky-pin">
                <Pin size={16} fill="#ef4444" color="#ef4444" />
              </div>
              <p className="sticky-text">
                Take notes to keep track of crucial details, and accomplish more tasks with ease.
              </p>

              {/* Overlay Checkbox Widget */}
              <div className="nested-widget widget-check">
                <span className="check-box-blue">
                  <CheckCircle size={14} color="#ffffff" fill="#2563eb" />
                </span>
              </div>
            </div>

            {/* Widget 2: Top Right - Reminders + Clock Icon */}
            <div className="widget widget-reminders">
              <div className="reminders-header">
                <span className="reminders-dot"></span>
                <span className="reminders-title">Reminders</span>
              </div>
              <div className="reminders-body">
                <h4 className="reminder-title">Today's Meeting</h4>
                <p className="reminder-desc">Call with marketing team</p>
                <div className="reminder-time">
                  <Clock size={12} className="text-blue" />
                  <span>13:00 - 13:45</span>
                </div>
              </div>

              {/* Overlay Clock Widget */}
              <div className="nested-widget widget-clock">
                <div className="clock-icon-wrapper">
                  <Clock size={20} color="#111827" />
                </div>
              </div>
            </div>

            {/* Widget 3: Bottom Left - Today's Tasks */}
            <div className="widget widget-tasks">
              <h3 className="tasks-header">Today's tasks</h3>
              <div className="tasks-list">

                {/* Task Item 1 */}
                <div className="task-row-item">
                  <div className="task-row-meta">
                    <span className="task-row-number bg-orange">8</span>
                    <span className="task-row-title">New ideas for campaign</span>
                    <div className="avatar-group">
                      <span className="avatar">A</span>
                      <span className="avatar">B</span>
                    </div>
                  </div>
                  <div className="task-progress-bar">
                    <div className="progress-fill bg-orange-bar" style={{ width: '60%' }}></div>
                  </div>
                  <div className="progress-percent">60%</div>
                </div>

                {/* Task Item 2 */}
                <div className="task-row-item">
                  <div className="task-row-meta">
                    <span className="task-row-number bg-green">3</span>
                    <span className="task-row-title">Design PPT #4</span>
                    <div className="avatar-group">
                      <span className="avatar">C</span>
                    </div>
                  </div>
                  <div className="task-progress-bar">
                    <div className="progress-fill bg-green-bar" style={{ width: '100%' }}></div>
                  </div>
                  <div className="progress-percent">112%</div>
                </div>

              </div>
            </div>

            {/* Widget 4: Bottom Right - Integrations */}
            <div className="widget widget-integrations">
              <h3 className="integrations-header">100+ Integrations</h3>
              <div className="integration-icons">

                {/* Icon 1: Gmail */}
                <div className="integration-icon-card mail-icon-color">
                  <Mail size={18} />
                </div>

                {/* Icon 2: Slack */}
                <div className="integration-icon-card slack-icon-color">
                  <MessageSquare size={18} />
                </div>

                {/* Icon 3: Calendar */}
                <div className="integration-icon-card calendar-icon-color">
                  <Calendar size={18} />
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="features-container">
          <div className="section-header">
            <span className="section-badge-pill">Features</span>
            <h2>Keep everything in one place</h2>
            <p className="features-subtitle">Forget complex project management tools.</p>
          </div>

          {/* Bento Grid - Top Row (2 equal cards) */}
          <div className="bento-grid">

            {/* Card 1: Seamless Collaboration */}
            <div className="bento-card bento-half">
              <div className="bento-mockup">
                {/* Workspace mockup */}
                <div className="mockup-workspace">
                  <div className="mockup-ws-header">
                    <span className="mockup-ws-label">MY WORKSPACE</span>
                    <span className="mockup-ws-icon">⚙</span>
                  </div>
                  <div className="mockup-ws-list">
                    <div className="mockup-ws-item">
                      <span className="ws-dot" style={{ background: '#3b82f6' }}></span>
                      <span>Branding and identify ...</span>
                    </div>
                    <div className="mockup-ws-item">
                      <span className="ws-dot" style={{ background: '#f97316' }}></span>
                      <span>Marketing</span>
                    </div>
                    <div className="mockup-ws-item">
                      <span className="ws-dot" style={{ background: '#8b5cf6' }}></span>
                      <span>Product la...</span>
                    </div>
                    <div className="mockup-ws-item">
                      <span className="ws-dot" style={{ background: '#06b6d4' }}></span>
                      <span>Team bra...</span>
                    </div>
                  </div>
                  {/* Overlay: Member popup */}
                  <div className="mockup-member-popup">
                    <div className="member-popup-header">
                      <span>Marketing Team</span>
                    </div>
                    <div className="member-popup-badge">Members 2</div>
                    <div className="member-popup-action">+ Invite members</div>
                    <div className="member-popup-person">
                      <span className="member-avatar" style={{ background: '#dbeafe' }}>A</span>
                      <span>Amanda Peterson</span>
                    </div>
                    <div className="member-popup-person">
                      <span className="member-avatar" style={{ background: '#fce7f3' }}>J</span>
                      <span>Jane Fox</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bento-text">
                <h3>Seamless Collaboration</h3>
                <p>Work together with your team effortlessly, share tasks, and update progress in real-time.</p>
              </div>
            </div>

            {/* Card 2: Time Management Tools */}
            <div className="bento-card bento-half">
              <div className="bento-mockup">
                <div className="mockup-time-grid">
                  {/* Bar Chart */}
                  <div className="mockup-bar-chart">
                    <div className="bar-chart-header">
                      <span>weekly</span>
                      <span className="bar-chart-toggle">daily</span>
                    </div>
                    <div className="bar-chart-bars">
                      <div className="bar-group">
                        <div className="bar" style={{ height: '60%', background: '#3b82f6' }}></div>
                        <span>Mon</span>
                      </div>
                      <div className="bar-group">
                        <div className="bar" style={{ height: '60%', background: '#3b82f6' }}></div>
                        <span>Tue</span>
                      </div>
                      <div className="bar-group">
                        <div className="bar" style={{ height: '45%', background: '#93c5fd' }}></div>
                        <span>Wed</span>
                      </div>
                      <div className="bar-group">
                        <div className="bar" style={{ height: '30%', background: '#dbeafe' }}></div>
                        <span>Thu</span>
                      </div>
                      <div className="bar-group">
                        <div className="bar" style={{ height: '20%', background: '#eff6ff' }}></div>
                        <span>Fri</span>
                      </div>
                    </div>
                  </div>
                  {/* Schedule */}
                  <div className="mockup-schedule">
                    <div className="schedule-header">
                      <span className="schedule-label-small">Your weekly meetings</span>
                      <strong>Weekly schedule</strong>
                    </div>
                    <div className="schedule-row">
                      <span className="schedule-day">15</span>
                      <div className="schedule-event">
                        <span>Meeting with marketing team</span>
                        <span className="schedule-time">🕐 13:00 - 13:45</span>
                      </div>
                    </div>
                    <div className="schedule-row">
                      <span className="schedule-day">16</span>
                      <div className="schedule-event">
                        <span>Meeting with marketing team</span>
                        <span className="schedule-time">🕐 12:00 - 12:45</span>
                      </div>
                    </div>
                    <div className="schedule-row">
                      <span className="schedule-day">17</span>
                      <div className="schedule-event">
                        <span>Meeting with new client</span>
                        <span className="schedule-time">🕐 14:00 - 15:00</span>
                      </div>
                    </div>
                  </div>
                  {/* Donut Chart */}
                  <div className="mockup-donut">
                    <span className="donut-label">Team workload</span>
                    <div className="donut-ring">
                      <svg viewBox="0 0 80 80" className="donut-svg">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#f97316" strokeWidth="8" strokeDasharray="151 201" strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 40 40)" />
                      </svg>
                      <span className="donut-percent">75%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bento-text">
                <h3>Time Management Tools</h3>
                <p>Optimize your time with integrated tools like timers, reminders, and schedules.</p>
              </div>
            </div>

            {/* Card 3: Advanced Task Tracking */}
            <div className="bento-card bento-large">
              <div className="bento-card-inner bento-horizontal">
                <div className="bento-text bento-text-left">
                  <div className="bento-accent-icon">
                    <span className="chevron-icon">»</span>
                  </div>
                  <h3>Advanced task tracking</h3>
                  <p>A bird's eye view of your entire workflow and project progress at a glance.</p>
                </div>
                <div className="bento-mockup bento-mockup-wide">
                  {/* Project Timeline */}
                  <div className="mockup-timeline-card">
                    <div className="timeline-header">
                      <strong>Project timeline</strong>
                      <div className="timeline-header-right">
                        <span className="timeline-label">Team</span>
                        <div className="timeline-avatars">
                          <span className="t-avatar">A</span>
                          <span className="t-avatar">B</span>
                          <span className="t-avatar">C</span>
                        </div>
                      </div>
                    </div>
                    <div className="timeline-bars">
                      <div className="tl-bar tl-bar-green" style={{ width: '55%', marginLeft: '10%' }}>
                        <span>Wireframe for this</span>
                        <span className="tl-pct">55%</span>
                      </div>
                      <div className="tl-bar tl-bar-blue" style={{ width: '40%', marginLeft: '25%' }}>
                        <span>Inverted tasks</span>
                        <span className="tl-pct">62%</span>
                      </div>
                    </div>
                  </div>
                  {/* Kanban Board */}
                  <div className="mockup-kanban-card">
                    <div className="kanban-header">
                      <strong>Tasks</strong>
                    </div>
                    <div className="kanban-cols">
                      <div className="kanban-col">
                        <div className="kanban-col-header">
                          <span>To do</span>
                          <span className="kanban-count">4</span>
                          <span className="kanban-plus">+</span>
                        </div>
                        <div className="kanban-card-item">
                          <div className="kanban-tags">
                            <span className="ktag ktag-red">Feedback</span>
                            <span className="ktag ktag-purple">Marketing team</span>
                          </div>
                          <p>New Ideas for the campaign</p>
                          <span className="kanban-date">📅 15 September</span>
                        </div>
                      </div>
                      <div className="kanban-col">
                        <div className="kanban-col-header">
                          <span>In progress</span>
                          <span className="kanban-count">2</span>
                        </div>
                        <div className="kanban-card-item">
                          <div className="kanban-tags">
                            <span className="ktag ktag-green">Sales team</span>
                          </div>
                          <p>New BrandBook</p>
                          <span className="kanban-date">📅 15 September</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Customizable Workspaces */}
            <div className="bento-card bento-small">
              <div className="bento-mockup">
                <div className="mockup-customize-grid">
                  <div className="customize-chip">Themes</div>
                  <div className="customize-chip">Widgets</div>
                  <div className="customize-chip muted">Tasks View</div>
                  <div className="customize-timer">
                    <span className="timer-display">04:21</span>
                    <div className="timer-controls">
                      <span className="timer-btn pause">⏸</span>
                      <span className="timer-btn stop">⏹</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bento-text">
                <h3>Customizable Workspaces</h3>
                <p>Tailor your workspace with themes, widgets, and views that fit your workflow.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits">
        <div className="benefits-container">
          {/* Centered Section Header */}
          <div className="benefits-section-header">
            <span className="section-badge-pill">Testimonials</span>
            <h2>People just like you are already using TodoApps</h2>
          </div>

          {/* Testimonial Masonry Grid */}
          <div className="testimonial-grid">

            {/* Column 1 */}
            <div className="testimonial-col">

              {/* Testimonial 1 (Tall) */}
              <div className="testimonial-card testimonial-tall card-has-overlay">
                {/* Floating chat bubble overlay */}
                <div className="speech-bubble-overlay">
                  <span className="speech-dots">...</span>
                </div>
                <p className="testimonial-quote">
                  "This task manager has completely transformed the way my team works. We stay focused on what truly matters to unlock deep work and always meet deadlines."
                </p>
                <div className="testimonial-user">
                  <div className="t-user-avatar bg-blue-avatar">J</div>
                  <div className="t-user-info">
                    <h4 className="t-user-name">John D.</h4>
                    <p className="t-user-role">Marketing Lead</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 (Small) */}
              <div className="testimonial-card testimonial-small">
                <p className="testimonial-quote">
                  "I love how easy it is to create and assign tasks. Ideas are captured instantly before they slip away from memory."
                </p>
                <div className="testimonial-user">
                  <div className="t-user-avatar bg-orange-avatar">D</div>
                  <div className="t-user-info">
                    <h4 className="t-user-name">Daniela T.</h4>
                    <p className="t-user-role">Operations Manager</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Column 2 */}
            <div className="testimonial-col">

              {/* Testimonial 3 (Small) */}
              <div className="testimonial-card testimonial-small">
                <p className="testimonial-quote">
                  "The metrics and progress bars help me visualize my completion and achieve more every day."
                </p>
                <div className="testimonial-user">
                  <div className="t-user-avatar bg-green-avatar">S</div>
                  <div className="t-user-info">
                    <h4 className="t-user-name">Sarah W.</h4>
                    <p className="t-user-role">Freelance Designer</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 4 (Tall) */}
              <div className="testimonial-card testimonial-tall">
                <p className="testimonial-quote">
                  "Everything is securely synced, organized, and backed up in real-time. It gives me complete peace of mind and keeps my freelance projects running smoothly."
                </p>
                <div className="testimonial-user">
                  <div className="t-user-avatar bg-purple-avatar">A</div>
                  <div className="t-user-info">
                    <h4 className="t-user-name">Alex M.</h4>
                    <p className="t-user-role">Freelance Developer</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Column 3 */}
            <div className="testimonial-col">

              {/* Testimonial 5 (Small) */}
              <div className="testimonial-card testimonial-small">
                <p className="testimonial-quote">
                  "The built-in analytics give me a complete overview of our team's productivity."
                </p>
                <div className="testimonial-user">
                  <div className="t-user-avatar bg-teal-avatar">S</div>
                  <div className="t-user-info">
                    <h4 className="t-user-name">Sam J.</h4>
                    <p className="t-user-role">Project Coordinator</p>
                  </div>
                </div>
              </div>

              {/* Video Testimonial Card (Tall) */}
              <div className="testimonial-video-card">
                <img
                  src="/images/testimonial_video_thumb.png"
                  alt="User speaking video thumbnail"
                  className="t-video-image"
                />

                {/* Watch video action button overlay */}
                <div className="t-video-play-action">
                  <span className="play-triangle">▶</span>
                  <span>Watch video review</span>
                </div>

                {/* Overlapping YouTube Red Sticker */}
                <div className="youtube-badge-overlay">
                  <svg viewBox="0 0 24 24" className="youtube-svg-icon" fill="currentColor">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.555A3.003 3.003 0 0 0 .502 6.163C0 8.04 0 12 0 12s0 3.96.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.555a3.003 3.003 0 0 0 2.11-2.108C24 15.96 24 12 24 12s0-3.96-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <span className="section-badge-pill">Join Us</span>
          <h2>Ready to Get Organized?</h2>
          <p>Join thousands of users who have transformed their focus and productivity today.</p>
          <button
            className="cta-btn-primary"
            onClick={() => navigate('/signup')}
          >
            Start Free Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          
          {/* Top Section */}
          <div className="footer-top">
            <div className="footer-brand-col">
              <div className="footer-logo">
                <div className="logo-dots small">
                  <span className="logo-dot blue"></span>
                  <span className="logo-dot"></span>
                  <span className="logo-dot"></span>
                  <span className="logo-dot"></span>
                </div>
                <span className="footer-brand-name">TodoApps</span>
              </div>
              <h3 className="footer-tagline">Stay organized and boost your productivity</h3>
            </div>
            
            <div className="footer-links-wrapper">
              <div className="footer-links-col">
                <a href="#benefits">→ About Us</a>
                <a href="#benefits">→ Contact</a>
                <a href="#features">→ What's New</a>
                <a href="#benefits">→ Careers</a>
              </div>
              <div className="footer-links-col">
                <a href="#features">→ Product</a>
                <a href="#features">→ Solutions</a>
                <a href="#features">→ Integrations</a>
                <a href="#features">→ Price</a>
              </div>
            </div>
          </div>

          {/* Floating Widgets Canvas Section */}
          <div className="footer-widgets-canvas">
            
            {/* Widget 1: Speech Bubble */}
            <div className="footer-mini-widget widget-bubble">
              <span className="mini-widget-dots">...</span>
            </div>

            {/* Widget 2: Checkbox */}
            <div className="footer-mini-widget widget-checkbox-blue">
              <span className="mini-widget-check-mark">✓</span>
            </div>

            {/* Widget 3: Calendar 20 */}
            <div className="footer-mini-widget widget-calendar-20">
              <span className="mini-widget-cal-header"></span>
              <span className="mini-widget-cal-date">20</span>
            </div>

            {/* Widget 4: Clock */}
            <div className="footer-mini-widget widget-clock-black">
              <Clock size={20} color="#ffffff" />
            </div>

            {/* Widget 5: Flag */}
            <div className="footer-mini-widget widget-flag-blue">
              <span className="mini-widget-flag">⚑</span>
            </div>

            {/* Widget 6: Hourglass */}
            <div className="footer-mini-widget widget-hourglass-blue">
              <span className="mini-widget-glass">⏳</span>
            </div>

            {/* Widget 7: Calendar grid */}
            <div className="footer-mini-widget widget-calendar-grid">
              <Calendar size={20} color="#94a3b8" />
            </div>

            {/* Widget 8: Stopwatch */}
            <div className="footer-mini-widget widget-stopwatch">
              <span className="mini-widget-timer">⏱</span>
            </div>

            {/* Widget 9: Bulb */}
            <div className="footer-mini-widget widget-bulb-orange">
              <span className="mini-widget-bulb">💡</span>
            </div>

            {/* Widget 10: Double Chevron Right */}
            <div className="footer-mini-widget widget-chevron-double">
              <ChevronRight size={18} color="#0066ff" />
              <ChevronRight size={18} color="#0066ff" style={{ marginLeft: '-10px' }} />
            </div>

          </div>

          {/* Bottom Section */}
          <div className="footer-bottom">
            <p className="footer-copy">© 2026. All rights reserved.</p>
            <div className="footer-legal-links">
              <a href="#benefits">Privacy Policy</a>
              <a href="#benefits">Terms of Service</a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
