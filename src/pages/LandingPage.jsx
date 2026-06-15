import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Calendar,
  Clock,
  Pin,
  Mail,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

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

          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#benefits">Solutions</a>
            <a href="#benefits">Resources</a>
            <a href="#features">Pricing</a>
          </div>

          <div className="nav-buttons">
            <button
              className="nav-btn-text"
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
            <button
              className="nav-btn-primary"
              onClick={() => navigate('/signup')}
            >
              Get demo
            </button>
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
            <div className="widget widget-sticky-note float-animation-1">
              <div className="sticky-pin">
                <Pin size={16} fill="#ef4444" color="#ef4444" />
              </div>
              <p className="sticky-text">
                Take notes to keep track of crucial details, and accomplish more tasks with ease.
              </p>

              {/* Overlay Checkbox Widget */}
              <div className="nested-widget widget-check float-animation-sub">
                <span className="check-box-blue">
                  <CheckCircle size={14} color="#ffffff" fill="#2563eb" />
                </span>
              </div>
            </div>

            {/* Widget 2: Top Right - Reminders + Clock Icon */}
            <div className="widget widget-reminders float-animation-2">
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
              <div className="nested-widget widget-clock float-animation-sub-delayed">
                <div className="clock-icon-wrapper">
                  <Clock size={20} color="#111827" />
                </div>
              </div>
            </div>

            {/* Widget 3: Bottom Left - Today's Tasks */}
            <div className="widget widget-tasks float-animation-3">
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
            <div className="widget widget-integrations float-animation-4">
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
          <div className="benefits-grid">
            <div className="benefits-header-col">
              <span className="section-badge">Why Us</span>
              <h2>Why Choose TodoApps?</h2>
              <p>We combine minimalist design with powerful functionality to provide the ultimate productivity companion.</p>
              <button
                className="benefits-btn-link"
                onClick={() => navigate('/signup')}
              >
                <span>Get started today</span>
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="benefits-list-col">
              <ul className="benefits-list">
                <li>
                  <div className="benefit-icon">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h4>Stay Focused</h4>
                    <p>Eliminate distractions and focus on what truly matters to unlock deep work.</p>
                  </div>
                </li>
                <li>
                  <div className="benefit-icon">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h4>Never Forget</h4>
                    <p>Capture ideas instantly into your inbox before they slip away from memory.</p>
                  </div>
                </li>
                <li>
                  <div className="benefit-icon">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h4>Achieve More</h4>
                    <p>Track progress, visualize your completion metrics, and celebrate completed milestones.</p>
                  </div>
                </li>
                <li>
                  <div className="benefit-icon">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h4>Peace of Mind</h4>
                    <p>Everything is securely synced, organized, and backed up in real-time.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <span className="cta-badge">Join Us</span>
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
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-dots small">
                  <span className="logo-dot blue"></span>
                  <span className="logo-dot"></span>
                  <span className="logo-dot"></span>
                  <span className="logo-dot"></span>
                </div>
                <span>TodoApps</span>
              </div>
              <p>Your personal task management system for a calmer, more productive life.</p>
            </div>
            <div className="footer-links-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#benefits">Solutions</a></li>
                <li><a href="#features">Pricing</a></li>
              </ul>
            </div>
            <div className="footer-links-col">
              <h4>Company</h4>
              <ul>
                <li><a href="#benefits">About Us</a></li>
                <li><a href="#benefits">Careers</a></li>
                <li><a href="#benefits">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 TodoApps. Built for modern builders. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
