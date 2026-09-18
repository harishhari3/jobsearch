import { motion } from 'framer-motion'

export default function CategoryPills({ categories, active, onSelect }) {
  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <motion.button
          whileHover={{ y: -3, scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onSelect('')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
            active === ''
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-600/40'
              : 'glass text-slate-300 hover:text-white hover:border-purple-400/40'
          }`}
        >
          ✨ All Jobs
        </motion.button>

        {categories.map((cat, i) => (
          <motion.button
            key={cat.tag}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onSelect(cat.tag)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
              active === cat.tag
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-600/40'
                : 'glass text-slate-300 hover:text-white hover:border-purple-400/40'
            }`}
          >
            {cat.label}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
