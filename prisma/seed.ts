import { PrismaClient, LocationCategory } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Seed Locations
  const locations = [
    {
      name: "Michelin US0",
      code: "US0",
      category: LocationCategory.PLANT,
      address: "1401 Antioch Church Rd, Greenville, SC",
      latitude: 34.8526,
      longitude: -82.394,
      geofenceRadius: 50, // ~164 feet
      isDefault: true,
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
