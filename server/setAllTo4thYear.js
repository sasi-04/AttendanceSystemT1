import Datastore from 'nedb-promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function setAllTo4thYear() {
  console.log('🔄 Setting all students to M.Tech 4th Year...\n')
  
  const studentsDb = Datastore.create({ 
    filename: path.resolve(__dirname, 'data/students.db'), 
    autoload: true 
  })
  
  // Get all students
  const allStudents = await studentsDb.find({})
  console.log(`Found ${allStudents.length} students`)
  
  // Update all students to M.Tech 4th Year
  const result = await studentsDb.update(
    {},
    { $set: { department: 'M.Tech', year: '4th Year' } },
    { multi: true }
  )
  
  console.log(`✅ Updated ${result} students to M.Tech 4th Year`)
  
  // Verify
  const updated = await studentsDb.find({})
  const byYear = {}
  updated.forEach(s => {
    const year = s.year || 'No Year'
    byYear[year] = (byYear[year] || 0) + 1
  })
  
  console.log('\n📊 Current distribution:')
  Object.entries(byYear).forEach(([year, count]) => {
    console.log(`   ${year}: ${count} students`)
  })
  
  console.log('\n✅ All students are now M.Tech 4th Year!')
}

setAllTo4thYear().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
