import { motion, AnimatePresence } from 'framer-motion'
import { BookmarkX } from 'lucide-react'
import JobCard from './JobCard'

export default function SavedJobs({ saved, onOpen, onToggleSave }) {
  return (
    <section id="saved-section" className="mx-auto mt-20 max-w-6xl px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        className="mb-8 flex items-end justify-between"
      >
        <div>
          <h2 className="font-display text-3xl font-bold">
            Saved <span className="gradient-text">Jobs</span>
          </h2>
          <div
            className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            style={{ backgroundSize: '200% 100%', animation: 'gradientMove 4s linear infinite' }}
          />
          <p className="mt-2 text-slate-400">
            {saved.length > 0
              ? `${saved.length} role${saved.length > 1 ? 's' : ''} bookmarked for later`
              : 'Bookmark roles you love to keep them here'}
          </p>
        </div>
      </motion.div>

      {saved.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass flex flex-col items-center rounded-3xl border-dashed p-12 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-400">
            <BookmarkX size={26} />
          </div>
          <p className="max-w-sm text-sm text-slate-400">
            No saved jobs yet. Click the bookmark icon on any job card to keep
            it here for quick access.
          </p>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {saved.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                onOpen={onOpen}
                saved
                onToggleSave={onToggleSave}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  )
}
