import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Search } from 'lucide-react'
import AnimatedBackground from './components/AnimatedBackground'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SearchBar from './components/SearchBar'
import CategoryPills from './components/CategoryPills'
import StatsBar from './components/StatsBar'
import JobCard from './components/JobCard'
import JobDetailModal from './components/JobDetailModal'
import Pagination from './components/Pagination'
import SavedJobs from './components/SavedJobs'
import Footer from './components/Footer'
import Toast from './components/Toast'
import CursorFollower from './components/CursorFollower'
import ScrollProgress from './components/ScrollProgress'
import CallAgentButton from './components/CallAgentButton'
import CallAgentView from './components/CallAgentView'
import ResumeModal from './components/ResumeModal'
import CompanyMarquee from './components/CompanyMarquee'
import BackToTop from './components/BackToTop'
import AssessmentCard from './components/AssessmentCard'
import PaymentModal from './components/PaymentModal'
import AssessmentView from './components/AssessmentView'
import AuthModal from './components/AuthModal'
import { JobGridSkeleton, ErrorState, EmptyJobs } from './components/Feedback'
import { searchJobs, fetchCategories } from './services/adzuna'
import { extractPdfText, loadResume, saveResume } from './services/resume'
import { getProfile, logout, fetchWithAuth } from './services/auth'
import { useTheme } from './hooks/useTheme'
import { DEFAULT_CATEGORIES } from './config'

const STORED_SAVED = 'jobpulse_saved_jobs'

export default function App() {
  const { theme, toggle } = useTheme()

  const [query, setQuery] = useState({
    what: '',
    where: '',
    country: 'gb',
    category: '',
    contract: '',
    page: 1,
  })

  const [jobs, setJobs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [hasSearched, setHasSearched] = useState(false)

  const [selectedJob, setSelectedJob] = useState(null)
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORED_SAVED)) || []
    } catch {
      return []
    }
  })
  const [toast, setToast] = useState(null)

  // Auth & Profile state
  const [user, setUser] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)

  const [resume, setResume] = useState(() => loadResume())
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [examOpen, setExamOpen] = useState(false)
  const [examUnlocked, setExamUnlocked] = useState(() => localStorage.getItem('jobpulse_exam_unlocked') === '1')
  const [lastScore, setLastScore] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jobpulse_exam_score')) || null
    } catch {
      return null
    }
  })
  const fileInputRef = useRef(null)

  const savedRef = useRef(saved)
  savedRef.current = saved

  const showToast = useCallback((message, type = 'info') => {
    setToast({ id: Date.now(), message, type })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    localStorage.setItem(STORED_SAVED, JSON.stringify(saved))
  }, [saved])

  // Try to load user session on app start
  useEffect(() => {
    const initSession = async () => {
      try {
        const profile = await getProfile()
        if (profile) {
          setUser(profile)
          showToast(`Welcome back, ${profile.name}!`, 'success')
          syncUserDataWithBackend(profile)
        }
      } catch {
        // No active session, ignore
      }
    }
    initSession()
  }, [showToast])

  // Listen for completed voice agent calls to archive them
  useEffect(() => {
    const handleCallLogMessage = async (e) => {
      if (e.data && e.data.type === 'aethercall_hangup') {
        const { duration, persona, transcriptText } = e.data
        if (user) {
          try {
            await fetchWithAuth('/calls', {
              method: 'POST',
              body: JSON.stringify({ duration, persona, transcriptText }),
            })
            showToast('Interview call log saved to your profile!', 'success')
          } catch (err) {
            console.warn('Failed to save call log to backend:', err)
          }
        }
      }
    }
    window.addEventListener('message', handleCallLogMessage)
    return () => window.removeEventListener('message', handleCallLogMessage)
  }, [user, showToast])

  const syncUserDataWithBackend = async (currentUser) => {
    if (!currentUser) return
    try {
      // 1. Sync Resume
      const resRes = await fetchWithAuth('/resumes')
      if (resRes.ok) {
        const resumeData = await resRes.json()
        setResume(resumeData)
        saveResume(resumeData)
      } else {
        // If frontend has local resume but backend doesn't, upload it
        const localResume = loadResume()
        if (localResume) {
          await fetchWithAuth('/resumes', {
            method: 'POST',
            body: JSON.stringify({
              fileName: localResume.fileName,
              text: localResume.text,
              level: localResume.level,
            }),
          })
        }
      }

      // 2. Sync Exam Status
      const statusRes = await fetchWithAuth('/exams/status')
      if (statusRes.ok) {
        const status = await statusRes.json()
        setExamUnlocked(status.unlocked)
        if (status.unlocked) {
          localStorage.setItem('jobpulse_exam_unlocked', '1')
        }
        if (status.lastScore && status.lastScore.time) {
          setLastScore(status.lastScore)
          localStorage.setItem('jobpulse_exam_score', JSON.stringify(status.lastScore))
        }
      }
    } catch (err) {
      console.warn('Could not sync data with backend:', err)
    }
  }

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser)
    showToast(`Signed in as ${authenticatedUser.name}`, 'success')
    syncUserDataWithBackend(authenticatedUser)
  }

  const handleLogout = () => {
    logout()
    setUser(null)
    setResume(null)
    setExamUnlocked(false)
    setLastScore(null)
    localStorage.removeItem('jobpulse_exam_unlocked')
    localStorage.removeItem('jobpulse_exam_score')
    localStorage.removeItem('jobpulse_resume')
    showToast('Signed out successfully', 'info')
  }

  const loadCategories = useCallback(async (country) => {
    const fetched = await fetchCategories(country)
    if (fetched.length) setCategories(fetched)
  }, [])

  useEffect(() => {
    loadCategories(query.country)
  }, [query.country, loadCategories])

  const runSearch = useCallback(
    async (nextQuery) => {
      setQuery(nextQuery)
      setHasSearched(true)
      setLoading(true)
      setError(null)
      try {
        const data = await searchJobs(nextQuery)
        setJobs(data.results)
        setTotal(data.count)
      } catch (err) {
        setJobs([])
        setTotal(0)
        setError(err.message)
        if (err.message === 'network') {
          showToast('Could not reach the job service', 'error')
        }
      } finally {
        setLoading(false)
      }
    },
    [showToast]
  )

  const handleSearch = (filters) => {
    runSearch({
      ...query,
      what: filters.what,
      where: filters.where,
      country: filters.country,
      contract: filters.contract,
      page: 1,
    })
  }

  const handleCategory = (tag) => {
    runSearch({ ...query, category: tag, page: 1 })
  }

  const handlePage = (page) => {
    runSearch({ ...query, page })
    window.scrollTo({ top: 560, behavior: 'smooth' })
  }

  const handleSave = useCallback((job) => {
    const isSaved = savedRef.current.some((j) => j.id === job.id)
    let next
    if (isSaved) {
      next = savedRef.current.filter((j) => j.id !== job.id)
      showToast('Removed from saved jobs', 'info')
    } else {
      next = [job, ...savedRef.current]
      showToast('Job saved! View it in Saved Jobs', 'success')
    }
    setSaved(next)
  }, [showToast])

  const handleCloseDetail = useCallback(() => setSelectedJob(null), [])

  const handleResumeUpload = async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Please upload a PDF file only', 'error')
      return
    }
    setResumeUploading(true)
    try {
      const text = await extractPdfText(file)
      setResumeFile({ name: file.name, text })
      showToast('Resume parsed successfully', 'success')
    } catch {
      showToast('Could not read this PDF — try another file', 'error')
    } finally {
      setResumeUploading(false)
    }
  }

  const handleResumeConfirm = async (level) => {
    if (!resumeFile) return
    const data = {
      fileName: resumeFile.name,
      text: resumeFile.text,
      level,
      savedAt: new Date().toISOString(),
    }
    
    saveResume(data)
    setResume(data)
    setResumeFile(null)
    showToast(`Resume saved as ${level === 'fresher' ? 'Fresher' : 'Experienced'}`, 'success')

    if (user) {
      try {
        await fetchWithAuth('/resumes', {
          method: 'POST',
          body: JSON.stringify({
            fileName: data.fileName,
            text: data.text,
            level: data.level,
          }),
        })
      } catch (err) {
        console.warn('Failed to upload resume to backend:', err)
      }
    }
  }

  const handlePaid = () => {
    localStorage.setItem('jobpulse_exam_unlocked', '1')
    setExamUnlocked(true)
    setPaymentOpen(false)
    setExamOpen(true)
    showToast('Exam unlocked — good luck!', 'success')
  }

  const handleExamComplete = async (score) => {
    const payload = { ...score, total: 18, time: new Date().toISOString() }
    localStorage.setItem('jobpulse_exam_score', JSON.stringify(payload))
    setLastScore(payload)

    if (user) {
      try {
        await fetchWithAuth('/exams/score', {
          method: 'POST',
          body: JSON.stringify({
            correct: score.correct,
            wrong: score.wrong,
            skipped: score.skipped,
            total: 18,
          }),
        })
      } catch (err) {
        console.warn('Failed to save exam score to backend:', err)
      }
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))
  const showResults = hasSearched && !error

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <ScrollProgress />
      <CursorFollower />

      <Navbar
        theme={theme}
        onToggleTheme={toggle}
        savedCount={saved.length}
        onGoHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onUploadClick={() => fileInputRef.current?.click()}
        resume={resume}
        uploading={resumeUploading}
        user={user}
        onSignInClick={() => setAuthOpen(true)}
        onSignOutClick={handleLogout}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          handleResumeUpload(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      <main className="relative">
        <Hero onQuickSearch={(q) => handleSearch({ ...query, what: q, page: 1 })} />

        <SearchBar
          onSearch={handleSearch}
          loading={loading}
          initialWhat={query.what}
          initialWhere={query.where}
          initialCountry={query.country}
        />

        <CategoryPills
          categories={categories}
          active={query.category}
          onSelect={handleCategory}
        />

        <StatsBar />

        <CompanyMarquee />

        <section id="results-section" className="mx-auto mt-16 max-w-6xl px-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display flex items-center gap-2.5 text-2xl font-bold md:text-3xl">
                <Sparkles size={22} className="text-purple-400 animate-pulse" />
                {hasSearched ? 'Search Results' : 'Fresh Opportunities'}
              </h2>
              <div
                className="mt-2 h-1 w-28 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                style={{ backgroundSize: '200% 100%', animation: 'gradientMove 4s linear infinite' }}
              />
              {hasSearched && !loading && !error && (
                <p className="mt-1 text-sm text-slate-400">
                  {total.toLocaleString()} roles match your search
                </p>
              )}
            </div>
            {query.what && (
              <span className="hidden items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300 md:flex">
                <Search size={14} />
                {query.what}
              </span>
            )}
          </div>

          {loading ? (
            <JobGridSkeleton />
          ) : error ? (
            <ErrorState error={error} onRetry={() => runSearch(query)} />
          ) : jobs.length === 0 ? (
            <EmptyJobs hasQuery={Boolean(query.what || query.category)} />
          ) : (
            <>
              <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job, i) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    index={i}
                    onOpen={setSelectedJob}
                    saved={saved.some((j) => j.id === job.id)}
                    onToggleSave={handleSave}
                  />
                ))}
              </motion.div>
              <Pagination
                page={query.page}
                totalPages={totalPages}
                total={total}
                onPage={handlePage}
              />
            </>
          )}
        </section>

        <SavedJobs saved={saved} onOpen={setSelectedJob} onToggleSave={handleSave} />

        <AssessmentCard
          unlocked={examUnlocked}
          lastScore={lastScore}
          onUnlock={() => setPaymentOpen(true)}
          onStart={() => setExamOpen(true)}
        />
      </main>

      <Footer />

      <CallAgentButton onOpen={() => setCallOpen(true)} />
      <CallAgentView open={callOpen} onClose={() => setCallOpen(false)} />
      <BackToTop />

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handlePaid}
      />
      <AssessmentView
        open={examOpen}
        onClose={() => setExamOpen(false)}
        onComplete={handleExamComplete}
      />

      <JobDetailModal
        job={selectedJob}
        saved={selectedJob ? saved.some((j) => j.id === selectedJob.id) : false}
        onToggleSave={handleSave}
        onClose={handleCloseDetail}
      />

      <ResumeModal
        uploading={resumeUploading}
        fileName={resumeFile?.name}
        text={resumeFile?.text}
        onClose={() => setResumeFile(null)}
        onConfirm={handleResumeConfirm}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
