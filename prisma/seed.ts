import { PrismaClient, LocationCategory } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Seed Locations
  const locations = [
    {
      name: "US0",
      code: "US0",
      category: LocationCategory.PLANT,
      address: "1401 Antioch Church Rd, Greenville, SC 29605",
      latitude: 34.8526,
      longitude: -82.394,
      geofenceRadius: 50, // ~164 feet
      isDefault: true,
    },
    {
      name: "HNA",
      code: "HNA",
      category: LocationCategory.OFFICE,
      address: "1 Parkway S, Greenville, SC 29615",
      latitude: 34.8447,
      longitude: -82.3987,
      geofenceRadius: 50, // ~164 feet
      isDefault: false,
    },
    {
      name: "US2",
      code: "US2",
      category: LocationCategory.PLANT,
      address: "6301 US-76, Pendleton, SC 29670",
      latitude: 34.6518,
      longitude: -82.7836,
      geofenceRadius: 50, // ~164 feet
      isDefault: false,
    },
    {
      name: "SPA",
      code: "SPA",
      category: LocationCategory.PLANT,
      address: "1000 International Dr, Spartanburg, SC 29303",
      latitude: 34.9285,
      longitude: -81.9571,
      geofenceRadius: 50, // ~164 feet
      isDefault: false,
    },
    {
      name: "LXT",
      code: "LXT",
      category: LocationCategory.PLANT,
      address: "2420 Two Notch Rd, Lexington, SC 29072",
      latitude: 33.9812,
      longitude: -81.2365,
      geofenceRadius: 50, // ~164 feet
      isDefault: false,
    },
    {
      name: "WFH",
      code: "WFH",
      category: LocationCategory.HOME,
      address: "400 Bayridge Rd, Simpsonville, SC 29680",
      latitude: 34.7373,
      longitude: -82.2543,
      geofenceRadius: 200, // ~656 feet - same as other locations
      isDefault: false,
    },
  ]

  for (const location of locations) {
    // Check if location exists by name
    const existingLocations = await prisma.location.findMany()
    const existing = existingLocations.find((l: { name: string }) => l.name === location.name)

    if (existing) {
      await prisma.location.update({
        where: { id: existing.id },
        data: location,
      })
    } else {
      await prisma.location.create({
        data: location,
      })
    }
  }

  console.log(`Seeded ${locations.length} locations`)

  // Seed Policy Config
  const policy = await prisma.policyConfig.upsert({
    where: { id: "default" },
    update: {
      name: "Standard 3-Day Policy",
      requiredDaysPerWeek: 3,
      minimumMinutesPerDay: 0,
      isActive: true,
    },
    create: {
      id: "default",
      name: "Standard 3-Day Policy",
      requiredDaysPerWeek: 3,
      minimumMinutesPerDay: 0,
      isActive: true,
    },
  })

  console.log("Seeded policy config:", policy.name)

  // Seed App Config (singleton)
  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      timezone: "America/New_York",
    },
  })

  console.log("Seeded app config")
  console.log("Database seeding complete!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
