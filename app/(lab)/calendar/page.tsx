'use client'

import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useRouter } from 'next/navigation'

export default function CalendarPage() {
  const router = useRouter()
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetch('/api/calendar').then(r => r.json()).then(setEvents)
  }, [])

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Calendar</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventClick={info => router.push(`/orders/${info.event.extendedProps.orderId}`)}
          height="auto"
          headerToolbar={{
            left:   'prev,next today',
            center: 'title',
            right:  'dayGridMonth,dayGridWeek',
          }}
        />
      </div>
    </div>
  )
}
