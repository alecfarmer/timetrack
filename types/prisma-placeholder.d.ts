// This file provides placeholder types for development before prisma generate runs
// These will be replaced by the actual generated types once you run:
// 1. Set up your DATABASE_URL in .env
// 2. Run: npx prisma db push
// 3. Run: npx prisma generate

declare module "@prisma/client" {
  export enum LocationCategory {
    OFFICE = "OFFICE",
    PLANT = "PLANT",
    CUSTOMER = "CUSTOMER",
    HOME = "HOME",
    TRAVEL = "TRAVEL",
    OTHER = "OTHER",
  }

  export enum EntryType {
    CLOCK_IN = "CLOCK_IN",
    CLOCK_OUT = "CLOCK_OUT",
  }

  export interface Location {
    id: string
    name: string
    code: string | null
    category: LocationCategory
    address: string | null
    latitude: number
    longitude: number
    geofenceRadius: number
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
  }

  export interface Entry {
    id: string
    type: EntryType
    timestampClient: Date
    timestampServer: Date
    locationId: string
    gpsLatitude: number | null
    gpsLongitude: number | null
    gpsAccuracy: number | null
    photoUrl: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    editHistory: unknown | null
    workDayId: string | null
  }

  export interface WorkDay {
    id: string
    date: Date
    locationId: string
    firstClockIn: Date | null
    lastClockOut: Date | null
    totalMinutes: number | null
    meetsPolicy: boolean
    createdAt: Date
    updatedAt: Date
  }

  export interface PolicyConfig {
    id: string
    name: string
    requiredDaysPerWeek: number
    minimumMinutesPerDay: number
    effectiveDate: Date
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }

  export interface AppConfig {
    id: string
    pinHash: string | null
    timezone: string
    createdAt: Date
    updatedAt: Date
  }

  export class PrismaClient {
    constructor(options?: { log?: string[] })
    $disconnect(): Promise<void>
    $connect(): Promise<void>

    location: {
      findMany: (args?: unknown) => Promise<Location[]>
      findUnique: (args: { where: { id: string } }) => Promise<Location | null>
      create: (args: { data: Partial<Location> }) => Promise<Location>
      update: (args: { where: { id: string }; data: Partial<Location> }) => Promise<Location>
      updateMany: (args: { where: unknown; data: unknown }) => Promise<{ count: number }>
      upsert: (args: { where: unknown; update: unknown; create: unknown }) => Promise<Location>
      delete: (args: { where: { id: string } }) => Promise<Location>
      count: (args?: unknown) => Promise<number>
    }

    entry: {
      findMany: (args?: unknown) => Promise<(Entry & { location?: Partial<Location> })[]>
      findUnique: (args: { where: { id: string } }) => Promise<Entry | null>
      create: (args: { data: unknown; include?: unknown }) => Promise<Entry & { location?: Partial<Location> }>
      update: (args: { where: { id: string }; data: unknown }) => Promise<Entry>
      delete: (args: { where: { id: string } }) => Promise<Entry>
      count: (args?: unknown) => Promise<number>
    }

    workDay: {
      findMany: (args?: unknown) => Promise<(WorkDay & { location?: Partial<Location> })[]>
      findUnique: (args: { where: unknown }) => Promise<WorkDay | null>
      create: (args: { data: unknown }) => Promise<WorkDay>
      update: (args: { where: { id: string }; data: unknown }) => Promise<WorkDay>
      upsert: (args: { where: unknown; update: unknown; create: unknown }) => Promise<WorkDay>
    }

    policyConfig: {
      findFirst: (args?: unknown) => Promise<PolicyConfig | null>
      findMany: (args?: unknown) => Promise<PolicyConfig[]>
      upsert: (args: { where: unknown; update: unknown; create: unknown }) => Promise<PolicyConfig>
    }

    appConfig: {
      findUnique: (args: { where: { id: string } }) => Promise<AppConfig | null>
      upsert: (args: { where: unknown; update: unknown; create: unknown }) => Promise<AppConfig>
    }
  }
}
