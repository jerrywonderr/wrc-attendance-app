import { supabase } from '@/lib/supabase'
import { formatPhoneNumber } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phone)

    const { data: attendee, error: attendeeError } = await supabase
      .from('attendees')
      .select('id, uid, name')
      .eq('phone', formattedPhone)
      .single()

    if (attendeeError || !attendee) {
      return NextResponse.json(
        { success: false, error: 'No attendee found with this phone number' },
        { status: 404 }
      )
    }

    const { data: logs, error: logsError } = await supabase
      .from('attendance_logs')
      .select('day, status, scan_time')
      .eq('attendee_id', attendee.id)
      .eq('status', 'present')
      .order('day')

    if (logsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch attendance' },
        { status: 500 }
      )
    }

    const attendance = {
      day1: logs.find(l => l.day === 1) || null,
      day2: logs.find(l => l.day === 2) || null,
      day3: logs.find(l => l.day === 3) || null,
      day4: logs.find(l => l.day === 4) || null,
    }

    return NextResponse.json({
      success: true,
      attendee: {
        uid: attendee.uid,
        name: attendee.name,
      },
      attendance,
    })
  } catch (error) {
    console.error('Confirm attendance error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}


