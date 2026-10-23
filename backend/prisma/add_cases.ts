import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Case 1: Mycology M4
  await prisma.test.create({
    data: {
      title: 'Mycology Case: 54yo Diabetic Male',
      subject: 'Mycology',
      enabled: true,
      questions: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=600&auto=format&fit=crop',
            text: 'Name the pathogen & name the species.',
            correctAnswer: 'Aspergillus fumigatus',
            hintText: 'Observe the greenish colonies and the vesicle with phialides.',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=600&auto=format&fit=crop',
            text: 'List 4 important clinical manifestations of this fungus.',
            correctAnswer: 'Allergic bronchopulmonary aspergillosis, Aspergilloma, Invasive aspergillosis, Chronic necrotizing aspergillosis',
            hintText: 'Think of allergic, structural, and invasive diseases in the lungs.',
          }
        ]
      }
    }
  })

  // Case 2: Mycology M1
  await prisma.test.create({
    data: {
      title: 'Mycology Case: 40yo Male with White Patches',
      subject: 'Mycology',
      enabled: true,
      questions: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=600&auto=format&fit=crop',
            text: 'Name the fungal pathogen & 3 other species of the same organism.',
            correctAnswer: 'Candida albicans. Other species: C. tropicalis, C. glabrata, C. krusei',
            hintText: 'Positive germ tube test is characteristic for the main pathogen.',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=600&auto=format&fit=crop',
            text: 'Describe 3 microscopic identification points of this fungus.',
            correctAnswer: 'Gram positive, oval budding yeast cells, pseudohyphae',
            hintText: 'Recall its appearance on Gram stain and structures it forms.',
          }
        ]
      }
    }
  })

  // Case 3: Parasitology P2
  await prisma.test.create({
    data: {
      title: 'Parasitology Case: 3yo Boy with Loose Stools',
      subject: 'Parasitology',
      enabled: true,
      questions: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=600&auto=format&fit=crop',
            text: 'What is your probable clinical diagnosis?',
            correctAnswer: 'Giardiasis',
            hintText: 'Caused by a flagellated protozoan causing malabsorption.',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=600&auto=format&fit=crop',
            text: 'Name the pathogen.',
            correctAnswer: 'Giardia lamblia',
            hintText: 'Also known as Giardia intestinalis or Giardia duodenalis.',
          }
        ]
      }
    }
  })

  // Case 4: Parasitology P1
  await prisma.test.create({
    data: {
      title: 'Parasitology Case: 30yo Labourer with Discharge',
      subject: 'Parasitology',
      enabled: true,
      questions: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=600&auto=format&fit=crop',
            text: 'What is your probable clinical diagnosis?',
            correctAnswer: 'Trichomoniasis',
            hintText: 'Common sexually transmitted infection caused by a motile protozoan.',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=600&auto=format&fit=crop',
            text: 'Name the pathogen.',
            correctAnswer: 'Trichomonas vaginalis',
            hintText: 'Pear-shaped trophozoite with 4 anterior flagella.',
          }
        ]
      }
    }
  })

  console.log('Cases added successfully!')
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
