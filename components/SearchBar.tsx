'use client'

import { useContext } from 'react'
import { TodoContext } from '@/app/providers'
import { RiSearchLine } from 'react-icons/ri'

export default function SearchBar() {
  const { searchQuery = '', setSearchQuery = () => {} } = useContext(TodoContext) || {}

  return (
    <div className="relative">
      <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search tasks..."
        className="search-input pl-10"
      />
    </div>
  )
}