import { useEffect, useState } from 'react'
import './App.css'
import deejoftLogo from './assets/deejoft_consult_logo.jpg'

const USER_STORAGE_KEY = 'deejoft-portal-users'
const ACTIVE_USER_STORAGE_KEY = 'deejoft-portal-active-user'
const VIEWS = {
    landing: 'landing',
    auth: 'auth',
    dashboard: 'dashboard',
}

const COURSE_CATALOG = [
    {
        title: 'Website Development',
        description:
            'Learn modern frontend and backend techniques for building responsive, performant websites with real-world tooling.',
    },
    {
        title: 'DevOps',
        description:
            'Master CI/CD pipelines, infrastructure as code, and automation practices that keep engineering teams shipping quickly.',
    },
    {
        title: 'Cybersecurity',
        description:
            'Understand threat modeling, secure coding, and incident response to defend applications and infrastructure.',
    },
    {
        title: 'Data Science',
        description:
            'Explore data pipelines, analytics, and machine learning workflows that unlock insights for modern businesses.',
    },
]


// Resets both auth forms to a known initial state.
const createDefaultForms = () => ({
    signup: {
        name: '',
        email: '',
        password: '',
        terms: false,
    },
    login: {
        email: '',
        password: '',
        remember: false,
    },
})

// Pull previously registered users from the browser, if any.
const loadRegisteredUsers = () => {
    if (typeof window === 'undefined') {
        return []
    }

    try {
        const raw = window.localStorage.getItem(USER_STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function App() {
    // Track whether the UI is showing signup or login.
    const [mode, setMode] = useState('signup')
    // Form values for both signup and login flows.
    const [forms, setForms] = useState(createDefaultForms)
    // Persisted users registered on this device.
    const [users, setUsers] = useState(loadRegisteredUsers)
    // Display success/error messages under the form.
    const [status, setStatus] = useState(null)
    // Switch between auth and dashboard views.
    const [view, setView] = useState(() => {
        if (typeof window === 'undefined') return VIEWS.landing
        return window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY)
            ? VIEWS.dashboard
            : VIEWS.landing
    })
    // Currently authenticated user when on the dashboard.
    const [activeUser, setActiveUser] = useState(() => {
        if (typeof window === 'undefined') return null
        const stored = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY)
        if (!stored) return null
        try {
            return JSON.parse(stored)
        } catch {
            return null
        }
    })
    // Track which course accordions are expanded.
    const [expandedCourses, setExpandedCourses] = useState(() => new Set())

    const activeForm = forms[mode]

    // Keep the browser storage in sync with the in-memory users list.
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users))
        }
    }, [users])

    // Persist the active session so refreshes keep the user on the dashboard.
    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        if (activeUser) {
            window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(activeUser))
        } else {
            window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY)
        }
    }, [activeUser])

    // Prevent access to the dashboard without an authenticated session.
    useEffect(() => {
        if (view === VIEWS.dashboard && !activeUser) {
            setView(VIEWS.landing)
            setStatus(null)
        }
    }, [view, activeUser])

    // Update a single field on the active form.
    const handleFieldChange = (field) => (event) => {
        const { type, value, checked } = event.target
        setForms((previous) => ({
            ...previous,
            [mode]: {
                ...previous[mode],
                [field]: type === 'checkbox' ? checked : value,
            },
        }))
    }

    // Submit either the signup or login form.
    const handleSubmit = (event) => {
        event.preventDefault()

        if (mode === 'signup') {
            const { name, email, password, terms } = forms.signup
            const normalizedEmail = email.trim().toLowerCase()

            if (!terms) {
                setStatus({
                    type: 'error',
                    message: 'You need to accept the terms to create an account.',
                })
                return
            }

            const existing = users.find((user) => user.email === normalizedEmail)
            if (existing) {
                setStatus({
                    type: 'error',
                    message: 'An account with this email already exists. Try signing in.',
                })
                return
            }

            const newUser = {
                name: name.trim(),
                email: normalizedEmail,
                password,
                createdAt: new Date().toISOString(),
            }

            setUsers((previous) => [...previous, newUser])
            setForms(() => {
                const defaults = createDefaultForms()
                return {
                    signup: defaults.signup,
                    login: { ...defaults.login, email: normalizedEmail },
                }
            })
            setMode('login')
            setStatus({
                type: 'success',
                message: 'Account created. Please sign in with your new credentials.',
            })
            return
        }

        const { email, password } = forms.login
        const normalizedEmail = email.trim().toLowerCase()
        const match = users.find((user) => user.email === normalizedEmail)

        if (!match || match.password !== password) {
            setStatus({
                type: 'error',
                message: 'Incorrect email or password. Try again.',
            })
            return
        }

        const loginTimestamp = new Date().toISOString()
        setStatus(null)
        setActiveUser({ ...match, lastLogin: loginTimestamp })
        setUsers((previous) =>
            previous.map((user) =>
                user.email === normalizedEmail ? { ...user, lastLogin: loginTimestamp } : user,
            ),
        )
        setExpandedCourses(() => new Set([COURSE_CATALOG[0].title]))
        setView(VIEWS.dashboard)
    }

    // Toggle between login and signup forms.
    const switchMode = (nextMode) => {
        setMode(nextMode)
        setStatus(null)
    }

    const navigateToAuth = (nextMode) => {
        setMode(nextMode)
        setView(VIEWS.auth)
        setStatus(null)
    }

    // Expand or collapse a single course card.
    const toggleCourse = (title) => {
        setExpandedCourses((previous) => {
            const next = new Set(previous)
            if (next.has(title)) {
                next.delete(title)
            } else {
                next.add(title)
            }
            return next
        })
    }

    // Clear the session and bounce back to the login page.
    const handleSignOut = () => {
        setForms(() => {
            const defaults = createDefaultForms()
            return {
                signup: defaults.signup,
                login: {
                    ...defaults.login,
                    email: activeUser?.email ?? '',
                },
            }
        })
        setActiveUser(null)
        setView(VIEWS.landing)
        setMode('login')
        setStatus(null)
        setExpandedCourses(() => new Set())
    }

    // Render the simple dashboard summary after a successful login.
    if (view === VIEWS.dashboard && activeUser) {
        return (
            <div className="dashboard-viewport">
                <div className="dashboard-card">
                    <header className="dashboard-header">
                        <div>
                            <span className="dashboard-badge">Dashboard</span>
                            <h1>Hello, {activeUser.name || 'there'} 👋</h1>
                            <p className="dashboard-summary">
                                You are signed in to Deejoft Portal. Explore projects, manage
                                teams, and keep track of your workflows from this centralized
                                hub.
                            </p>
                        </div>
                        <button type="button" className="signout-button" onClick={handleSignOut}>
                            Sign out
                        </button>
                    </header>

                    <section className="dashboard-body">
                        <div className="metric-card">
                            <span className="metric-title">Last login</span>
                            <strong className="metric-value">
                                {activeUser.lastLogin
                                    ? new Date(activeUser.lastLogin).toLocaleString()
                                    : 'Just now'}
                            </strong>
                        </div>
                        <div className="metric-card">
                            <span className="metric-title">Projects</span>
                            <strong className="metric-value">Coming soon</strong>
                        </div>
                        <div className="metric-card">
                            <span className="metric-title">Account email</span>
                            <strong className="metric-value">{activeUser.email}</strong>
                        </div>
                    </section>

                    <section className="course-section">
                        <h2>Deejoft Courses</h2>
                        <p className="course-description">
                            Explore our current trainings to sharpen your skills across critical IT
                            domains.
                        </p>
                        <ul className="course-accordion">
                            {COURSE_CATALOG.map((course) => {
                                const isOpen = expandedCourses.has(course.title)
                                const panelId = `course-${course.title.toLowerCase().replace(/\s+/g, '-')}`
                                return (
                                    <li
                                        key={course.title}
                                        className={`course-item${isOpen ? ' is-open' : ''}`}
                                    >
                                        <button
                                            type="button"
                                            className="course-toggle"
                                            onClick={() => toggleCourse(course.title)}
                                            aria-expanded={isOpen}
                                            aria-controls={panelId}
                                        >
                                            <span>{course.title}</span>
                                            <span aria-hidden="true" className="course-icon">
                                                {isOpen ? '−' : '+'}
                                            </span>
                                        </button>
                                        <div
                                            id={panelId}
                                            className="course-panel"
                                            hidden={!isOpen}
                                        >
                                            <p>{course.description}</p>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </section>
                </div>
            </div>
        )
    }

    if (view === VIEWS.landing) {
        return (
            <div className="landing-viewport">
                <header className="landing-header">
                    <div className="landing-brand">
                        <img src={deejoftLogo} alt="Deejoft logo" />
                        <span>Deejoft Portal</span>
                    </div>
                    <button
                        type="button"
                        className="landing-link"
                        onClick={() => navigateToAuth('login')}
                    >
                        Sign In
                    </button>
                </header>

                <main className="landing-hero">
                    <div className="landing-copy">
                        <span className="landing-pill">Digital Solutions For Modern Teams</span>
                        <h1>Welcome to your Deejoft workspace</h1>
                        <p>
                            Manage projects, track progress, and access guided learning — all in one
                            secure portal designed to keep your business moving forward.
                        </p>
                        <div className="landing-actions">
                            <button
                                type="button"
                                className="landing-cta"
                                onClick={() => navigateToAuth('signup')}
                            >
                                Get Started
                            </button>
                            <button
                                type="button"
                                className="landing-secondary"
                                onClick={() => navigateToAuth('login')}
                            >
                                I already have an account
                            </button>
                        </div>
                    </div>
                    <div className="landing-visual" aria-hidden="true">
                        <div className="landing-card">
                            <h2>What you get</h2>
                            <ul>
                                <li>Secure sign-in and account tools</li>
                                <li>Course catalog tailored for IT teams</li>
                                <li>Fast navigation to client projects</li>
                            </ul>
                        </div>
                        <div className="landing-spark" />
                    </div>
                </main>

                <footer className="landing-footer">
                    © {new Date().getFullYear()} Deejoft. All rights reserved.
                </footer>
            </div>
        )
    }

    // Default to the public auth experience.
    return (
        <div className="auth-viewport">
            <div className="auth-card">
                <section className="auth-panel">
                    <header className="auth-brand">
                        <div className="brand-icon">
                            <img src={deejoftLogo} alt="Deejoft logo" loading="lazy" />
                        </div>
                        <span className="brand-name">Deejoft Portal</span>
                    </header>

                    <div className="auth-copy">
                        <h1>{mode === 'signup' ? 'Get Started Now' : 'Welcome Back'}</h1>
                        <p>
                            {mode === 'signup'
                                ? 'Create an account and unlock all Deejoft services.'
                                : 'Enter your credentials to access your Deejoft account.'}
                        </p>
                    </div>

                    <div className="auth-social">
                        <button type="button" className="social-button social-google">
                            <span aria-hidden="true" className="social-icon">
                                G
                            </span>
                            {mode === 'signup' ? 'Sign up with Google' : 'Log in with Google'}
                        </button>
                        <button type="button" className="social-button social-apple">
                            <span aria-hidden="true" className="social-icon">
                                A
                            </span>
                            {mode === 'signup' ? 'Sign up with Apple' : 'Log in with Apple'}
                        </button>
                    </div>

                    <div className="divider">
                        <span>or continue with email</span>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {mode === 'signup' && (
                            <label className="form-field">
                                <span>Name</span>
                                <input
                                    className="form-control"
                                    type="text"
                                    name="name"
                                    autoComplete="name"
                                    placeholder="Jane Doe"
                                    minLength={2}
                                    required
                                    value={activeForm.name}
                                    onChange={handleFieldChange('name')}
                                />
                            </label>
                        )}
                        <label className="form-field">
                            <span>Email address</span>
                            <input
                                className="form-control"
                                type="email"
                                name="email"
                                autoComplete="email"
                                placeholder="name@deejoft.com"
                                required
                                value={activeForm.email}
                                onChange={handleFieldChange('email')}
                            />
                        </label>
                        <label className="form-field">
                            <span>
                                <span>Password</span>
                                {mode === 'login' && (
                                    <a
                                        className="form-link"
                                        href="#forgot"
                                        onClick={(event) => event.preventDefault()}
                                    >
                                        Forgot password?
                                    </a>
                                )}
                            </span>
                            <input
                                className="form-control"
                                type="password"
                                name="password"
                                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                                placeholder="Minimum 8 characters"
                                minLength={8}
                                required
                                value={activeForm.password}
                                onChange={handleFieldChange('password')}
                            />
                        </label>

                        {mode === 'signup' ? (
                            <label className="form-checkbox">
                                <input
                                    type="checkbox"
                                    name="terms"
                                    required
                                    checked={activeForm.terms}
                                    onChange={handleFieldChange('terms')}
                                />
                                <span>
                                    I agree to the{' '}
                                    <a
                                        href="#terms"
                                        onClick={(event) => event.preventDefault()}
                                    >
                                        Terms &amp; Privacy
                                    </a>
                                </span>
                            </label>
                        ) : (
                            <label className="form-checkbox">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={activeForm.remember}
                                    onChange={handleFieldChange('remember')}
                                />
                                <span>Remember me</span>
                            </label>
                        )}

                        <button type="submit" className="submit-button">
                            {mode === 'signup' ? 'Create account' : 'Log in'}
                        </button>
                    </form>

                    {status && (
                        <p className={`form-status form-status-${status.type}`}>
                            {status.message}
                        </p>
                    )}

                    <p className="auth-footer">
                        {mode === 'signup' ? (
                            <>
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    aria-label="Switch to login form"
                                >
                                    Log in
                                </button>
                            </>
                        ) : (
                            <>
                                New to Deejoft?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchMode('signup')}
                                    aria-label="Switch to sign up form"
                                >
                                    Create account
                                </button>
                            </>
                        )}
                    </p>
                </section>

                <aside className="hero-panel" aria-hidden="true">
                    <div className="hero-content">
                        <div className="hero-badge">Secure access</div>
                        <h2>Awesome IT Services For Your Business</h2>
                        <p>
                            Deejoft is a website design company in Nigeria offering solutions
                            across web, SEO, and mobile. Manage projects, collaborate with
                            clients, and monitor performance from a single portal.
                        </p>
                        <div className="hero-mockups">
                            <div className="mockup-card" />
                            <div className="mockup-card" />
                            <div className="mockup-card" />
                        </div>
                    </div>
                </aside>
            </div>

            <footer className="page-footer">
                © {new Date().getFullYear()} Deejoft. All rights reserved.
            </footer>
        </div>
    )
}

export default App
