import Datastore from 'nedb-promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function revertMTechTo4thYear() {
  console.log('🔄 Reverting M.Tech students back to 4th Year...\n')
  
  const studentsDb = Datastore.create({ 
    filename: path.resolve(__dirname, 'data/students.db'), 
    autoload: true 
  })
  
  // Get all M.Tech students
  const mTechStudents = await studentsDb.find({ department: 'M.Tech' })
  
  console.log(`Found ${mTechStudents.length} M.Tech students`)
  
  // Update all M.Tech students to 4th Year
  const result = await studentsDb.update(
    { department: 'M.Tech' },
    { $set: { year: '4th Year' } },
    { multi: true }
  )
  
  console.log(`✅ Updated ${result} M.Tech students to 4th Year`)
  
  // Verify
  const updated = await studentsDb.find({ department: 'M.Tech' })
  const yearDistribution = {}
  updated.forEach(s => {
    yearDistribution[s.year] = (yearDistribution[s.year] || 0) + 1
  })
  
  console.log('\n📊 Current M.Tech distribution:')
  Object.entries(yearDistribution).forEach(([year, count]) => {
    console.log(`   ${year}: ${count} students`)
  })
  
  console.log('\n✅ All M.Tech students are now in 4th Year!')
}

revertMTechTo4thYear().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
