import { PrismaClient, LocationCategory } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Seed Locations
  const locations = [
    {
      name: "Michelin Donaldson",
      code: "US0",
      category: LocationCategory.PLANT,
      address: "1 Michelin Way, Donaldson, SC 29605",
      latitude: 34.8526,
      longitude: -82.394,
      geofenceRadius: 300,
      isDefault: true,
    },
    {
      name: "Michelin Anderson",
      code: "US2",
      category: LocationCategory.PLANT,
      address: "Anderson, SC",
      latitude: 34.5034,
      longitude: -82.6501,
      geofenceRadius: 300,
      isDefault: false,
    },
  ]

  for (const location of locations) {
    await prisma.location.upsert({
      where: { id: location.code || location.name },
      update: location,
      create: location,
    })
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
