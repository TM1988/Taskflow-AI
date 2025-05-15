'use client'

import { useState } from 'react'
import { useSettingsStore } from '../store'

interface TeamMember {
  name: string
  email: string
}

export default function Team() {
  const { name, email } = useSettingsStore()
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMemberName && newMemberEmail) {
      setTeamMembers([...teamMembers, { name: newMemberName, email: newMemberEmail }])
      setNewMemberName('')
      setNewMemberEmail('')
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-xl mb-6 text-gray-500 dark:text-gray-400">Team</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg mb-4 text-gray-500 dark:text-gray-400">Team Owner</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 text-lg">
                {name[0]}
              </div>
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300">{name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{email}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg mb-4 text-gray-500 dark:text-gray-400">Add Team Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                Add Member
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg mb-6 text-gray-500 dark:text-gray-400">Team Members</h3>
          {teamMembers.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No team members added yet</p>
          ) : (
            <div className="space-y-6">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 text-lg">
                    {member.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700 dark:text-gray-300">{member.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}