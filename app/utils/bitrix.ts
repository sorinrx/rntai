import axios from 'axios';
import { EmployeeData, RoomData, findEmployeeData, findRoomData, rooms } from './employeeData';

const BITRIX_WEBHOOK_URL_LEAD = 'https://crm.renet.ro/rest/1/c8t4itlkucmewkz2/crm.lead.add.json';
const BITRIX_WEBHOOK_URL_MEETING = 'https://crm.renet.ro/rest/1/b4efdi1y4vosq6k0/calendar.event.add.json';
const BITRIX_WEBHOOK_URL_CALENDAR_EVENT = 'https://crm.renet.ro/rest/1/92ym2ewal5w4mpr3/calendar.event.get.json';

export interface CalendarEvent {
  id: string;
  name: string;
  dateFrom: string;
  dateTo: string;
  createdBy: string;
  roomName: string;
}

export const addLead = async ({ TITLE, NAME, PHONE, EMAIL, RESPONSIBLE_NAME }: {
  TITLE: string,
  NAME: string,
  PHONE: string,
  EMAIL: string,
  RESPONSIBLE_NAME: string
}) => {
  try {
    console.log('Received RESPONSIBLE_NAME:', RESPONSIBLE_NAME);

    const employeeData = findEmployeeData(RESPONSIBLE_NAME);
    console.log('Found employee data:', employeeData);

    if (!employeeData) {
      const errorMessage = `No employee data found for: ${RESPONSIBLE_NAME}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const ASSIGNED_BY_ID = employeeData.userId;
    console.log('Using ASSIGNED_BY_ID:', ASSIGNED_BY_ID);

    console.log('Sending request to addLead with data:', { TITLE, NAME, PHONE, EMAIL, ASSIGNED_BY_ID });
    const response = await axios.post(BITRIX_WEBHOOK_URL_LEAD, {
      fields: {
        TITLE,
        NAME,
        PHONE: [{ VALUE: PHONE, VALUE_TYPE: "WORK" }],
        EMAIL: [{ VALUE: EMAIL, VALUE_TYPE: "WORK" }],
        ASSIGNED_BY_ID
      },
      params: { REGISTER_SONET_EVENT: "Y" }
    });

    console.log('Response from addLead:', response.data);
    return { output: response.data };
  } catch (error) {
    const errorMessage = error.response?.data || error.message;
    console.error('Failed to add lead:', errorMessage);
    return { error: errorMessage };
  }
};

export const getCalendarEvents = async (room: string, from: string, to: string): Promise<{ output: CalendarEvent[] | string } | { error: string }> => {
  console.log(`Fetching calendar events for ${room} from ${from} to ${to}`);
  
  if (!isValidDate(from) || !isValidDate(to)) {
    return { error: "Formatele datelor trebuie să fie YYYY-MM-DD." };
  }

  try {
    const selectedRoom = rooms.find(r => r.name.toLowerCase() === room.toLowerCase());
    if (!selectedRoom) {
      const errorMessage = `Sala "${room}" nu a fost găsită.`;
      console.error(errorMessage);
      return { error: errorMessage };
    }

    const events = await fetchEventsFromBitrix(selectedRoom, from, to);
    
    if (events.length === 0) {
      console.log('No existing events found');
      return { output: "Nu există întâlniri programate pentru această perioadă." };
    }

    return { output: events };
  } catch (error) {
    const errorMessage = "A apărut o eroare la obținerea evenimentelor din calendar.";
    console.error('Failed to get calendar events:', error);
    return { error: errorMessage };
  }
};

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateString) && !isNaN(Date.parse(dateString));
}

async function fetchEventsFromBitrix(room: RoomData, from: string, to: string): Promise<CalendarEvent[]> {
  const params = {
    type: 'location',
    from,
    to,
    section: room.calendarId.toString()
  };

  console.log('Sending request with params:', params);

  const response = await axios.get(BITRIX_WEBHOOK_URL_CALENDAR_EVENT, { params });

  console.log('API Response:', response.data);

  if (response.data && Array.isArray(response.data.result)) {
    return response.data.result.map(event => ({
      id: event.ID,
      name: event.NAME,
      dateFrom: event.DATE_FROM,
      dateTo: event.DATE_TO,
      createdBy: event.CREATED_BY,
      roomName: room.name
    }));
  } else {
    throw new Error('No events found or unexpected response structure');
  }
}

export const addMeeting = async ({ name, from, to, organizer, room, description }: {
  name: string,
  from: string,
  to: string,
  organizer: string,
  room?: string,
  description?: string
}) => {
  try {
    console.log('Starting addMeeting with parameters:', { name, from, to, organizer, room, description });

    const employeeData = findEmployeeData(organizer);
    if (!employeeData) {
      const errorMessage = `Employee ${organizer} not found`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    console.log('Employee data found:', employeeData);

    let location = '';
    if (room) {
      const roomData = findRoomData(room);
      if (roomData) {
        location = `calendar_${roomData.calendarId}`;
        console.log('Room data found:', roomData);
      } else {
        console.warn(`Room ${room} not found, using as plain text`);
        location = room;
      }
    }

    const meetingData = {
      type: 'user',
      ownerId: employeeData.userId.toString(),
      name,
      description: description || '',
      from: `${from} ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
      to: `${to} ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,  
      section: employeeData.calendarId.toString(),
      is_meeting: 'Y',
      private_event: 'N',
      location: location,
      attendees: [employeeData.userId.toString()],
      host: employeeData.userId.toString(),
      meeting: {
        host_name: "",
        text: "",
        open: true,
        notify: true,
        reinvite: false
      }
    };

    console.log('Sending request to addMeeting with data:', JSON.stringify(meetingData, null, 2));
    const response = await axios.post(BITRIX_WEBHOOK_URL_MEETING, meetingData);
    console.log('Full API response:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.result) {
      console.log('Meeting successfully added with ID:', response.data.result);
      return { output: response.data };
    } else {
      const errorMessage = 'API did not return a result';
      console.error(errorMessage, response.data);
      return { error: errorMessage };
    }
  } catch (error) {
    const errorMessage = error.response?.data || error.message;
    console.error('Failed to add meeting:', errorMessage);
    return { error: errorMessage };
  }
};

export const checkAndAddMeeting = async (meetingData: {
  name: string,
  from: string,
  to: string,
  organizer: string,
  room: string,
  description?: string
}) => {
  try {
    console.log('Checking meeting availability:', meetingData);

    const meetingDate = meetingData.from.split(' ')[0];
    const existingEventsResult = await getCalendarEvents(meetingData.room, meetingDate, meetingDate);
    
    if ('error' in existingEventsResult) {
      console.error('Error fetching existing events:', existingEventsResult.error);
      return { error: existingEventsResult.error };
    }

    if (typeof existingEventsResult.output === 'string') {
      console.log('No existing events found');
      return await addMeeting(meetingData);
    }

    const existingEvents = existingEventsResult.output as CalendarEvent[];
    console.log('Existing events:', existingEvents);

    const newMeetingStart = new Date(meetingData.from);
    const newMeetingEnd = new Date(meetingData.to);

    const overlap = existingEvents.some(event => {
      let [datePart, timePart] = event.dateFrom.split(' ');
      let [day, month, year] = datePart.split('/');
      const eventStart = new Date(`${year}-${month}-${day}T${timePart}`);

      [datePart, timePart] = event.dateTo.split(' ');
      [day, month, year] = datePart.split('/');
      const eventEnd = new Date(`${year}-${month}-${day}T${timePart}`);

      console.log('Comparing with event:', event);
      console.log('New meeting:', newMeetingStart, '-', newMeetingEnd);
      console.log('Existing event:', eventStart, '-', eventEnd);

      const isOverlapping = (newMeetingStart < eventEnd && newMeetingEnd > eventStart);
      console.log('Is overlapping:', isOverlapping);

      return isOverlapping;
    });

    if (overlap) {
      const overlapMessage = "Nu poți înregistra această întâlnire pentru că la acea oră este programată o altă întâlnire.";
      console.log('Overlap detected, cannot add meeting:', overlapMessage);
      return { error: overlapMessage };
    }

    console.log('No overlap detected, proceeding to add meeting');
    return await addMeeting(meetingData);
  } catch (error) {
    const errorMessage = error.message;
    console.error('Failed to check and add meeting:', errorMessage);
    return { error: errorMessage };
  }
};
export const getCalendarEventsForRooms = async (roomsInput: string | string[] | 'all', from: string, to: string): Promise<{ output: { [room: string]: CalendarEvent[] | string } } | { error: string }> => {
  console.log(`Fetching calendar events for rooms: ${roomsInput} from ${from} to ${to}`);

  if (!isValidDate(from) || !isValidDate(to)) {
    return { error: "Formatele datelor trebuie să fie YYYY-MM-DD." };
  }

  let roomsToFetch: string[];
  if (roomsInput === 'all') {
    roomsToFetch = rooms.map(room => room.name);
  } else if (typeof roomsInput === 'string') {
    roomsToFetch = [roomsInput];
  } else {
    roomsToFetch = roomsInput;
  }

  try {
    const allEvents: { [room: string]: CalendarEvent[] | string } = {};
    for (const room of roomsToFetch) {
      const result = await getCalendarEvents(room, from, to);
      if ('error' in result) {
        console.error(`Error fetching events for room ${room}:`, result.error);
        allEvents[room] = `Eroare: ${result.error}`;
      } else {
        allEvents[room] = result.output;
      }
    }
    return { output: allEvents };
  } catch (error) {
    const errorMessage = "A apărut o eroare la obținerea evenimentelor din calendar pentru sălile specificate.";
    console.error('Failed to get calendar events for specified rooms:', error);
    return { error: errorMessage };
  }
};