import Datastore from 'nedb-promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function compactDatabase() {
  console.log('🔧 Compacting databases...\n')
  
  // Students database
  const studentsDb = Datastore.create({ 
    filename: path.resolve(__dirname, 'data/students.db'), 
    autoload: true 
  })
  
  // Force compaction
  if (studentsDb.persistence && studentsDb.persistence.compactDatafile) {
    const compact = promisify(studentsDb.persistence.compactDatafile.bind(studentsDb.persistence))
    await compact()
    console.log('✅ Students database compacted')
  }
  
  // Enrollments database
  const enrollmentsDb = Datastore.create({ 
    filename: path.resolve(__dirname, 'data/enrollments.db'), 
    autoload: true 
  })
  
  if (enrollmentsDb.persistence && enrollmentsDb.persistence.compactDatafile) {
    const compact = promisify(enrollmentsDb.persistence.compactDatafile.bind(enrollmentsDb.persistence))
    await compact()
    console.log('✅ Enrollments database compacted')
  }
  
  // Presents database
  const presentsDb = Datastore.create({ 
    filename: path.resolve(__dirname, 'data/presents.db'), 
    autoload: true 
  })
  
  if (presentsDb.persistence && presentsDb.persistence.compactDatafile) {
    const compact = promisify(presentsDb.persistence.compactDatafile.bind(presentsDb.persistence))
    await compact()
    console.log('✅ Attendance database compacted')
  }
  
  console.log('\n✅ All databases compacted successfully!')
  
  // Verify DEMO001 is gone
  const demoStudent = await studentsDb.findOne({ regNo: 'DEMO001' })
  if (demoStudent) {
    console.log('\n⚠️  Warning: DEMO001 still exists in database')
  } else {
    console.log('\n✅ Verified: DEMO001 has been removed')
  }
}

compactDatabase().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
