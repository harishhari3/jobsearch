import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, Bookmark, Search, FileText, CheckCircle2, Loader2, LogOut, User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import Logo from './Logo'

export default function Navbar({
  theme,
  onToggleTheme,
  savedCount,
  onGoHome,
  onUploadClick,
  resume,
  uploading,
  user,
  onSignInClick,
  onSignOutClick,
}) {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > lastY && y > 260)
      setScrolled(y > 16)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Home', icon: Search, onClick: onGoHome },
    {
      label: 'Saved Jobs',
      icon: Bookmark,
      onClick: () => document.getElementById('saved-section')?.scrollIntoView({ behavior: 'smooth' }),
    },
    {
      label: 'Browse Jobs',
      icon: Search,
      onClick: () => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }),
    },
    {
      label: 'Skill Exam',
      icon: FileText,
      onClick: () => document.getElementById('exam-section')?.scrollIntoView({ behavior: 'smooth' }),
    },
  ]

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: hidden ? -120 : 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
    >
      <div className="mx-auto max-w-6xl">
        <nav
          className={`glass-strong rounded-2xl px-4 py-3 flex items-center justify-between transition-shadow duration-500 ${
            scrolled ? 'shadow-2xl shadow-purple-950/30 border-purple-500/20' : 'shadow-2xl shadow-black/20'
          }`}
        >
          <button onClick={onGoHome} className="cursor-pointer">
            <Logo />
          </button>

          <div className="hidden md:flex items-center gap-1.5">
            {links.map((link, i) => (
              <motion.button
                key={link.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={link.onClick}
                className="relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group/nav"
              >
                <link.icon size={16} className="text-purple-400 transition-transform duration-300 group-hover/nav:scale-125 group-hover/nav:-rotate-6" />
                {link.label}
                <span className="absolute inset-x-3 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-transform duration-300 group-hover/nav:scale-x-100" />
                {link.label === 'Saved Jobs' && savedCount > 0 && (
                  <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-1 text-[10px] font-bold text-white">
                    {savedCount}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={onUploadClick}
              className={`hidden sm:flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                resume
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:border-purple-400/40 hover:bg-white/10'
              }`}
            >
              {uploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : resume ? (
                <CheckCircle2 size={16} />
              ) : (
                <FileText size={16} className="text-purple-400" />
              )}
              {resume ? `Resume · ${resume.level === 'fresher' ? 'Fresher' : 'Experienced'}` : 'Upload Resume'}
            </motion.button>

            {/* Auth section */}
            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-1.5 text-sm font-semibold text-slate-200 cursor-pointer"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-6 w-6 rounded-full border border-purple-400" referrerpolicy="no-referrer" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[80px] truncate">{user.name}</span>
                </motion.button>

                <AnimatePresence>
                  {showDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="glass-strong absolute right-0 mt-2 z-40 w-48 rounded-xl p-2 shadow-2xl border border-white/10"
                      >
                        <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                          <p className="text-xs font-bold text-white truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowDropdown(false)
                            onSignOutClick()
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                        >
                          <LogOut size={14} />
                          Log Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSignInClick}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-950/20 hover:brightness-110 transition-all cursor-pointer"
              >
                <UserIcon size={14} />
                Sign In
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.06, rotate: 12 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>

            <button
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 cursor-pointer"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mt-2 glass-strong rounded-2xl p-3 flex flex-col gap-1"
            >
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    setOpen(false)
                    link.onClick()
                  }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <link.icon size={17} className="text-purple-400" />
                  {link.label}
                  {link.label === 'Saved Jobs' && savedCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-1 text-[10px] font-bold text-white">
                      {savedCount}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  setOpen(false)
                  onUploadClick()
                }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition-colors cursor-pointer text-left"
              >
                {resume ? <CheckCircle2 size={17} className="text-emerald-400" /> : <FileText size={17} className="text-purple-400" />}
                {resume ? `Resume · ${resume.level === 'fresher' ? 'Fresher' : 'Experienced'}` : 'Upload Resume'}
              </button>
              {user ? (
                <button
                  onClick={() => {
                    setOpen(false)
                    onSignOutClick()
                  }}
                  className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-300 transition-colors cursor-pointer text-left"
                >
                  <LogOut size={17} className="text-red-400" />
                  Log Out ({user.name})
                </button>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false)
                    onSignInClick()
                  }}
                  className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors cursor-pointer text-left"
                >
                  <UserIcon size={17} />
                  Sign In
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
