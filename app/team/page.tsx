'use client'

import { useState } from 'react'
import { useSettingsStore } from '../store'
import Header from '@/components/Header'
import { RiUserLine, RiMailLine, RiAddLine, RiCloseLine } from 'react-icons/ri'

interface TeamMember {
  name: string
  email: string
  role: string
  status: 'online' | 'offline' | 'away'
}

export default function Team() {
  const { name, email } = useSettingsStore()
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'Frontend Developer',
      status: 'online'
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'Backend Developer',
      status: 'away'
    }
  ])

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMemberName && newMemberEmail) {
      setTeamMembers([...teamMembers, {
        name: newMemberName,
        email: newMemberEmail,
        role: 'Team Member',
        status: 'offline'
      }])
      setNewMemberName('')
      setNewMemberEmail('')
    }
  }

  const handleRemoveMember = (email: string) => {
    setTeamMembers(teamMembers.filter(member => member.email !== email))
  }

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500'
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="section-title">Team</h1>
            <p className="section-subtitle">Manage your team members and their roles</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="chart-container">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{teamMembers.length + 1} members</span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                      {name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                        <span className="px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary text-xs rounded-full">Owner</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
                    </div>
                  </div>

                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg group">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                          {member.name[0]}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white dark:border-gray-900 rounded-full ${statusColors[member.status]}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">{member.role}</span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.email)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <RiCloseLine className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="chart-container">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Add Team Member</h2>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                    <div className="relative">
                      <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="input-field pl-10"
                        placeholder="Enter name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <div className="relative">
                      <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="input-field pl-10"
                        placeholder="Enter email"
                      />
                    </div>
                  </div>
                  <button type="submit" className="button-primary w-full flex items-center justify-center gap-2">
                    <RiAddLine className="w-5 h-5" />
                    Add Member
                  </button>
                </form>
              </div>

              <div className="chart-container mt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Invites</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No pending invites</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}