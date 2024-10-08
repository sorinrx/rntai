// utils/authorized_users.ts

export interface EmployeeData {
    name: string;
    calendarId: number;
    userId: number;
    phoneNumber: string;
    phonePrivateNumber: string;
  }
  
  export interface RoomData {
    name: string;
    calendarId: number;
  }
  
  // Funcție pentru a genera un număr de telefon privat generic
  function generateGenericPrivateNumber(index: number): string {
    return `+4075${index.toString().padStart(7, '0')}`;
  }
  
  // Încarcă datele din variabilele de mediu
  export const employees: EmployeeData[] = [
    {"name":"Admin RENET","calendarId":4,"userId":1,"phoneNumber":"400000000000","phonePrivateNumber":generateGenericPrivateNumber(1)},
    {"name":"Sorin Răducu","calendarId":6,"userId":12,"phoneNumber":"40316313413","phonePrivateNumber":"+40752703232"},
    {"name":"Robert Gagos","calendarId":36,"userId":18,"phoneNumber":"40316316818","phonePrivateNumber":"+40745695511"},
    {"name":"Alina Raducu","calendarId":24,"userId":22,"phoneNumber":"40316316819","phonePrivateNumber":"+40741935203"},
    {"name":"Petrut Bragea","calendarId":106,"userId":28,"phoneNumber":"40316316820","phonePrivateNumber":"+40724380900"},
    {"name":"Ovidiu Onofrei","calendarId":58,"userId":30,"phoneNumber":"40316316821","phonePrivateNumber":"+40749378676"},
    {"name":"Eduard Radu","calendarId":76,"userId":32,"phoneNumber":"40316316822","phonePrivateNumber":"+40750407117"},
    {"name":"Hasan Zafar","calendarId":42,"userId":44,"phoneNumber":"40316316823","phonePrivateNumber":generateGenericPrivateNumber(7)},
    {"name":"Mihaita Moldovan","calendarId":110,"userId":60,"phoneNumber":"40316316824","phonePrivateNumber":"+40747751293"},
    {"name":"Sorin Stoinea","calendarId":90,"userId":88,"phoneNumber":"40316316825","phonePrivateNumber":"+40740121267"},
    {"name":"Constantin Marza","calendarId":68,"userId":94,"phoneNumber":"40316316826","phonePrivateNumber":"+40723589030"},
    {"name":"Roxana Iordache","calendarId":66,"userId":96,"phoneNumber":"40316316827","phonePrivateNumber":generateGenericPrivateNumber(11)},
    {"name":"Daniel Dobre","calendarId":112,"userId":98,"phoneNumber":"40316316828","phonePrivateNumber":"+40742893157"},
    {"name":"Mirela Moruzzi","calendarId":114,"userId":104,"phoneNumber":"40316316829","phonePrivateNumber":"+40749117774"},
    {"name":"Emilian Bostenaru","calendarId":116,"userId":106,"phoneNumber":"40316316830","phonePrivateNumber":generateGenericPrivateNumber(14)},
    {"name":"Ramona Ursu","calendarId":82,"userId":110,"phoneNumber":"40316316831","phonePrivateNumber":"+40737989041"},
    {"name":"Mario Dumitrescu","calendarId":72,"userId":114,"phoneNumber":"40316316832","phonePrivateNumber":"+40723307312"},
    {"name":"Alexandru Cordea","calendarId":78,"userId":130,"phoneNumber":"40316316833","phonePrivateNumber":"+40726284310"},
    {"name":"Valeriu Stancu","calendarId":74,"userId":132,"phoneNumber":"40316316834","phonePrivateNumber":"+40729101123"},
    {"name":"Cristina Marin","calendarId":104,"userId":142,"phoneNumber":"40316316835","phonePrivateNumber":"+40769250545"},
    {"name":"Alexandru Dobrea","calendarId":84,"userId":150,"phoneNumber":"40316316836","phonePrivateNumber":"+40736013770"},
    {"name":"Cristian Sima","calendarId":92,"userId":152,"phoneNumber":"40316316837","phonePrivateNumber":"+40727817620"},
    {"name":"Cristian Grozea","calendarId":118,"userId":156,"phoneNumber":"40316316838","phonePrivateNumber":"+40720645925"},
    {"name":"Rares Lunguti","calendarId":98,"userId":158,"phoneNumber":"40316316839","phonePrivateNumber":"+40766633577"},
    {"name":"Gabriel Stancu","calendarId":88,"userId":160,"phoneNumber":"40316316840","phonePrivateNumber":"+40742727272"},
    {"name":"Cristi Stanica","calendarId":120,"userId":164,"phoneNumber":"40316316841","phonePrivateNumber":"+40734222095"},
    {"name":"Laurentiu Stoica","calendarId":122,"userId":170,"phoneNumber":"40316316842","phonePrivateNumber":generateGenericPrivateNumber(25)},
    {"name":"Mihaela Anton","calendarId":124,"userId":172,"phoneNumber":"40316316843","phonePrivateNumber":"+40723325257"},
    {"name":"Mihai Badea","calendarId":126,"userId":174,"phoneNumber":"40316316844","phonePrivateNumber":"+40721277407"},
    {"name":"DEDIU MIHAI Dediu","calendarId":138,"userId":176,"phoneNumber":"40316316845","phonePrivateNumber":"+40722163102"},
    {"name":"Vitalie Pascari","calendarId":128,"userId":180,"phoneNumber":"40316316846","phonePrivateNumber":"+40737143032"},
    {"name":"Victor Ion","calendarId":102,"userId":184,"phoneNumber":"40316316847","phonePrivateNumber":"+40765474485"},
    {"name":"Toma Filipovici","calendarId":96,"userId":186,"phoneNumber":"40316316848","phonePrivateNumber":"+40735773269"},
    {"name":"Stelian Chirita","calendarId":130,"userId":188,"phoneNumber":"40316316849","phonePrivateNumber":"+40731664010"},
    {"name":"Andreea Belous","calendarId":86,"userId":190,"phoneNumber":"40316316850","phonePrivateNumber":"+40742957076"},
    {"name":"Laura Filipovici","calendarId":100,"userId":198,"phoneNumber":"40316316851","phonePrivateNumber":"+40746343163"}
  ];
  
  export const rooms: RoomData[] = [
    {"name":"Sala 1","calendarId":2},
    {"name":"Sala 2","calendarId":28},
    {"name":"Sala 3","calendarId":108}
  ];
  
  export function findEmployeeData(name: string): EmployeeData | undefined {
    return employees.find(emp => emp.name.toLowerCase() === name.toLowerCase());
  }
  
  export function findRoomData(roomName: string): RoomData | undefined {
    return rooms.find(room => room.name.toLowerCase() === roomName.toLowerCase());
  }
  
  // Funcție pentru autorizarea accesului prin WhatsApp
  export function authorizeWhatsAppAccess(phoneNumber: string): EmployeeData | undefined {
    return employees.find(emp => emp.phonePrivateNumber === phoneNumber);
  }
  
  // Obiect pentru a reține identitatea utilizatorilor autorizați
  const authorizedSessions: { [phoneNumber: string]: EmployeeData } = {};
  
  // Funcție pentru a reține identitatea celui care s-a autorizat
  export function setAuthorizedUser(phoneNumber: string, employeeData: EmployeeData): void {
    authorizedSessions[phoneNumber] = employeeData;
  }
  
  // Funcție pentru a obține identitatea unui utilizator autorizat
  export function getAuthorizedUser(phoneNumber: string): EmployeeData | undefined {
    return authorizedSessions[phoneNumber];
  }