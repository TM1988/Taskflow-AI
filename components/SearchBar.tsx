'use client'

import { useContext } from 'react'
import { TodoContext } from '@/app/providers'

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useContext(TodoContext)

  return (
    <div className="max-w-2xl mx-auto mb-4">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search"
        className="w-full px-2 py-1 border border-gray-300 font-mono text-sm"
      />
    </div>
  )
}