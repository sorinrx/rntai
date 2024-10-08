export interface EmployeeData {
  name: string;
  calendarId: number;
  userId: number;
  phoneNumber: string;
}

export interface RoomData {
  name: string;
  calendarId: number;
}

export const employees: EmployeeData[] = JSON.parse(process.env.NEXT_PUBLIC_EMPLOYEE_DATA || '[]');
export const rooms: RoomData[] = JSON.parse(process.env.NEXT_PUBLIC_ROOM_DATA || '[]');

export function findEmployeeData(name: string): EmployeeData | undefined {
  return employees.find(employee => employee.name === name);
}

export function findRoomData(roomName: string): RoomData | undefined {
  return rooms.find(room => room.name === roomName);
}

export function findEmployeeByPhoneNumber(phoneNumber: string): EmployeeData | undefined {
  return employees.find(employee => employee.phoneNumber === phoneNumber);
}

export { employees as EmployeeData, rooms as RoomData };