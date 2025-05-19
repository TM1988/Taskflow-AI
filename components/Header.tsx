export default function Header() {
  return (
    <header className="header sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Taskflow-AI
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            v1.0
          </p>
        </div>
      </div>
    </header>
  )
}