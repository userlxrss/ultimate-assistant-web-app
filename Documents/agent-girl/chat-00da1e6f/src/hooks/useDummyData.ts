'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { generateAllDummyData } from '@/lib/dummyData'

export function useDummyData() {
  const {
    setUser,
    setJournalEntries,
    setTasks,
    setEvents,
    setEmails,
    setContacts,
    journalEntries,
    tasks,
    events,
    emails,
    contacts
  } = useAppStore()

  useEffect(() => {
    // Only load dummy data if store is empty
    if (journalEntries.length === 0 && tasks.length === 0) {
      const dummyData = generateAllDummyData()

      setUser(dummyData.user)
      setJournalEntries(dummyData.journalEntries)
      setTasks(dummyData.tasks)
      setEvents(dummyData.events)
      setEmails(dummyData.emails)
      setContacts(dummyData.contacts)
    }
  }, [journalEntries.length, tasks.length, setUser, setJournalEntries, setTasks, setEvents, setEmails, setContacts])
}