'use client'

import { useContext } from 'react'
import { TodoContext } from '@/app/providers'
import { RiSearchLine } from 'react-icons/ri'

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useContext(TodoContext)

  return (
    <div className="relative">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search tasks..."
        className="search-input"
      />
    </div>
  )
}