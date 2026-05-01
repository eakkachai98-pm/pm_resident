import { TechnicianAvailability, TimeSlot } from '../types';

export const DEFAULT_WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
export const SLOT_CAPACITY = 3;

const WEEKDAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getDayCodeFromDateString(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  return WEEKDAY_CODES[new Date(year, month - 1, day).getDay()];
}

export function normalizeWorkingDays(workingDays?: string[] | null): string[] {
  if (!workingDays) {
    return [...DEFAULT_WORKING_DAYS];
  }

  return [...new Set(workingDays)];
}

export function isSlotBlocked(blockType: string, slot: TimeSlot): boolean {
  return blockType === 'Full Day' || blockType === slot;
}

export function isTechnicianAvailableForSlot(
  technician: TechnicianAvailability,
  dateString: string,
  slot: TimeSlot
): boolean {
  const workingDays = normalizeWorkingDays(technician.workingDays);
  const dayCode = getDayCodeFromDateString(dateString);

  if (!workingDays.includes(dayCode)) {
    return false;
  }

  return !technician.blockedSlots.some(
    (blockedSlot) => blockedSlot.date === dateString && isSlotBlocked(blockedSlot.type, slot)
  );
}

export function getAvailableTechniciansForSlot(
  technicians: TechnicianAvailability[],
  dateString: string,
  slot: TimeSlot
): TechnicianAvailability[] {
  return technicians.filter((technician) => isTechnicianAvailableForSlot(technician, dateString, slot));
}

export function getAvailableTechnicianCountForSlot(
  technicians: TechnicianAvailability[],
  dateString: string,
  slot: TimeSlot
): number {
  return getAvailableTechniciansForSlot(technicians, dateString, slot).length;
}

export function getSlotCapacity(
  technicians: TechnicianAvailability[],
  dateString: string,
  slot: TimeSlot
): number {
  return getAvailableTechnicianCountForSlot(technicians, dateString, slot) * SLOT_CAPACITY;
}

export function getDateAvailability(technicians: TechnicianAvailability[], dateString: string) {
  const morningAvailable = getAvailableTechniciansForSlot(technicians, dateString, 'Morning');
  const afternoonAvailable = getAvailableTechniciansForSlot(technicians, dateString, 'Afternoon');
  const dayCode = getDayCodeFromDateString(dateString);
  const hasWorkingTechnician = technicians.some((technician) =>
    normalizeWorkingDays(technician.workingDays).includes(dayCode)
  );

  return {
    morningAvailableCount: morningAvailable.length,
    afternoonAvailableCount: afternoonAvailable.length,
    morningCapacity: morningAvailable.length * SLOT_CAPACITY,
    afternoonCapacity: afternoonAvailable.length * SLOT_CAPACITY,
    isWorkingDay: hasWorkingTechnician,
    isDateAvailable: morningAvailable.length > 0 || afternoonAvailable.length > 0
  };
}
